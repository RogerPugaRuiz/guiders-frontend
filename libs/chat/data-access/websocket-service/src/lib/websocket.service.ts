import { Injectable, inject, signal, DestroyRef } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { ENVIRONMENT_TOKEN } from '@guiders-frontend/auth/data-access/session';
import { Message } from '@guiders-frontend/shared/types';

/**
 * Estado de cambio de chat
 */
export interface ChatStatusUpdate {
  chatId: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  timestamp: string;
}

/**
 * Configuración de conexión WebSocket
 */
export interface WebSocketConfig {
  url?: string;
  path?: string;
  authToken?: string | null;
  autoConnect?: boolean;
}

/**
 * Servicio WebSocket para comunicación en tiempo real
 * 
 * Funcionalidades:
 * - Conexión/desconexión automática
 * - Unirse/salir de salas de chat
 * - Recepción de mensajes nuevos en tiempo real
 * - Notificaciones de cambios de estado
 * - Gestión de reconexiones automáticas
 * - Signals para estado reactivo
 * 
 * Basado en la arquitectura del backend:
 * - POST /v2/messages → envío HTTP
 * - WebSocket → recepción en tiempo real
 * - Salas: chat:{chatId}, chat:{chatId}:commercial
 */
@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private readonly environment = inject(ENVIRONMENT_TOKEN);
  private readonly destroyRef = inject(DestroyRef);

  private socket: Socket | null = null;
  private config: WebSocketConfig = {};

  // ===== SIGNALS (ESTADO REACTIVO) =====
  readonly isConnected = signal<boolean>(false);
  readonly isConnecting = signal<boolean>(false);
  readonly connectionError = signal<string | null>(null);
  readonly currentRooms = signal<Set<string>>(new Set());

  // ===== SUBJECTS (STREAMS REACTIVOS) =====
  private readonly messageReceivedSubject = new BehaviorSubject<Message | null>(null);
  private readonly chatStatusSubject = new BehaviorSubject<ChatStatusUpdate | null>(null);
  private readonly connectionStateSubject = new BehaviorSubject<'connected' | 'disconnected' | 'connecting'>('disconnected');

  // ===== OBSERVABLES PÚBLICOS =====
  readonly messageReceived$: Observable<Message | null> = this.messageReceivedSubject.asObservable();
  readonly chatStatus$: Observable<ChatStatusUpdate | null> = this.chatStatusSubject.asObservable();
  readonly connectionState$: Observable<'connected' | 'disconnected' | 'connecting'> = this.connectionStateSubject.asObservable();

  constructor() {
    // Auto-cleanup al destruir el servicio
    this.destroyRef.onDestroy(() => {
      this.disconnect();
    });
  }

  /**
   * Conectar al servidor WebSocket
   */
  connect(config: WebSocketConfig = {}): void {
    if (this.socket?.connected) {
      console.warn('[WebSocket] Ya conectado');
      return;
    }

    if (this.isConnecting()) {
      console.warn('[WebSocket] Conexión en progreso');
      return;
    }

    this.config = config;
    this.isConnecting.set(true);
    this.connectionError.set(null);
    this.connectionStateSubject.next('connecting');

    // IMPORTANTE: Socket.IO se conecta a la raíz del servidor, NO al path /api
    // Prioridad: config.url > environment.api.wsUrl > environment.api.baseUrl sin /api
    let url: string;
    if (config.url) {
      url = config.url;
    } else if (this.environment.api.wsUrl) {
      url = this.environment.api.wsUrl;
    } else {
      // Fallback: remover /api del baseUrl
      const apiBaseUrl = this.environment.api.baseUrl;
      url = apiBaseUrl.replace(/\/api$/, '');
    }
    
    const path = config.path || '/socket.io/';

    console.log('[WebSocket] Conectando a:', url, 'path:', path);

    // Configuración del cliente Socket.IO
    this.socket = io(url, {
      path,
      transports: ['websocket', 'polling'],
      withCredentials: true, // Importante para cookies
      auth: config.authToken ? { token: config.authToken } : undefined,
      autoConnect: config.autoConnect ?? true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    this.setupEventListeners();
  }

  /**
   * Desconectar del servidor WebSocket
   */
  disconnect(): void {
    if (this.socket) {
      console.log('[WebSocket] Desconectando...');
      
      // Limpiar salas antes de desconectar
      this.currentRooms().forEach(roomId => {
        this.leaveRoom(roomId);
      });

      this.socket.disconnect();
      this.socket.removeAllListeners();
      this.socket = null;
    }

    this.isConnected.set(false);
    this.isConnecting.set(false);
    this.connectionStateSubject.next('disconnected');
    this.currentRooms.set(new Set());
  }

  /**
   * Unirse a una sala de chat
   */
  joinRoom(chatId: string): void {
    if (!this.socket?.connected) {
      console.error('[WebSocket] No conectado. Usa connect() primero.');
      return;
    }

    const roomId = `chat:${chatId}`;
    console.log('[WebSocket] Uniéndose a sala:', roomId);

    this.socket.emit('chat:join', { chatId });

    // Actualizar estado local
    const rooms = new Set(this.currentRooms());
    rooms.add(roomId);
    this.currentRooms.set(rooms);
  }

  /**
   * Unirse a múltiples salas de chat simultáneamente
   * Útil para suscribirse a todos los chats del usuario al iniciar
   */
  joinMultipleRooms(chatIds: string[]): void {
    if (!this.socket?.connected) {
      console.error('[WebSocket] No conectado. Usa connect() primero.');
      return;
    }

    if (chatIds.length === 0) {
      console.warn('[WebSocket] No hay chats para unirse');
      return;
    }

    console.log(`[WebSocket] Uniéndose a ${chatIds.length} salas:`, chatIds);

    // Emitir evento para cada chat
    chatIds.forEach(chatId => {
      this.socket?.emit('chat:join', { chatId });
    });

    // Actualizar estado local
    const rooms = new Set(this.currentRooms());
    chatIds.forEach(chatId => {
      rooms.add(`chat:${chatId}`);
    });
    this.currentRooms.set(rooms);

    console.log(`✅ [WebSocket] Suscrito a ${chatIds.length} chats para notificaciones en tiempo real`);
  }

  /**
   * Obtener lista de chats activos (IDs sin prefijo)
   */
  getActiveChats(): string[] {
    return Array.from(this.currentRooms())
      .map(roomId => roomId.replace('chat:', ''));
  }

  /**
   * Salir de una sala de chat
   */
  leaveRoom(chatId: string): void {
    if (!this.socket?.connected) {
      return;
    }

    const roomId = `chat:${chatId}`;
    console.log('[WebSocket] Saliendo de sala:', roomId);

    this.socket.emit('chat:leave', { chatId });

    // Actualizar estado local
    const rooms = new Set(this.currentRooms());
    rooms.delete(roomId);
    this.currentRooms.set(rooms);
  }

  /**
   * Verificar si está conectado
   */
  get connected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * Obtener ID del socket actual
   */
  get socketId(): string | undefined {
    return this.socket?.id;
  }

  /**
   * Configurar listeners de eventos del socket
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    // Evento: Conexión exitosa
    this.socket.on('connect', () => {
      console.log('✅ [WebSocket] Conectado - Socket ID:', this.socket?.id);
      this.isConnected.set(true);
      this.isConnecting.set(false);
      this.connectionError.set(null);
      this.connectionStateSubject.next('connected');

      // Volver a unirse a salas anteriores
      this.rejoinRooms();
    });

    // Evento: Desconexión
    this.socket.on('disconnect', (reason) => {
      console.log('⚠️ [WebSocket] Desconectado - Razón:', reason);
      this.isConnected.set(false);
      this.isConnecting.set(false);
      this.connectionStateSubject.next('disconnected');
    });

    // Evento: Error de conexión
    this.socket.on('connect_error', (error) => {
      console.error('❌ [WebSocket] Error de conexión:', error.message);
      this.isConnected.set(false);
      this.isConnecting.set(false);
      this.connectionError.set(error.message);
      this.connectionStateSubject.next('disconnected');
    });

    // Evento: Mensaje nuevo (message:new)
    this.socket.on('message:new', (message: Message) => {
      console.log('📨 [WebSocket] Nuevo mensaje:', message);
      this.messageReceivedSubject.next(message);
    });

    // Evento: Cambio de estado del chat (chat:status)
    this.socket.on('chat:status', (data: ChatStatusUpdate) => {
      console.log('📊 [WebSocket] Cambio de estado:', data);
      this.chatStatusSubject.next(data);
    });

    // Evento: Reconexión en progreso
    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`🔄 [WebSocket] Intento de reconexión #${attemptNumber}`);
      this.isConnecting.set(true);
      this.connectionStateSubject.next('connecting');
    });

    // Evento: Reconexión exitosa
    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`✅ [WebSocket] Reconectado después de ${attemptNumber} intentos`);
      this.isConnected.set(true);
      this.isConnecting.set(false);
      this.connectionStateSubject.next('connected');
    });

    // Evento: Falló la reconexión
    this.socket.on('reconnect_failed', () => {
      console.error('❌ [WebSocket] Falló la reconexión después de todos los intentos');
      this.connectionError.set('No se pudo reconectar después de varios intentos');
      this.connectionStateSubject.next('disconnected');
    });
  }

  /**
   * Volver a unirse a las salas después de reconectar
   */
  private rejoinRooms(): void {
    const rooms = this.currentRooms();
    if (rooms.size === 0) return;

    console.log('[WebSocket] Reincorporándose a salas:', Array.from(rooms));
    
    rooms.forEach(roomId => {
      // Extraer chatId del formato chat:{chatId}
      const chatId = roomId.replace('chat:', '');
      this.socket?.emit('chat:join', { chatId });
    });
  }

  /**
   * Emitir evento personalizado (uso avanzado)
   */
  emit(eventName: string, data: unknown): void {
    if (!this.socket?.connected) {
      console.error('[WebSocket] No conectado. No se puede emitir:', eventName);
      return;
    }

    this.socket.emit(eventName, data);
  }

  /**
   * Escuchar evento personalizado (uso avanzado)
   */
  on(eventName: string, callback: (...args: unknown[]) => void): void {
    if (!this.socket) {
      console.error('[WebSocket] Socket no inicializado');
      return;
    }

    this.socket.on(eventName, callback);
  }

  /**
   * Dejar de escuchar evento personalizado
   */
  off(eventName: string, callback?: (...args: unknown[]) => void): void {
    if (!this.socket) return;

    if (callback) {
      this.socket.off(eventName, callback);
    } else {
      this.socket.off(eventName);
    }
  }
}
