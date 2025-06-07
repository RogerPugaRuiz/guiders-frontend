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
    
    try {
      // Enviar el mensaje usando acknowledgment para obtener respuesta del servidor
      this.webSocketService.emitEventWithAck('commercial:send-message', {
        id: messageId,
        message,
        timestamp,
        chatId: chat.id
      }).then((response) => {
        // Respuesta exitosa del servidor
        console.log('✅ [Chat] Mensaje enviado exitosamente, respuesta del servidor:', response);
        
        // Limpiar el campo de mensaje y resetear altura
        this.currentMessageText.set('');
        this.textareaRows.set(1);
        this.isSendingMessage.set(false);
        
      }).catch((error) => {
        // Error del servidor o timeout
        console.error('❌ [Chat] Error al enviar mensaje:', error);
        this.isSendingMessage.set(false);
        
        // Mostrar mensaje de error al usuario (opcional)
        if ('error' in error) {
          console.error('Error del servidor:', error.error);
          // Aquí podrías mostrar una notificación al usuario
        }
      });
      
    } catch (error) {
      console.error('❌ [Chat] Error al enviar mensaje:', error);
      this.isSendingMessage.set(false);
    }
  }

  /**
   * Genera un ID único para el mensaje
   */
  private generateMessageId(): string {
    return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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
  }
}