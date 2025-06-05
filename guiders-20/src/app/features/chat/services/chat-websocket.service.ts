import { Injectable, inject, signal, computed, OnDestroy } from '@angular/core';
import { Subject, takeUntil, filter, Observable } from 'rxjs';
import { WebSocketService, WebSocketMessage } from '../../../core/services/websocket.service';
import { ChatData } from '../models/chat.models';
import { 
  WebSocketMessageType, 
  ChatWebSocketEventType,
  isChatRelatedMessageType,
  mapWebSocketMessageTypeToChatEventType
} from '../../../core/enums/websocket-message-types.enum';

export interface ChatWebSocketEvent {
  type: ChatWebSocketEventType;
  chatId: string;
  data: any;
  timestamp: number;
}

export interface ParticipantStatusData {
  participantId: string;
  chatId: string;
  isOnline: boolean;
  lastSeen?: string;
  status?: string;
}

export interface TypingStatusData {
  participantId: string;
  chatId: string;
  isTyping: boolean;
  timestamp: number;
}

export interface ChatUpdateData {
  chatId: string;
  status?: string;
  lastMessageAt?: string;
  data?: any;
}

/**
 * Servicio especializado para manejar eventos WebSocket del chat
 * usando signals de Angular 20
 */
@Injectable({
  providedIn: 'root'
})
export class ChatWebSocketService implements OnDestroy {
  private webSocketService = inject(WebSocketService);
  private destroy$ = new Subject<void>();

  // Signal para eventos del chat
  private chatEvents = signal<ChatWebSocketEvent[]>([]);
  
  // Signal para el estado de escritura por chat
  private typingStatus = signal<Map<string, { userId: string; isTyping: boolean; timestamp: number }>>(new Map());

  // Subjects para eventos específicos observables
  private participantStatusUpdates$ = new Subject<ParticipantStatusData>();
  private typingStatusUpdates$ = new Subject<TypingStatusData>();
  private chatUpdates$ = new Subject<ChatUpdateData>();

  // Computed para obtener eventos por chat
  getChatEvents = computed(() => this.chatEvents);
  
  // Computed para verificar si alguien está escribiendo en un chat específico
  isTypingInChat = computed(() => (chatId: string) => {
    const status = this.typingStatus().get(chatId);
    if (!status) return false;
    
    // Considerar que ya no está escribiendo si han pasado más de 5 segundos
    const now = Date.now();
    return status.isTyping && (now - status.timestamp) < 5000;
  });

  constructor() {
    this.initializeWebSocketListeners();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.participantStatusUpdates$.complete();
    this.typingStatusUpdates$.complete();
    this.chatUpdates$.complete();
  }

  /**
   * Inicializa los listeners para eventos de WebSocket relacionados con chat
   */
  private initializeWebSocketListeners(): void {
    // Escuchar mensajes de WebSocket filtrados por eventos de chat
    this.webSocketService.getMessages()
      .pipe(
        takeUntil(this.destroy$),
        filter(message => this.isChatRelatedMessage(message))
      )
      .subscribe(message => {
        this.handleChatWebSocketMessage(message);
      });

    // Configurar listeners para eventos específicos del WebSocket
    this.setupSpecificEventListeners();
  }

  /**
   * Configura listeners para eventos específicos de WebSocket
   */
  private setupSpecificEventListeners(): void {
    // Escuchar eventos de estado de participantes
    this.webSocketService.getMessagesByType(WebSocketMessageType.PARTICIPANT_ONLINE_STATUS_UPDATED)
      .pipe(takeUntil(this.destroy$))
      .subscribe(message => {
        const participantData: ParticipantStatusData = {
          participantId: message.data?.participantId || '',
          chatId: message.data?.chatId || '',
          isOnline: message.data?.isOnline || false,
          lastSeen: message.data?.lastSeen,
          status: message.data?.status
        };
        this.participantStatusUpdates$.next(participantData);
      });

    // Escuchar eventos de estado de escritura
    this.webSocketService.getMessagesByType(WebSocketMessageType.CHAT_TYPING_STATUS_UPDATED)
      .pipe(takeUntil(this.destroy$))
      .subscribe(message => {
        const typingData: TypingStatusData = {
          participantId: message.data?.participantId || '',
          chatId: message.data?.chatId || '',
          isTyping: message.data?.isTyping || false,
          timestamp: message.timestamp || Date.now()
        };
        this.typingStatusUpdates$.next(typingData);
      });

    // Escuchar eventos de actualización de chat
    this.webSocketService.getMessagesByType(WebSocketMessageType.CHAT_STATUS_UPDATED)
      .pipe(takeUntil(this.destroy$))
      .subscribe(message => {
        const chatUpdateData: ChatUpdateData = {
          chatId: message.data?.chatId || '',
          status: message.data?.status,
          lastMessageAt: message.data?.lastMessageAt,
          data: message.data
        };
        this.chatUpdates$.next(chatUpdateData);
      });
  }

