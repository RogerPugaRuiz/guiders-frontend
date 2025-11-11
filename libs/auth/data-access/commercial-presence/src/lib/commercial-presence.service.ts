import { Injectable, inject, DestroyRef } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, timer, EMPTY } from 'rxjs';
import { catchError, map, tap, retry, switchMap } from 'rxjs/operators';
import { ENVIRONMENT_TOKEN, UserService } from '@guiders-frontend/auth/data-access/session';
import {
  ConnectionStatus,
  CommercialMetadata,
  ConnectCommercialRequest,
  DisconnectCommercialRequest,
  UpdateStatusRequest,
  CommercialInfo,
  ApiResponse,
  CommercialStatusResponse
} from './commercial-presence.types';

/**
 * Servicio de presencia para comerciales
 *
 * Gestiona la conexión, heartbeat y desconexión de comerciales en tiempo real.
 * Implementa reconexión automática y manejo de errores.
 *
 * @see {@link https://github.com/tu-repo/docs/guia-integracion-frontend.md} Guía de Integración
 */
@Injectable({
  providedIn: 'root'
})
export class CommercialPresenceService {
  private readonly http = inject(HttpClient);
  private readonly environment = inject(ENVIRONMENT_TOKEN);
  private readonly userService = inject(UserService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly baseUrl = `${this.environment.api.baseUrl}/v2/commercials`;

  // Estado de conexión
  private readonly isConnectedSubject = new BehaviorSubject<boolean>(false);
  private readonly connectionStatusSubject = new BehaviorSubject<ConnectionStatus>('offline');
  private readonly lastActivitySubject = new BehaviorSubject<Date | null>(null);
  private readonly errorSubject = new BehaviorSubject<string | null>(null);

  // Observables públicos
  readonly isConnected$ = this.isConnectedSubject.asObservable();
  readonly connectionStatus$ = this.connectionStatusSubject.asObservable();
  readonly lastActivity$ = this.lastActivitySubject.asObservable();
  readonly error$ = this.errorSubject.asObservable();

  // Control del heartbeat
  private heartbeatIntervalId: ReturnType<typeof setInterval> | null = null;
  private readonly HEARTBEAT_INTERVAL = 30000; // 30 segundos
  private readonly RECONNECT_DELAY = 5000; // 5 segundos
  private readonly MAX_RETRY_ATTEMPTS = 3;

  // Información del comercial
  private commercialId: string | null = null;
  private commercialName: string | null = null;

  // Métricas y debugging
  private heartbeatCount = 0;
  private reconnectAttempts = 0;
  private lastHeartbeatTime: Date | null = null;
  private connectionStartTime: Date | null = null;

  // Reconexión automática por actividad del usuario
  private autoReconnectEnabled = false;
  private lastUserActivityTime = 0;
  private readonly USER_ACTIVITY_DEBOUNCE_MS = 2000; // 2 segundos de debounce
  private reconnectingFromActivity = false;

  constructor() {
    // Manejar cierre de pestaña/navegador
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));
    }

    // Limpiar al destruir el servicio
    this.destroyRef.onDestroy(() => {
      this.cleanup();
    });
  }

  /**
   * Conectar comercial al sistema
   * Inicia el heartbeat automático si la conexión es exitosa
   */
  connect(commercialId?: string, commercialName?: string): Observable<CommercialInfo> {
    // Obtener ID del usuario desde UserService si no se proporciona
    const userId = commercialId || this.userService.getUserId();
    const user = this.userService.currentUser();
    const userName = commercialName || user?.email || 'Comercial';

    if (!userId) {
      const error = 'No se pudo obtener el ID del comercial. Asegúrate de estar autenticado.';
      console.error('[CommercialPresenceService]', error);
      this.errorSubject.next(error);
      return throwError(() => new Error(error));
    }

    // Guardar información del comercial
    this.commercialId = userId;
    this.commercialName = userName;

    if (this.isConnectedSubject.value) {
      console.warn('[CommercialPresenceService] ⚠️ Comercial ya está conectado');
      return this.getStatus(userId);
    }

    const request: ConnectCommercialRequest = {
      id: userId,
      name: userName,
      metadata: this.getMetadata()
    };

    const timestamp = new Date().toISOString();
    const endpoint = `${this.baseUrl}/connect`;

    console.group(`[CommercialPresenceService] 🔌 CONNECT - ${timestamp}`);
    console.log('📤 Request:', {
      endpoint,
      method: 'POST',
      commercialId: userId,
      commercialName: userName,
      metadata: request.metadata,
      hasAuthToken: !!localStorage.getItem('access-token')
    });
    console.groupEnd();

    return this.http.post<ApiResponse<CommercialInfo>>(
      endpoint,
      request,
      this.getHttpOptions()
    ).pipe(
      retry(this.MAX_RETRY_ATTEMPTS),
      tap(() => {
        console.log('[CommercialPresenceService] 🔄 Petición enviada, esperando respuesta...');
      }),
      map(response => {
        console.group(`[CommercialPresenceService] 📥 CONNECT Response - ${new Date().toISOString()}`);
        console.log('Response:', response);
        console.groupEnd();

        if (!response.success || !response.commercial) {
          throw new Error(response.message || 'Error al conectar comercial');
        }
        return response.commercial;
      }),
      tap(commercial => {
        this.connectionStartTime = new Date();
        this.heartbeatCount = 0;
        this.reconnectAttempts = 0;
        this.isConnectedSubject.next(true);
        this.connectionStatusSubject.next(commercial.connectionStatus);
        this.lastActivitySubject.next(new Date(commercial.lastActivity));
        this.errorSubject.next(null);

        console.group(`[CommercialPresenceService] ✅ CONECTADO EXITOSAMENTE`);
        console.log('🆔 Commercial ID:', commercial.id);
        console.log('👤 Nombre:', commercial.name);
        console.log('🟢 Estado:', commercial.connectionStatus);
        console.log('⏰ Última actividad:', commercial.lastActivity);
        console.log('📊 Está activo:', commercial.isActive);
        console.log('🕐 Hora de conexión:', this.connectionStartTime.toISOString());
        console.log('⏱️ Intervalo de heartbeat:', `${this.HEARTBEAT_INTERVAL / 1000}s`);
        console.groupEnd();

        // Iniciar heartbeat automático
        this.startHeartbeat();
      }),
      catchError(error => this.handleError('Error al conectar comercial', error))
    );
  }

  /**
   * Desconectar comercial del sistema
   * Detiene el heartbeat automático
   */
  disconnect(): Observable<void> {
    if (!this.isConnectedSubject.value || !this.commercialId) {
      console.warn('[CommercialPresenceService] ⚠️ Comercial no está conectado');
      return EMPTY;
    }

    const timestamp = new Date().toISOString();
    const sessionDuration = this.connectionStartTime
      ? Math.round((new Date().getTime() - this.connectionStartTime.getTime()) / 1000)
      : 0;

    // Detener heartbeat antes de desconectar
    this.stopHeartbeat();

    const request: DisconnectCommercialRequest = {
      id: this.commercialId
    };

    const endpoint = `${this.baseUrl}/disconnect`;

    console.group(`[CommercialPresenceService] 👋 DISCONNECT - ${timestamp}`);
    console.log('📤 Request:', {
      endpoint,
      method: 'POST',
      commercialId: this.commercialId,
      totalHeartbeats: this.heartbeatCount,
      sessionDuration: `${sessionDuration}s (${Math.round(sessionDuration / 60)}min)`,
      hasAuthToken: !!localStorage.getItem('access-token')
    });
    console.groupEnd();

    return this.http.post<ApiResponse>(
      endpoint,
      request,
      this.getHttpOptions()
    ).pipe(
      map(response => {
        console.group(`[CommercialPresenceService] 📥 DISCONNECT Response`);
        console.log('Response:', response);
        console.groupEnd();

        if (!response.success) {
          console.warn('[CommercialPresenceService] ⚠️ Error al desconectar, pero continuando...');
        }
      }),
      tap(() => {
        this.isConnectedSubject.next(false);
        this.connectionStatusSubject.next('offline');
        this.lastActivitySubject.next(null);

        console.group('[CommercialPresenceService] ✅ DESCONECTADO EXITOSAMENTE');
        console.log('🆔 Commercial ID:', this.commercialId);
        console.log('⏱️ Duración de sesión:', `${sessionDuration}s (${Math.round(sessionDuration / 60)}min)`);
        console.log('💓 Total de heartbeats:', this.heartbeatCount);
        console.log('🔄 Intentos de reconexión:', this.reconnectAttempts);
        console.groupEnd();

        // Resetear métricas
        this.heartbeatCount = 0;
        this.reconnectAttempts = 0;
        this.lastHeartbeatTime = null;
        this.connectionStartTime = null;
      }),
      catchError(error => {
        console.group('[CommercialPresenceService] ❌ DISCONNECT ERROR');
        console.error('Error:', error);
        console.log('ℹ️ Marcando como desconectado localmente...');
        console.groupEnd();

        // No lanzar error porque de todas formas estamos desconectando
        this.isConnectedSubject.next(false);
        this.connectionStatusSubject.next('offline');
        return EMPTY;
      })
    );
  }

  /**
   * Enviar heartbeat manual
   * Normalmente esto se hace automáticamente cada 30 segundos
   */
  sendHeartbeat(): Observable<CommercialInfo> {
    if (!this.commercialId) {
      const error = 'No hay comercial conectado para enviar heartbeat';
      console.error('[CommercialPresenceService]', error);
      return throwError(() => new Error(error));
    }

    this.heartbeatCount++;
    const timestamp = new Date();
    const timeSinceLastHeartbeat = this.lastHeartbeatTime
      ? Math.round((timestamp.getTime() - this.lastHeartbeatTime.getTime()) / 1000)
      : 0;
    const timeSinceConnection = this.connectionStartTime
      ? Math.round((timestamp.getTime() - this.connectionStartTime.getTime()) / 1000)
      : 0;

    // Payload simplificado: solo enviar el ID
    const request = {
      id: this.commercialId
    };

    const endpoint = `${this.baseUrl}/heartbeat`;

    console.group(`[CommercialPresenceService] 💓 HEARTBEAT #${this.heartbeatCount} - ${timestamp.toISOString()}`);
    console.log('📤 Request:', {
      endpoint,
      method: 'PUT',
      commercialId: this.commercialId,
      timeSinceLastHeartbeat: `${timeSinceLastHeartbeat}s`,
      timeSinceConnection: `${timeSinceConnection}s`,
      hasAuthToken: !!localStorage.getItem('access-token')
    });
    console.groupEnd();

    return this.http.put<ApiResponse<CommercialInfo>>(
      endpoint,
      request,
      this.getHttpOptions()
    ).pipe(
      map(response => {
        console.group(`[CommercialPresenceService] 📥 HEARTBEAT Response #${this.heartbeatCount}`);
        console.log('✅ Success:', response.success);
        console.log('📊 Commercial:', response.commercial);
        console.groupEnd();

        if (!response.success || !response.commercial) {
          throw new Error(response.message || 'Error en heartbeat');
        }
        return response.commercial;
      }),
      tap(commercial => {
        this.lastHeartbeatTime = timestamp;
        this.lastActivitySubject.next(new Date(commercial.lastActivity));

        console.log(
          `[CommercialPresenceService] ✅ Heartbeat #${this.heartbeatCount} exitoso - ` +
          `Estado: ${commercial.connectionStatus} | ` +
          `Activo: ${commercial.isActive} | ` +
          `Próximo en ${this.HEARTBEAT_INTERVAL / 1000}s`
        );
      }),
      catchError(error => {
        console.group(`[CommercialPresenceService] ❌ HEARTBEAT ERROR #${this.heartbeatCount}`);
        console.error('Error:', error);
        console.log('⚠️ Iniciando proceso de reconexión...');
        console.groupEnd();

        // Intentar reconectar si falla el heartbeat
        this.handleHeartbeatError();
        return throwError(() => error);
      })
    );
  }

  /**
   * Cambiar estado de conexión del comercial
   */
  updateStatus(status: ConnectionStatus): Observable<CommercialInfo> {
    if (!this.commercialId) {
      const error = 'No hay comercial conectado para actualizar estado';
      console.error('[CommercialPresenceService]', error);
      return throwError(() => new Error(error));
    }

    const previousStatus = this.connectionStatusSubject.value;
    const timestamp = new Date().toISOString();

    const request: UpdateStatusRequest = {
      id: this.commercialId,
      status
    };

    const endpoint = `${this.baseUrl}/status`;

    console.group(`[CommercialPresenceService] 🔄 UPDATE STATUS - ${timestamp}`);
    console.log('📤 Request:', {
      endpoint,
      method: 'PUT',
      commercialId: this.commercialId,
      previousStatus,
      newStatus: status,
      hasAuthToken: !!localStorage.getItem('access-token')
    });
    console.groupEnd();

    return this.http.put<ApiResponse<CommercialInfo>>(
      endpoint,
      request,
      this.getHttpOptions()
    ).pipe(
      map(response => {
        console.group(`[CommercialPresenceService] 📥 UPDATE STATUS Response`);
        console.log('Response:', response);
        console.groupEnd();

        if (!response.success || !response.commercial) {
          throw new Error(response.message || 'Error al actualizar estado');
        }
        return response.commercial;
      }),
      tap(commercial => {
        this.connectionStatusSubject.next(commercial.connectionStatus);

        console.group('[CommercialPresenceService] ✅ ESTADO ACTUALIZADO');
        console.log('🆔 Commercial ID:', this.commercialId);
        console.log('🔄 Estado anterior:', previousStatus);
        console.log('🟢 Estado nuevo:', commercial.connectionStatus);
        console.log('📊 Está activo:', commercial.isActive);
        console.log('⏰ Última actividad:', commercial.lastActivity);
        console.groupEnd();
      }),
      catchError(error => this.handleError('Error al actualizar estado', error))
    );
  }

  /**
   * Consultar estado de conexión actual
   */
  getStatus(commercialId?: string): Observable<CommercialInfo> {
    const id = commercialId || this.commercialId;

    if (!id) {
      const error = 'No se proporcionó ID de comercial';
      console.error('[CommercialPresenceService]', error);
      return throwError(() => new Error(error));
    }

    return this.http.get<CommercialStatusResponse>(
      `${this.baseUrl}/${id}/status`,
      this.getHttpOptions()
    ).pipe(
      map(response => ({
        id: response.commercialId,
        name: this.commercialName || 'Comercial',
        connectionStatus: response.connectionStatus,
        lastActivity: response.lastActivity,
        isActive: response.isActive
      })),
      catchError(error => this.handleError('Error al consultar estado', error))
    );
  }

  /**
   * Obtener estado actual (síncrono)
   */
  getCurrentStatus(): {
    isConnected: boolean;
    status: ConnectionStatus;
    lastActivity: Date | null;
  } {
    return {
      isConnected: this.isConnectedSubject.value,
      status: this.connectionStatusSubject.value,
      lastActivity: this.lastActivitySubject.value
    };
  }

  /**
   * Obtener métricas y estado de debug (síncrono)
   * Útil para debugging y monitoreo
   */
  getDebugInfo(): {
    // Estado de conexión
    isConnected: boolean;
    status: ConnectionStatus;
    commercialId: string | null;
    commercialName: string | null;

    // Timing
    connectionStartTime: Date | null;
    lastHeartbeatTime: Date | null;
    lastActivity: Date | null;
    sessionDuration: number | null; // en segundos
    timeSinceLastHeartbeat: number | null; // en segundos

    // Métricas
    heartbeatCount: number;
    reconnectAttempts: number;
    heartbeatInterval: number; // en milisegundos
    isHeartbeatActive: boolean;

    // Configuración
    baseUrl: string;
    hasAuthToken: boolean;
  } {
    const now = new Date();
    const sessionDuration = this.connectionStartTime
      ? Math.round((now.getTime() - this.connectionStartTime.getTime()) / 1000)
      : null;
    const timeSinceLastHeartbeat = this.lastHeartbeatTime
      ? Math.round((now.getTime() - this.lastHeartbeatTime.getTime()) / 1000)
      : null;

    return {
      // Estado de conexión
      isConnected: this.isConnectedSubject.value,
      status: this.connectionStatusSubject.value,
      commercialId: this.commercialId,
      commercialName: this.commercialName,

      // Timing
      connectionStartTime: this.connectionStartTime,
      lastHeartbeatTime: this.lastHeartbeatTime,
      lastActivity: this.lastActivitySubject.value,
      sessionDuration,
      timeSinceLastHeartbeat,

      // Métricas
      heartbeatCount: this.heartbeatCount,
      reconnectAttempts: this.reconnectAttempts,
      heartbeatInterval: this.HEARTBEAT_INTERVAL,
      isHeartbeatActive: this.heartbeatIntervalId !== null,

      // Configuración
      baseUrl: this.baseUrl,
      hasAuthToken: !!localStorage.getItem('access-token')
    };
  }

  /**
   * Imprimir estado de debug en consola
   */
  printDebugInfo(): void {
    const info = this.getDebugInfo();

    console.group('[CommercialPresenceService] 📊 DEBUG INFO');
    console.log('═════════════════════════════════════════════');
    console.log('🔌 ESTADO DE CONEXIÓN');
    console.log('  Conectado:', info.isConnected ? '✅' : '❌');
    console.log('  Estado:', info.status);
    console.log('  Commercial ID:', info.commercialId || 'N/A');
    console.log('  Nombre:', info.commercialName || 'N/A');
    console.log('═════════════════════════════════════════════');
    console.log('⏱️ TIMING');
    console.log('  Inicio de sesión:', info.connectionStartTime?.toISOString() || 'N/A');
    console.log('  Último heartbeat:', info.lastHeartbeatTime?.toISOString() || 'N/A');
    console.log('  Última actividad:', info.lastActivity?.toISOString() || 'N/A');
    console.log('  Duración de sesión:', info.sessionDuration ? `${info.sessionDuration}s (${Math.round(info.sessionDuration / 60)}min)` : 'N/A');
    console.log('  Tiempo desde último heartbeat:', info.timeSinceLastHeartbeat ? `${info.timeSinceLastHeartbeat}s` : 'N/A');
    console.log('═════════════════════════════════════════════');
    console.log('📊 MÉTRICAS');
    console.log('  Total de heartbeats:', info.heartbeatCount);
    console.log('  Intentos de reconexión:', info.reconnectAttempts);
    console.log('  Intervalo de heartbeat:', `${info.heartbeatInterval / 1000}s`);
    console.log('  Heartbeat activo:', info.isHeartbeatActive ? '✅' : '❌');
    console.log('═════════════════════════════════════════════');
    console.log('⚙️ CONFIGURACIÓN');
    console.log('  Base URL:', info.baseUrl);
    console.log('  Auth Token:', info.hasAuthToken ? '✅ Presente' : '❌ No presente');
    console.log('═════════════════════════════════════════════');
    console.groupEnd();
  }

  /**
   * Habilitar reconexión automática por actividad del usuario
   * Cuando el usuario hace click, scroll, etc. y está offline, se reconectará automáticamente
   */
  enableAutoReconnectOnActivity(): void {
    if (this.autoReconnectEnabled) {
      console.warn('[CommercialPresenceService] ⚠️ Reconexión automática ya está habilitada');
      return;
    }

    this.autoReconnectEnabled = true;
    this.setupUserActivityListeners();
    console.log('[CommercialPresenceService] 🔄 Reconexión automática por actividad habilitada');
  }

  /**
   * Deshabilitar reconexión automática por actividad del usuario
   */
  disableAutoReconnectOnActivity(): void {
    if (!this.autoReconnectEnabled) {
      return;
    }

    this.autoReconnectEnabled = false;
    this.removeUserActivityListeners();
    console.log('[CommercialPresenceService] 🔄 Reconexión automática por actividad deshabilitada');
  }

  /**
   * Marcar como offline localmente (usado por CommercialStatusService)
   * No realiza peticiones HTTP, solo actualiza el estado local
   */
  markAsOffline(): void {
    console.log('[CommercialPresenceService] ⚠️ Marcado como offline localmente');
    this.isConnectedSubject.next(false);
    this.connectionStatusSubject.next('offline');
    this.stopHeartbeat();
  }

  // ===== MÉTODOS PRIVADOS =====

  /**
   * Configurar listeners para actividad del usuario
   */
  private setupUserActivityListeners(): void {
    if (typeof window === 'undefined') {
      return;
    }

    const events = ['click', 'scroll', 'keydown', 'mousemove', 'touchstart'];

    events.forEach(event => {
      document.addEventListener(event, this.handleUserActivity, { passive: true });
    });

    console.log('[CommercialPresenceService] 👂 Listeners de actividad configurados:', events.join(', '));
  }

  /**
   * Remover listeners de actividad del usuario
   */
  private removeUserActivityListeners(): void {
    if (typeof window === 'undefined') {
      return;
    }

    const events = ['click', 'scroll', 'keydown', 'mousemove', 'touchstart'];

    events.forEach(event => {
      document.removeEventListener(event, this.handleUserActivity);
    });

    console.log('[CommercialPresenceService] 🔇 Listeners de actividad removidos');
  }

  /**
   * Manejar actividad del usuario
   */
  private handleUserActivity = (): void => {
    // Si no está habilitada la reconexión automática, ignorar
    if (!this.autoReconnectEnabled) {
      return;
    }

    // Si ya estamos conectados, no hacer nada
    if (this.isConnectedSubject.value) {
      return;
    }

    // Si ya estamos intentando reconectar, no duplicar
    if (this.reconnectingFromActivity) {
      return;
    }

    // Implementar debounce: solo reconectar si han pasado al menos 2 segundos
    const now = Date.now();
    const timeSinceLastActivity = now - this.lastUserActivityTime;

    if (timeSinceLastActivity < this.USER_ACTIVITY_DEBOUNCE_MS) {
      return;
    }

    this.lastUserActivityTime = now;

    // Verificar que tengamos los datos del comercial
    if (!this.commercialId || !this.commercialName) {
      console.warn('[CommercialPresenceService] ⚠️ No hay datos del comercial para reconectar');
      return;
    }

    // Intentar reconectar
    console.log('[CommercialPresenceService] 🔄 Detectada actividad del usuario estando offline, reconectando...');
    this.reconnectingFromActivity = true;

    this.connect(this.commercialId, this.commercialName).subscribe({
      next: () => {
        console.log('[CommercialPresenceService] ✅ Reconexión por actividad exitosa');
        this.reconnectingFromActivity = false;
      },
      error: (error) => {
        console.error('[CommercialPresenceService] ❌ Error al reconectar por actividad:', error);
        this.reconnectingFromActivity = false;
      }
    });
  };

  /**
   * Iniciar heartbeat automático
   */
  private startHeartbeat(): void {
    // Limpiar heartbeat anterior si existe
    this.stopHeartbeat();

    console.log('[CommercialPresenceService] 💓 Iniciando heartbeat (cada 30s)');

    this.heartbeatIntervalId = setInterval(() => {
      this.sendHeartbeat().subscribe({
        error: () => {
          // El error ya se maneja en sendHeartbeat
        }
      });
    }, this.HEARTBEAT_INTERVAL);
  }

  /**
   * Detener heartbeat automático
   */
  private stopHeartbeat(): void {
    if (this.heartbeatIntervalId) {
      clearInterval(this.heartbeatIntervalId);
      this.heartbeatIntervalId = null;
      console.log('[CommercialPresenceService] 💔 Heartbeat detenido');
    }
  }

  /**
   * Manejar error en heartbeat e intentar reconexión
   */
  private handleHeartbeatError(): void {
    this.reconnectAttempts++;

    console.group(`[CommercialPresenceService] 🔄 RECONEXIÓN - Intento #${this.reconnectAttempts}`);
    console.log('⚠️ Heartbeat falló, intentando reconectar...');
    console.log('🆔 Commercial ID:', this.commercialId);
    console.log('⏱️ Delay antes de reconectar:', `${this.RECONNECT_DELAY / 1000}s`);
    console.log('💓 Heartbeats exitosos antes del error:', this.heartbeatCount - 1);
    console.groupEnd();

    this.stopHeartbeat();
    this.isConnectedSubject.next(false);

    // Esperar antes de reconectar
    timer(this.RECONNECT_DELAY).pipe(
      tap(() => {
        console.log(`[CommercialPresenceService] ⏰ Ejecutando reconexión #${this.reconnectAttempts}...`);
      }),
      switchMap(() => {
        if (this.commercialId && this.commercialName) {
          return this.connect(this.commercialId, this.commercialName);
        }
        console.error('[CommercialPresenceService] ❌ No hay información del comercial para reconectar');
        return EMPTY;
      })
    ).subscribe({
      next: () => {
        console.group('[CommercialPresenceService] ✅ RECONEXIÓN EXITOSA');
        console.log('🔄 Intento de reconexión:', this.reconnectAttempts);
        console.log('✅ Servicio restaurado correctamente');
        console.groupEnd();
      },
      error: (error) => {
        console.group(`[CommercialPresenceService] ❌ RECONEXIÓN FALLIDA #${this.reconnectAttempts}`);
        console.error('Error:', error);
        console.log('⚠️ Se intentará reconectar en el siguiente heartbeat');
        console.groupEnd();
      }
    });
  }

  /**
   * Manejar cierre de pestaña/navegador
   */
  private handleBeforeUnload(): void {
    if (this.isConnectedSubject.value && this.commercialId) {
      const sessionDuration = this.connectionStartTime
        ? Math.round((new Date().getTime() - this.connectionStartTime.getTime()) / 1000)
        : 0;

      // Usar sendBeacon para garantizar que se envíe incluso al cerrar
      const request: DisconnectCommercialRequest = {
        id: this.commercialId
      };

      const blob = new Blob([JSON.stringify(request)], { type: 'application/json' });
      const beaconSent = navigator.sendBeacon(`${this.baseUrl}/disconnect`, blob);

      console.group('[CommercialPresenceService] 📡 BEFOREUNLOAD - Cerrando pestaña/navegador');
      console.log('🆔 Commercial ID:', this.commercialId);
      console.log('⏱️ Duración de sesión:', `${sessionDuration}s (${Math.round(sessionDuration / 60)}min)`);
      console.log('💓 Total de heartbeats:', this.heartbeatCount);
      console.log('📡 Beacon enviado:', beaconSent ? '✅' : '❌');
      console.log('🌐 Endpoint:', `${this.baseUrl}/disconnect`);
      console.groupEnd();
    }
  }

  /**
   * Limpiar recursos
   */
  private cleanup(): void {
    this.stopHeartbeat();
    this.removeUserActivityListeners();

    if (typeof window !== 'undefined') {
      window.removeEventListener('beforeunload', this.handleBeforeUnload.bind(this));
    }
  }

  /**
   * Obtener metadata del navegador
   */
  private getMetadata(): CommercialMetadata {
    if (typeof window === 'undefined') {
      return {};
    }

    return {
      browser: navigator.userAgent,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
  }

  /**
   * Configuración de headers HTTP
   */
  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    const authToken = localStorage.getItem('access-token');
    if (authToken) {
      headers = headers.set('Authorization', `Bearer ${authToken}`);
    }

    return headers;
  }

  /**
   * Configuración de opciones HTTP
   */
  private getHttpOptions(): { headers: HttpHeaders; withCredentials: boolean } {
    return {
      headers: this.getHeaders(),
      withCredentials: true
    };
  }

  /**
   * Manejar errores HTTP
   */
  private handleError(message: string, error: unknown): Observable<never> {
    let errorMessage = message;

    if (error instanceof HttpErrorResponse) {
      if (error.status === 401) {
        errorMessage = 'Token expirado o no válido. Por favor, inicia sesión nuevamente.';
      } else if (error.status >= 500) {
        errorMessage = `Error del servidor (${error.status}). Reintentando...`;
      } else if (error.error?.message) {
        errorMessage = error.error.message;
      }
    }

    console.error(`[CommercialPresenceService] ❌ ${message}:`, error);
    this.errorSubject.next(errorMessage);

    return throwError(() => new Error(errorMessage));
  }
}
