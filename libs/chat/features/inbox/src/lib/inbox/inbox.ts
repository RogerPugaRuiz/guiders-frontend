import { Component, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ChatService } from '@guiders-frontend/chat-service';
import { Chat, Message } from '@guiders-frontend/shared/types';
import { SessionService } from '@guiders-frontend/auth/data-access/session';
import { Button } from '@guiders-frontend/button';
import { IconComponent } from '@guiders-frontend/icon';

@Component({
  selector: 'chat-inbox',
  imports: [
    CommonModule,
    HttpClientModule,
    Button,
    IconComponent
  ],
  templateUrl: './inbox.html',
  styleUrl: './inbox.scss',
})
export class Inbox {
  private readonly router = inject(Router);
  private readonly chatService = inject(ChatService);
  private readonly sessionService = inject(SessionService);

  // Señales para el estado del componente
  readonly selectedConversationId = signal<string | null>(null);
  readonly showChatList = signal<boolean>(true);
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  
  // Señales para datos sincronizados
  readonly conversations = signal<Chat[]>([]);
  readonly allMessages = signal<{ [chatId: string]: Message[] }>({});

  // Observables del servicio
  readonly chats$ = this.chatService.chats$;
  readonly selectedChat$ = this.chatService.selectedChat$;
  readonly messages$ = this.chatService.messages$;
  readonly loading$ = this.chatService.loading$;
  readonly error$ = this.chatService.error$;

  // Computed values
  readonly currentUser = computed(() => this.sessionService.getCurrentUser());
  readonly currentUserId = computed(() => this.currentUser()?.sub || null);
  readonly hasSelectedChat = computed(() => this.selectedConversationId() !== null);
  readonly selectedChat = computed(() => {
    const chatId = this.selectedConversationId();
    if (!chatId) return null;
    
    const chats = this.conversations();
    return chats.find((chat: Chat) => chat.chatId === chatId) || null;
  });
  readonly currentChatMessages = computed(() => {
    const chatId = this.selectedConversationId();
    if (!chatId) return [];
    
    const allMessages = this.allMessages();
    return allMessages[chatId] || [];
  });
  readonly validCurrentUserId = computed(() => {
    const userId = this.currentUserId();
    return userId || '';
  });

  // Señales para filtros y búsqueda
  readonly selectedFilter = signal<string>('all');
  readonly searchQuery = signal<string>('');

  constructor() {
    // Cargar chats iniciales
    this.loadChats();
    
    // Recargar chats cada 30 segundos para mantener datos actualizados
    setInterval(() => {
      this.loadChats();
    }, 30000);

    // Sincronizar señales con observables
    this.chats$.subscribe(chats => {
      this.conversations.set(chats || []);
    });

    this.messages$.subscribe(messages => {
      this.allMessages.set(messages || {});
    });

    // Suscribirse a cambios de chat seleccionado
    this.selectedChat$.subscribe(chatId => {
      this.selectedConversationId.set(chatId);
      if (chatId) {
        this.loadMessages(chatId);
      }
    });

    // Suscribirse a errores
    this.error$.subscribe(errorMessage => {
      this.error.set(errorMessage);
    });

    // Suscribirse a estado de loading
    this.loading$.subscribe(loading => {
      this.isLoading.set(loading);
    });
  }

  // ===== MÉTODOS PÚBLICOS =====

