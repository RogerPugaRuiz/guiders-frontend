import { Injectable, inject } from '@angular/core';
import { SelfChatService } from '@guiders-frontend/self-chat';
import { Observable } from 'rxjs';
import { shareReplay, tap } from 'rxjs/operators';
import { UserService } from './user.service';
import { User } from './user.interface';
import { AuthRefreshService } from './auth-refresh.service';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly userService = inject(UserService);
  private readonly authRefreshService = inject(AuthRefreshService);
  private readonly selfChat = inject(SelfChatService);
  private me$?: Observable<User>;

  ensureSession$(): Observable<User> {
    if (!this.me$) {
      this.me$ = this.userService.fetchUser()
        .pipe(
          tap(user => {
            console.log('Session ensured for user:', user.email);
            // Programar refresh proactivo basado en la expiración del token
            this.scheduleProactiveRefresh(user);
            // Bootstrap the per-user self chat (Microsoft Teams-style)
            this.selfChat.initialize({ sub: user.sub, email: user.email });
          }),
          shareReplay({ bufferSize: 1, refCount: false })
        );
    }
    return this.me$;
  }

  clearCache(): void {
    this.me$ = undefined;
    this.userService.clearUser();
    // Cancelar refresh programado cuando se limpia la cache
    this.authRefreshService.cancelScheduledRefresh();
    // Drop in-memory self chat snapshot (localStorage stays intact)
    this.selfChat.clear();
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
    // No se limpia la caché aquí: limpiarla forzaría un nuevo fetchUser() en cuanto
    // cualquier consumidor de ensureSession$() volviera a suscribirse, generando
    // una cascada de peticiones a /me. El token renovado se aplica vía cookie HttpOnly;
    // el signal de UserService no necesita recargarse salvo que cambie el payload del JWT.
    return this.authRefreshService.refreshSession();
  }

  /**
   * Verifica si hay un refresh en progreso
   */
  isRefreshInProgress(): boolean {
    return this.authRefreshService.isRefreshInProgress();
  }
}
