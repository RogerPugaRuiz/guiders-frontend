import { Component, input, output, signal, computed, inject, effect, resource, ResourceStreamItem, Signal, OnInit, OnDestroy, linkedSignal, viewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AvatarService } from '../../../../core/services/avatar.service';
import { AuthService } from '../../../../core/services/auth.service';
import { HttpClient, httpResource } from '@angular/common/http';
import { ChatData, ChatListResponse, ChatStatus, Participant, MessagesListResponse } from '../../models/chat.models';
import { ChatLastMessageUpdatedData } from '../../../../core/models/websocket-response.models';
import { environment } from 'src/environments/environment';
import { WebSocketConnectionStateDefault, WebSocketMessage, WebSocketService } from 'src/app/core/services';
import { toSignal } from '@angular/core/rxjs-interop';
import { WebSocketMessageType } from 'src/app/core/enums';
import { catchError, EMPTY, filter, tap } from 'rxjs';

interface FilterOption {
  value: string;
  label: string;
}

// Interfaces para los eventos emitidos
export interface ChatSearchEvent {
  searchTerm: string;
}

export interface ChatFilterEvent {
  filter: ChatStatus | 'all';
}

export interface ChatSelectionEvent {
  chat: ChatData;
}

export interface ChatRetryEvent {
  // Evento simple para indicar retry
}

@Component({
  selector: 'app-chat-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-list.html',
  styleUrl: './chat-list.scss'
})
export class ChatListComponent implements OnInit, OnDestroy, AfterViewInit {
  // Injection of services
  private avatarService = inject(AvatarService);
  private authService = inject(AuthService);
  private ws = inject(WebSocketService);
  private http = inject(HttpClient);

  // Referencia al contenedor de chats para el scroll infinito
  chatListContainer = viewChild<ElementRef>('chatListContainer');

  // Variables para manejar el scroll infinito
  private isLoadingMore = false;
  private scrollDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  private loadMoreThrottleTimer: ReturnType<typeof setTimeout> | null = null;
  private minimumLoadingTimer: ReturnType<typeof setTimeout> | null = null;
  private cleanupScrollListener: (() => void) | null = null;

  // Configuración para el scroll infinito
  private readonly SCROLL_THRESHOLD = 200; // Distancia del bottom para activar carga (aumentado para mayor sensibilidad)
  private readonly DEBOUNCE_DELAY = 100; // Delay para debounce del scroll (reducido para mayor respuesta)
  private readonly THROTTLE_DELAY = 200; // Delay para throttle de cargas (reducido)
  private readonly MINIMUM_LOADING_DURATION = 800; // Tiempo mínimo para mostrar loading (reducido)

  // Signal para mostrar el indicador de carga de scroll infinito
  isLoadingMoreChats = signal(false);
  private loadingStartTime = 0;

  // Signal para acumular todos los chats HTTP
  allChats = signal<ChatData[]>([]);

  // Output events
  chatSelected = output<ChatSelectionEvent>();
  participantStatusUpdated = output<{ participantId: string; isOnline: boolean }>();

  // Signals
  searchTerm = signal('');
  selectedFilter = signal<ChatStatus | 'all'>('all');
  isLoading = signal(false);
  error = signal<string | null>(null);
  isRetryLoading = signal(false);
  selectedChat = signal<ChatData | null>(null);
  previousSelectedChatId = signal<string | null>(null); // Para rastrear cambios de selección
  limit = signal(24);
  cursor = signal<string>("");
  include = signal<string[]>(['participants', 'lastMessage', 'metadata']);
  
  // Signal para mantener el conteo de mensajes no leídos por chat ID
  unreadCountsMap = signal<Map<string, number>>(new Map());