  /**
   * Verifica si un mensaje de WebSocket está relacionado con el chat
   */
  private isChatRelatedMessage(message: WebSocketMessage): boolean {
    return isChatRelatedMessageType(message.type as string);
  }

  /**
   * Maneja los mensajes de WebSocket relacionados con el chat
   */
  private handleChatWebSocketMessage(message: WebSocketMessage): void {
    try {
      const chatEvent: ChatWebSocketEvent = {
        type: mapWebSocketMessageTypeToChatEventType(message.type as string, message.data),
        chatId: message.data?.chatId || '',
        data: message.data,
        timestamp: message.timestamp || Date.now()
      };

      // Actualizar el signal de eventos
      this.chatEvents.update(events => [...events, chatEvent]);

      // Manejar eventos específicos
      this.handleSpecificChatEvent(chatEvent);

      console.log('💬 [ChatWebSocket] Evento recibido:', chatEvent);
    } catch (error) {
      console.error('❌ [ChatWebSocket] Error procesando mensaje:', error, message);
    }
  }

  /**
   * Maneja eventos específicos del chat
   */
  private handleSpecificChatEvent(event: ChatWebSocketEvent): void {
    switch (event.type) {
      case ChatWebSocketEventType.TYPING:
        this.handleTypingEvent(event);
        break;
      case ChatWebSocketEventType.MESSAGE:
        this.handleNewMessage(event);
        break;
      case ChatWebSocketEventType.STATUS_CHANGE:
        this.handleStatusChange(event);
        break;
    }
  }

  /**
   * Maneja eventos de escritura
   */
  private handleTypingEvent(event: ChatWebSocketEvent): void {
    this.typingStatus.update(statusMap => {
      const newMap = new Map(statusMap);
      newMap.set(event.chatId, {
        userId: event.data.userId,
        isTyping: event.data.isTyping,
        timestamp: event.timestamp
      });
      return newMap;
    });
  }

  /**
   * Maneja nuevos mensajes
   */
  private handleNewMessage(event: ChatWebSocketEvent): void {
    // Limpiar estado de escritura cuando llega un mensaje
    this.typingStatus.update(statusMap => {
      const newMap = new Map(statusMap);
      newMap.delete(event.chatId);
      return newMap;
    });
  }

  /**
   * Maneja cambios de estado del chat
   */
  private handleStatusChange(event: ChatWebSocketEvent): void {
    console.log('🔄 [ChatWebSocket] Estado del chat cambiado:', event.chatId, event.data.newStatus);
  }

  /**
   * Envía un evento de escritura
   */
  sendTypingEvent(chatId: string, isTyping: boolean): void {
    if (this.webSocketService.isConnected()) {
      this.webSocketService.sendMessage(WebSocketMessageType.CHAT_TYPING, {
        chatId,
        isTyping,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Envía un mensaje de chat
   */
  sendChatMessage(chatId: string, message: string, attachments?: any[]): void {
    if (this.webSocketService.isConnected()) {
      this.webSocketService.sendMessage(WebSocketMessageType.CHAT_MESSAGE, {
        chatId,
        message,
        attachments,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Obtiene eventos de un chat específico
   */
  getChatEventsForChat(chatId: string): ChatWebSocketEvent[] {
    return this.chatEvents().filter(event => event.chatId === chatId);
  }

  /**
   * Limpia eventos antiguos (mantener solo los últimos 100 por rendimiento)
   */
  clearOldEvents(): void {
    this.chatEvents.update(events => {
      if (events.length > 100) {
        return events.slice(-100);
      }
      return events;
    });
  }

  /**
   * Obtiene el estado de escritura para un chat específico
   */
  getTypingStatusForChat(chatId: string): { userId: string; isTyping: boolean } | null {
    const status = this.typingStatus().get(chatId);
    if (!status) return null;
    
    // Verificar que no haya expirado
    const now = Date.now();
    if (now - status.timestamp > 5000) {
      // Limpiar estado expirado
      this.typingStatus.update(statusMap => {
        const newMap = new Map(statusMap);
        newMap.delete(chatId);
        return newMap;
      });
      return null;
    }
    
    return {
      userId: status.userId,
      isTyping: status.isTyping
    };
  }

  /**
   * Observable para cambios de estado de participantes
   */
  onParticipantStatusUpdate(): Observable<ParticipantStatusData> {
    return this.participantStatusUpdates$.asObservable();
  }

  /**
   * Observable para cambios de estado de escritura
   */
  onTypingStatusUpdate(): Observable<TypingStatusData> {
    return this.typingStatusUpdates$.asObservable();
  }

  /**
   * Observable para actualizaciones de chat
   */
  onChatUpdate(): Observable<ChatUpdateData> {
    return this.chatUpdates$.asObservable();
  }
}
