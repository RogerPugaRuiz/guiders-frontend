import { Injectable, inject, OnDestroy, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import * as io from 'socket.io-client';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

export interface WebSocketMessage {
  type: string;
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

  // Estados observables
  private connectionState$ = new BehaviorSubject<WebSocketConnectionState>({
    connected: false,
    connecting: false,
    error: null,
    lastConnected: null,
    reconnectAttempts: 0
  });

  private messages$ = new Subject<WebSocketMessage>();

  constructor() {
    // Solo inicializar en el navegador
    if (isPlatformBrowser(this.platformId)) {
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
          // Probamos diferentes métodos según la versión del servidor
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
  sendMessage(type: string, data?: any): void {
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
    return this.connectionState$.asObservable();
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
  getMessagesByType(type: string): Observable<WebSocketMessage> {
    return this.messages$.pipe(
      filter(message => message.type === type)
    );
  }

  /**
   * Verifica si está conectado
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Verifica si está intentando conectar
   */
  isConnecting(): boolean {
    return this.connectionState$.value.connecting;
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
        type: 'user_status_change',
        data,
        timestamp: Date.now()
      });
    });

    this.socket.on('notification', (data: any) => {
      console.log('🔔 WebSocket: Notificación recibida:', data);
      this.messages$.next({
        type: 'notification',
        data,
        timestamp: Date.now()
      });
    });

    this.socket.on('chat_message', (data: any) => {
      console.log('💬 WebSocket: Mensaje de chat recibido:', data);
      this.messages$.next({
        type: 'chat_message',
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
   * Actualiza el estado de conexión
   */
  private updateConnectionState(updates: Partial<WebSocketConnectionState>): void {
    const currentState = this.connectionState$.value;
    const newState = { ...currentState, ...updates };
    this.connectionState$.next(newState);
  }

  /**
   * Limpia recursos al destruir el servicio
   */
  ngOnDestroy(): void {
    console.log('WebSocket: Limpiando recursos del servicio...');
    this.destroy$.next();
    this.destroy$.complete();
    this.disconnect();
  }
}
