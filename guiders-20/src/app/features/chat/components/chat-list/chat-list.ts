import { Component, inject, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, catchError, of, map, startWith, Subject, takeUntil } from 'rxjs';

import { Chat, ChatStatus } from '../../../../../../../libs/feature/chat/domain/entities/chat.entity';
import { ChatService } from '../../services/chat.service';
import { WebSocketService } from '../../../../core/services/websocket.service';
import { 
  Response, 
  ChatStatusUpdatedData, 
  ParticipantOnlineStatusUpdatedData, 
  ChatLastMessageUpdatedData 
} from '../../../../core/models/websocket.models';

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
  private websocketService = inject(WebSocketService);
  private destroy$ = new Subject<void>();

  // Signals para el estado
  searchTerm = signal('');
  selectedFilter = signal<ChatStatus | 'all'>('all');
  isLoading = signal(false);
  error = signal<string | null>(null);
  isRetryLoading = signal(false);
  private chatsSignal = signal<Chat[]>([]);

  // Opciones de filtro
  filterOptions: FilterOption[] = [
    { value: 'all', label: 'Todos los chats' },
    { value: 'active', label: 'Activos' },
    { value: 'waiting', label: 'En espera' },
    { value: 'inactive', label: 'Inactivos' },
    { value: 'closed', label: 'Cerrados' }
  ];

  // Observable de chats convertido a signal
  private chats$ = this.loadChats();
  chats = computed(() => this.chatsSignal());

  // Computed signals
  filteredChats = computed(() => {
    const chats = this.chats();
    const search = this.searchTerm().toLowerCase().trim();
    const filter = this.selectedFilter();

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

  showEmptyState = computed(() => 
    !this.isLoading() && !this.error() && this.chats().length === 0
  );

  showErrorState = computed(() => 
    !this.isLoading() && this.error() !== null
  );

  selectedFilterValue = computed(() => this.selectedFilter());

  ngOnInit() {
    this.loadInitialChats();
    this.setupWebSocketListeners();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadChats(): Observable<Chat[]> {
    return this.chatService.getChats({ limit: 50 }).pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Error loading chats:', error);
        this.error.set('Error al cargar los chats. Por favor, inténtalo de nuevo.');
        return of([]);
      }),
      startWith([])
    );
  }

  private loadInitialChats() {
    this.isLoading.set(true);
    this.error.set(null);
    
    this.chatService.getChats({ limit: 50 }).subscribe({
      next: (response) => {
        this.chatsSignal.set(response.data);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading initial chats:', error);
        this.error.set('Error al cargar los chats. Por favor, inténtalo de nuevo.');
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Configura los listeners de WebSocket para eventos de chat
   */
  private setupWebSocketListeners() {
    // Escuchar cambios de estado de chat
    this.websocketService.getMessagesByType('chat:status-updated')
      .pipe(takeUntil(this.destroy$))
      .subscribe(message => {
        this.handleChatStatusUpdated(message.data);
      });

    // Escuchar cambios de estado online de participantes
    this.websocketService.getMessagesByType('participant:online-status-updated')
      .pipe(takeUntil(this.destroy$))
      .subscribe(message => {
        this.handleParticipantOnlineStatusUpdated(message.data);
      });

    // Escuchar actualizaciones de último mensaje
    this.websocketService.getMessagesByType('chat:last-message-updated')
      .pipe(takeUntil(this.destroy$))
      .subscribe(message => {
        this.handleLastMessageUpdated(message.data);
      });
  }

  /**
   * Maneja eventos de actualización de estado de chat
   */
  private handleChatStatusUpdated(data: Response<ChatStatusUpdatedData>) {
    console.log('📝 Chat status updated event received:', data);
    
    // Verificar si es una respuesta exitosa
    if ('data' in data) {
      const { chatId, status } = data.data;
      const currentChats = this.chats();
      const updatedChats = currentChats.map(chat => 
        chat.id === chatId 
          ? { ...chat, status: status as ChatStatus, updatedAt: new Date() }
          : chat
      );
      
      // Actualizar el signal de chats
      this.updateChatsSignal(updatedChats);
    } else {
      // Manejar error
      console.error('Error in chat status update:', data.error);
    }
  }

  /**
   * Maneja eventos de actualización de estado online de participantes
   */
  private handleParticipantOnlineStatusUpdated(data: Response<ParticipantOnlineStatusUpdatedData>) {
    console.log('👤 Participant online status updated event received:', data);
    
    // Verificar si es una respuesta exitosa
    if ('data' in data) {
      const { participantId, isOnline } = data.data;
      const currentChats = this.chats();
      const updatedChats = currentChats.map(chat => ({
        ...chat,
        participants: chat.participants?.map(participant =>
          participant.id === participantId
            ? { ...participant, isOnline }
            : participant
        )
      }));
      
      // Actualizar el signal de chats
      this.updateChatsSignal(updatedChats);
    } else {
      // Manejar error
      console.error('Error in participant online status update:', data.error);
    }
  }

  /**
   * Maneja eventos de actualización de último mensaje
   */
  private handleLastMessageUpdated(data: Response<ChatLastMessageUpdatedData>) {
    console.log('📨 Last message updated event received:', data);
    
    // Verificar si es una respuesta exitosa
    if ('data' in data) {
      const { chatId, lastMessage, lastMessageAt, senderId } = data.data;
      const currentChats = this.chats();
      const updatedChats = currentChats.map(chat => 
        chat.id === chatId 
          ? { 
              ...chat, 
              lastMessage: {
                id: Date.now().toString(), // Temporal ID
                chatId,
                senderId,
                senderName: 'Unknown', // No tenemos el nombre en el evento
                content: lastMessage,
                type: 'text' as const,
                timestamp: new Date(lastMessageAt),
                isRead: false
              },
              updatedAt: new Date(lastMessageAt)
            }
          : chat
      );
      
      // Actualizar el signal de chats
      this.updateChatsSignal(updatedChats);
    } else {
      // Manejar error
      console.error('Error in last message update:', data.error);
    }
  }

  /**
   * Actualiza el signal de chats de manera reactiva
   */
  private updateChatsSignal(updatedChats: Chat[]) {
    console.log('📊 Updating chats with WebSocket data:', updatedChats.length, 'chats');
    this.chatsSignal.set(updatedChats);
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
        this.chatsSignal.set(response.data);
        this.isRetryLoading.set(false);
      },
      error: (error) => {
        console.error('Error retrying chats:', error);
        this.error.set('Error al cargar los chats. Por favor, inténtalo de nuevo.');
        this.isRetryLoading.set(false);
      }
    });
  }

  // Métodos de utilidad
  getVisitorName(chat: Chat): string {
    const visitor = chat.participants?.find(p => p.role === 'visitor');
    return visitor?.name || 'Visitante Anónimo';
  }

  getParticipantInitials(chat: Chat): string {
    const name = this.getVisitorName(chat);
    return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2);
  }

  getParticipantStatusClass(chat: Chat): string {
    const visitor = chat.participants?.find(p => p.role === 'visitor');
    return visitor?.isOnline ? 'chat-item__status--online' : 'chat-item__status--offline';
  }

  getLastMessagePreview(chat: Chat): string {
    return chat.lastMessage?.content || 'Sin mensajes';
  }

  formatLastMessageTime(chat: Chat): string {
    if (!chat.lastMessage?.timestamp) return '';
    
    const messageDate = new Date(chat.lastMessage.timestamp);
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
