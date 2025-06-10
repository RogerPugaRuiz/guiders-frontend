import { Component, ElementRef, OnInit, OnDestroy, viewChild, inject, signal, computed, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { ChatService } from '../../services/chat.service';
import { ChatData, SelectOption } from '../../models/chat.models';
import { ChatListComponent, ChatSearchEvent, ChatFilterEvent, ChatSelectionEvent, ChatRetryEvent } from '../chat-list/chat-list';
import { ChatMessages } from '../chat-messages/chat-messages';
import { ChatSelectionService } from '../../services/chat-selection.service';
import { ChatWebSocketService } from '../../services/chat-websocket.service';
import { WebSocketService } from '../../../../core/services/websocket.service';
import { AvatarService } from 'src/app/core/services/avatar.service';
import { AuthService } from '../../../../core/services/auth.service';
import { v4 as uuidv4 } from 'uuid';
import { WebSocketMessageType } from 'src/app/core/enums/websocket-message-types.enum';
import { ReceiveMessageData, ChatLastMessageUpdatedData } from 'src/app/core/models/websocket-response.models';
import { ChatStateService } from '../../services/chat-state.service';
import { Message } from '@libs/feature/chat';
import { User } from '@libs/feature/auth';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [FormsModule, ChatListComponent, ChatMessages],
  templateUrl: './chat.html',
  styleUrls: ['./chat.scss']
})
export class ChatComponent implements OnInit, OnDestroy {

  private avatarService = inject(AvatarService);
  public webSocketService = inject(WebSocketService);
  private chatStateService = inject(ChatStateService);
  private authService = inject(AuthService);
  private destroy$ = new Subject<void>();

  // Referencias a elementos del template usando viewChild signal
  trackingInfoPanel = viewChild<ElementRef>('trackingInfoPanel');
  messageTextarea = viewChild<ElementRef<HTMLTextAreaElement>>('messageTextarea');

  // Estado utilizando signals (nuevo en Angular 20)
  selectedChat = signal<ChatData | null>(null);
  currentMessageText = signal('');
  isTrackingPanelVisible = signal(false);
  textareaRows = signal(1);
  readonly maxTextareaRows = 5;
  isSendingMessage = signal(false);

  // Métodos implementados con signals
  visitorStatus() {
    const chat = this.selectedChat();
    if (!chat) return 'Sin seleccionar';
    
    const visitor = chat.participants.find(p => p.isVisitor);
    if (!visitor) return 'Sin información';
    
    if (visitor.isOnline) return 'En línea';
    return 'Desconectado';
  }

  canSendMessage() {
    return this.selectedChat() !== null && 
           this.currentMessageText().trim().length > 0 && 
           !this.isSendingMessage() &&
           this.webSocketService.isConnected();
  }

  getSendingStatus() {
    return this.isSendingMessage();
  }

  onParticipantStatusUpdated($event: { participantId: string; isOnline: boolean; }) {
    console.log('🔄 [Chat] Participant status updated:', $event);
    this.selectedChat.update(chat => {
      if (!chat) return chat;
      const participant = chat.participants.find(p => p.id === $event.participantId);
      if (participant) {
        participant.isOnline = $event.isOnline;
      }
      return chat;
    });
  }

  getChatAvatarUrl(): string {
    const chat = this.selectedChat();
    if (!chat) return '';
    
    const visitor = chat.participants.find(p => p.isVisitor)?.name;
    return this.avatarService.generateVisitorAvatar(visitor || '');
  }

  onAvatarError($event: Event): void {
    const img = $event.target as HTMLImageElement;
    img.style.display = 'none';
    // El fallback text se mostrará automáticamente
  }