  /**
   * Cargar lista de chats con filtros aplicados
   */
  loadChats(): void {
    console.log('📞 Inbox: Iniciando loadChats()...');
    
    // Obtener el ID del comercial actual
    const commercialId = this.currentUserId();
    console.log('👤 Inbox: Commercial ID obtenido:', commercialId);
    
    if (!commercialId) {
      console.warn('⚠️ Inbox: No hay commercial ID disponible - usuario no autenticado');
      this.error.set('Usuario no autenticado');
      return;
    }

    // Preparar filtros basados en el estado actual
    const selectedFilter = this.selectedFilter();
    const searchQuery = this.searchQuery();
    console.log('🔍 Inbox: Filtros actuales - selectedFilter:', selectedFilter, 'searchQuery:', searchQuery);
    
    const options: {
      cursor?: string;
      limit?: number;
      filters?: {
        status?: string[];
        priority?: string[];
        department?: string;
        dateFrom?: string;
        dateTo?: string;
      };
      sort?: {
        field?: string;
        direction?: 'asc' | 'desc';
      };
    } = {
      limit: 50, // Límite por defecto
      sort: {
        field: 'lastMessageAt',
        direction: 'desc'
      }
    };
    
    if (selectedFilter !== 'all') {
      options.filters = {
        status: [selectedFilter]
      };
      console.log('🎯 Inbox: Aplicando filtro de estado:', selectedFilter);
    }

    console.log('📋 Inbox: Opciones de consulta preparadas:', JSON.stringify(options, null, 2));
    console.log('🚀 Inbox: Llamando a chatService.getCommercialChats()...');

    this.chatService.getCommercialChats(commercialId, options).subscribe({
      next: (chats) => {
        console.log('✅ Inbox: Respuesta recibida del servicio - número de chats:', chats?.length || 0);
        console.log('📊 Inbox: Chats recibidos del servicio:', chats);
        
        let filteredChats = chats;
        
        // Aplicar búsqueda local si hay query
        const query = searchQuery.trim().toLowerCase();
        if (query) {
          console.log('🔎 Inbox: Aplicando búsqueda local con query:', query);
          const originalCount = chats.length;
          
          filteredChats = chats.filter(chat => 
            chat.participants.some(p => 
              p.name.toLowerCase().includes(query) ||
              (p.email && p.email.toLowerCase().includes(query))
            ) ||
            chat.lastMessage?.content.toLowerCase().includes(query)
          );
          
          console.log(`🔍 Inbox: Búsqueda aplicada - ${originalCount} → ${filteredChats.length} chats`);
        }
        
        console.log('📝 Inbox: Chats finales después de filtros:', filteredChats);
        console.log(`📈 Inbox: Total de chats a mostrar: ${filteredChats.length}`);
        
        // Si no hay chat seleccionado y hay chats disponibles, seleccionar el primero
        const currentSelectedChatId = this.selectedConversationId();
        console.log('🎯 Inbox: Chat actualmente seleccionado:', currentSelectedChatId);
        
        if (filteredChats.length > 0 && !currentSelectedChatId) {
          console.log('🔄 Inbox: Auto-seleccionando primer chat:', filteredChats[0].chatId);
          this.onUserSelected(filteredChats[0]);
        } else if (filteredChats.length === 0) {
          console.log('📭 Inbox: No hay chats disponibles para mostrar');
        } else {
          console.log('✨ Inbox: Manteniendo chat seleccionado actual:', currentSelectedChatId);
        }
        
        console.log('✅ Inbox: loadChats() completado exitosamente');
      },
      error: (error) => {
        console.error('❌ Inbox: Error al cargar chats:', error);
        console.error('🔍 Inbox: Detalles del error:', {
          message: error.message,
          status: error.status,
          statusText: error.statusText,
          url: error.url,
          commercialId,
          options
        });
        this.error.set('Error al cargar los chats');
      }
    });
  }

  /**
   * Seleccionar un chat
   */
  onUserSelected(chat: Chat): void {
    this.chatService.selectChat(chat.chatId);
    this.selectedConversationId.set(chat.chatId);
    
    // En dispositivos móviles, ocultar la lista de chats
    if (this.isMobile()) {
      this.showChatList.set(false);
    }
  }

  /**
   * Cargar mensajes de un chat
   */
  loadMessages(chatId: string): void {
    this.chatService.getMessages(chatId).subscribe({
      next: (messages) => {
        console.log(`Mensajes cargados para chat ${chatId}:`, messages);
      },
      error: (error) => {
        console.error('Error al cargar mensajes:', error);
        this.error.set('Error al cargar los mensajes');
      }
    });
  }

  /**
   * Enviar mensaje
   */
  onMessageSent(content: string): void {
    const chatId = this.selectedConversationId();
    if (!chatId) return;

    const userId = this.currentUserId();
    if (!userId) {
      this.error.set('Usuario no autenticado');
      return;
    }

    this.chatService.sendMessage({
      chatId,
      content,
      type: 'TEXT'
    }).subscribe({
      next: (message) => {
        if (message) {
          console.log('Mensaje enviado:', message);
        }
      },
      error: (error) => {
        console.error('Error al enviar mensaje:', error);
        this.error.set('Error al enviar el mensaje');
      }
    });
  }

  /**
   * Marcar mensaje como leído
   */
  onMessageRead(message: Message): void {
    this.chatService.markAsRead([message.messageId]).subscribe({
      next: (success) => {
        if (success) {
          console.log('Mensaje marcado como leído');
        }
      },
      error: (error) => {
        console.error('Error al marcar mensaje como leído:', error);
      }
    });
  }

  /**
   * Volver a la lista de chats (móvil)
   */
  goBackToChatList(): void {
    this.showChatList.set(true);
    this.chatService.selectChat(null);
    this.selectedConversationId.set(null);
  }

  /**
   * Actualizar filtro seleccionado
   */
  updateFilter(filter: string): void {
    this.selectedFilter.set(filter);
    this.loadChats(); // Recargar con el nuevo filtro
  }

  /**
   * Actualizar query de búsqueda
   */
  updateSearchQuery(query: string): void {
    this.searchQuery.set(query);
    // Debounce la búsqueda para mejorar el rendimiento
    setTimeout(() => {
      this.loadChats();
    }, 300);
  }

