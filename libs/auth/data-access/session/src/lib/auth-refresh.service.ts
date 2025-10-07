import { Injectable, inject, OnDestroy } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, EMPTY, throwError } from 'rxjs';
import { switchMap, catchError, tap, take, shareReplay, filter } from 'rxjs/operators';
import { ENVIRONMENT_TOKEN } from './environment.token';

/**
 * Servicio que maneja el refresh automático de la sesión del BFF
 * para evitar que el usuario se quede sin autenticación.
 */
@Injectable({ 
  providedIn: 'root' 
})
export class AuthRefreshService implements OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly environment = inject(ENVIRONMENT_TOKEN);
  
  // Sujeto que indica si hay un refresh en progreso
  private readonly refreshInProgress$ = new BehaviorSubject<boolean>(false);
  
  // Observable compartido para evitar múltiples refreshes simultáneos
  private refreshTokenSubject$ = new BehaviorSubject<string | null>(null);
  
  // Timer para refresh proactivo
  private refreshTimer?: ReturnType<typeof setTimeout>;
  
  // Configuración por defecto
  private readonly DEFAULT_REFRESH_MARGIN_SECONDS = 60; // 1 minuto antes de expirar
  private readonly MAX_REFRESH_RETRIES = 3;

  /**
   * Realiza el refresh de la sesión usando el endpoint del BFF
   */
  refreshSession(): Observable<void> {
    // Si ya hay un refresh en progreso, esperar a que termine
    if (this.refreshInProgress$.value) {
      return this.refreshTokenSubject$.pipe(
        filter(token => token !== null),
        take(1),
        switchMap(() => EMPTY),
        shareReplay(1)
      );
    }

    console.log('[AuthRefreshService] Iniciando refresh de sesión...');
    this.refreshInProgress$.next(true);

    // Determinar la app actual basada en la URL o configuración
    const currentApp = this.getCurrentApp();
    const refreshUrl = `${this.environment.api.baseUrl}/bff/auth/refresh/${currentApp}`;

    return this.http.post<void>(refreshUrl, {}, {
      withCredentials: true // Importante: incluir las cookies HttpOnly
    }).pipe(
      tap(() => {
        console.log('[AuthRefreshService] Sesión renovada exitosamente');
        this.refreshTokenSubject$.next('success');
        this.refreshInProgress$.next(false);
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('[AuthRefreshService] Error al renovar sesión:', error);
        this.refreshInProgress$.next(false);
        this.refreshTokenSubject$.next(null);
        
        // Si es 401/403, la sesión no se puede renovar
        if (error.status === 401 || error.status === 403) {
          console.warn('[AuthRefreshService] Sesión no renovable, redirigiendo al login...');
          this.redirectToLogin();
          return EMPTY;
        }
        
        return throwError(() => error);
      }),
      shareReplay(1)
    );
  }

  /**
   * Configura un timer para refresh proactivo basado en la expiración del token
   * @param expirationTimestamp Timestamp de expiración del token (en segundos)
   * @param marginSeconds Segundos antes de la expiración para hacer el refresh (por defecto 60s)
   */
  scheduleProactiveRefresh(
    expirationTimestamp: number, 
    marginSeconds: number = this.DEFAULT_REFRESH_MARGIN_SECONDS
  ): void {
    // Limpiar timer anterior si existe
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    const now = Math.floor(Date.now() / 1000);
    const timeToRefresh = (expirationTimestamp - now - marginSeconds) * 1000;

    if (timeToRefresh <= 0) {
      // Si ya pasó el tiempo, hacer refresh inmediatamente
      console.log('[AuthRefreshService] Sesión próxima a expirar, refrescando ahora...');
      this.refreshSession().subscribe({
        error: (error) => console.error('Error en refresh proactivo:', error)
      });
      return;
    }

    console.log(`[AuthRefreshService] Programando refresh proactivo en ${Math.round(timeToRefresh / 1000)} segundos`);
    
    this.refreshTimer = setTimeout(() => {
      console.log('[AuthRefreshService] Ejecutando refresh proactivo programado');
      this.refreshSession().subscribe({
        error: (error) => console.error('Error en refresh proactivo programado:', error)
      });
    }, timeToRefresh);
  }

  /**
   * Cancela el refresh programado
   */
  cancelScheduledRefresh(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = undefined;
      console.log('[AuthRefreshService] Refresh programado cancelado');
    }
  }

  /**
   * Indica si hay un refresh en progreso
   */
  isRefreshInProgress(): boolean {
    return this.refreshInProgress$.value;
  }

  /**
   * Observable que indica el estado del refresh
   */
  getRefreshStatus(): Observable<boolean> {
    return this.refreshInProgress$.asObservable();
  }

  /**
   * Determina la app actual basándose en la URL o configuración
   */
  private getCurrentApp(): string {
    // Intentar determinar la app desde la URL
    const pathname = window.location.pathname;
    
    // Si estamos en una ruta que incluye '/admin', es admin
    if (pathname.includes('/admin') || window.location.hostname.includes('admin')) {
      return 'admin';
    }
    
    // Por defecto, asumir console
    return 'console';
  }

  /**
   * Redirige al login cuando el refresh falla
   */
  private redirectToLogin(): void {
    const currentApp = this.getCurrentApp();
    const returnUrl = encodeURIComponent(window.location.href);
    const loginUrl = `${this.environment.api.baseUrl}/bff/auth/login/${currentApp}?redirect=${returnUrl}`;
    
    console.log(`[AuthRefreshService] Redirigiendo al login: ${loginUrl}`);
    window.location.replace(loginUrl);
  }

  /**
   * Limpia recursos cuando se destruye el servicio
   */
  ngOnDestroy(): void {
    this.cancelScheduledRefresh();
  }
}