  sendMessage() {
    const message = this.currentMessageText().trim();
    const chat = this.selectedChat();
    
    if (!message || !chat || this.isSendingMessage()) return;
    
    // Verificar que hay conexión WebSocket
    if (!this.webSocketService.isConnected()) {
      console.warn('💬 [Chat] No hay conexión WebSocket activa, no se puede enviar el mensaje');
      return;
    }
    
    // Activar indicador de envío
    this.isSendingMessage.set(true);
    
    // Generar ID único para el mensaje
    const messageId = this.generateMessageId();
    const timestamp = Date.now();
    
    console.log('📤 [Chat] Enviando mensaje vía WebSocket:', {
      id: messageId,
      message,
      chatId: chat.id,
      timestamp
    });

    // PROGRAMACIÓN POSITIVA: Crear mensaje temporal y agregarlo inmediatamente
    this.authService.getCurrentUser().subscribe({
      next: (currentUser: User | null) => {
        if (!currentUser) {
          console.error('❌ [Chat] No se pudo obtener el usuario actual');
          this.isSendingMessage.set(false);
          return;
        }

        // Crear mensaje temporal con estado 'pending'
        const temporaryMessage: Message = {
          id: messageId,
          chatId: chat.id,
          senderId: currentUser.id,
          senderName: currentUser.name || currentUser.email,
          content: message,
          type: 'text',
          timestamp: new Date(timestamp).toISOString(),
          isRead: false,
          metadata: {
            isPending: true, // Marcador para UI optimistic
            isTemporary: true
          }
        };

        // Agregar mensaje inmediatamente al estado (UI optimistic)
        console.log('✨ [Chat] Agregando mensaje temporal para UI optimistic:', temporaryMessage.id);
        this.chatStateService.addMessage(temporaryMessage);

        // Limpiar el campo de mensaje inmediatamente para mejor UX
        this.currentMessageText.set('');
        this.textareaRows.set(1);
        
        try {
          // Enviar el mensaje usando acknowledgment para obtener respuesta del servidor
          this.webSocketService.emitEventWithAck('commercial:send-message', {
            id: messageId,
            message,
            timestamp,
            chatId: chat.id
          }).then((response) => {
            // ✅ ÉXITO: Respuesta exitosa del servidor
            console.log('✅ [Chat] Mensaje enviado exitosamente, respuesta del servidor:', response);
            
            // Actualizar el mensaje para quitar el estado temporal/pendiente
            this.chatStateService.updateMessage(messageId, {
              metadata: {
                isPending: false,
                isTemporary: false,
                confirmedAt: Date.now()
              }
            });
            
            this.isSendingMessage.set(false);
            
          }).catch((error) => {
            // ❌ ERROR: Error del servidor o timeout
            console.error('❌ [Chat] Error al enviar mensaje:', error);
            
            // REMOVER el mensaje temporal debido al error
            console.log('🗑️ [Chat] Removiendo mensaje temporal debido al error');
            this.chatStateService.removeMessage(messageId);
            
            // Restaurar el texto del mensaje para que el usuario pueda reintentarlo
            this.currentMessageText.set(message);
            
            this.isSendingMessage.set(false);
            
            // Mostrar mensaje de error al usuario (opcional)
            if ('error' in error) {
              console.error('Error del servidor:', error.error);
              // Aquí podrías mostrar una notificación al usuario
            }
          });
          
        } catch (error) {
          console.error('❌ [Chat] Error al enviar mensaje:', error);
          
          // Remover mensaje temporal en caso de error
          this.chatStateService.removeMessage(messageId);
          
          // Restaurar el texto del mensaje
          this.currentMessageText.set(message);
          
          this.isSendingMessage.set(false);
        }
      },
      error: (error) => {
        console.error('❌ [Chat] Error al obtener usuario actual:', error);
        this.isSendingMessage.set(false);
      }
    });
  }

  /**
   * Genera un UUID v4 válido para el ID del mensaje
   * Esta función asegura que se use el formato esperado por el backend
   */
  private generateMessageId(): string {
    return uuidv4();
  }

  onKeyDown($event: KeyboardEvent) {
    if ($event.key === 'Enter') {
      if (!$event.shiftKey) {
        // Enter sin Shift: enviar mensaje
        $event.preventDefault();
        this.sendMessage();
      } else {
        // Shift+Enter: nueva línea - el textarea se expandirá automáticamente con adjustTextareaHeight
        // No necesitamos prevenir el evento porque queremos que se agregue el salto de línea
        // La expansión se manejará en onMessageInput cuando se actualice el contenido
      }
    }
  }

  private adjustTextareaHeight() {
    const textarea = this.messageTextarea()?.nativeElement;
    if (!textarea) return;

    const text = this.currentMessageText();
    
    // Si el texto está completamente vacío (sin saltos de línea), resetear a 1 fila
    if (text === '') {
      this.textareaRows.set(1);
      return;
    }
    
    // Contar líneas basándose en saltos de línea, considerando líneas vacías
    const lines = text.split('\n').length;
    const newRows = Math.min(Math.max(1, lines), this.maxTextareaRows);
    
    this.textareaRows.set(newRows);
  }

