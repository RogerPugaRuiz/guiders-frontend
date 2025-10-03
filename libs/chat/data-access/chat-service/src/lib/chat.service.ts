import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, map, catchError, of, filter } from 'rxjs';
import { 
  Chat, 
  Message, 
  CreateChatRequest, 
  CreateChatWithMessageRequest, 
  SendMessageRequest, 
  MarkAsReadRequest,
  CreateChatResponse,
  User
} from '@guiders-frontend/shared/types';
import { ENVIRONMENT_TOKEN } from '@guiders-frontend/auth/data-access/session';
import { WebSocketService, ChatStatusUpdate } from '@guiders-frontend/chat/data-access/websocket-service';

// Tipos internos para las respuestas de la API
interface ApiChatResponse {
  // Campos comunes a ambos formatos
  id?: string; // Nuevo formato del backend
  chatId?: string; // Formato anterior
  status: 'PENDING' | 'ACTIVE' | 'CLOSED' | 'TRANSFERRED' | 'ASSIGNED'; // ASSIGNED es el nuevo estado
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' | 'NORMAL'; // NORMAL es nueva prioridad

  // Campos del formato anterior
  department?: string;
  subject?: string;
  visitorId?: string;
  commercialId?: string;

  // Campos del nuevo formato del backend
  visitorInfo?: {
    id: string;
    name?: string;
    email?: string;
    additionalData?: Record<string, unknown>;
  };
  assignedCommercialId?: string;
  availableCommercialIds?: string[];
  metadata?: {
    department?: string;
    source?: string;
    tags?: string[];
    customFields?: Record<string, unknown>;
  };

  // Campos comunes
  queuePosition?: number;
  estimatedWaitTime?: number;
  lastMessage?: ApiMessageResponse;
  unreadCount?: number;
  unreadMessagesCount?: number; // Nuevo formato
  totalMessages?: number; // Nuevo formato
  isActive?: boolean; // Nuevo formato

  // Fechas
  createdAt: string;
  updatedAt: string;
  closedAt?: string;

  // Campos adicionales del nuevo formato
  tags?: string[];
}

interface ApiMessageResponse {
  messageId: string;
  chatId: string;
  senderId: string;
  senderType: 'VISITOR' | 'COMMERCIAL' | 'SYSTEM';
  content: string;
  type: 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM';
  sentAt: string;
  status: 'SENT' | 'DELIVERED' | 'READ';
  replyTo?: string;
  edited?: boolean;
  editedAt?: string;
  metadata?: Record<string, unknown>;
}

// Tipo para mensajes del WebSocket (pueden venir con sentAt como string o Date)
interface WebSocketMessage {
  messageId: string;
  chatId: string;
  senderId: string;
  senderType: 'VISITOR' | 'COMMERCIAL' | 'SYSTEM';
  content: string;
  type: 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM';
  sentAt: string | Date;
  status: 'SENT' | 'DELIVERED' | 'READ';
  replyTo?: string;
  edited?: boolean;
  editedAt?: string | Date;
  metadata?: Record<string, unknown>;
}

interface CreateChatWithMessageResponse {
  chat: ApiChatResponse;
  message: ApiMessageResponse;
}

interface ApiGetChatsResponse {
  chats: ApiChatResponse[];
  // Campos del formato anterior
  pagination?: {
    hasNext: boolean;
    cursor?: string;
    total?: number;
  };
  // Campos del nuevo formato del backend
  total?: number;
  hasMore?: boolean;
  nextCursor?: string | null;
}

