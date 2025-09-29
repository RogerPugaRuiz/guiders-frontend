import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { shareReplay, tap } from 'rxjs/operators';
import { UserService } from './user.service';
import { User } from './user.interface';
import { AuthRefreshService } from './auth-refresh.service';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly userService = inject(UserService);
  private readonly authRefreshService = inject(AuthRefreshService);
  private me$?: Observable<User>;

  ensureSession$(): Observable<User> {
    if (!this.me$) {
      this.me$ = this.userService.fetchUser()
        .pipe(
          tap(user => {
            console.log('Session ensured for user:', user.email);
            // Programar refresh proactivo basado en la expiración del token
            this.scheduleProactiveRefresh(user);
          }),
          shareReplay({ bufferSize: 1, refCount: true })
        );
    }
    return this.me$;
  }

  clearCache(): void {
    this.me$ = undefined;
    this.userService.clearUser();
    // Cancelar refresh programado cuando se limpia la cache
    this.authRefreshService.cancelScheduledRefresh();
  }

  // Método de conveniencia para obtener el usuario actual
  getCurrentUser(): User | null {
    return this.userService.currentUser();
  }

  // Método de conveniencia para verificar autenticación
  isAuthenticated(): boolean {
    return this.userService.isAuthenticated();
  }

  // Método de conveniencia para verificar si la sesión ha expirado
  isSessionExpired(): boolean {
    return this.userService.isSessionExpired();
  }

  /**
   * Programa un refresh proactivo basado en la información del usuario
   */
  private scheduleProactiveRefresh(user: User): void {
    if (user.session?.exp) {
      console.log('[SessionService] Programando refresh proactivo para el usuario:', user.email);
      this.authRefreshService.scheduleProactiveRefresh(user.session.exp);
    } else {
      console.warn('[SessionService] No se puede programar refresh: falta información de expiración');
    }
  }

  /**
   * Fuerza un refresh de sesión inmediatamente
   */
  refreshSession(): Observable<void> {
    return this.authRefreshService.refreshSession().pipe(
      tap(() => {
        // Después del refresh, limpiar cache para forzar nueva carga
        this.clearCache();
      })
    );
  }

  /**
   * Verifica si hay un refresh en progreso
   */
  isRefreshInProgress(): boolean {
    return this.authRefreshService.isRefreshInProgress();
  }
}