  onMessageInput($event: Event) {
    const target = $event.target as HTMLTextAreaElement;
    this.currentMessageText.set(target.value);
    
    // Debug logging para verificar el comportamiento
    console.log('💬 Contenido textarea:', JSON.stringify(target.value));
    console.log('📏 Líneas detectadas:', target.value.split('\n').length);
    
    this.adjustTextareaHeight();
  }

  currentMessage() {
    return this.currentMessageText();
  }

  getCurrentTextareaRows() {
    return this.textareaRows();
  }

  closeTrackingInfo() {
    this.isTrackingPanelVisible.set(false);
  }

  visitor() {
    const chat = this.selectedChat();
    if (!chat) return 'Sin chat seleccionado';
    
    const visitor = chat.participants.find(p => p.isVisitor);
    return visitor?.name || 'Visitante anónimo';
  }

  selectedChatStatusClass() {
    const chat = this.selectedChat();
    if (!chat) return 'chat-contact__status--offline';
    
    const visitor = chat.participants.find(p => p.isVisitor);
    if (visitor?.isOnline) return 'chat-contact__status--online';
    return 'chat-contact__status--offline';
  }

  selectedChatInitials() {
    const chat = this.selectedChat();
    if (!chat) return '?';
    
    const visitor = chat.participants.find(p => p.isVisitor);
    if (!visitor) return '?';
    
    if (visitor.name) {
      const nameParts = visitor.name.split(' ');
      return nameParts.map(part => part.charAt(0).toUpperCase()).join('').substring(0, 2);
    }
    
    return 'AN'; // Anónimo
  }

  toggleTrackingInfo() {
    this.isTrackingPanelVisible.update(visible => !visible);
  }

  showTrackingPanel() {
    return this.isTrackingPanelVisible();
  }

  onChatSelected(event: ChatSelectionEvent) {
    this.selectedChat.set(event.chat);
    console.log('🎯 [Chat] Chat seleccionado desde chat-list:', event.chat.id, event.chat);
    
    // Usar el servicio de estado para manejar la selección correctamente
    this.chatStateService.selectChat(event.chat.id).catch(error => {
      console.error('❌ [Chat] Error al seleccionar chat:', error);
    });
  }

  /**
   * Procesa mensajes entrantes del WebSocket tipo 'receive-message'
   */
  private handleIncomingMessage(payload: any): void {
    try {
      // Extraer los datos del mensaje de la estructura anidada
      const messageData = payload?.data?.data;
      
      // Validar estructura del payload
      if (!this.isValidReceiveMessagePayload(messageData)) {
        console.error('❌ [Chat] Payload de mensaje entrante inválido:', payload);
        return;
      }
      const currentChat = this.selectedChat();

      // Solo procesar el mensaje si pertenece al chat seleccionado actualmente
      if (!currentChat || currentChat.id !== messageData.chatId) {
        console.log('📨 [Chat] Mensaje recibido para chat no seleccionado, no actualizando UI:', {
          receivedChatId: messageData.chatId,
          currentChatId: currentChat?.id || 'ninguno'
        });
        return;
      }

      // Crear objeto Message según la interfaz
      const newMessage: Message = {
        id: messageData.id,
        chatId: messageData.chatId,
        senderId: messageData.senderId,
        senderName: this.getSenderNameById(messageData.senderId),
        content: messageData.message,
        type: 'text',
        timestamp: messageData.createdAt,
        isRead: false,
        metadata: {
          source: 'websocket',
          receivedAt: new Date().toISOString()
        }
      };

      // Agregar mensaje al estado del chat
      this.chatStateService.addMessage(newMessage);

      console.log('✅ [Chat] Mensaje entrante procesado y agregado al chat:', {
        messageId: newMessage.id,
        chatId: newMessage.chatId,
        content: newMessage.content,
        sender: newMessage.senderName
      });

    } catch (error) {
      console.error('❌ [Chat] Error al procesar mensaje entrante:', error);
    }
  }

  /**
   * Valida la estructura del payload de receive-message
   */
  private isValidReceiveMessagePayload(payload: any): payload is ReceiveMessageData {
    return payload &&
           typeof payload.id === 'string' &&
           typeof payload.chatId === 'string' &&
           typeof payload.senderId === 'string' &&
           typeof payload.message === 'string' &&
           typeof payload.createdAt === 'string' &&
           payload.id.trim() !== '' &&
           payload.chatId.trim() !== '' &&
           payload.senderId.trim() !== '' &&
           payload.message.trim() !== '';
  }

