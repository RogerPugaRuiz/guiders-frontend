import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { shareReplay, tap } from 'rxjs/operators';
import { UserService } from './user.service';
import { User } from './user.interface';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly userService = inject(UserService);
  private me$?: Observable<User>;

  ensureSession$(): Observable<User> {
    if (!this.me$) {
      this.me$ = this.userService.fetchUser()
        .pipe(
          tap(user => {
            console.log('Session ensured for user:', user.email);
          }),
          shareReplay({ bufferSize: 1, refCount: true })
        );
    }
    return this.me$;
  }

  clearCache(): void {
    this.me$ = undefined;
    this.userService.clearUser();
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
}
