import { Injectable, inject, OnDestroy, PLATFORM_ID, signal, computed } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { Socket, io } from 'socket.io-client';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';
import { WebSocketMessageType } from '../enums/websocket-message-types.enum';
import { Event, ErrorResponse, SuccessResponse } from '../models/websocket-response.models';

export interface WebSocketMessage {
  type: WebSocketMessageType | string;
  data?: any;
  timestamp?: number;
}

export interface WebSocketConnectionState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  lastConnected: Date | null;
  reconnectAttempts: number;
}

export class WebSocketConnectionStateDefault implements WebSocketConnectionState {
  connected = false;
  connecting = false;
  error = null;
  lastConnected = null;
  reconnectAttempts = 0;
}

/**
 * Servicio WebSocket moderno para Angular 20 usando signals
 */
@Injectable({
  providedIn: 'root'
})
export class WebSocketService implements OnDestroy {
  private platformId = inject(PLATFORM_ID);
  private authService = inject(AuthService);

  private socket: Socket | null = null;
  private destroy$ = new Subject<void>();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  // Para detección de mensajes duplicados
  private recentMessages: Array<{messageId: string, timestamp: number}> = [];
  private readonly MAX_RECENT_MESSAGES = 100;
  private readonly DUPLICATE_DETECTION_WINDOW = 5000; // 5 segundos

  // Protección adicional: último mensaje procesado para evitar duplicados consecutivos
  private lastProcessedMessage: {messageId: string, timestamp: number, messageHash: string} | null = null;

  // Lista de eventos que tienen listeners específicos para evitar duplicados en onAny
  private readonly SPECIFIC_EVENT_LISTENERS: string[] = [
    WebSocketMessageType.RECEIVE_MESSAGE, // 'receive-message'
    'participant:online-status-updated', 
    'ping',
    'pong'
  ];

  // Signals para el estado de conexión
  private connectionState = signal<WebSocketConnectionState>({
    connected: false,
    connecting: false,
    error: null,
    lastConnected: null,
    reconnectAttempts: 0
  });

  private messages$ = new Subject<WebSocketMessage>();

  // Subject específico para mensajes receive-message (para evitar duplicados)
  private receiveMessages$ = new Subject<WebSocketMessage>();

  // Computed signals para información derivada
  isConnected = computed(() => this.connectionState().connected);
  isConnecting = computed(() => this.connectionState().connecting);
  connectionError = computed(() => this.connectionState().error);
  lastConnected = computed(() => this.connectionState().lastConnected);
  reconnectAttemptsCount = computed(() => this.connectionState().reconnectAttempts);

  // Observable para el estado de conexión
  private connectionStatus$ = new BehaviorSubject<WebSocketConnectionState>(this.connectionState());

  constructor() {
    // Solo inicializar en el navegador
    if (isPlatformBrowser(this.platformId)) {
      // Configurar la escucha automática de cambios de token
      this.setupTokenChangeListener();
      
      // Suscribirse a cambios en la sesión para reconectar cuando sea necesario
      this.authService.getSession()
        .pipe(takeUntil(this.destroy$))
        .subscribe(session => {
          if (session?.token && !this.isConnected()) {
            this.connect();
          } else if (!session?.token && this.isConnected()) {
            this.disconnect();
          }
        });
    }
  }