  /**
   * Obtiene el nombre del sender por su ID
   */
  private getSenderNameById(senderId: string): string {
    const currentChat = this.selectedChat();
    if (!currentChat) return 'Usuario desconocido';

    const participant = currentChat.participants.find(p => p.id === senderId);
    return participant?.name || 'Usuario desconocido';
  }

  /**
   * Procesa actualizaciones del último mensaje del chat del WebSocket tipo 'chat:last-message-updated'
   */
  private handleLastMessageUpdate(payload: any): void {
    try {
      const updateData = payload?.data;
      
      // Validar estructura del payload
      if (!this.isValidLastMessageUpdatePayload(updateData)) {
        console.error('❌ [Chat] Payload de actualización de último mensaje inválido:', payload);
        return;
      }

      const currentChat = this.selectedChat();

      // Solo procesar si es para el chat seleccionado actualmente
      if (!currentChat || currentChat.id !== updateData.chatId) {
        console.log('📝 [Chat] Actualización de último mensaje para chat no seleccionado:', {
          receivedChatId: updateData.chatId,
          currentChatId: currentChat?.id || 'ninguno'
        });
        return;
      }

      // Actualizar la información del último mensaje en el chat seleccionado
      this.selectedChat.update(chat => {
        if (!chat || chat.id !== updateData.chatId) return chat;
        
        return {
          ...chat,
          lastMessage: updateData.lastMessage,
          lastMessageAt: updateData.lastMessageAt
        };
      });

      // Actualizar también en el servicio de estado global
      this.chatStateService.updateLastMessage(
        updateData.chatId,
        updateData.lastMessage,
        updateData.lastMessageAt,
        updateData.senderId
      );

      console.log('✅ [Chat] Último mensaje actualizado para el chat:', {
        chatId: updateData.chatId,
        lastMessage: updateData.lastMessage,
        lastMessageAt: updateData.lastMessageAt,
        senderId: updateData.senderId
      });

    } catch (error) {
      console.error('❌ [Chat] Error al procesar actualización de último mensaje:', error);
    }
  }

  /**
   * Valida la estructura del payload de chat:last-message-updated
   */
  private isValidLastMessageUpdatePayload(payload: any): payload is ChatLastMessageUpdatedData {
    return payload &&
           typeof payload.lastMessage === 'string' &&
           typeof payload.lastMessageAt === 'string' &&
           typeof payload.chatId === 'string' &&
           typeof payload.senderId === 'string' &&
           payload.lastMessage.trim() !== '' &&
           payload.chatId.trim() !== '' &&
           payload.senderId.trim() !== '';
  }

  ngOnInit() {
    this.setupWebSocketListeners();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupWebSocketListeners() {
    // Escuchar respuestas exitosas del servidor
    this.webSocketService.getMessagesByType('commercial:message-sent')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          console.log('✅ [Chat] Mensaje confirmado por el servidor:', response);
          // Aquí podrías mostrar un indicador visual de éxito
          this.isSendingMessage.set(false);
        },
        error: (error: any) => {
          console.error('❌ [Chat] Error en confirmación del mensaje:', error);
          this.isSendingMessage.set(false);
        }
      });

    // Escuchar errores del servidor
    this.webSocketService.getMessagesByType('commercial:message-error')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (error: any) => {
          console.error('❌ [Chat] Error del servidor al enviar mensaje:', error);
          this.isSendingMessage.set(false);
          // Aquí podrías mostrar un mensaje de error al usuario
        }
      });

    // Escuchar mensajes entrantes del tipo 'receive-message'
    this.webSocketService.getMessagesByType(WebSocketMessageType.RECEIVE_MESSAGE)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (messageEvent: any) => {
          console.log('📨 [Chat] Mensaje entrante recibido:', messageEvent);
          this.handleIncomingMessage(messageEvent);
        },
        error: (error: any) => {
          console.error('❌ [Chat] Error al procesar mensaje entrante:', error);
        }
      });

    // Escuchar actualizaciones del último mensaje del chat
    this.webSocketService.getMessagesByType(WebSocketMessageType.CHAT_LAST_MESSAGE_UPDATED)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updateEvent: any) => {
          console.log('📝 [Chat] Actualización de último mensaje recibida:', updateEvent);
          this.handleLastMessageUpdate(updateEvent);
        },
        error: (error: any) => {
          console.error('❌ [Chat] Error al procesar actualización de último mensaje:', error);
        }
      });
  }
}