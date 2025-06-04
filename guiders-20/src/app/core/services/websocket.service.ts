import { Injectable, inject, OnDestroy, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import * as io from 'socket.io-client';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';
import { 
  WebSocketMessage, 
  WebSocketConnectionState 
} from '../models/websocket.models';

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

        this.updateConnectionState({ 
          connecting: true, 
          error: null 
        });

        try {
          console.log('WebSocket: Conectando con Socket.IO...', { 
            url: environment.websocketUrl
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

    // Eventos específicos para chat
    this.socket.on('chat:status-updated', (data: any) => {
      console.log('💬 WebSocket: Chat status updated:', data);
      this.messages$.next({
        type: 'chat:status-updated',
        data,
        timestamp: Date.now()
      });
    });

    this.socket.on('participant:online-status-updated', (data: any) => {
      console.log('👤 WebSocket: Participant online status updated:', data);
      this.messages$.next({
        type: 'participant:online-status-updated',
        data,
        timestamp: Date.now()
      });
    });

    this.socket.on('chat:last-message-updated', (data: any) => {
      console.log('📨 WebSocket: Last message updated:', data);
      this.messages$.next({
        type: 'chat:last-message-updated',
        data,
        timestamp: Date.now()
      });
    });

    // Eventos de reconexión
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

    this.socket.on('reconnect_attempt', (attemptNumber: number) => {
      console.log(`WebSocket: Intento de reconexión ${attemptNumber}/${this.maxReconnectAttempts}`);
      this.reconnectAttempts = attemptNumber;
      this.updateConnectionState({
        connecting: true,
        reconnectAttempts: attemptNumber
      });
    });

    this.socket.on('reconnect_failed', () => {
      console.error('WebSocket: Falló la reconexión después de todos los intentos');
      this.handleConnectionError('Falló la reconexión después de múltiples intentos');
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