interface ApiGetMessagesResponse {
  messages: ApiMessageResponse[];
  pagination?: {
    hasNext: boolean;
    cursor?: string;
    total?: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private readonly http = inject(HttpClient);
  private readonly environment = inject(ENVIRONMENT_TOKEN);
  private readonly webSocket = inject(WebSocketService);
  private readonly baseUrl = `${this.environment.api.baseUrl}/v2`;
  
  // Estado global del chat
  private readonly chatsSubject = new BehaviorSubject<Chat[]>([]);
  private readonly selectedChatSubject = new BehaviorSubject<string | null>(null);
  private readonly messagesSubject = new BehaviorSubject<{ [chatId: string]: Message[] }>({});
  private readonly loadingSubject = new BehaviorSubject<boolean>(false);
  private readonly errorSubject = new BehaviorSubject<string | null>(null);

  // Observables públicos
  readonly chats$ = this.chatsSubject.asObservable();
  readonly selectedChat$ = this.selectedChatSubject.asObservable();
  readonly messages$ = this.messagesSubject.asObservable();
  readonly loading$ = this.loadingSubject.asObservable();
  readonly error$ = this.errorSubject.asObservable();

  private currentUserId: string | null = null;
  private authToken: string | null = null;

  constructor() {
    // Inicializar con token del localStorage si existe
    this.authToken = localStorage.getItem('access-token');
    this.currentUserId = localStorage.getItem('user-id');

    // Inicializar WebSocket
    this.initializeWebSocket();
  }

  /**
   * Inicializar conexión WebSocket y suscribirse a eventos
   */
  private initializeWebSocket(): void {
    // Conectar al servidor WebSocket
    this.webSocket.connect({
      authToken: this.authToken,
      autoConnect: true
    });

    // Suscribirse a mensajes nuevos
    this.webSocket.messageReceived$
      .pipe(filter((message): message is Message => message !== null))
      .subscribe(message => {
        console.log('[ChatService] Mensaje recibido via WebSocket:', message);
        // Normalizar el mensaje para asegurar que sentAt sea Date
        const normalizedMessage = this.normalizeMessage(message);
        this.addMessageToState(normalizedMessage.chatId, normalizedMessage);
      });

    // Suscribirse a cambios de estado del chat
    this.webSocket.chatStatus$
      .pipe(filter((status): status is ChatStatusUpdate => status !== null))
      .subscribe(status => {
        console.log('[ChatService] Estado del chat actualizado:', status);
        this.updateChatStatus(status.chatId, status.status);
      });
  }

  // Configuración de headers para autenticación
  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    if (this.authToken) {
      headers = headers.set('Authorization', `Bearer ${this.authToken}`);
    }

    // Agregar CSRF token si está disponible
    const csrfToken = this.getCsrfToken();
    if (csrfToken) {
      headers = headers.set('X-CSRF-Token', csrfToken);
    }

    return headers;
  }

  // Configuración de opciones HTTP con credenciales
  private getHttpOptions(): { headers: HttpHeaders; withCredentials: boolean } {
    return {
      headers: this.getHeaders(),
      withCredentials: true
    };
  }

  // Obtener token CSRF desde meta tag, cookie o endpoint
  private getCsrfToken(): string | null {
    // 1. Intentar obtener desde meta tag
    const metaTag = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement;
    if (metaTag && metaTag.content) {
      return metaTag.content;
    }

    // 2. Intentar obtener desde cookie no-HttpOnly (si está configurada así)
    const cookieMatch = document.cookie.match(/(?:^|;\s*)csrf-token\s*=\s*([^;]+)/);
    if (cookieMatch) {
      return cookieMatch[1];
    }

    // 3. En una implementación real, podrías hacer una petición a /api/v2/csrf
    // para obtener el token cuando no esté disponible por otros medios
    return null;
  }

  /**
   * Obtener token CSRF desde el endpoint del BFF
   * Este método puede ser llamado al inicializar la aplicación
   */
  fetchCsrfToken(): Observable<string | null> {
    return this.http.get<{ token: string }>(`${this.baseUrl}/csrf`, { 
      withCredentials: true 
    }).pipe(
      map(response => {
        // Opcional: almacenar el token en una meta tag para uso futuro
        let metaTag = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement;
        if (!metaTag) {
          metaTag = document.createElement('meta');
          metaTag.name = 'csrf-token';
          document.head.appendChild(metaTag);
        }
        metaTag.content = response.token;
        return response.token;
      }),
      catchError(error => {
        console.warn('No se pudo obtener el token CSRF:', error);
        return of(null);
      })
    );
  }

