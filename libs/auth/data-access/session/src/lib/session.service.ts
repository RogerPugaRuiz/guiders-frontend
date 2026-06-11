import { Injectable, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { SelfChatService } from '@guiders-frontend/self-chat';
import { Observable, throwError } from 'rxjs';
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
  private userNotProvisioned = false;

  ensureSession$(): Observable<User> {
    if (this.userNotProvisioned) {
      const error = new HttpErrorResponse({
        status: 403,
        statusText: 'User Not Provisioned',
        error: { reason: 'user_not_provisioned' },
      });
      return throwError(() => error);
    }
    if (!this.me$) {
      this.me$ = this.userService.fetchUser()
        .pipe(
          tap(user => {
            console.log('Session ensured for user:', user.email);
            this.scheduleProactiveRefresh(user);
            this.selfChat.initialize({ sub: user.sub, email: user.email });
          }),
          shareReplay({ bufferSize: 1, refCount: false })
        );
    }
    return this.me$;
  }

  markUserNotProvisioned(): void {
    this.userNotProvisioned = true;
  }

  clearCache(): void {
    this.me$ = undefined;
    this.userNotProvisioned = false;
    this.userService.clearUser();
    this.authRefreshService.cancelScheduledRefresh();
    this.selfChat.clear();
  }

  getCurrentUser(): User | null {
    return this.userService.currentUser();
  }

  isAuthenticated(): boolean {
    return this.userService.isAuthenticated();
  }

  isSessionExpired(): boolean {
    return this.userService.isSessionExpired();
  }

  private scheduleProactiveRefresh(user: User): void {
    if (user.session?.exp) {
      console.log('[SessionService] Programando refresh proactivo para el usuario:', user.email);
      this.authRefreshService.scheduleProactiveRefresh(user.session.exp);
    } else {
      console.warn('[SessionService] No se puede programar refresh: falta información de expiración');
    }
  }

  refreshSession(): Observable<void> {
    return this.authRefreshService.refreshSession();
  }

  isRefreshInProgress(): boolean {
    return this.authRefreshService.isRefreshInProgress();
  }
}