  constructor() {
    effect(() => {
      console.log('🔄 Resource Status:', this.chatsResource.status());
      console.log('📊 Resource Value:', this.chatsResource.value());
      console.log('🔄 Is Loading:', this.chatsResource.isLoading());
      console.log('❌ Error:', this.chatsResource.error());
      console.log('📦 Chats computed:', this.chats());
      console.log('🎯 Filtered chats:', this.filteredChats());
    });

    // Effect para monitorear cambios en el cursor y status del resource
    effect(() => {
      const cursor = this.cursor();
      const status = this.chatsResource.status();
      const isLoading = this.chatsResource.isLoading();
      
      console.log('📋 [ChatList] Cambio en cursor o status:', {
        cursor,
        status,
        isLoading,
        wsConnected: this.wsConnected().connected
      });
    });

    // Effect para acumular chats cuando cambian los datos del httpResource
    effect(() => {
      const newData = this.chatsResource.value();
      const isFirst = this.isFirstLoad();

      if (newData?.chats) {
        console.log('📋 [ChatList] Nuevos datos recibidos:', {
          chatsCount: newData.chats.length,
          isFirst,
          hasMore: newData.hasMore,
          nextCursor: newData.nextCursor,
          total: newData.total
        });

        requestAnimationFrame(() => {
          if (isFirst) {
            // Primera carga: reemplazar todos los chats
            this.allChats.set(newData.chats);
            console.log('📋 [ChatList] Primera carga:', newData.chats.length, 'chats');
          } else {
            // Cargas posteriores: acumular chats (añadir al final para paginación)
            this.allChats.update(current => {
              const existingIds = new Set(current.map(chat => chat.id));
              const newChats = newData.chats.filter(chat => !existingIds.has(chat.id));
              
              // Añadir nuevos chats al final
              const combined = [...current, ...newChats];
              console.log('📋 [ChatList] Chats acumulados:', {
                nuevos: newChats.length,
                anteriores: current.length,
                total: combined.length
              });
              return combined;
            });
          }
          
          // Si no hay más chats para cargar, ocultar el indicador
          if (!newData.hasMore && this.isLoadingMoreChats()) {
            console.log('📋 [ChatList] No hay más chats, completando carga...');
            this.animateLoadingCompletion();
          } else if (this.isLoadingMore) {
            // Si hay más chats pero terminamos de cargar esta página, resetear el flag
            console.log('📋 [ChatList] Página cargada, reseteando flag de loading...');
            setTimeout(() => {
              this.animateLoadingCompletion();
            }, 500);
          }
        });
      }
    });

    // Effect para resetear paginación cuando cambien los filtros
    effect(() => {
      const searchTerm = this.searchTerm();
      const selectedFilter = this.selectedFilter();
      
      // Solo resetear si hay filtros activos y ya tenemos chats cargados
      // Esto evita resetear en la carga inicial
      if ((searchTerm || selectedFilter !== 'all') && this.allChats().length > 0) {
        console.log('🔄 [ChatList] Filtros cambiados, reseteando paginación');
        setTimeout(() => {
          this.resetPagination();
          // Forzar recarga después del reset
          this.chatsResource.reload();
        }, 0);
      }
    });

    effect(() => {
      const status = this.wsConnected();
      if (status.connected && this.chatsResource.status() === 'idle') {
        this.chatsResource.reload();
      }
    });

    effect(() => {
      const participantStatus = this.participantStatusUpdate();
      if (participantStatus) {
        this.participantStatusUpdated.emit(participantStatus.data.data as { participantId: string; isOnline: boolean });
      }
    });

    // Effect para cargar conteos de mensajes no leídos cuando cambian los chats
    effect(() => {
      const chats = this.filteredChats();
      if (chats.length > 0) {
        // Usar setTimeout para evitar cargas síncronas que puedan bloquear la UI
        setTimeout(() => {
          this.loadUnreadCountsForVisibleChats();
        }, 100);
      }
    });

    // Effect para monitorear cambios en la selección de chat y enviar eventos WebSocket
    effect(() => {
      const currentSelectedChat = this.selectedChat();
      const previousSelectedChatId = this.previousSelectedChatId();
      
      // Si había un chat seleccionado anteriormente y es diferente al actual
      if (previousSelectedChatId && previousSelectedChatId !== currentSelectedChat?.id) {
        this.emitViewingChatMessage(previousSelectedChatId, false);
        console.log('👁️ [ChatList] Effect: Chat anterior desconectado por cambio de selección:', previousSelectedChatId);
      }
      
      // Si hay un chat seleccionado actualmente
      if (currentSelectedChat) {
        this.emitViewingChatMessage(currentSelectedChat.id, true);
        console.log('👁️ [ChatList] Effect: Chat actual conectado por cambio de selección:', currentSelectedChat.id);
        
        // Limpiar conteo de mensajes no leídos
        this.clearUnreadCount(currentSelectedChat.id);
      }
      
      // Actualizar el ID del chat anteriormente seleccionado
      this.previousSelectedChatId.set(currentSelectedChat?.id || null);
    });

    // Effect para manejar la recepción de un chat asignado al comercial
    effect(() => {
      const incomingChat = this.commercialIncomingChat();
      
      if (incomingChat?.data?.data?.chat) {
        const newChat = incomingChat.data.data.chat as ChatData;
        
        console.log('🔔 [ChatList] Nuevo chat asignado al comercial recibido:', newChat);
        
        // Reproducir sonido de notificación o mostrar toast si es necesario
        this.playNotificationSound();
        
        // Opcional: Seleccionar automáticamente el nuevo chat
        // this.selectChat(newChat);
      }
    });

    // Effect para seleccionar automáticamente el primer chat cuando se cambien los filtros
    effect(() => {
      const filteredChats = this.filteredChats();
      const currentSelection = this.selectedChat();
      
      // Si no hay chat seleccionado y hay chats disponibles, seleccionar el primero
      if (!currentSelection && filteredChats.length > 0) {
        setTimeout(() => {
          this.selectFirstChatIfNone();
        }, 100);
      }
      
      // Si el chat actual ya no está en la lista filtrada, deseleccionarlo
      if (currentSelection && !filteredChats.some(chat => chat.id === currentSelection.id)) {
        // El effect de selección se encargará de enviar el mensaje de desconexión
        this.selectedChat.set(null);
        console.log('❌ [ChatList] Chat seleccionado ya no está en la lista filtrada, deseleccionando');
      }
    });
  }
  
  ngAfterViewInit(): void {
    // Configurar listener para scroll infinito
    this.setupScrollListener();
  }
  
  ngOnInit(): void {
  }
  
  ngOnDestroy(): void {
    // Deseleccionar el chat actual al destruir el componente
    // El effect se encargará de enviar el mensaje de desconexión automáticamente
    if (this.selectedChat()) {
      this.selectedChat.set(null);
      console.log('👁️ [ChatList] Componente destruido, deseleccionando chat actual');
    }

    // Limpiar todos los timers y listeners
    if (this.scrollDebounceTimer) {
      clearTimeout(this.scrollDebounceTimer);
      this.scrollDebounceTimer = null;
    }
    
    if (this.loadMoreThrottleTimer) {
      clearTimeout(this.loadMoreThrottleTimer);
      this.loadMoreThrottleTimer = null;
    }

    if (this.minimumLoadingTimer) {
      clearTimeout(this.minimumLoadingTimer);
      this.minimumLoadingTimer = null;
    }
    
    // Limpiar listener de scroll
    if (this.cleanupScrollListener) {
      this.cleanupScrollListener();
      this.cleanupScrollListener = null;
    }
    
    console.log('📋 [ChatList] Componente destruido, timers y listeners limpiados');
  }
  