  /**
   * Conecta al servidor Socket.IO con autenticación JWT
   */
  connect(): void {
    if (!isPlatformBrowser(this.platformId)) {
      console.warn('WebSocket: No se puede conectar en el servidor');
      return;
    }

    if (this.socket && this.socket.connected) {
      console.log('WebSocket: Ya existe una conexión activa');
      return;
    }

    // Obtener el token desde la sesión de autenticación
    this.authService.getSession().subscribe({
      next: (session) => {
        if (!session?.token) {
          console.warn('WebSocket: No hay token de autenticación disponible');
          this.updateConnectionState({ error: 'Token de autenticación no disponible' });
          return;
        }

        console.log('WebSocket: Token obtenido:', {
          tokenPresent: !!session.token,
          tokenStart: session.token.substring(0, 10) + '...',
          tokenLength: session.token.length,
          user: session.user?.email || 'No email'
        });

        this.updateConnectionState({ 
          connecting: true, 
          error: null 
        });

        try {
          console.log('WebSocket: Conectando con Socket.IO...', { 
            url: environment.websocketUrl,
            token: session.token ? 'Token presente' : 'Token ausente',
            tokenLength: session.token?.length
          });
          
          // Configurar Socket.IO con autenticación JWT
          this.socket = io(environment.websocketUrl, {
            // Método 1: auth (Socket.IO v4+)
            auth: {
              token: session.token
            },
            // Método 2: query (Socket.IO v2/v3 y backward compatibility)
            query: {
              token: session.token,
              authorization: `Bearer ${session.token}`
            },
            // Método 3: transportOptions para headers HTTP
            transportOptions: {
              polling: {
                extraHeaders: {
                  'Authorization': `Bearer ${session.token}`
                }
              }
            },
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: this.maxReconnectAttempts,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            timeout: 10000,
            forceNew: true
          });



          this.setupSocketEventListeners();

        } catch (error) {
          console.error('WebSocket: Error al crear la conexión Socket.IO:', error);
          this.handleConnectionError('Error al crear la conexión');
        }
      },
      error: (error) => {
        console.error('WebSocket: Error al obtener la sesión:', error);
        this.updateConnectionState({ error: 'Error al obtener la sesión de autenticación' });
      }
    });
  }

  /**
   * Conecta al servidor Socket.IO de forma síncrona usando async/await
   * Retorna una Promise que se resuelve cuando la conexión está establecida
   */
  async connectAsync(): Promise<WebSocketConnectionState> {
    if (!isPlatformBrowser(this.platformId)) {
      const error = 'No se puede conectar en el servidor';
      console.warn('WebSocket:', error);
      throw new Error(error);
    }

    if (this.socket && this.socket.connected) {
      console.log('WebSocket: Ya existe una conexión activa');
      return this.connectionState();
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.updateConnectionState({ 
          connecting: false, 
          error: 'Timeout al conectar' 
        });
        reject(new Error('Timeout al conectar al WebSocket'));
      }, 10000); // 10 segundos de timeout

