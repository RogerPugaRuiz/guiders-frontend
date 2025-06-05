import { Injectable, inject, OnDestroy, PLATFORM_ID, signal, computed } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import * as io from 'socket.io-client';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';
import { WebSocketMessageType } from '../enums/websocket-message-types.enum';

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

  private socket: any | null = null;
  private destroy$ = new Subject<void>();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  // Signals para el estado de conexión
  private connectionState = signal<WebSocketConnectionState>({
    connected: false,
    connecting: false,
    error: null,
    lastConnected: null,
    reconnectAttempts: 0
  });

  private messages$ = new Subject<WebSocketMessage>();

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
          this.socket = io.connect(environment.websocketUrl, {
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
            this.socket = io.connect(environment.websocketUrl, {
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
            this.socket.once('connect', onConnect);
            this.socket.once('connect_error', onConnectError);

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
   */
  getMessages(): Observable<WebSocketMessage> {
    return this.messages$.asObservable();
  }

  /**
   * Observable de mensajes filtrados por tipo
   */
  getMessagesByType(type: WebSocketMessageType | string): Observable<WebSocketMessage> {
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

    this.socket.on('chat:last-message-updated', (data: any) => {
      console.log('💬 WebSocket: Último mensaje de chat actualizado:', data);
      this.messages$.next({
        type: WebSocketMessageType.CHAT_LAST_MESSAGE_UPDATED,
        data,
        timestamp: Date.now()
      });
    });

    // Eventos de ping/pong para heartbeat
    this.socket.on('ping', (data: any) => {
      console.log('🏓 WebSocket: Ping recibido, enviando pong');
      this.socket?.emit('pong', data);
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
  updateAuthToken(newToken: string): void {
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
      if (this.socket.auth) {
        this.socket.auth.token = newToken;
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

        try {
          // Configurar Socket.IO con el nuevo token
          this.socket = io.connect(environment.websocketUrl, {
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
          const currentAuth = this.socket?.auth?.token;
          if (currentAuth && currentAuth !== session.token) {
            console.log('WebSocket: Token renovado detectado, actualizando...');
            this.updateAuthToken(session.token);
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
    this.disconnect();
  }
}
