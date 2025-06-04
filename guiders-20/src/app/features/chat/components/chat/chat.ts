import { Component, ElementRef, OnInit, OnDestroy, viewChild, inject, signal, computed, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { ChatService } from '../../services/chat.service';
import { SelectOption } from '../../models/chat.models';
import { Chat, ChatStatus, Participant, ChatListResponse } from '../../../../../../../libs/feature/chat/domain/entities/chat.entity';
import { ChatListComponent, ChatSearchEvent, ChatFilterEvent, ChatSelectionEvent, ChatRetryEvent } from '../chat-list/chat-list';
import { ChatSelectionService } from '../../services/chat-selection.service';
import { ChatWebSocketService } from '../../services/chat-websocket.service';
import { WebSocketService } from '../../../../core/services/websocket.service';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [FormsModule, ChatListComponent],
  templateUrl: './chat.html',
  styleUrls: ['./chat.scss']
})
export class ChatComponent implements OnInit, OnDestroy {
  // Referencias a elementos del template usando viewChild signal
  trackingInfoPanel = viewChild<ElementRef>('trackingInfoPanel');
  messageTextarea = viewChild<ElementRef<HTMLTextAreaElement>>('messageTextarea');
  
  // Inyección de servicios usando la función inject()
  private chatService = inject(ChatService);
  private chatSelectionService = inject(ChatSelectionService);
  private chatWebSocketService = inject(ChatWebSocketService);
  private webSocketService = inject(WebSocketService);
  private destroy$ = new Subject<void>();
  