      // Obtener el token desde la sesión de autenticación
      this.authService.getSession().subscribe({
        next: (session) => {
          if (!session?.token) {
            clearTimeout(timeout);
            const error = 'Token de autenticación no disponible';
            console.warn('WebSocket:', error);
            this.updateConnectionState({ error });
            reject(new Error(error));
            return;
          }

          console.log('WebSocket: Token obtenido para conexión síncrona:', {
            tokenPresent: !!session.token,
            tokenStart: session.token.substring(0, 10) + '...',
            tokenLength: session.token.length,
            user: session.user?.email || 'No email'
          });

          this.updateConnectionState({ 
            connecting: true, 
            error: null 
          });

          try {
            console.log('WebSocket: Conectando sincrónamente con Socket.IO...', { 
              url: environment.websocketUrl,
              token: session.token ? 'Token presente' : 'Token ausente',
              tokenLength: session.token?.length
            });
            
            // Configurar Socket.IO con autenticación JWT
            this.socket = io(environment.websocketUrl, {
              auth: {
                token: session.token
              },
              query: {
                token: session.token,
                authorization: `Bearer ${session.token}`
              },
              transportOptions: {
                polling: {
                  extraHeaders: {
                    'Authorization': `Bearer ${session.token}`
                  }
                }
              },
              autoConnect: true,
              reconnection: true,
              reconnectionAttempts: this.maxReconnectAttempts,
              reconnectionDelay: 1000,
              reconnectionDelayMax: 5000,
              timeout: 10000,
              forceNew: true
            });

            // Configurar listeners para resolver/rechazar la promesa
            const onConnect = () => {
              clearTimeout(timeout);
              this.socket?.off('connect', onConnect);
              this.socket?.off('connect_error', onConnectError);
              console.log('✅ WebSocket: Conectado exitosamente (modo síncrono)');
              resolve(this.connectionState());
            };

            const onConnectError = (error: Error) => {
              clearTimeout(timeout);
              this.socket?.off('connect', onConnect);
              this.socket?.off('connect_error', onConnectError);
              console.error('❌ WebSocket: Error de conexión (modo síncrono):', error);
              this.handleConnectionError(`Error de conexión: ${error.message}`);
              reject(error);
            };

            // Escuchar eventos de conexión una sola vez
            if (this.socket) {
              this.socket.once('connect', onConnect);
              this.socket.once('connect_error', onConnectError);
            } else {
              console.error('WebSocket: No se pudo configurar listeners - socket es null');
              onConnectError(new Error('Socket no inicializado'));
            }

            // Configurar todos los event listeners normales
            this.setupSocketEventListeners();

          } catch (error) {
            clearTimeout(timeout);
            console.error('WebSocket: Error al crear la conexión Socket.IO (modo síncrono):', error);
            this.handleConnectionError('Error al crear la conexión');
            reject(error);
          }
        },
        error: (error) => {
          clearTimeout(timeout);
          console.error('WebSocket: Error al obtener la sesión (modo síncrono):', error);
          this.updateConnectionState({ error: 'Error al obtener la sesión de autenticación' });
          reject(error);
        }
      });
    });
  }

  /**
   * Desconecta del servidor Socket.IO
   */
  disconnect(): void {
    console.log('WebSocket: Desconectando...');
    
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    // Limpiar estado de protección contra duplicados
    this.clearDuplicateProtectionState();

    this.updateConnectionState({
      connected: false,
      connecting: false,
      error: null,
      reconnectAttempts: 0
    });
  }

  /**
   * Envía un mensaje al servidor usando Socket.IO
   */
  sendMessage(type: WebSocketMessageType | string, data?: any): void {
    if (!this.socket || !this.socket.connected) {
      console.warn('WebSocket: No se puede enviar mensaje, no hay conexión activa');
      return;
    }

    const message: WebSocketMessage = {
      type,
      data,
      timestamp: Date.now()
    };

    console.log('WebSocket: Enviando mensaje:', message);
    this.socket.emit('message', message);
  }

  /**
   * Envía un evento específico al servidor usando Socket.IO
   * Útil para eventos que no siguen el formato estándar de mensaje
   */
  emitEvent(eventName: string, data?: Record<string, unknown>): void {
    if (!this.socket || !this.socket.connected) {
      console.warn('WebSocket: No se puede enviar evento, no hay conexión activa');
      return;
    }

    // Estructurar el payload según el interface Event requerido
    const eventPayload: Event = {
      type: eventName,
      data: data || {},
      metadata: {
        clientId: this.socket.id || 'unknown',
        userAgent: isPlatformBrowser(this.platformId) ? navigator.userAgent : 'server',
        origin: isPlatformBrowser(this.platformId) ? window.location.origin : 'server'
      },
      timestamp: Date.now()
    };

    console.log(`WebSocket: Enviando evento '${eventName}' con estructura Event:`, eventPayload);
    this.socket.emit(eventName, eventPayload);
  }

  /**
   * Envía un evento específico al servidor usando Socket.IO con acknowledgment
   * Retorna una Promise que se resuelve con la respuesta del servidor
   */
  emitEventWithAck<T extends Record<string, unknown>>(
    eventName: string, 
    data?: Record<string, unknown>
  ): Promise<ErrorResponse | SuccessResponse<T>> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.socket.connected) {
        const error: ErrorResponse = {
          error: 'No hay conexión WebSocket activa',
          timestamp: Date.now()
        };
        reject(error);
        return;
      }

      // Estructurar el payload según el interface Event requerido
      const eventPayload: Event = {
        type: eventName,
        data: data || {},
        metadata: {
          clientId: this.socket.id || 'unknown',
          userAgent: isPlatformBrowser(this.platformId) ? navigator.userAgent : 'server',
          origin: isPlatformBrowser(this.platformId) ? window.location.origin : 'server'
        },
        timestamp: Date.now()
      };

      console.log(`WebSocket: Enviando evento '${eventName}' con ACK:`, eventPayload);

      // Enviar con timeout para el acknowledgment
      const timeout = setTimeout(() => {
        const timeoutError: ErrorResponse = {
          error: 'Timeout al esperar respuesta del servidor',
          timestamp: Date.now()
        };
        reject(timeoutError);
      }, 10000); // 10 segundos de timeout

      // Emitir evento con callback para acknowledgment
      this.socket.emit(eventName, eventPayload, (response: ErrorResponse | SuccessResponse<T>) => {
        clearTimeout(timeout);
        
        if ('error' in response) {
          console.error(`WebSocket: Error del servidor para '${eventName}':`, response);
          reject(response);
        } else {
          console.log(`WebSocket: Respuesta exitosa para '${eventName}':`, response);
          resolve(response);
        }
      });
    });
  }

  /**
   * Método alternativo para enviar mensajes (compatibilidad con código existente)
   */
  send(message: WebSocketMessage): boolean {
    if (!this.socket || !this.socket.connected) {
      console.warn('WebSocket: No se puede enviar mensaje, no hay conexión');
      return false;
    }

    try {
      const messageWithTimestamp = {
        ...message,
        timestamp: Date.now()
      };

      this.socket.emit('message', messageWithTimestamp);
      console.log('WebSocket: Mensaje enviado:', messageWithTimestamp);
      return true;
    } catch (error) {
      console.error('WebSocket: Error al enviar mensaje:', error);
      return false;
    }
  }

  /**
   * Obtiene el estado de conexión como Observable
   */
  getConnectionState(): Observable<WebSocketConnectionState> {
    return new Observable(observer => {
      const subscription = () => observer.next(this.connectionState());
      subscription(); // Emitir el valor inicial
      
      // Configurar un efecto para observar cambios en el signal
      const effectRef = (() => {
        this.connectionState();
        subscription();
      });
      
      return () => {
        // Cleanup si es necesario
      };
    });
  }

  /**
   * Obtiene los mensajes como Observable
   * NOTA: Este Observable NO incluye eventos que tienen listeners específicos
   * como 'receive-message'. Para esos eventos, usa getMessagesByType().
   */
  getMessages(): Observable<WebSocketMessage> {
    return this.messages$.asObservable();
  }

  /**
   * Observable de mensajes filtrados por tipo
   */
  getMessagesByType(type: WebSocketMessageType | string): Observable<WebSocketMessage> {
    // Para receive-message, usar el Subject específico para evitar duplicados
    if (type === WebSocketMessageType.RECEIVE_MESSAGE) {
      return this.receiveMessages$.asObservable();
    }
    
    // Para otros tipos, usar el Subject general
    return this.messages$.pipe(
      filter(message => message.type === type)
    );
  }

  /**
   * Observable para el estado de conexión WebSocket
   * Permite a los componentes suscribirse a cambios de estado
   */
  getConnectionStatus(): Observable<WebSocketConnectionState> {
    return this.connectionStatus$.asObservable();
  }

  /**
   * Configura los event listeners de Socket.IO
   */
  private setupSocketEventListeners(): void {
    if (!this.socket) return;

    // Evento de conexión exitosa
    this.socket.on('connect', () => {
      console.log('✅ WebSocket: Conectado exitosamente con Socket.IO');
      this.reconnectAttempts = 0;
      this.updateConnectionState({
        connected: true,
        connecting: false,
        error: null,
        lastConnected: new Date(),
        reconnectAttempts: 0
      });
    });

    // Evento de desconexión
    this.socket.on('disconnect', (reason: string) => {
      console.log('WebSocket: Desconectado:', reason);
      this.updateConnectionState({
        connected: false,
        connecting: false,
        error: `Desconectado: ${reason}`
      });
    });

    // Evento de error de conexión
    this.socket.on('connect_error', (error: Error) => {
      console.error('WebSocket: Error de conexión:', error);
      this.handleConnectionError(`Error de conexión: ${error.message}`);
    });

    // Evento de error de autenticación
    this.socket.on('auth_error', (error: any) => {
      console.error('WebSocket: Error de autenticación:', error);
      this.handleConnectionError(`Error de autenticación: ${error.message || 'Token inválido'}`);
    });

    // Evento de reconexión exitosa
    this.socket.on('reconnect', (attemptNumber: number) => {
      console.log(`WebSocket: Reconectado después de ${attemptNumber} intentos`);
      this.reconnectAttempts = 0;
      this.updateConnectionState({
        connected: true,
        connecting: false,
        error: null,
        reconnectAttempts: 0
      });
    });

    // Evento de intento de reconexión
    this.socket.on('reconnect_attempt', (attemptNumber: number) => {
      console.log(`WebSocket: Intento de reconexión ${attemptNumber}/${this.maxReconnectAttempts}`);
      this.reconnectAttempts = attemptNumber;
      this.updateConnectionState({
        connecting: true,
        reconnectAttempts: attemptNumber
      });
    });

    // Evento de fallo en reconexión
    this.socket.on('reconnect_failed', () => {
      console.error('WebSocket: Falló la reconexión después de todos los intentos');
      this.handleConnectionError('Falló la reconexión después de múltiples intentos');
    });

    // Escuchar mensajes generales
    this.socket.on('message', (message: WebSocketMessage) => {
      console.log('📨 WebSocket: Mensaje recibido:', message);
      this.messages$.next(message);
    });

    // Escuchar eventos específicos de la aplicación
    this.socket.on('user_status_change', (data: any) => {
      console.log('👤 WebSocket: Cambio de estado de usuario:', data);
      this.messages$.next({
        type: WebSocketMessageType.USER_STATUS_CHANGE,
        data,
        timestamp: Date.now()
      });
    });

    this.socket.on('notification', (data: any) => {
      console.log('🔔 WebSocket: Notificación recibida:', data);
      this.messages$.next({
        type: WebSocketMessageType.NOTIFICATION,
        data,
        timestamp: Date.now()
      });
    });

    this.socket.on('chat_message', (data: any) => {
      console.log('💬 WebSocket: Mensaje de chat recibido:', data);
      this.messages$.next({
        type: WebSocketMessageType.CHAT_MESSAGE,
        data,
        timestamp: Date.now()
      });
    });

    // Eventos específicos para chat-list
    this.socket.on('chat:status-updated', (data: any) => {
      console.log('📝 WebSocket: Estado de chat actualizado:', data);
      this.messages$.next({
        type: WebSocketMessageType.CHAT_STATUS_UPDATED,
        data,
        timestamp: Date.now()
      });
    });

    this.socket.on('participant:online-status-updated', (data: any) => {
      console.log('👤 WebSocket: Estado online de participante actualizado:', data);
      this.messages$.next({
        type: WebSocketMessageType.PARTICIPANT_ONLINE_STATUS_UPDATED,
        data,
        timestamp: Date.now()
      });
    });

    // Eventos de ping/pong para heartbeat
    this.socket.on('ping', (data: any) => {
      console.log('🏓 WebSocket: Ping recibido, enviando pong');
      this.socket?.emit('pong', data);
    });

    // Escuchar mensajes entrantes del tipo 'receive-message'
    this.socket.on(WebSocketMessageType.RECEIVE_MESSAGE, (data: any) => {
      const messageId = data?.data?.id || 'unknown';
      const timestamp = Date.now();
      const messageHash = this.generateMessageHash(data);
      
      console.log('📨 WebSocket: Mensaje recibido del tipo receive-message:', {
        messageId,
        timestamp,
        messageHash,
        data,
        socketId: this.socket?.id
      });
      
      // PRIMERA PROTECCIÓN: Verificar duplicados consecutivos (mismo ID y contenido)
      if (this.isConsecutiveDuplicate(messageId, messageHash, timestamp)) {
        console.warn('🚫 WebSocket: Mensaje duplicado consecutivo BLOQUEADO:', {
          messageId,
          messageHash,
          timestamp
        });
        return; // BLOQUEAR procesamiento de duplicados consecutivos
      }
      
      // SEGUNDA PROTECCIÓN: Verificar si ya procesamos este mensaje recientemente
      const isDuplicate = this.recentMessages.some((msg: {messageId: string, timestamp: number}) => 
        msg.messageId === messageId && 
        (timestamp - msg.timestamp) < this.DUPLICATE_DETECTION_WINDOW
      );
      
      if (isDuplicate) {
        console.warn('⚠️ WebSocket: Mensaje duplicado en ventana temporal BLOQUEADO:', {
          messageId,
          timestamp,
          previousMessages: this.recentMessages.filter((m: {messageId: string, timestamp: number}) => m.messageId === messageId)
        });
        return; // BLOQUEAR procesamiento de duplicados en ventana temporal
      }
      
      // Almacenar información del mensaje para detección de duplicados
      this.storeRecentMessage(messageId, timestamp);
      this.updateLastProcessedMessage(messageId, messageHash, timestamp);
      
      // Enviar al Subject específico para receive-message
      this.receiveMessages$.next({
        type: WebSocketMessageType.RECEIVE_MESSAGE,
        data,
        timestamp: timestamp
      });
      
      console.log('✅ WebSocket: Mensaje receive-message procesado y enviado al Subject específico:', {
        messageId,
        messageHash,
        timestamp
      });
    });

    // Configurar listener genérico SOLO para eventos no manejados específicamente
    this.socket.onAny((event: string, data: any) => {
      // Solo procesar eventos que NO tienen listeners específicos
      if (!this.SPECIFIC_EVENT_LISTENERS.includes(event)) {
        console.log(`WebSocket: Evento genérico recibido (no manejado específicamente): ${event}`, data);
        this.messages$.next({
          type: event,
          data,
          timestamp: Date.now()
        });
      } else {
        console.log(`WebSocket: Evento ${event} ignorado por onAny (tiene listener específico)`);
      }
    });
  }

  /**
   * Maneja errores de conexión
   */
  private handleConnectionError(error: string): void {
    console.error('WebSocket: Error manejado:', error);
    this.updateConnectionState({
      connected: false,
      connecting: false,
      error
    });
  }

  /**
   * Actualiza el estado de conexión usando signals
   */
  private updateConnectionState(updates: Partial<WebSocketConnectionState>): void {
    const currentState = this.connectionState();
    const newState = { ...currentState, ...updates };
    this.connectionState.set(newState);
    // Actualizar también el observable para compatibilidad
    this.connectionStatus$.next(newState);
  }

  /**
   * Actualiza el token de autenticación sin reconstruir la conexión Socket.IO
   * Útil cuando el token se renueva pero queremos mantener la conexión activa
   */
  setAuthToken(newToken: string): void {
    if (!this.socket) {
      console.warn('WebSocket: No hay conexión activa para actualizar el token');
      return;
    }

    try {
      console.log('WebSocket: Actualizando token de autenticación...', {
        tokenPresent: !!newToken,
        tokenStart: newToken.substring(0, 10) + '...',
        tokenLength: newToken.length,
        socketConnected: this.socket.connected
      });

      // Actualizar el token en la configuración del socket
      if (this.socket.auth && typeof this.socket.auth === 'object') {
        // Usando aserción de tipos para indicar que auth es un objeto con token
        (this.socket.auth as Record<string, any>)["token"] = newToken;
      }

      // Emitir evento de actualización de token al servidor
      this.socket.emit('auth:token-update', {
        token: newToken,
        timestamp: Date.now()
      });

      console.log('✅ WebSocket: Token actualizado exitosamente');

    } catch (error) {
      console.error('WebSocket: Error al actualizar token:', error);
      // En caso de error, podríamos opcionalmente reconectar
      // this.reconnectWithNewToken(newToken);
    }
  }

  /**
   * Reconecta con un nuevo token (método alternativo si updateAuthToken falla)
   */
  reconnectWithNewToken(newToken: string): void {
    console.log('WebSocket: Reconectando con nuevo token...');
    
    // Desconectar la conexión actual
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    // Configurar temporalmente el nuevo token y reconectar
    this.authService.getSession().subscribe({
      next: (session) => {
        if (session && session.token !== newToken) {
          console.log('WebSocket: Usando token proporcionado en lugar del de la sesión');
        }
        
        this.updateConnectionState({ 
          connecting: true, 
          error: null 
        });

        try {            // Configurar Socket.IO con el nuevo token
            this.socket = io(environment.websocketUrl, {
            auth: {
              token: newToken
            },
            query: {
              token: newToken,
              authorization: `Bearer ${newToken}`
            },
            transportOptions: {
              polling: {
                extraHeaders: {
                  'Authorization': `Bearer ${newToken}`
                }
              }
            },
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: this.maxReconnectAttempts,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            timeout: 10000,
            forceNew: true
          });

          this.setupSocketEventListeners();

        } catch (error) {
          console.error('WebSocket: Error al reconectar con nuevo token:', error);
          this.handleConnectionError('Error al reconectar con nuevo token');
        }
      },
      error: (error) => {
        console.error('WebSocket: Error al obtener la sesión para reconexión:', error);
        this.updateConnectionState({ error: 'Error al obtener la sesión para reconexión' });
      }
    });
  }

  /**
   * Configura la escucha automática de cambios de token
   * Se llama automáticamente en el constructor
   */
  private setupTokenChangeListener(): void {
    // Escuchar cambios en la sesión que puedan indicar renovación de token
    this.authService.getSession()
      .pipe(takeUntil(this.destroy$))
      .subscribe(session => {
        if (session?.token && this.isConnected()) {
          // Verificar si el token ha cambiado
          let currentAuth = null;
          
          // Obtener token actual usando verificación de tipo segura
          if (this.socket?.auth && typeof this.socket.auth === 'object') {
            currentAuth = (this.socket.auth as Record<string, any>)["token"];
          }
          
          if (currentAuth && currentAuth !== session.token) {
            console.log('WebSocket: Token renovado detectado, actualizando...');
            this.setAuthToken(session.token);
          }
        } else if (session?.token && !this.isConnected()) {
          this.connect();
        } else if (!session?.token && this.isConnected()) {
          this.disconnect();
        }
      });
  }

  /**
   * Limpia recursos al destruir el servicio
   */
  ngOnDestroy(): void {
    console.log('WebSocket: Limpiando recursos del servicio...');
    this.destroy$.next();
    this.destroy$.complete();
    this.connectionStatus$.complete();
    this.messages$.complete();
    this.receiveMessages$.complete();
    this.disconnect();
  }

  /**
   * Almacena información de un mensaje reciente para detección de duplicados
   */
  private storeRecentMessage(messageId: string, timestamp: number): void {
    // Limpiar mensajes antiguos antes de añadir el nuevo
    this.cleanOldMessages(timestamp);
    
    // Añadir el nuevo mensaje
    this.recentMessages.push({ messageId, timestamp });
    
    // Mantener solo los últimos MAX_RECENT_MESSAGES
    if (this.recentMessages.length > this.MAX_RECENT_MESSAGES) {
      this.recentMessages = this.recentMessages.slice(-this.MAX_RECENT_MESSAGES);
    }
  }

  /**
   * Limpia mensajes antiguos fuera del window de detección
   */
  private cleanOldMessages(currentTimestamp: number): void {
    this.recentMessages = this.recentMessages.filter(
      msg => (currentTimestamp - msg.timestamp) < this.DUPLICATE_DETECTION_WINDOW
    );
  }

  /**
   * Obtiene estadísticas de duplicados para debugging
   */
  public getDuplicateStats(): {
    recentMessagesCount: number;
    oldestMessage: number | null;
    newestMessage: number | null;
  } {
    const now = Date.now();
    return {
      recentMessagesCount: this.recentMessages.length,
      oldestMessage: this.recentMessages.length > 0 ? 
        Math.min(...this.recentMessages.map(m => now - m.timestamp)) : null,
      newestMessage: this.recentMessages.length > 0 ? 
        Math.max(...this.recentMessages.map(m => now - m.timestamp)) : null
    };
  }

  /**
   * Diagnóstico de la conexión WebSocket para debugging
   */
  public getConnectionDiagnostics(): {
    isConnected: boolean;
    socketId: string | null;
    hasListeners: boolean;
    connectionState: WebSocketConnectionState;
    duplicateStats: any;
    duplicateProtectionStats: any;
  } {
    return {
      isConnected: this.socket?.connected || false,
      socketId: this.socket?.id || null,
      hasListeners: !!this.socket && this.socket.hasListeners?.(WebSocketMessageType.RECEIVE_MESSAGE),
      connectionState: this.connectionState(),
      duplicateStats: this.getDuplicateStats(),
      duplicateProtectionStats: this.getDuplicateProtectionStats()
    };
  }

  /**
   * Método de debugging para monitorear eventos WebSocket filtrados
   */
  public debugEventFiltering(): void {
    console.log('🔍 WebSocket Debug: Lista de eventos con listeners específicos:', this.SPECIFIC_EVENT_LISTENERS);
    console.log('🔍 WebSocket Debug: Para desactivar el filtrado temporalmente, ejecuta en consola:');
    console.log('window.wsService = this; // Luego: wsService.SPECIFIC_EVENT_LISTENERS.length = 0');
  }

  /**
   * Obtener estadísticas de eventos procesados vs filtrados (para debugging)
   */
  public getEventStats(): {
    specificEvents: string[];
    totalEventsReceived: number;
    lastEventTime: Date | null;
  } {
    return {
      specificEvents: [...this.SPECIFIC_EVENT_LISTENERS],
      totalEventsReceived: this.recentMessages.length,
      lastEventTime: this.recentMessages.length > 0 ? 
        new Date(Math.max(...this.recentMessages.map(m => m.timestamp))) : null
    };
  }

  /**
   * Genera un hash simple del contenido del mensaje para detectar duplicados exactos
   */
  private generateMessageHash(data: any): string {
    try {
      const messageContent = {
        id: data?.data?.id || data?.id,
        content: data?.data?.content || data?.content,
        sender: data?.data?.sender_id || data?.data?.senderId || data?.sender,
        timestamp: data?.data?.timestamp || data?.timestamp,
        chat: data?.data?.chat_id || data?.data?.chatId || data?.chat
      };
      
      // Crear hash simple concatenando propiedades clave
      const hashString = JSON.stringify(messageContent);
      let hash = 0;
      for (let i = 0; i < hashString.length; i++) {
        const char = hashString.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convertir a entero de 32 bits
      }
      return hash.toString();
    } catch (error) {
      console.warn('⚠️ WebSocket: Error generando hash del mensaje:', error);
      return 'unknown-hash';
    }
  }

  /**
   * Verifica si el mensaje es un duplicado del último mensaje procesado
   */
  private isConsecutiveDuplicate(messageId: string, messageHash: string, timestamp: number): boolean {
    if (!this.lastProcessedMessage) {
      return false;
    }

    const timeDiff = timestamp - this.lastProcessedMessage.timestamp;
    const isSameId = this.lastProcessedMessage.messageId === messageId;
    const isSameHash = this.lastProcessedMessage.messageHash === messageHash;
    const isWithinWindow = timeDiff < this.DUPLICATE_DETECTION_WINDOW;

    // Es duplicado si tiene el mismo ID y hash, y está dentro del window temporal
    const isDuplicate = isSameId && isSameHash && isWithinWindow;

    if (isDuplicate) {
      console.warn('🚫 WebSocket: Duplicado consecutivo detectado:', {
        messageId,
        messageHash,
        timeDiff,
        lastProcessed: this.lastProcessedMessage
      });
    }

    return isDuplicate;
  }

  /**
   * Actualiza el último mensaje procesado para futuras comparaciones
   */
  private updateLastProcessedMessage(messageId: string, messageHash: string, timestamp: number): void {
    this.lastProcessedMessage = {
      messageId,
      messageHash,
      timestamp
    };
  }

  /**
   * Limpia el estado de protección contra duplicados (útil al desconectar)
   */
  private clearDuplicateProtectionState(): void {
    console.log('🧹 WebSocket: Limpiando estado de protección contra duplicados');
    this.recentMessages = [];
    this.lastProcessedMessage = null;
  }

  /**
   * Método de debugging para obtener estadísticas de protección contra duplicados
   */
  public getDuplicateProtectionStats(): {
    totalRecentMessages: number;
    lastProcessedMessage: any;
    duplicateDetectionWindow: number;
    maxRecentMessages: number;
    oldestMessageAge: number | null;
  } {
    const now = Date.now();
    const oldestMessage = this.recentMessages.length > 0 ? 
      this.recentMessages[0] : null;
    
    return {
      totalRecentMessages: this.recentMessages.length,
      lastProcessedMessage: this.lastProcessedMessage,
      duplicateDetectionWindow: this.DUPLICATE_DETECTION_WINDOW,
      maxRecentMessages: this.MAX_RECENT_MESSAGES,
      oldestMessageAge: oldestMessage ? (now - oldestMessage.timestamp) : null
    };
  }
}
