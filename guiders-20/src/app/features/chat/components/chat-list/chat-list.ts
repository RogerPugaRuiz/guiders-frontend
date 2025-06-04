import { Component, inject, OnInit, OnDestroy, signal, computed, effect, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, catchError, of, map, startWith, Subject, takeUntil } from 'rxjs';

import { Chat, ChatStatus, Participant } from '../../../../../../../libs/feature/chat/domain/entities/chat.entity';
import { ChatService } from '../../services/chat.service';
import { WebSocketService } from '../../../../core/services/websocket.service';
import { HttpClient } from '@angular/common/http';
import { AvatarService } from '../../../../core/services/avatar.service';

interface FilterOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-chat-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-list.html',
  styleUrl: './chat-list.scss'
})
export class ChatListComponent implements OnInit, OnDestroy {
  private chatService = inject(ChatService);
  private cdr = inject(ChangeDetectorRef);
  private avatarService = inject(AvatarService);
  private websocketService = inject(WebSocketService);
  private destroy$ = new Subject<void>();

  // Signals para el estado
  searchTerm = signal('');
  selectedFilter = signal<ChatStatus | 'all'>('all');
  isLoading = signal(false);
  error = signal<string | null>(null);
  isRetryLoading = signal(false);

  // Opciones de filtro
  filterOptions: FilterOption[] = [
    { value: 'all', label: 'Todos los chats' },
    { value: 'active', label: 'Activos' },
    { value: 'inactive', label: 'Inactivos' },
    { value: 'pending', label: 'Pendientes' },
    { value: 'archived', label: 'Archivados' },
    { value: 'closed', label: 'Cerrados' }
  ];

  // Signal para almacenar los chats
  chats = signal<Chat[]>([]);

  // Computed signals
  filteredChats = computed(() => {
    const chats = this.chats();
    const search = this.searchTerm().toLowerCase().trim();
    const filter = this.selectedFilter();

    // Validación defensiva para evitar errores con chats undefined
    if (!chats || !Array.isArray(chats)) {
      return [];
    }

    return chats.filter(chat => {
      // Filtro por estado
      const matchesFilter = filter === 'all' || chat.status === filter;
      
      // Filtro por búsqueda
      const matchesSearch = !search || 
        this.getVisitorName(chat).toLowerCase().includes(search) ||
        this.getLastMessagePreview(chat).toLowerCase().includes(search);

      return matchesFilter && matchesSearch;
    });
  });

  showEmptyState = computed(() => {
    const chats = this.chats();
    // Validación defensiva para evitar errores con chats undefined
    return !this.isLoading() && !this.error() && (!chats || chats.length === 0);
  });

  showErrorState = computed(() => 
    !this.isLoading() && this.error() !== null
  );

  selectedFilterValue = computed(() => this.selectedFilter());

  constructor() {
    // Effect para debugging - monitora cambios en el signal de chats
    effect(() => {
      const chats = this.chats();
      console.log('🔄 Effect: Chats signal changed:', {
        count: chats?.length || 0,
        chats: chats,
        isArray: Array.isArray(chats)
      });
    });

    // Effect para debugging - monitora el estado de loading
    effect(() => {
      const loading = this.isLoading();
      console.log('🔄 Effect: Loading state changed:', loading);
    });

    // Effect para debugging - monitora el estado de error
    effect(() => {
      const error = this.error();
      console.log('🔄 Effect: Error state changed:', error);
    });

    // Effect para debugging - monitora los chats filtrados
    effect(() => {
      const filtered = this.filteredChats();
      console.log('🔄 Effect: Filtered chats changed:', {
        count: filtered?.length || 0,
        filtered: filtered
      });
    });
  }

  ngOnInit() {
    this.loadChats();
    this.setupWebSocketSubscriptions();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Configura las suscripciones a eventos WebSocket
   */
  private setupWebSocketSubscriptions(): void {
    console.log('🔌 [ChatList] Configurando suscripciones WebSocket...');
    
    // Suscribirse a todos los mensajes WebSocket y filtrar por eventos específicos
    this.websocketService.getMessages()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (message) => {
          console.log('📨 [ChatList] Mensaje WebSocket recibido:', message);
          this.handleWebSocketMessage(message);
        },
        error: (error) => {
          console.error('❌ [ChatList] Error en WebSocket:', error);
        }
      });