  // Triggers
  onSearchChange($event: Event) {
    const target = $event.target as HTMLInputElement;
    this.searchTerm.set(target.value.trim().toLowerCase());
    console.log('🔍 [ChatList] Término de búsqueda actualizado:', this.searchTerm());
  }

  onFilterChange($event: Event) {
    const target = $event.target as HTMLSelectElement;
    const filterValue = target.value as ChatStatus | 'all';
    this.selectedFilter.set(filterValue);
    console.log('🎯 [ChatList] Filtro actualizado:', this.selectedFilter());
  }

  filterOptions: FilterOption[] = [
    { value: 'all', label: 'Todos' },
    { value: 'active', label: 'Activos' },
    { value: 'archived', label: 'Archivados' },
    { value: 'closed', label: 'Cerrados' },
    { value: 'pending', label: 'Pendientes' },
    { value: 'inactive', label: 'Inactivos' }
  ];

  connectionTrigger = toSignal(
    this.ws.getConnectionStatus(),
    { initialValue: null }
  );
  // Convierte el observable del WebSocket a signal
  wsConnected = toSignal(this.ws.getConnectionStatus(), {
    initialValue: {
      connected: false,
      connecting: false,
      error: null,
      lastConnected: null,
      reconnectAttempts: 0
    }
  });


  // Computed signal que determina si es la primera carga
  private isFirstLoad = computed(() => this.cursor() === '');

  chatsResource = httpResource<ChatListResponse>(() => {
    // Solo ejecuta la petición si el WebSocket está conectado
    if (!this.wsConnected().connected) {
      console.log('📋 [ChatList] WebSocket no conectado, no ejecutando petición');
      return undefined;
    }

    const params = {
      limit: this.limit(),
      cursor: this.cursor(),
      include: this.include().join(',')
    };

    console.log('📋 [ChatList] Configurando httpResource con parámetros:', params);

    return {
      url: `${environment.apiUrl}/chats`,
      params
    };
  });

  participantStatusUpdate = toSignal(
    this.ws.getMessagesByType(WebSocketMessageType.PARTICIPANT_ONLINE_STATUS_UPDATED)
      .pipe(
        // Añadir console.log para ver el contenido del observable
        tap(message => {
        }),
        filter(message => message && message.data),
        catchError(err => {
          console.error('❌ Error in chat status update stream:', err);
          return EMPTY;
        })
      ),
    { initialValue: null }
  );

  // Signal para recibir actualizaciones de chat asignado a comercial
  commercialIncomingChat = toSignal(
    this.ws.getMessagesByType(WebSocketMessageType.COMMERCIAL_INCOMING_CHAT)
      .pipe(
        tap(message => {
          console.log('🔔 [ChatList] Recibido chat asignado a comercial:', message);
        }),
        filter(message => message && message.data && message.data.data && message.data.data.chat),
        catchError(err => {
          console.error('❌ Error en el stream de chat asignado a comercial:', err);
          return EMPTY;
        })
      ),
    { initialValue: null }
  );

  // Signal para recibir mensajes entrantes y actualizar el último mensaje
  incomingMessage = toSignal(
    this.ws.getMessagesByType(WebSocketMessageType.RECEIVE_MESSAGE)
      .pipe(
        tap(message => {
          const messageId = message?.data?.data?.id || 'unknown';
          console.log('📨 [ChatList] Mensaje entrante recibido en componente:', {
            messageId,
            timestamp: Date.now(),
            componentName: 'ChatListComponent',
            message
          });
        }),
        filter(message => message && message.data && message.data.data),
        catchError(err => {
          console.error('❌ Error en el stream de mensajes entrantes:', err);
          return EMPTY;
        })
      ),
    { initialValue: null }
  );

