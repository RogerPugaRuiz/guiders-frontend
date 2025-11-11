import { Injectable, inject, signal, DestroyRef, Injector } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { interval, switchMap, catchError, of, EMPTY } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ENVIRONMENT_TOKEN } from '@guiders-frontend/auth/data-access/session';

/**
 * Estado de conexión del comercial
 */
export interface CommercialStatus {
  commercialId: string;
  connectionStatus: 'online' | 'offline';
  lastActivity: string;
  isActive: boolean;
}

/**
 * CommercialStatusService
 *
 * Servicio que hace polling del estado de conexión del comercial
 * y lo expone como signal reactivo para mostrar en la UI.
 *
 * Características:
 * - Polling automático cada 5 segundos
 * - Se pausa cuando la página está en background (optimización)
 * - Expone el estado como signal para reactividad
 * - Auto-cleanup al destruir
 *
 * @example
 * ```typescript
 * const statusService = inject(CommercialStatusService);
 * statusService.startPolling('commercial-id-123');
 *
 * // En el template
 * <div [class]="statusService.connectionStatus()">
 *   {{ statusService.isConnected() ? 'Conectado' : 'Desconectado' }}
 * </div>
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class CommercialStatusService {
  private readonly http = inject(HttpClient);
  private readonly environment = inject(ENVIRONMENT_TOKEN);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);

  // ===== SIGNALS =====
  readonly status = signal<CommercialStatus | null>(null);
  readonly connectionStatus = signal<'online' | 'offline' | null>(null);
  readonly isActive = signal<boolean>(false);
  readonly lastActivity = signal<string | null>(null);
  readonly isPolling = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  // ===== CONFIGURACIÓN =====
  private readonly POLLING_INTERVAL_MS = 5000; // 5 segundos
  private currentCommercialId: string | null = null;
  private previousConnectionStatus: 'online' | 'offline' | null = null;

  /**
   * Computed: ¿Está conectado?
   */
  readonly isConnected = signal<boolean>(false);

  /**
   * Inicia el polling para un comercial específico
   */
  startPolling(commercialId: string): void {
    if (this.isPolling()) {
      console.warn('[CommercialStatusService] Polling ya en progreso');
      return;
    }

    console.log(`[CommercialStatusService] 🔄 Iniciando polling para comercial: ${commercialId}`);
    this.currentCommercialId = commercialId;
    this.isPolling.set(true);
    this.error.set(null);

    // Obtener estado inicial inmediatamente
    this.fetchStatus(commercialId);

    // Configurar polling cada 5 segundos
    interval(this.POLLING_INTERVAL_MS)
      .pipe(
        // Solo hacer polling si la página está visible (optimización)
        switchMap(() => {
          if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
            console.log('[CommercialStatusService] ⏸️ Página oculta, pausando polling');
            return EMPTY;
          }
          return of(null);
        }),
        switchMap(() => this.fetchStatusObservable(commercialId)),
        catchError((error) => {
          console.error('[CommercialStatusService] Error en polling:', error);
          this.error.set(error.message || 'Error desconocido');
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (status) => {
          if (status) {
            this.updateStatus(status);
          }
        },
        error: (error) => {
          console.error('[CommercialStatusService] Error fatal en polling:', error);
          this.error.set(error.message);
        }
      });

    console.log('[CommercialStatusService] ✅ Polling iniciado');
  }

  /**
   * Detiene el polling
   */
  stopPolling(): void {
    console.log('[CommercialStatusService] 🛑 Deteniendo polling');
    this.isPolling.set(false);
    this.currentCommercialId = null;
    // El polling se detendrá automáticamente por takeUntilDestroyed cuando se destruya el componente
  }

  /**
   * Obtiene el estado del comercial (versión void para uso interno)
   */
  private fetchStatus(commercialId: string): void {
    this.fetchStatusObservable(commercialId)
      .pipe(
        catchError((error) => {
          console.error('[CommercialStatusService] Error al obtener estado:', error);
          this.error.set(error.message || 'Error al obtener estado');
          return EMPTY;
        })
      )
      .subscribe({
        next: (status) => {
          this.updateStatus(status);
        }
      });
  }

  /**
   * Obtiene el estado del comercial (versión Observable)
   */
  private fetchStatusObservable(commercialId: string) {
    const url = `${this.environment.api.baseUrl}/v2/commercials/${commercialId}/status`;

    return this.http.get<CommercialStatus>(url, {
      withCredentials: true
    }).pipe(
      catchError((error) => {
        console.error('[CommercialStatusService] Error HTTP:', error);

        // Si es 404 o 401, el comercial no existe o no está autenticado
        if (error.status === 404 || error.status === 401) {
          this.updateStatus({
            commercialId,
            connectionStatus: 'offline',
            lastActivity: new Date().toISOString(),
            isActive: false
          });
        }

        throw error;
      })
    );
  }

  /**
   * Actualiza el estado interno
   */
  private updateStatus(status: CommercialStatus): void {
    const previousStatus = this.previousConnectionStatus;
    const newStatus = status.connectionStatus;

    this.status.set(status);
    this.connectionStatus.set(newStatus);
    this.isActive.set(status.isActive);
    this.lastActivity.set(status.lastActivity);
    this.isConnected.set(newStatus === 'online');
    this.error.set(null);

    console.log(`[CommercialStatusService] 📊 Estado actualizado:`, {
      previousStatus,
      newStatus,
      payloadCompleto: status, // Payload completo del evento
      isActive: status.isActive,
      lastActivity: status.lastActivity
    });

    // Si el estado es offline, notificar al CommercialPresenceService
    // Esto asegura que el detector de actividad pueda funcionar
    if (newStatus === 'offline' && previousStatus !== 'offline') {
      this.notifyPresenceServiceOffline();
    }

    this.previousConnectionStatus = newStatus;
  }

  /**
   * Notifica al CommercialPresenceService que el estado es offline
   * Usa lazy loading para evitar dependencias circulares
   */
  private async notifyPresenceServiceOffline(): Promise<void> {
    try {
      console.log('[CommercialStatusService] ⚠️ Detectado cambio a OFFLINE, notificando a CommercialPresenceService...');

      const { CommercialPresenceService } = await import('@guiders-frontend/commercial-presence');
      const presenceService = this.injector.get(CommercialPresenceService, null);

      if (presenceService) {
        // Marcar como desconectado para que el detector de actividad funcione
        presenceService.markAsOffline();
        console.log('[CommercialStatusService] ✅ CommercialPresenceService notificado del estado offline');
      }
    } catch (error: any) {
      console.warn('[CommercialStatusService] ⚠️ No se pudo notificar al CommercialPresenceService:', error.message);
    }
  }

  /**
   * Obtiene el color para el indicador de estado
   */
  getStatusColor(): 'success' | 'danger' | 'neutral' {
    const status = this.connectionStatus();

    if (!status) return 'neutral';

    return status === 'online' ? 'success' : 'danger';
  }

  /**
   * Obtiene el texto descriptivo del estado
   */
  getStatusText(): string {
    const status = this.connectionStatus();
    const isActive = this.isActive();

    if (!status) return 'Verificando...';

    if (status === 'online' && isActive) {
      return 'Conectado';
    } else if (status === 'online' && !isActive) {
      return 'Conectado (inactivo)';
    } else {
      return 'Desconectado';
    }
  }
}