  // Configurar usuario actual y token
  setCurrentUser(userId: string, token: string): void {
    this.currentUserId = userId;
    this.authToken = token;
    localStorage.setItem('user-id', userId);
    localStorage.setItem('access-token', token);
  }

  getCurrentUserId(): string | null {
    if (this.currentUserId) {
      return this.currentUserId;
    }
    
    // Si no tenemos el ID en memoria, intentar extraerlo del token
    try {
      const token = localStorage.getItem('access-token');
      if (!token) return null;
      
      // Decodificar JWT para obtener el ID del usuario
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.sub || payload.userId || payload.commercialId || null;
      
      if (userId) {
        this.currentUserId = userId;
      }
      
      return userId;
    } catch (error) {
      console.warn('Error al obtener ID del usuario del token:', error);
      return null;
    }
  }

  // ===== MÉTODOS DE CHAT =====

  /**
   * Obtener lista de chats para un comercial específico
   */
  getCommercialChats(commercialId: string, options?: {
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
  }): Observable<Chat[]> {
    this.setLoading(true);
    
    let url = `${this.baseUrl}/chats/commercial/${commercialId}`;
    const params = new URLSearchParams();
    
    if (options?.cursor) params.append('cursor', options.cursor);
    if (options?.limit) params.append('limit', options.limit.toString());
    
    // Filtros
    if (options?.filters?.status) {
      options.filters.status.forEach(status => 
        params.append('filters[status][]', status)
      );
    }
    if (options?.filters?.priority) {
      options.filters.priority.forEach(priority => 
        params.append('filters[priority][]', priority)
      );
    }
    if (options?.filters?.department) {
      params.append('filters[department]', options.filters.department);
    }
    if (options?.filters?.dateFrom) {
      params.append('filters[dateFrom]', options.filters.dateFrom);
    }
    if (options?.filters?.dateTo) {
      params.append('filters[dateTo]', options.filters.dateTo);
    }
    
    // Ordenamiento
    if (options?.sort?.field) {
      const sortObj = {
        field: options.sort.field,
        direction: options.sort.direction || 'desc'
      };
      params.append('sort', JSON.stringify(sortObj));
    }
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    return this.http.get<ApiGetChatsResponse>(url, this.getHttpOptions())
      .pipe(
        map(response => {
          const chats = this.transformChatsFromApi(response.chats);
          this.chatsSubject.next(chats);
          this.setLoading(false);
          return chats;
        }),
        catchError(error => {
          this.handleError('Error al obtener chats del comercial', error);
          return of([]);
        })
      );
  }