  chats = linkedSignal(() => {
    const httpChats = this.allChats();
    const participantStatusUpdate = this.participantStatusUpdate();
    const incomingChat = this.commercialIncomingChat();
    const incomingMessage = this.incomingMessage();

    let updatedChats = httpChats;

    // Manejar nuevo chat asignado al comercial
    if (incomingChat?.data?.data?.chat) {
      console.log('🔔 [ChatList] Procesando chat entrante asignado al comercial:', incomingChat);
      
      const newChat = incomingChat.data.data.chat as ChatData;
      
      // Verificar si el chat ya existe en la lista
      const chatExists = updatedChats.some(chat => chat.id === newChat.id);
      
      if (!chatExists) {
        // Añadir el nuevo chat al principio de la lista
        console.log('➕ [ChatList] Añadiendo nuevo chat a la lista:', newChat);
        updatedChats = [newChat, ...updatedChats];
      } else {
        // Actualizar el chat existente
        console.log('🔄 [ChatList] Actualizando chat existente:', newChat.id);
        updatedChats = updatedChats.map(chat => 
          chat.id === newChat.id ? newChat : chat
        );
      }
      
      console.log('🔄 [ChatList] Lista de chats actualizada con nuevo chat asignado:', updatedChats);
    }

    // Handle participant status updates
    if (participantStatusUpdate?.data?.data) {
      console.log('🔄 [ChatList] Participant status update:', participantStatusUpdate);

      const { isOnline, participantId } = participantStatusUpdate.data.data as {
        isOnline: boolean;
        participantId: string;
      };

      console.log('🔍 Debug - participantId:', participantId, 'isOnline:', isOnline);

      updatedChats = updatedChats.map(chat => {
        console.log('🔍 Processing chat:', chat.id);
        const updatedParticipants = chat.participants.map(participant => {
          console.log('🔍 Checking participant:', participant.id, 'against:', participantId);
          if (participant.id === participantId) {
            console.log('✅ Found matching participant, updating isOnline to:', isOnline);
            return { ...participant, isOnline };
          }
          return participant;
        });

        return {
          ...chat,
          participants: updatedParticipants
        };
      });

      console.log('🔄 [ChatList] Updated chats with participant status:', updatedChats);
    }

    // Manejar mensajes entrantes para actualizar último mensaje
    if (incomingMessage?.data?.data) {
      console.log('📨 [ChatList] Procesando mensaje entrante:', incomingMessage);
      
      const messageData = incomingMessage.data.data;
      const { chatId, message, createdAt, senderId } = messageData;
      const currentUser = this.authService.currentUser();

      // Actualizar el último mensaje del chat correspondiente
      updatedChats = updatedChats.map(chat => {
        if (chat.id === chatId) {
          console.log('✅ [ChatList] Actualizando último mensaje para chat:', chatId);
          return {
            ...chat,
            lastMessage: message,
            lastMessageAt: createdAt
          };
        }
        return chat;
      });

      // Si el mensaje no es del usuario actual, incrementar el conteo de no leídos
      if (currentUser && senderId !== currentUser.id) {
        setTimeout(() => {
          const currentCount = this.unreadCountsMap().get(chatId) || 0;
          this.updateUnreadCount(chatId, currentCount + 1);
          console.log('📨 [ChatList] Incrementando conteo de mensajes no leídos para chat:', chatId, 'nuevo conteo:', currentCount + 1);
        }, 0);
      }

      // Verificar si el chat está seleccionado actualmente y emitir mensaje de visualización
      const selectedChatId = this.selectedChat()?.id;
      if (selectedChatId === chatId) {
        setTimeout(() => {
          this.emitViewingChatMessage(chatId, true);
          console.log('👁️ [ChatList] Mensaje de visualización enviado para chat activo:', chatId);
        }, 0);
      }

      console.log('🔄 [ChatList] Lista de chats actualizada con mensaje entrante:', updatedChats);
    }

    return updatedChats;
  });