    console.log('✅ [ChatList] Suscripciones WebSocket configuradas');
  }

  /**
   * Maneja los mensajes WebSocket entrantes
   */
  private handleWebSocketMessage(message: any): void {
    if (!message || !message.type) {
      console.warn('⚠️ [ChatList] Mensaje WebSocket inválido:', message);
      return;
    }

    try {
      switch (message.type) {
        case 'chat:status-updated':
          this.handleChatStatusUpdated(message.data);
          break;
        case 'participant:online-status-updated':
          this.handleParticipantOnlineStatusUpdated(message.data);
          break;
        case 'chat:last-message-updated':
          this.handleChatLastMessageUpdated(message.data);
          break;
        default:
          // Ignorar otros eventos
          console.log('🔇 [ChatList] Evento WebSocket ignorado:', message.type);
      }
    } catch (error) {
      console.error('❌ [ChatList] Error procesando mensaje WebSocket:', error, message);
    }
  }

  /**
   * Maneja actualizaciones de estado de chat
   */
  private handleChatStatusUpdated(data: any): void {
    console.log('📝 [ChatList] Procesando chat:status-updated:', data);

    // Verificar si los datos vienen en formato Response o directamente
    let chatId: string;
    let status: string;

    if (data && typeof data === 'object') {
      // Si viene como SuccessResponse
      if ('data' in data && data.data) {
        if ('error' in data) {
          console.error('❌ [ChatList] Error en chat:status-updated:', data.error);
          return;
        }
        chatId = data.data.chatId;
        status = data.data.status;
      } else {
        // Si viene directamente con los datos
        chatId = data.chatId;
        status = data.status;
      }

      if (chatId && status) {
        this.updateChatStatus(chatId, status);
      } else {
        console.warn('⚠️ [ChatList] Datos incompletos para chat:status-updated:', data);
      }
    }
  }

  /**
   * Maneja actualizaciones de estado online de participantes
   */
  private handleParticipantOnlineStatusUpdated(data: any): void {
    console.log('👤 [ChatList] Procesando participant:online-status-updated:', data);

    // Verificar si los datos vienen en formato Response o directamente
    let participantId: string;
    let isOnline: boolean;

    if (data && typeof data === 'object') {
      // Si viene como SuccessResponse
      if ('data' in data && data.data) {
        if ('error' in data) {
          console.error('❌ [ChatList] Error en participant:online-status-updated:', data.error);
          return;
        }
        participantId = data.data.participantId;
        isOnline = data.data.isOnline;
      } else {
        // Si viene directamente con los datos
        participantId = data.participantId;
        isOnline = data.isOnline;
      }

      if (participantId !== undefined && isOnline !== undefined) {
        this.updateParticipantOnlineStatus(participantId, isOnline);
      } else {
        console.warn('⚠️ [ChatList] Datos incompletos para participant:online-status-updated:', data);
      }
    }
  }

  /**
   * Maneja actualizaciones del último mensaje de chat
   */
  private handleChatLastMessageUpdated(data: any): void {
    console.log('💬 [ChatList] Procesando chat:last-message-updated:', data);

    // Verificar si los datos vienen en formato Response o directamente
    let chatId: string;
    let lastMessage: string;
    let lastMessageAt: string;
    let senderId: string;

    if (data && typeof data === 'object') {
      // Si viene como SuccessResponse
      if ('data' in data && data.data) {
        if ('error' in data) {
          console.error('❌ [ChatList] Error en chat:last-message-updated:', data.error);
          return;
        }
        chatId = data.data.chatId;
        lastMessage = data.data.lastMessage;
        lastMessageAt = data.data.lastMessageAt;
        senderId = data.data.senderId;
      } else {
        // Si viene directamente con los datos
        chatId = data.chatId;
        lastMessage = data.lastMessage;
        lastMessageAt = data.lastMessageAt;
        senderId = data.senderId;
      }

      if (chatId && lastMessage && lastMessageAt && senderId) {
        this.updateChatLastMessage(chatId, lastMessage, lastMessageAt, senderId);
      } else {
        console.warn('⚠️ [ChatList] Datos incompletos para chat:last-message-updated:', data);
      }
    }
  }

  /**
   * Actualiza el estado de un chat específico
   */
  private updateChatStatus(chatId: string, status: string): void {
    const currentChats = this.chats();
    const chatIndex = currentChats.findIndex(chat => chat.id === chatId);

    if (chatIndex === -1) {
      console.warn('⚠️ [ChatList] Chat no encontrado para actualizar estado:', chatId);
      return;
    }

    const updatedChats = [...currentChats];
    updatedChats[chatIndex] = {
      ...updatedChats[chatIndex],
      status: status as ChatStatus
    };

    this.chats.set(updatedChats);
    console.log('✅ [ChatList] Estado de chat actualizado:', { chatId, status });
  }

  /**
   * Actualiza el estado online de un participante
   */
  private updateParticipantOnlineStatus(participantId: string, isOnline: boolean): void {
    const currentChats = this.chats();
    let chatUpdated = false;

    const updatedChats = currentChats.map(chat => {
      const participantIndex = chat.participants?.findIndex(p => p.id === participantId);
      
      if (participantIndex !== undefined && participantIndex >= 0) {
        const updatedParticipants = [...(chat.participants || [])];
        updatedParticipants[participantIndex] = {
          ...updatedParticipants[participantIndex],
          isOnline,
          lastSeenAt: isOnline ? new Date().toISOString() : updatedParticipants[participantIndex].lastSeenAt
        };

        chatUpdated = true;
        return {
          ...chat,
          participants: updatedParticipants
        };
      }

      return chat;
    });

    if (chatUpdated) {
      this.chats.set(updatedChats);
      console.log('✅ [ChatList] Estado online de participante actualizado:', { participantId, isOnline });
    } else {
      console.warn('⚠️ [ChatList] Participante no encontrado para actualizar estado online:', participantId);
    }
  }

  /**
   * Actualiza el último mensaje de un chat específico
   */
  private updateChatLastMessage(chatId: string, lastMessage: string, lastMessageAt: string, senderId: string): void {
    const currentChats = this.chats();
    const chatIndex = currentChats.findIndex(chat => chat.id === chatId);

    if (chatIndex === -1) {
      console.warn('⚠️ [ChatList] Chat no encontrado para actualizar último mensaje:', chatId);
      return;
    }

    const chat = currentChats[chatIndex];
    const participant = chat.participants?.find(p => p.id === senderId);
    
    const updatedChats = [...currentChats];
    updatedChats[chatIndex] = {
      ...updatedChats[chatIndex],
      lastMessage: {
        id: `temp-${Date.now()}`, // ID temporal para el mensaje
        chatId: chatId,
        senderId: senderId,
        senderName: participant?.name || 'Usuario',
        content: lastMessage,
        type: 'text' as const,
        timestamp: lastMessageAt,
        isRead: false
      },
      lastMessageAt: lastMessageAt
    };

    this.chats.set(updatedChats);
    console.log('✅ [ChatList] Último mensaje de chat actualizado:', { chatId, lastMessage: lastMessage.substring(0, 50) + '...' });
  }

  private loadChats() {
    console.log('🚀 [ChatList] Iniciando carga de chats...');
    this.isLoading.set(true);
    this.error.set(null);
    
    console.log('🔧 [ChatList] Llamando chatService.getChats...');
    this.chatService.getChats({ limit: 50 }).subscribe({
      next: (response) => {
        console.log('📨 [ChatList] Respuesta recibida del servicio:', {
          response,
          responseType: typeof response,
          hasResponse: !!response,
          responseKeys: response ? Object.keys(response) : 'No response'
        });
        
        // Extraer los chats de la respuesta normalizada
        const chats = response.data || [];
        console.log('📝 [ChatList] Chats extraídos:', {
          chats,
          length: chats.length,
          isArray: Array.isArray(chats),
          firstItem: chats[0]
        });
        
        // Asignar los chats al signal
        this.chats.set(chats);
        
        console.log('✅ [ChatList] Chats asignados al signal. Verificando estado:', {
          signalValue: this.chats(),
          signalLength: this.chats().length,
          signalIsArray: Array.isArray(this.chats())
        });
        
        this.isLoading.set(false);
        
        // Forzar detección de cambios
        this.cdr.detectChanges();
        console.log('🔄 [ChatList] Detección de cambios forzada');
      },
      error: (error) => {
        console.error('❌ [ChatList] Error loading chats:', error);
        this.error.set('Error al cargar los chats. Por favor, inténtalo de nuevo.');
        this.isLoading.set(false);
        this.cdr.detectChanges();
      }
    });
  }

  // Métodos para el template
  onSearchChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchTerm.set(target.value);
  }

  onFilterChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.selectedFilter.set(target.value as ChatStatus | 'all');
  }

  retryLoadChats() {
    this.isRetryLoading.set(true);
    this.error.set(null);
    
    this.chatService.getChats({ limit: 50 }).subscribe({
      next: (response) => {
        console.log('Chats recargados:', response);
        const chats = response.data || [];
        this.chats.set(chats);
        this.isRetryLoading.set(false);
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error retrying chats:', error);
        this.error.set('Error al cargar los chats. Por favor, inténtalo de nuevo.');
        this.isRetryLoading.set(false);
        this.cdr.detectChanges();
      }
    });
  }

  // Métodos de utilidad para manejar participantes visitantes
  getVisitor(chat: Chat): Participant | undefined {
    return chat.participants?.find(p => p.isVisitor);
  }

  getVisitorName(chat: Chat): string {
    const visitor = this.getVisitor(chat);
    // Si el nombre es un UUID (formato común para visitantes anónimos), mostrar algo más amigable
    if (visitor?.name && visitor.name.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      return `Visitante ${visitor.name.substring(0, 4)}`;
    }
    return visitor?.name || 'Visitante Anónimo';
  }

  isAnonymousVisitor(chat: Chat): boolean {
    const visitor = this.getVisitor(chat);
    return visitor?.isAnonymous ?? false;
  }

  getParticipantInitials(chat: Chat): string {
    const name = this.getVisitorName(chat);
    return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2);
  }

  getParticipantAvatarUrl(chat: Chat): string {
    const visitor = this.getVisitor(chat);
    const name = visitor?.name || 'Visitante Anónimo';
    return this.avatarService.generateVisitorAvatar(name, 32);
  }

  onAvatarError(event: any, chat: Chat): void {
    // Ocultar la imagen y mostrar el fallback
    const img = event.target as HTMLImageElement;
    const avatarDiv = img.parentElement;
    if (avatarDiv) {
      img.style.display = 'none';
      const fallback = avatarDiv.querySelector('.chat-item__avatar-fallback') as HTMLElement;
      if (fallback) {
        fallback.style.display = 'flex';
      }
    }
  }

  getParticipantStatusClass(chat: Chat): string {
    const visitor = this.getVisitor(chat);
    
    if (visitor?.isViewing) {
      return 'chat-item__status--viewing';
    } else if (visitor?.isTyping) {
      return 'chat-item__status--typing';
    } else if (visitor?.isOnline) {
      return 'chat-item__status--online';
    } else if (visitor?.lastSeenAt) {
      // Si el visitante tiene lastSeenAt, significa que ha estado conectado pero inactivo
      const lastSeen = new Date(visitor.lastSeenAt);
      const now = new Date();
      const diffMinutes = (now.getTime() - lastSeen.getTime()) / (1000 * 60);
      
      // Si la última vez que se vio fue hace menos de 30 minutos, está inactivo
      if (diffMinutes < 30) {
        return 'chat-item__status--inactive';
      }
    }
    
    // Por defecto, estado desconectado
    return 'chat-item__status--offline';
  }
  
  getParticipantStatusText(chat: Chat): string {
    const visitor = this.getVisitor(chat);
    
    if (visitor?.isViewing) {
      return 'Viendo página';
    } else if (visitor?.isTyping) {
      return 'Escribiendo...';
    } else if (visitor?.isOnline) {
      return 'Conectado';
    } else if (visitor?.lastSeenAt) {
      const lastSeen = new Date(visitor.lastSeenAt);
      const now = new Date();
      const diffMinutes = (now.getTime() - lastSeen.getTime()) / (1000 * 60);
      
      // Si la última vez que se vio fue hace menos de 30 minutos, está inactivo
      if (diffMinutes < 30) {
        return 'Inactivo';
      } else if (diffMinutes < 60) {
        return 'Visto recientemente';
      } else {
        const diffInHours = Math.floor(diffMinutes / 60);
        if (diffInHours < 24) {
          return `Visto hace ${diffInHours}h`;
        } else {
          const days = Math.floor(diffInHours / 24);
          return `Visto hace ${days}d`;
        }
      }
    } else {
      return 'Desconectado';
    }
  }

  getLastMessagePreview(chat: Chat): string {
    return chat.lastMessage?.content || 'Sin mensajes';
  }

  formatLastMessageTime(chat: Chat): string {
    // Usar lastMessage.timestamp si existe, o lastMessageAt si no
    const timestamp = chat.lastMessage?.timestamp || chat.lastMessageAt;
    
    if (!timestamp) return '';
    
    const messageDate = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const minutes = Math.floor(diffInHours * 60);
      return `${minutes}m`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h`;
    } else {
      return messageDate.toLocaleDateString('es-ES', { 
        day: 'numeric', 
        month: 'short' 
      });
    }
  }
}