  /**
   * Obtener lista de chats con filtros y paginación (método genérico)
   */
  getChats(filters?: {
    status?: string;
    department?: string;
    limit?: number;
    cursor?: string;
  }): Observable<Chat[]> {
    // Si tenemos un usuario comercial, usar el endpoint específico
    const currentUserId = this.getCurrentUserId();
    if (currentUserId) {
      return this.getCommercialChats(currentUserId, {
        cursor: filters?.cursor,
        limit: filters?.limit,
        filters: {
          status: filters?.status ? [filters.status] : undefined,
          department: filters?.department
        }
      });
    }
    
    // Fallback al endpoint genérico si no hay usuario
    this.setLoading(true);
    
    let url = `${this.baseUrl}/chats`;
    const params = new URLSearchParams();
    
    if (filters?.status) params.append('status', filters.status);
    if (filters?.department) params.append('department', filters.department);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.cursor) params.append('cursor', filters.cursor);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    return this.http.get<ApiGetChatsResponse>(url, this.getHttpOptions())
      .pipe(
        map(response => {
          const chats = this.transformChatsFromApi(response.chats);
          this.chatsSubject.next(chats);
          this.setLoading(false);
          return chats;
        }),
        catchError(error => {
          this.handleError('Error al obtener chats', error);
          return of([]);
        })
      );
  }

  /**
   * Obtener chat específico por ID
   */
  getChat(chatId: string): Observable<Chat | null> {
    this.setLoading(true);
    
    return this.http.get<ApiChatResponse>(`${this.baseUrl}/chats/${chatId}`, 
      this.getHttpOptions()
    ).pipe(
      map(chat => {
        this.setLoading(false);
        return this.transformChatFromApi(chat);
      }),
      catchError(error => {
        this.handleError('Error al obtener chat', error);
        return of(null);
      })
    );
  }

  /**
   * Crear nuevo chat
   */
  createChat(request: CreateChatRequest): Observable<Chat | null> {
    this.setLoading(true);
    
    return this.http.post<CreateChatResponse>(`${this.baseUrl}/chats`, request, 
      this.getHttpOptions()
    ).pipe(
      map(response => {
        this.setLoading(false);
        // Después de crear, obtener el chat completo
        this.getChat(response.chatId).subscribe();
        return null; // Retornamos null porque necesitamos hacer otra llamada
      }),
      catchError(error => {
        this.handleError('Error al crear chat', error);
        return of(null);
      })
    );
  }

  /**
   * Crear chat con primer mensaje
   */
  createChatWithMessage(request: CreateChatWithMessageRequest): Observable<{ chat: Chat | null, message: Message | null }> {
    this.setLoading(true);
    
    return this.http.post<CreateChatWithMessageResponse>(`${this.baseUrl}/chats/with-message`, request, 
      this.getHttpOptions()
    ).pipe(
      map(response => {
        this.setLoading(false);
        const chat = response.chat ? this.transformChatFromApi(response.chat) : null;
        const message = response.message ? this.transformMessageFromApi(response.message) : null;
        
        if (chat) {
          this.addChatToState(chat);
        }
        if (message && chat) {
          this.addMessageToState(chat.chatId, message);
        }
        
        return { chat, message };
      }),
      catchError(error => {
        this.handleError('Error al crear chat con mensaje', error);
        return of({ chat: null, message: null });
      })
    );
  }

  // ===== MÉTODOS DE MENSAJES =====

  /**
   * Obtener mensajes de un chat
   */
  getMessages(chatId: string, options?: {
    limit?: number;
    cursor?: string;
    before?: string;
  }): Observable<Message[]> {
    this.setLoading(true);
    
    let url = `${this.baseUrl}/messages/chat/${chatId}`;
    const params = new URLSearchParams();
    
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.cursor) params.append('cursor', options.cursor);
    if (options?.before) params.append('before', options.before);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    return this.http.get<ApiGetMessagesResponse>(url, this.getHttpOptions())
      .pipe(
        map(response => {
          const messages = response.messages.map(msg => this.transformMessageFromApi(msg));
          this.setMessagesForChat(chatId, messages);
          this.setLoading(false);
          return messages;
        }),
        catchError(error => {
          this.handleError('Error al obtener mensajes', error);
          return of([]);
        })
      );
  }

  /**
   * Enviar mensaje
   */
  sendMessage(request: SendMessageRequest): Observable<Message | null> {
    return this.http.post<ApiMessageResponse>(`${this.baseUrl}/messages`, request, 
      this.getHttpOptions()
    ).pipe(
      map(response => {
        const message = this.transformMessageFromApi(response);
        this.addMessageToState(request.chatId, message);
        return message;
      }),
      catchError(error => {
        this.handleError('Error al enviar mensaje', error);
        return of(null);
      })
    );
  }

  /**
   * Marcar mensajes como leídos
   */
  markAsRead(messageIds: string[]): Observable<boolean> {
    const request: MarkAsReadRequest = { messageIds };
    
    return this.http.put(`${this.baseUrl}/messages/mark-as-read`, request, 
      this.getHttpOptions()
    ).pipe(
      map(() => {
        // Actualizar estado local
        this.updateMessageStatus(messageIds, 'READ');
        return true;
      }),
      catchError(error => {
        this.handleError('Error al marcar mensajes como leídos', error);
        return of(false);
      })
    );
  }

  // ===== MÉTODOS DE ESTADO =====

  selectChat(chatId: string | null): void {
    const previousChatId = this.selectedChatSubject.value;
    
    // Salir de la sala anterior si existe
    if (previousChatId && this.webSocket.isConnected()) {
      this.webSocket.leaveRoom(previousChatId);
    }

    // Unirse a la nueva sala si existe
    if (chatId && this.webSocket.isConnected()) {
      this.webSocket.joinRoom(chatId);
    }

    this.selectedChatSubject.next(chatId);
  }

  getSelectedChatId(): string | null {
    return this.selectedChatSubject.value;
  }

  // ===== MÉTODOS PRIVADOS =====

  private transformChatFromApi(apiChat: ApiChatResponse): Chat {
    // Normalizar campos entre los dos formatos
    const chatId = apiChat.id || apiChat.chatId || '';
    const visitorId = apiChat.visitorInfo?.id || apiChat.visitorId || '';
    const commercialId = apiChat.assignedCommercialId || apiChat.commercialId;
    const department = apiChat.metadata?.department || apiChat.department || 'general';
    const unreadCount = apiChat.unreadMessagesCount || apiChat.unreadCount || 0;

    // Crear participantes
    const participants: User[] = [];

    if (visitorId) {
      participants.push({
        id: visitorId,
        name: apiChat.visitorInfo?.name || 'Visitante',
        email: apiChat.visitorInfo?.email,
        role: 'visitor',
        status: 'online'
      });
    }

    if (commercialId) {
      participants.push({
        id: commercialId,
        name: 'Comercial',
        role: 'commercial',
        status: 'online'
      });
    }

    // Normalizar prioridad
    let priority = apiChat.priority;
    if (priority === 'NORMAL') {
      priority = 'MEDIUM'; // Mapear NORMAL a MEDIUM para consistencia
    }

    // Normalizar status
    let status = apiChat.status;
    if (status === 'ASSIGNED') {
      status = 'ACTIVE'; // Mapear ASSIGNED a ACTIVE para consistencia
    }

    return {
      chatId,
      status: status as 'PENDING' | 'ACTIVE' | 'CLOSED' | 'TRANSFERRED',
      priority: priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
      department,
      subject: apiChat.subject,
      visitorId,
      commercialId,
      queuePosition: apiChat.queuePosition,
      estimatedWaitTime: apiChat.estimatedWaitTime,
      lastMessage: apiChat.lastMessage ? this.transformMessageFromApi(apiChat.lastMessage) : undefined,
      unreadCount,
      isTyping: false,
      typingUsers: [],
      createdAt: new Date(apiChat.createdAt),
      updatedAt: new Date(apiChat.updatedAt),
      closedAt: apiChat.closedAt ? new Date(apiChat.closedAt) : undefined,
      participants,
      name: apiChat.subject || apiChat.visitorInfo?.name || apiChat.visitorInfo?.email || 'Visitante',
      archived: false,
      muted: false,
      pinned: false
    };
  }

  private transformChatsFromApi(apiChats: ApiChatResponse[]): Chat[] {
    return apiChats.map(chat => this.transformChatFromApi(chat));
  }

  private transformMessageFromApi(apiMessage: ApiMessageResponse): Message {
    return {
      messageId: apiMessage.messageId,
      chatId: apiMessage.chatId,
      senderId: apiMessage.senderId,
      senderType: apiMessage.senderType,
      content: apiMessage.content,
      type: apiMessage.type,
      sentAt: new Date(apiMessage.sentAt),
      status: apiMessage.status,
      replyTo: apiMessage.replyTo,
      edited: apiMessage.edited,
      editedAt: apiMessage.editedAt ? new Date(apiMessage.editedAt) : undefined,
      metadata: apiMessage.metadata
    };
  }

  /**
   * Normalizar mensaje para asegurar tipos correctos
   * Los mensajes del WebSocket pueden venir con sentAt como string
   */
  private normalizeMessage(message: Message | WebSocketMessage): Message {
    return {
      messageId: message.messageId,
      chatId: message.chatId,
      senderId: message.senderId,
      senderType: message.senderType,
      content: message.content,
      type: message.type,
      sentAt: message.sentAt instanceof Date ? message.sentAt : new Date(message.sentAt),
      status: message.status,
      replyTo: message.replyTo,
      edited: message.edited,
      editedAt: message.editedAt ? 
        (message.editedAt instanceof Date ? message.editedAt : new Date(message.editedAt)) : 
        undefined,
      metadata: message.metadata
    };
  }

  private addChatToState(chat: Chat): void {
    const currentChats = this.chatsSubject.value;
    const existingIndex = currentChats.findIndex(c => c.chatId === chat.chatId);
    
    if (existingIndex >= 0) {
      currentChats[existingIndex] = chat;
    } else {
      currentChats.unshift(chat);
    }
    
    this.chatsSubject.next([...currentChats]);
  }

  private addMessageToState(chatId: string, message: Message): void {
    const currentMessages = this.messagesSubject.value;
    const chatMessages = currentMessages[chatId] || [];
    
    chatMessages.push(message);
    
    this.messagesSubject.next({
      ...currentMessages,
      [chatId]: [...chatMessages]
    });
  }

  private setMessagesForChat(chatId: string, messages: Message[]): void {
    const currentMessages = this.messagesSubject.value;
    
    this.messagesSubject.next({
      ...currentMessages,
      [chatId]: messages
    });
  }

  private updateMessageStatus(messageIds: string[], status: 'SENT' | 'DELIVERED' | 'READ'): void {
    const currentMessages = this.messagesSubject.value;
    const updatedMessages = { ...currentMessages };
    
    Object.keys(updatedMessages).forEach(chatId => {
      updatedMessages[chatId] = updatedMessages[chatId].map(message => 
        messageIds.includes(message.messageId) 
          ? { ...message, status }
          : message
      );
    });
    
    this.messagesSubject.next(updatedMessages);
  }

  private updateChatStatus(chatId: string, newStatus: string): void {
    const currentChats = this.chatsSubject.value;
    const validStatuses: Array<'PENDING' | 'ACTIVE' | 'CLOSED' | 'TRANSFERRED' | 'ASSIGNED'> = [
      'PENDING', 'ACTIVE', 'CLOSED', 'TRANSFERRED', 'ASSIGNED'
    ];
    
    // Validar que el status sea válido
    if (!validStatuses.includes(newStatus as never)) {
      console.warn('[ChatService] Estado inválido recibido:', newStatus);
      return;
    }

    const status = newStatus as 'PENDING' | 'ACTIVE' | 'CLOSED' | 'TRANSFERRED' | 'ASSIGNED';
    const updatedChats = currentChats.map(chat => 
      chat.chatId === chatId 
        ? { ...chat, status }
        : chat
    );
    
    this.chatsSubject.next(updatedChats);
  }

  private setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
  }

  private handleError(message: string, error: unknown): void {
    console.error(message, error);
    this.errorSubject.next(message);
    this.setLoading(false);
  }

  // ===== MÉTODOS PÚBLICOS WEBSOCKET =====

  /**
   * Obtener estado de conexión WebSocket
   */
  get isWebSocketConnected(): boolean {
    return this.webSocket.isConnected();
  }

  /**
   * Obtener servicio WebSocket (para uso avanzado)
   */
  get webSocketService(): WebSocketService {
    return this.webSocket;
  }
}