  // Estado utilizando signals (nuevo en Angular 20)
  chats = signal<Chat[]>([]);
  selectedFilterValue = signal<ChatStatus | 'all'>('all');
  searchTerm = signal<string>('');
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);
  isRetryLoading = signal<boolean>(false);
  showTrackingPanel = signal<boolean>(false);
  currentMessage = signal<string>('');
  
  // Opciones para el selector de filtro
  filterOptions: SelectOption[] = [
    { value: 'all', label: 'Todas' },
    { value: 'pending', label: 'Sin asignar' },
    { value: 'active', label: 'Activas' },
    { value: 'closed', label: 'Cerradas' }
  ];
  
  // Valores calculados usando computed
  filteredChats = computed(() => {
    const chats = this.chats();
    const search = this.searchTerm().toLowerCase().trim();
    const filter = this.selectedFilterValue();
    
    if (chats.length === 0) return [];
    
    // Primero aplicar filtro por estado
    let filtered = chats;
    switch (filter) {
      case 'pending':
        filtered = chats.filter(chat => chat.status === 'pending');
        break;
      case 'active':
        filtered = chats.filter(chat => chat.status === 'active');
        break;
      case 'closed':
        filtered = chats.filter(chat => chat.status === 'closed');
        break;
      case 'all':
      default:
        filtered = chats;
        break;
    }
    
    // Luego aplicar búsqueda si hay término de búsqueda
    if (search) {
      filtered = filtered.filter(chat => {
        const visitorName = this.getVisitorName(chat).toLowerCase();
        const lastMessage = chat.lastMessage?.content?.toLowerCase() || '';
        return visitorName.includes(search) || lastMessage.includes(search);
      });
    }
    
    return filtered;
  });

  // Estados calculados para la UI
  hasChats = computed(() => this.chats().length > 0);
  showEmptyState = computed(() => !this.isLoading() && !this.error() && this.filteredChats().length === 0);
  showErrorState = computed(() => this.error() !== null && !this.isLoading());
  canSendMessage = computed(() => this.currentMessage().trim().length > 0);
  selectedChatId = computed(() => this.selectedChat()?.id || null);

  // Signals para estado en tiempo real del WebSocket
  private realtimeParticipantStates = signal<Map<string, Partial<Participant>>>(new Map());
  private typingStates = signal<Map<string, boolean>>(new Map());

  // Computed signals para el chat seleccionado con estado en tiempo real
  selectedChat = computed(() => this.chatSelectionService.selectedChat());
  selectedChatVisitor = computed(() => {
    const chat = this.selectedChat();
    if (!chat) return null;
    
    const visitor = chat.participants?.find(p => p.isVisitor);
    if (!visitor) return null;
    
    // Aplicar estado en tiempo real del WebSocket si existe
    const realtimeState = this.realtimeParticipantStates().get(visitor.id);
    if (realtimeState) {
      return {
        ...visitor,
        ...realtimeState
      };
    }
    
    return visitor;
  });
  selectedChatName = computed(() => {
    const visitor = this.selectedChatVisitor();
    return visitor?.name || 'Visitante';
  });
  selectedChatInitials = computed(() => {
    const name = this.selectedChatName();
    return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2);
  });
  selectedChatIsOnline = computed(() => {
    const visitor = this.selectedChatVisitor();
    return visitor?.isOnline || false;
  });
  selectedChatIsTyping = computed(() => {
    const visitor = this.selectedChatVisitor();
    if (!visitor) return false;
    
    // Verificar estado de escritura desde WebSocket
    const isTypingFromWS = this.typingStates().get(visitor.id) || false;
    return visitor.isTyping || isTypingFromWS;
  });
  selectedChatStatusText = computed(() => {
    const visitor = this.selectedChatVisitor();
    if (!visitor) return 'Sin seleccionar';
    
    if (this.selectedChatIsTyping()) return 'Escribiendo...';
    if (visitor.isViewing) return 'Viendo la conversación';
    if (visitor.isOnline) return 'En línea';
    if (visitor.lastSeenAt) {
      const lastSeen = new Date(visitor.lastSeenAt);
      const now = new Date();
      const diffMinutes = (now.getTime() - lastSeen.getTime()) / (1000 * 60);
      
      if (diffMinutes < 30) return 'Visto recientemente';
      if (diffMinutes < 60) return 'Visto hace menos de 1h';
      const diffHours = Math.floor(diffMinutes / 60);
      if (diffHours < 24) return `Visto hace ${diffHours}h`;
      const diffDays = Math.floor(diffHours / 24);
      return `Visto hace ${diffDays}d`;
    }
    return 'Desconectado';
  });
  selectedChatStatusClass = computed(() => {
    const visitor = this.selectedChatVisitor();
    if (!visitor) return 'chat-contact__status--offline';
    
    if (this.selectedChatIsTyping()) return 'chat-contact__status--typing';
    if (visitor.isViewing) return 'chat-contact__status--viewing';
    if (visitor.isOnline) return 'chat-contact__status--online';
    return 'chat-contact__status--offline';
  });
  hasSelectedChat = computed(() => this.selectedChat() !== null);
  
  constructor() {
    // Effect para limpiar estados de escritura expirados
    effect(() => {
      const typingStates = this.typingStates();
      if (typingStates.size > 0) {
        // Verificar cada 5 segundos si hay estados de escritura expirados
        setTimeout(() => {
          this.cleanExpiredTypingStates();
        }, 5000);
      }
    });
  }
  
  ngOnInit(): void {
    this.loadChats();
    this.setupWebSocketListeners();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  // Método para cargar los chats desde el servicio
  loadChats(): void {
    this.isLoading.set(true);
    this.isRetryLoading.set(true);
    this.error.set(null);

    const params = { include: [] as string[] };
    
    this.chatService.getChats(params).subscribe({
      next: (response: any) => {
        const chats = response.data || [];
        // Convertir ChatData a Chat asegurando que isAnonymous siempre sea boolean
        const convertedChats = chats.map((chat: any): Chat => ({
          ...chat,
          participants: chat.participants.map((p: any): Participant => ({
            ...p,
            isAnonymous: p.isAnonymous ?? false
          }))
        }));
        this.chats.set(convertedChats);
        this.isLoading.set(false);
        this.isRetryLoading.set(false);
      },
      error: (error: unknown) => {
        this.error.set('Error al cargar los chats. Por favor, intente nuevamente.');
        this.isLoading.set(false);
        this.isRetryLoading.set(false);
        console.error('Error loading chats:', error);
      }
    });
  }
  
  // Método para obtener las iniciales de un participante
  getParticipantInitials(chat: Chat): string {
    const visitor = chat.participants.find(p => p.isVisitor);
    if (visitor?.name) {
      return visitor.name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return 'VS';
  }
  
  // Método para obtener el nombre del participante visitante
  getVisitorName(chat: Chat): string {
    const visitor = chat.participants.find(p => p.isVisitor);
    return visitor?.name || 'Visitante';
  }
  
  // Método para verificar si hay participantes online
  hasOnlineParticipant(chat: Chat): boolean {
    return chat.participants.some(p => p.isOnline);
  }
  
  // Método para obtener el estado CSS del participante
  getParticipantStatusClass(chat: Chat): string {
    const visitor = chat.participants.find(p => p.isVisitor);
    if (visitor?.isOnline) {
      return 'chat-item__status--online';
    }
    return 'chat-item__status--offline';
  }
  
  // Método para formatear la fecha del último mensaje
  formatLastMessageTime(chat: Chat): string {
    // Usar lastMessage.timestamp si existe, o lastMessageAt si no
    const timestamp = chat.lastMessage?.timestamp || chat.lastMessageAt;
    
    if (!timestamp) return '';
    
    const messageDate = new Date(timestamp);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - messageDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      // Mismo día - mostrar hora
      return messageDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInDays === 1) {
      return 'Ayer';
    } else if (diffInDays < 7) {
      // Menos de una semana - mostrar día de la semana
      return messageDate.toLocaleDateString('es-ES', { weekday: 'short' });
    } else {
      // Más de una semana - mostrar fecha
      return messageDate.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
    }
  }
  
  // Método para obtener la vista previa del último mensaje
  getLastMessagePreview(chat: Chat): string {
    if (!chat.lastMessage) return 'Sin mensajes';
    return chat.lastMessage.content.length > 60 
      ? chat.lastMessage.content.substring(0, 60) + '...'
      : chat.lastMessage.content;
  }
  
  // Métodos para manejar los eventos de click
  toggleTrackingInfo(): void {
    this.showTrackingPanel.update(value => !value);
  }
  
  closeTrackingInfo(): void {
    this.showTrackingPanel.set(false);
  }
  
  // Manejadores de eventos del chat-list
  onSearchChange(event: ChatSearchEvent): void {
    this.searchTerm.set(event.searchTerm);
  }

  onFilterChange(event: ChatFilterEvent): void {
    this.selectedFilterValue.set(event.filter);
  }

  onChatSelection(event: ChatSelectionEvent): void {
    this.chatSelectionService.selectChat(event.chat);
  }

  onRetryLoad(event: ChatRetryEvent): void {
    this.retryLoadChats();
  }
  
  // Método para reintentar cargar chats
  retryLoadChats(): void {
    this.isRetryLoading.set(true);
    this.loadChats();
  }

  // Métodos para manejar el envío de mensajes
  onMessageInput(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    this.currentMessage.set(target.value);
    this.adjustTextareaHeight();
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      if (event.shiftKey) {
        // Shift + Enter: permitir salto de línea (comportamiento por defecto)
        return;
      } else {
        // Enter solo: enviar mensaje si es válido
        event.preventDefault();
        if (this.canSendMessage()) {
          this.sendMessage();
        }
      }
    }
  }

  sendMessage(): void {
    if (!this.canSendMessage()) return;
    
    const message = this.currentMessage().trim();
    // Aquí se implementaría la lógica para enviar el mensaje al servicio
    console.log('Enviando mensaje:', message);
    
    // Limpiar el textarea
    this.currentMessage.set('');
    const textarea = this.messageTextarea();
    if (textarea) {
      textarea.nativeElement.value = '';
      this.adjustTextareaHeight();
    }
  }

  private adjustTextareaHeight(): void {
    const textareaRef = this.messageTextarea();
    if (textareaRef) {
      const textarea = textareaRef.nativeElement;
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  }

  /**
   * Configura los listeners de WebSocket para el chat
   */
  private setupWebSocketListeners(): void {
    console.log('🔌 [Chat] Configurando listeners WebSocket...');
    
    // Suscribirse a eventos específicos del chat desde ChatWebSocketService
    this.chatWebSocketService.onParticipantStatusUpdate()
      .pipe(takeUntil(this.destroy$))
      .subscribe(participantData => {
        console.log('👤 [Chat] Estado de participante actualizado:', participantData);
        
        // Actualizar estado en tiempo real del participante
        const currentStates = this.realtimeParticipantStates();
        const newStates = new Map(currentStates);
        newStates.set(participantData.participantId, participantData);
        this.realtimeParticipantStates.set(newStates);
      });

    this.chatWebSocketService.onTypingStatusUpdate()
      .pipe(takeUntil(this.destroy$))
      .subscribe(typingData => {
        console.log('⌨️ [Chat] Estado de escritura actualizado:', typingData);
        
        // Actualizar estado de escritura con timestamp
        const currentTypingStates = this.typingStates();
        const newTypingStates = new Map(currentTypingStates);
        newTypingStates.set(typingData.participantId, typingData.isTyping);
        this.typingStates.set(newTypingStates);
        
        // Si está escribiendo, configurar timeout para limpiar el estado
        if (typingData.isTyping) {
          setTimeout(() => {
            this.cleanExpiredTypingStates();
          }, 10000); // Limpiar después de 10 segundos sin actualizaciones
        }
      });

    this.chatWebSocketService.onChatUpdate()
      .pipe(takeUntil(this.destroy$))
      .subscribe(chatData => {
        console.log('💬 [Chat] Chat actualizado:', chatData);
        
        // Actualizar el chat en la lista si coincide con alguno existente
        const currentChats = this.chats();
        const chatIndex = currentChats.findIndex(chat => chat.id === chatData.chatId);
        
        if (chatIndex >= 0) {
          const updatedChats = [...currentChats];
          // Actualizar solo los campos relevantes del chat
          updatedChats[chatIndex] = {
            ...updatedChats[chatIndex],
            status: (chatData.status as Chat['status']) || updatedChats[chatIndex].status,
            lastMessageAt: chatData.lastMessageAt || updatedChats[chatIndex].lastMessageAt
          };
          this.chats.set(updatedChats);
        }
      });

    // Suscribirse a mensajes generales del WebSocket para eventos adicionales
    this.webSocketService.getMessages()
      .pipe(takeUntil(this.destroy$))
      .subscribe(message => {
        // Manejar eventos específicos que no estén cubiertos por ChatWebSocketService
        switch (message.type) {
          case 'chat:message-received':
            console.log('📨 [Chat] Nuevo mensaje recibido:', message.data);
            // Actualizar último mensaje del chat correspondiente
            this.updateChatLastMessage(message.data);
            break;
          
          case 'chat:participant-joined':
            console.log('👋 [Chat] Participante se unió:', message.data);
            // Actualizar participantes del chat
            this.updateChatParticipants(message.data);
            break;
            
          case 'chat:participant-left':
            console.log('👋 [Chat] Participante se fue:', message.data);
            // Actualizar participantes del chat
            this.removeChatParticipant(message.data);
            break;
            
          default:
            // Ignorar otros eventos
            break;
        }
      });

    console.log('✅ [Chat] Listeners WebSocket configurados');
  }

  /**
   * Limpia estados de escritura expirados
   */
  private cleanExpiredTypingStates(): void {
    const currentTypingStates = this.typingStates();
    const newTypingStates = new Map();
    
    // Por simplicidad, limpiar todos los estados de escritura
    // En una implementación más robusta, se podría mantener timestamps
    // y solo limpiar los que hayan expirado
    
    this.typingStates.set(newTypingStates);
    console.log('🧹 [Chat] Estados de escritura expirados limpiados');
  }

  /**
   * Actualiza el último mensaje de un chat
   */
  private updateChatLastMessage(messageData: any): void {
    if (!messageData.chatId || !messageData.content) return;
    
    const currentChats = this.chats();
    const chatIndex = currentChats.findIndex(chat => chat.id === messageData.chatId);
    
    if (chatIndex >= 0) {
      const updatedChats = [...currentChats];
      updatedChats[chatIndex] = {
        ...updatedChats[chatIndex],
        lastMessage: {
          id: messageData.id || `temp-${Date.now()}`,
          chatId: messageData.chatId,
          senderId: messageData.senderId,
          senderName: messageData.senderName || 'Usuario',
          content: messageData.content,
          type: messageData.type || 'text',
          timestamp: messageData.timestamp || new Date().toISOString(),
          isRead: false
        },
        lastMessageAt: messageData.timestamp || new Date().toISOString()
      };
      this.chats.set(updatedChats);
    }
  }

  /**
   * Actualiza los participantes de un chat
   */
  private updateChatParticipants(participantData: any): void {
    if (!participantData.chatId || !participantData.participant) return;
    
    const currentChats = this.chats();
    const chatIndex = currentChats.findIndex(chat => chat.id === participantData.chatId);
    
    if (chatIndex >= 0) {
      const updatedChats = [...currentChats];
      const chat = updatedChats[chatIndex];
      
      // Verificar si el participante ya existe
      const existingParticipantIndex = chat.participants.findIndex(
        p => p.id === participantData.participant.id
      );
      
      if (existingParticipantIndex >= 0) {
        // Actualizar participante existente
        chat.participants[existingParticipantIndex] = {
          ...chat.participants[existingParticipantIndex],
          ...participantData.participant
        };
      } else {
        // Agregar nuevo participante
        chat.participants.push(participantData.participant);
      }
      
      this.chats.set(updatedChats);
    }
  }

  /**
   * Remueve un participante de un chat
   */
  private removeChatParticipant(participantData: any): void {
    if (!participantData.chatId || !participantData.participantId) return;
    
    const currentChats = this.chats();
    const chatIndex = currentChats.findIndex(chat => chat.id === participantData.chatId);
    
    if (chatIndex >= 0) {
      const updatedChats = [...currentChats];
      const chat = updatedChats[chatIndex];
      
      chat.participants = chat.participants.filter(
        p => p.id !== participantData.participantId
      );
      
      this.chats.set(updatedChats);
    }
  }
}