  /**
   * Cambiar prioridad de filtro
   */
  updatePriorityFilter(priorities: string[]): void {
    // Este método se puede usar desde el template para filtrar por prioridad
    const commercialId = this.currentUserId();
    if (!commercialId) return;

    const options = {
      filters: {
        priority: priorities
      },
      sort: {
        field: 'lastMessageAt' as const,
        direction: 'desc' as const
      }
    };

    this.chatService.getCommercialChats(commercialId, options).subscribe({
      next: (chats) => {
        console.log('Chats filtrados por prioridad:', chats);
      },
      error: (error) => {
        console.error('Error al filtrar por prioridad:', error);
        this.error.set('Error al filtrar chats');
      }
    });
  }

  /**
   * Crear nuevo chat
   */
  createNewChat(): void {
    // Implementar lógica para crear nuevo chat
    console.log('Crear nuevo chat');
  }

  /**
   * Refrescar datos
   */
  refresh(): void {
    this.loadChats();
    const chatId = this.selectedConversationId();
    if (chatId) {
      this.loadMessages(chatId);
    }
  }

  /**
   * Limpiar error
   */
  clearError(): void {
    this.error.set(null);
  }

  // ===== MÉTODOS PRIVADOS =====

  /**
   * Detectar si estamos en dispositivo móvil
   */
  private isMobile(): boolean {
    return window.innerWidth < 768;
  }

  // ===== MÉTODOS ADICIONALES PARA EL NUEVO TEMPLATE =====

  /**
   * Obtener nombre para mostrar del chat
   */
  getChatDisplayName(chat: Chat): string {
    if (chat.name && chat.name !== 'Chat sin título' && chat.name !== 'Visitante') {
      return chat.name;
    }

    const visitor = chat.participants?.find(p => p.role === 'visitor');
    if (visitor?.name && visitor.name.trim()) {
      return visitor.name;
    }

    if (visitor?.email && visitor.email.trim()) {
      return visitor.email;
    }

    return 'Visitante';
  }

  /**
   * Obtener avatar del chat
   */
  getChatAvatar(chat: Chat): string {
    if (chat.participants && chat.participants.length > 2) {
      return '👥';
    }

    const visitor = chat.participants?.find(p => p.role === 'visitor');
    return visitor?.avatar || '👤';
  }

  /**
   * Obtener preview del último mensaje
   */
  getChatPreview(chat: Chat): string {
    if (!chat.lastMessage) {
      return 'Sin mensajes';
    }

    const message = chat.lastMessage;
    if (message.type === 'TEXT') {
      return message.content.length > 60
        ? message.content.substring(0, 60) + '...'
        : message.content;
    }

    switch (message.type) {
      case 'IMAGE': return '📷 Imagen';
      case 'FILE': return '📎 Archivo';
      case 'AUDIO': return '🎵 Audio';
      case 'VIDEO': return '🎥 Video';
      case 'SYSTEM': return '📢 Mensaje del sistema';
      default: return 'Mensaje';
    }
  }

  /**
   * Formatear tiempo del chat
   */
  formatChatTime(timestamp: Date | string | undefined): string {
    if (!timestamp) return '';

    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return '';

      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);

      if (minutes < 1) return 'Ahora';
      if (minutes < 60) return `${minutes}m`;
      if (hours < 24) return `${hours}h`;
      if (days < 7) return `${days}d`;

      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit'
      });
    } catch (error) {
      console.warn('Error al formatear fecha:', timestamp, error);
      return '';
    }
  }

  /**
   * Obtener filtros disponibles
   */
  getAvailableFilters(): Array<{id: string, label: string, icon: string, count: number}> {
    const allChats = this.conversations();

    return [
      {
        id: 'all',
        label: 'Todos',
        icon: '💬',
        count: allChats.length
      },
      {
        id: 'ACTIVE',
        label: 'Activos',
        icon: '🟢',
        count: allChats.filter((chat: Chat) => chat.status === 'ACTIVE').length
      },
      {
        id: 'PENDING',
        label: 'Pendientes',
        icon: '🟡',
        count: allChats.filter((chat: Chat) => chat.status === 'PENDING').length
      },
      {
        id: 'unread',
        label: 'No leídos',
        icon: '🔴',
        count: allChats.filter((chat: Chat) => chat.unreadCount > 0).length
      }
    ];
  }

  /**
   * Obtener datetime string para el atributo HTML
   */
  getChatDatetime(chat: Chat): string | null {
    if (!chat.lastMessage?.sentAt) return null;

    try {
      return new Date(chat.lastMessage.sentAt).toISOString();
    } catch {
      return null;
    }
  }

  /**
   * Formatear tiempo del chat con validación de safety
   */
  formatChatTimeFromChat(chat: Chat): string {
    return this.formatChatTime(chat.lastMessage?.sentAt);
  }
}