  filteredChats = computed(() => {
    const allChats = this.chats() || [];
    const searchTerm = this.searchTerm();
    const selectedFilter = this.selectedFilter();
    
    let filtered = allChats;
    
    // Aplicar filtro por estado
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(chat => chat.status === selectedFilter);
    }
    
    // Aplicar filtro de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(chat => {
        // Buscar en el nombre del visitante
        const visitorName = this.getVisitorName(chat).toLowerCase();
        
        // Buscar en el último mensaje
        const lastMessage = chat.lastMessage ? chat.lastMessage.toLowerCase() : '';
        
        // Buscar en el ID del chat
        const chatId = chat.id.toLowerCase();
        
        // Buscar en nombres de todos los participantes
        const participantNames = chat.participants
          .map(p => p.name)
          .join(' ')
          .toLowerCase();
        
        return visitorName.includes(searchTerm) ||
               lastMessage.includes(searchTerm) ||
               chatId.includes(searchTerm) ||
               participantNames.includes(searchTerm);
      });
    }
    
    // Ordenar chats: primero los activos/en línea, luego por fecha del último mensaje
    return filtered.sort((a, b) => {
      // Priorizar chats con visitantes en línea
      const aVisitor = this.getVisitor(a);
      const bVisitor = this.getVisitor(b);
      
      if (aVisitor?.isOnline && !bVisitor?.isOnline) return -1;
      if (!aVisitor?.isOnline && bVisitor?.isOnline) return 1;
      
      // Si ambos tienen el mismo estado online, ordenar por última actividad
      const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      
      return bTime - aTime; // Más reciente primero
    });
  });

  // functions
  retryLoadChats() {
    this.isRetryLoading.set(true);
    this.error.set(null);
    
    console.log('🔄 [ChatList] Reintentando cargar chats...');
    
    // Recargar el resource
    this.chatsResource.reload();
    
    // Reset loading state after a delay
    setTimeout(() => {
      this.isRetryLoading.set(false);
    }, 1000);
  }

  isChatSelected(chat: ChatData): boolean {
    return this.selectedChat()?.id === chat.id;
  }

  selectChat(chat: ChatData): void {
    // Usar signal local para mantener el estado seleccionado
    // El effect se encargará de manejar los eventos WebSocket automáticamente
    this.selectedChat.set(chat);
    
    // Emitir evento al componente padre
    this.chatSelected.emit({ chat });
    
    console.log('✅ [ChatList] Chat seleccionado mediante signal y output:', chat.id, chat);
  }

  getChatAvatar(chat: ChatData): string {
    const visitor = this.getVisitorName(chat);
    return this.avatarService.generateVisitorAvatar(visitor);
  }

  getVisitorName(chat: ChatData): string {
    return chat.participants
      .filter(participant => participant.isVisitor)
      .map(participant => participant.name)[0] || 'Visitante';
  }

  onAvatarError($event: Event, chat: ChatData): void {

  }


  getParticipantInitials(chat: ChatData): string {
    return chat.participants
      .filter(participant => participant.isVisitor)
      .map(participant => participant.name)
      .map(name => name.split(' ').map(part => part.charAt(0).toUpperCase()).join(''))[0] || 'V';
  }

  /**
   * Reproduce un sonido de notificación cuando se recibe un nuevo chat
   */
  private playNotificationSound(): void {
    try {
      // Usar un elemento de audio HTML5 para reproducir el sonido
      const audio = new Audio('/assets/sounds/notification.mp3');
      audio.volume = 0.5; // Volumen al 50%
      audio.play().catch(error => {
        // Capturar errores de reproducción (común en navegadores que requieren interacción del usuario)
        console.warn('🔊 No se pudo reproducir el sonido de notificación:', error);
      });
    } catch (error) {
      console.error('❌ Error al intentar reproducir sonido de notificación:', error);
    }
  }

  getParticipantStatusClass(chat: ChatData): string {
    const visitor = this.getVisitor(chat);
    if (!visitor) return 'chat-item__status--offline';
    
    if (visitor.isTyping) {
      return 'chat-item__status--typing';
    }
    
    if (visitor.isOnline) {
      return 'chat-item__status--online';
    }
    
    // Si no está online, verificar si ha estado activo recientemente
    if (visitor.lastSeenAt) {
      const lastSeen = new Date(visitor.lastSeenAt);
      const now = new Date();
      const diffMinutes = (now.getTime() - lastSeen.getTime()) / (1000 * 60);
      
      // Si estuvo activo en los últimos 5 minutos, considerarlo inactivo, sino offline
      if (diffMinutes <= 5) {
        return 'chat-item__status--inactive';
      }
    }
    
    return 'chat-item__status--offline';
  }

  getParticipantStatusText(chat: ChatData): string {
    const visitor = this.getVisitor(chat);
    if (!visitor) return 'Usuario no disponible';
    
    if (visitor.isTyping) {
      return 'Escribiendo...';
    }
    
    if (visitor.isOnline) {
      return 'En línea';
    }
    
    // Si no está online, verificar cuándo fue la última vez que estuvo activo
    if (visitor.lastSeenAt) {
      const lastSeen = new Date(visitor.lastSeenAt);
      const now = new Date();
      const diffMinutes = (now.getTime() - lastSeen.getTime()) / (1000 * 60);
      
      if (diffMinutes <= 1) {
        return 'Activo hace menos de un minuto';
      } else if (diffMinutes <= 5) {
        return `Activo hace ${Math.floor(diffMinutes)} minutos`;
      } else if (diffMinutes <= 60) {
        return `Visto hace ${Math.floor(diffMinutes)} minutos`;
      } else if (diffMinutes <= 1440) { // 24 horas
        const hours = Math.floor(diffMinutes / 60);
        return `Visto hace ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
      } else {
        const days = Math.floor(diffMinutes / 1440);
        return `Visto hace ${days} ${days === 1 ? 'día' : 'días'}`;
      }
    }
    
    return 'Fuera de línea';
  }

  isAnonymousVisitor(chat: ChatData): boolean {
    return chat.participants.some(participant => participant.isVisitor && participant.isAnonymous);
  }

  formatLastMessageTime(chat: ChatData): string {
    const lastMessageAt = chat.lastMessageAt;
    if (!lastMessageAt) return '';

    const date = new Date(lastMessageAt);
    const now = new Date();

    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear();

    if (isToday) {
      // Formato HH:MM con ceros a la izquierda
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    }

    if (isYesterday) {
      return 'Ayer';
    }

    // Formato dd/mm/yy
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString().slice(-2);
    return `${day}/${month}/${year}`;
  }

  getLastMessagePreview(chat: ChatData): string {
    return chat.lastMessage ? chat.lastMessage : 'Sin mensajes';
  }

  getVisitor(chat: ChatData): Participant | null {
    return chat.participants.find(participant => participant.isVisitor) || null;
  }

  /**
   * Verifica si el chat tiene mensajes no leídos para el usuario actual
   * Compara el lastSeenAt del participante (usuario actual) con el lastMessageAt del chat
   * Si el chat está seleccionado actualmente, nunca considera que tiene mensajes no leídos
   */
  hasUnreadMessages(chat: ChatData): boolean {
    // Si el chat está seleccionado actualmente, nunca considerar que tiene mensajes no leídos
    if (this.isChatSelected(chat)) {
      return false;
    }
    
    const currentUser = this.authService.currentUser();
    if (!currentUser) return false;

    // Buscar el participante que corresponde al usuario actual (no es visitante y tiene el mismo ID)
    const currentUserParticipant = chat.participants.find(
      participant => !participant.isVisitor && participant.id === currentUser.id
    );

    if (!currentUserParticipant) return false;

    // Si no hay último mensaje en el chat, no hay mensajes no leídos
    if (!chat.lastMessageAt) return false;

    // Si el participante nunca ha visto el chat, hay mensajes no leídos
    if (!currentUserParticipant.lastSeenAt) return true;

    // Comparar fechas: si el último mensaje es posterior a cuando el usuario vio por última vez
    const lastMessageTime = new Date(chat.lastMessageAt).getTime();
    const lastSeenTime = new Date(currentUserParticipant.lastSeenAt).getTime();

    return lastMessageTime > lastSeenTime;
  }

  /**
   * Obtiene el número de mensajes no leídos para un chat específico
   * Usa el signal unreadCountsMap para obtener el conteo cached
   * Si el chat está seleccionado actualmente, siempre retorna 0
   */
  getUnreadCount(chat: ChatData): number {
    // Si el chat está seleccionado actualmente, nunca mostrar contador
    if (this.isChatSelected(chat)) {
      return 0;
    }
    
    if (!this.hasUnreadMessages(chat)) return 0;
    
    const cachedCount = this.unreadCountsMap().get(chat.id);
    if (cachedCount !== undefined) {
      // Limitar el conteo mostrado a 99 máximo
      return Math.min(cachedCount, 99);
    }

    // Si no está en cache, iniciar carga async y retornar 1 como placeholder
    this.loadUnreadCountForChat(chat);
    return 1;
  }

  /**
   * Obtiene el texto a mostrar en el badge de notificación
   * Muestra "99+" si hay más de 99 mensajes no leídos
   * Si el chat está seleccionado actualmente, nunca muestra texto
   */
  getUnreadCountText(chat: ChatData): string {
    // Si el chat está seleccionado actualmente, nunca mostrar texto del contador
    if (this.isChatSelected(chat)) {
      return '';
    }
    
    const count = this.getUnreadCount(chat);
    if (count === 0) return '';
    if (count > 99) return '99+';
    return count.toString();
  }

  /**
   * Carga el conteo de mensajes no leídos para un chat específico de forma asíncrona
   */
  private async loadUnreadCountForChat(chat: ChatData): Promise<void> {
    const currentUser = this.authService.currentUser();
    if (!currentUser) return;

    const currentUserParticipant = chat.participants.find(
      participant => !participant.isVisitor && participant.id === currentUser.id
    );

    if (!currentUserParticipant) return;

    try {
      // Hacer petición para obtener mensajes del chat
      const response = await this.http.get<MessagesListResponse>(
        `${environment.apiUrl}/chats/${chat.id}/messages`,
        {
          params: {
            limit: '50', // Obtener mensajes recientes suficientes
            cursor: '' // Desde el más reciente
          }
        }
      ).toPromise();

      if (!response?.messages) {
        this.updateUnreadCount(chat.id, 0);
        return;
      }

      // Filtrar mensajes posteriores al lastSeenAt del usuario
      const lastSeenTime = currentUserParticipant.lastSeenAt ? 
        new Date(currentUserParticipant.lastSeenAt).getTime() : 0;

      const unreadMessages = response.messages.filter(message => {
        const messageTime = new Date(message.createdAt).getTime();
        // Contar mensajes que son posteriores al lastSeenAt y que NO son del usuario actual
        return messageTime > lastSeenTime && message.senderId !== currentUser.id;
      });

      this.updateUnreadCount(chat.id, unreadMessages.length);
    } catch (error) {
      console.error('Error al cargar conteo de mensajes no leídos para chat', chat.id, ':', error);
      this.updateUnreadCount(chat.id, 0);
    }
  }

  /**
   * Actualiza el conteo de mensajes no leídos para un chat específico
   */
  private updateUnreadCount(chatId: string, count: number): void {
    this.unreadCountsMap.update(currentMap => {
      const newMap = new Map(currentMap);
      newMap.set(chatId, count);
      return newMap;
    });
  }

  /**
   * Carga los conteos de mensajes no leídos para todos los chats visibles
   */
  private loadUnreadCountsForVisibleChats(): void {
    const visibleChats = this.filteredChats();
    visibleChats.forEach(chat => {
      if (this.hasUnreadMessages(chat) && !this.unreadCountsMap().has(chat.id)) {
        this.loadUnreadCountForChat(chat);
      }
    });
  }

  /**
   * Limpia el conteo de mensajes no leídos para un chat específico
   * Útil cuando el usuario selecciona un chat (marca como leído)
   */
  clearUnreadCount(chatId: string): void {
    this.updateUnreadCount(chatId, 0);
  }

  /**
   * Limpia todos los conteos de mensajes no leídos
   */
  clearAllUnreadCounts(): void {
    this.unreadCountsMap.set(new Map());
  }

  /**
   * Emite un mensaje WebSocket para indicar que se está visualizando un chat
   */
  private emitViewingChatMessage(chatId: string, isViewing: boolean): void {
    if (!this.ws.isConnected()) {
      console.warn('👁️ [ChatList] No hay conexión WebSocket activa, no se puede enviar mensaje de visualización');
      return;
    }

    try {
      this.ws.emitEvent('commercial:viewing-chat', {
        chatId,
        isViewing
      });
      
      console.log('👁️ [ChatList] Mensaje de visualización enviado:', {
        chatId,
        isViewing,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('❌ [ChatList] Error al enviar mensaje de visualización:', error);
    }
  }

  /**
   * Método público para deseleccionar el chat actual
   * Útil cuando se necesita deseleccionar desde el componente padre
   */
  public deselectCurrentChat(): void {
    // El effect se encargará de enviar el mensaje de desconexión automáticamente
    this.selectedChat.set(null);
    console.log('👁️ [ChatList] Chat deseleccionado mediante signal');
  }

  /**
   * Limpia el término de búsqueda
   */
  clearSearch(): void {
    this.searchTerm.set('');
    this.resetPagination();
    console.log('🔍 [ChatList] Búsqueda limpiada y paginación reseteada');
  }

  /**
   * Resetea todos los filtros a sus valores por defecto
   */
  resetFilters(): void {
    this.searchTerm.set('');
    this.selectedFilter.set('all');
    this.resetPagination();
    console.log('🎯 [ChatList] Filtros reseteados y paginación reseteada');
  }

  /**
   * Obtiene el número total de chats filtrados
   */
  getTotalFilteredChats(): number {
    return this.filteredChats().length;
  }

  /**
   * Verifica si hay algún filtro activo
   */
  hasActiveFilters(): boolean {
    return this.searchTerm().length > 0 || this.selectedFilter() !== 'all';
  }

  /**
   * Obtiene el primer chat de la lista filtrada
   * Útil para selección automática
   */
  getFirstChat(): ChatData | null {
    const filtered = this.filteredChats();
    return filtered.length > 0 ? filtered[0] : null;
  }

  /**
   * Selecciona el primer chat disponible si no hay uno seleccionado
   */
  selectFirstChatIfNone(): void {
    if (!this.selectedChat() && this.filteredChats().length > 0) {
      const firstChat = this.getFirstChat();
      if (firstChat) {
        this.selectChat(firstChat);
        console.log('✅ [ChatList] Primer chat seleccionado automáticamente:', firstChat.id);
      }
    }
  }

  /**
   * Configura el listener para detectar scroll al bottom y cargar más chats
   */
  private setupScrollListener(): void {
    const container = this.chatListContainer()?.nativeElement;
    if (!container) {
      console.log('📋 [ChatList] No se pudo obtener referencia al contenedor');
      return;
    }

    console.log('📋 [ChatList] Configurando scroll listener');

    let lastScrollTop = 0;
    let isScrolling = false;
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const currentScrollTop = container.scrollTop;
          const scrollHeight = container.scrollHeight;
          const clientHeight = container.clientHeight;
          
          // Detectar dirección del scroll
          const isScrollingDown = currentScrollTop > lastScrollTop;
          
          // Detectar cuando el scroll está cerca del bottom y el usuario está scrolleando hacia abajo
          const distanceFromBottom = scrollHeight - clientHeight - currentScrollTop;
          
          // Log para debug
          console.log('📋 [ChatList] Scroll info:', {
            currentScrollTop,
            scrollHeight,
            clientHeight,
            distanceFromBottom,
            threshold: this.SCROLL_THRESHOLD,
            isScrollingDown,
            shouldLoad: distanceFromBottom <= this.SCROLL_THRESHOLD && isScrollingDown && !this.isLoadingMore && !isScrolling
          });
          
          if (distanceFromBottom <= this.SCROLL_THRESHOLD && 
              isScrollingDown && 
              !this.isLoadingMore && 
              !isScrolling) {
            
            isScrolling = true;
            
            // Debounce para evitar múltiples cargas rápidas
            if (this.scrollDebounceTimer) {
              clearTimeout(this.scrollDebounceTimer);
            }
            
            this.scrollDebounceTimer = setTimeout(() => {
              console.log('📋 [ChatList] Activando carga por scroll al bottom');
              this.loadMoreChats();
              isScrolling = false;
            }, this.DEBOUNCE_DELAY);
          }
          
          lastScrollTop = currentScrollTop;
          ticking = false;
        });
        
        ticking = true;
      }
    };

    // Listener optimizado para mejor rendimiento
    container.addEventListener('scroll', handleScroll, { passive: true });
    
    // Guardar referencia para cleanup
    this.cleanupScrollListener = () => {
      container.removeEventListener('scroll', handleScroll);
      console.log('📋 [ChatList] Scroll listener removido');
    };

    // Log inicial de las dimensiones del contenedor
    console.log('📋 [ChatList] Contenedor configurado:', {
      scrollHeight: container.scrollHeight,
      clientHeight: container.clientHeight,
      scrollTop: container.scrollTop
    });
  }

  /**
   * Carga más chats cuando el usuario hace scroll al bottom
   */
  private loadMoreChats(): void {
    // Throttle para evitar cargas muy frecuentes
    if (this.loadMoreThrottleTimer) {
      console.log('📋 [ChatList] Carga throttleada, ignorando...');
      return;
    }

    const chatsResponse = this.chatsResource.value();

    // Verificar si hay más chats para cargar
    if (!chatsResponse || !chatsResponse.hasMore) {
      console.log('📋 [ChatList] No hay más chats para cargar:', {
        hasResponse: !!chatsResponse,
        hasMore: chatsResponse?.hasMore
      });
      return;
    }

    // Evitar cargas múltiples simultáneas
    if (this.isLoadingMore) {
      console.log('📋 [ChatList] Ya se está cargando más chats, ignorando...');
      return;
    }

    // Verificar que hay un cursor válido para la siguiente página
    if (!chatsResponse.nextCursor) {
      console.log('📋 [ChatList] No hay cursor para siguiente página');
      return;
    }

    this.isLoadingMore = true;
    this.isLoadingMoreChats.set(true);
    
    // Guardar el momento en que inicia la carga para tiempo mínimo
    this.loadingStartTime = Date.now();
    console.log('📋 [ChatList] Iniciando carga de más chats...', {
      currentCount: this.allChats().length,
      nextCursor: chatsResponse.nextCursor
    });

    // Aplicar throttle
    this.loadMoreThrottleTimer = setTimeout(() => {
      this.loadMoreThrottleTimer = null;
    }, this.THROTTLE_DELAY);

    // Ejecutar nextPage() para cargar más chats
    this.nextPage();
  }

  /**
   * Cargar la siguiente página de chats
   */
  nextPage(): void {
    const chatsResponse = this.chatsResource.value();
    console.log('📋 [ChatList] Cargando siguiente página de chats');

    if (chatsResponse && chatsResponse.hasMore && chatsResponse.nextCursor) {
      // Actualizar cursor para la siguiente página
      console.log('📋 [ChatList] Actualizando cursor:', {
        anterior: this.cursor(),
        nuevo: chatsResponse.nextCursor
      });
      this.cursor.set(chatsResponse.nextCursor);
      console.log('📋 [ChatList] Cursor actualizado, esto debería activar una nueva petición HTTP');
    } else {
      console.log('📋 [ChatList] No se puede cargar siguiente página:', {
        hasResponse: !!chatsResponse,
        hasMore: chatsResponse?.hasMore,
        nextCursor: chatsResponse?.nextCursor
      });
    }
  }

  /**
   * Anima la finalización de la carga para una transición más suave
   */
  private animateLoadingCompletion(): void {
    const currentTime = Date.now();
    const elapsedTime = currentTime - this.loadingStartTime;
    const remainingTime = Math.max(0, this.MINIMUM_LOADING_DURATION - elapsedTime);

    console.log('📋 [ChatList] Tiempo transcurrido:', elapsedTime, 'ms, tiempo restante:', remainingTime, 'ms');

    // Limpiar timer anterior si existe
    if (this.minimumLoadingTimer) {
      clearTimeout(this.minimumLoadingTimer);
      this.minimumLoadingTimer = null;
    }

    // Esperar el tiempo restante antes de ocultar el mensaje
    this.minimumLoadingTimer = setTimeout(() => {
      // Delay progresivo para una transición más natural
      setTimeout(() => {
        this.isLoadingMore = false;
        
        // Delay adicional para ocultar el indicador de carga
        setTimeout(() => {
          this.isLoadingMoreChats.set(false);
          console.log('📋 [ChatList] Indicador de carga ocultado después del tiempo mínimo');
        }, 100);
      }, 200);
    }, remainingTime);
  }

  /**
   * Resetea el estado de paginación (útil al cambiar filtros)
   */
  resetPagination(): void {
    this.cursor.set('');
    this.allChats.set([]);
    this.isLoadingMore = false;
    this.isLoadingMoreChats.set(false);
    
    // Limpiar timers
    if (this.scrollDebounceTimer) {
      clearTimeout(this.scrollDebounceTimer);
      this.scrollDebounceTimer = null;
    }
    if (this.loadMoreThrottleTimer) {
      clearTimeout(this.loadMoreThrottleTimer);
      this.loadMoreThrottleTimer = null;
    }
    if (this.minimumLoadingTimer) {
      clearTimeout(this.minimumLoadingTimer);
      this.minimumLoadingTimer = null;
    }
    
    console.log('📋 [ChatList] Paginación reseteada');
  }

  /**
   * Método público para diagnosticar problemas de scroll infinito
   */
  public diagnoseScrollInfinite(): void {
    const container = this.chatListContainer()?.nativeElement;
    const chatsResponse = this.chatsResource.value();
    const allChats = this.allChats();
    const filteredChats = this.filteredChats();

    console.log('🔍 [ChatList] Diagnóstico de scroll infinito:', {
      // Estado del contenedor
      container: {
        exists: !!container,
        scrollHeight: container?.scrollHeight || 0,
        clientHeight: container?.clientHeight || 0,
        scrollTop: container?.scrollTop || 0,
        distanceFromBottom: container ? (container.scrollHeight - container.clientHeight - container.scrollTop) : 0
      },
      
      // Estado de los datos
      data: {
        resourceStatus: this.chatsResource.status(),
        resourceIsLoading: this.chatsResource.isLoading(),
        hasResourceValue: !!chatsResponse,
        resourceChatCount: chatsResponse?.chats?.length || 0,
        allChatsCount: allChats.length,
        filteredChatsCount: filteredChats.length,
        hasMore: chatsResponse?.hasMore,
        nextCursor: chatsResponse?.nextCursor,
        currentCursor: this.cursor(),
        total: chatsResponse?.total
      },
      
      // Estado de carga
      loading: {
        isLoadingMore: this.isLoadingMore,
        isLoadingMoreChats: this.isLoadingMoreChats(),
        isFirstLoad: this.isFirstLoad()
      },
      
      // Estado de conexión
      connection: {
        wsConnected: this.wsConnected().connected
      },
      
      // Configuración
      config: {
        limit: this.limit(),
        scrollThreshold: this.SCROLL_THRESHOLD,
        debounceDelay: this.DEBOUNCE_DELAY,
        throttleDelay: this.THROTTLE_DELAY
      }
    });

    // Sugerencias de depuración
    if (!container) {
      console.warn('⚠️ [ChatList] Contenedor no encontrado - verificar ViewChild');
    }
    
    if (!this.wsConnected().connected) {
      console.warn('⚠️ [ChatList] WebSocket no conectado - las peticiones no se ejecutarán');
    }
    
    if (chatsResponse && !chatsResponse.hasMore) {
      console.info('ℹ️ [ChatList] No hay más chats para cargar');
    }
    
    if (this.isLoadingMore) {
      console.info('ℹ️ [ChatList] Carga en progreso...');
    }
  }

  /**
   * Verifica si se puede cargar más chats
   */
  canLoadMoreChats(): boolean {
    const chatsResponse = this.chatsResource.value();
    return !!(chatsResponse && chatsResponse.hasMore && !this.isLoadingMore);
  }

}
