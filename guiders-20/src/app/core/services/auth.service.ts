import { Injectable, inject, signal } from '@angular/core';
import { Observable, from, tap } from 'rxjs';

import { 
  AuthResponse, 
  AuthSession,
  LoginCredentials, 
  User
} from '@libs/feature/auth';

import {
  LoginUseCase,
  LogoutUseCase,
  GetCurrentUserUseCase,
  GetSessionUseCase,
  IsAuthenticatedUseCase,
  ValidateTokenUseCase,
  RefreshTokenUseCase
} from '@libs/feature/auth';

import {
  LOGIN_USE_CASE_TOKEN,
  LOGOUT_USE_CASE_TOKEN,
  GET_CURRENT_USER_USE_CASE_TOKEN,
  GET_SESSION_USE_CASE_TOKEN,
  IS_AUTHENTICATED_USE_CASE_TOKEN,
  VALIDATE_TOKEN_USE_CASE_TOKEN,
  REFRESH_TOKEN_USE_CASE_TOKEN
} from '../config/auth-config.providers';

/**
 * Servicio para manejar la autenticación de usuarios usando arquitectura hexagonal
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Inyección de casos de uso
  private loginUseCase: LoginUseCase = inject(LOGIN_USE_CASE_TOKEN);
  private logoutUseCase: LogoutUseCase = inject(LOGOUT_USE_CASE_TOKEN);
  private getCurrentUserUseCase: GetCurrentUserUseCase = inject(GET_CURRENT_USER_USE_CASE_TOKEN);
  private getSessionUseCase: GetSessionUseCase = inject(GET_SESSION_USE_CASE_TOKEN);
  private isAuthenticatedUseCase: IsAuthenticatedUseCase = inject(IS_AUTHENTICATED_USE_CASE_TOKEN);
  private validateTokenUseCase: ValidateTokenUseCase = inject(VALIDATE_TOKEN_USE_CASE_TOKEN);
  private refreshTokenUseCase: RefreshTokenUseCase = inject(REFRESH_TOKEN_USE_CASE_TOKEN);
  
  // Signals para el estado de la aplicación
  currentUser = signal<User | null>(null);
  isAuthenticated = signal<boolean>(false);
  authToken = signal<string | null>(null);

  constructor() {
    // Inicializar el estado de autenticación al cargar el servicio
    this.initializeAuthState();
  }

  /**
   * Inicializa el estado de autenticación desde la sesión guardada
   */
  private async initializeAuthState(): Promise<void> {
    try {
      const [currentUser, session, authenticated] = await Promise.all([
        this.getCurrentUserUseCase.execute(),
        this.getSessionUseCase.execute(),
        this.isAuthenticatedUseCase.execute()
      ]);

      this.currentUser.set(currentUser);
      this.isAuthenticated.set(authenticated);
      this.authToken.set(session?.token || null);
    } catch (error) {
      console.error('Error initializing auth state:', error);
      this.resetSignals();
    }
  }

  /**
   * Realiza el proceso de inicio de sesión
   */
  login(credentials: LoginCredentials): Observable<AuthResponse> {
    return from(this.loginUseCase.execute(credentials)).pipe(
      tap(response => {
        // Actualizar signals después del login exitoso
        if (response.success && response.user && response.session) {
          this.currentUser.set(response.user);
          this.isAuthenticated.set(true);
          this.authToken.set(response.session.token);
        }
      })
    );
  }

  /**
   * Cierra la sesión del usuario
   */
  logout(): Observable<void> {
    return from(this.logoutUseCase.execute()).pipe(
      tap(() => {
        // Limpiar signals después del logout
        this.resetSignals();
      })
    );
  }

  /**
   * Obtiene el usuario actual
   */
  getCurrentUser(): Observable<User | null> {
    return from(this.getCurrentUserUseCase.execute());
  }

  /**
   * Obtiene la sesión actual
   */
  getSession(): Observable<AuthSession | null> {
    return from(this.getSessionUseCase.execute());
  }

  /**
   * Verifica si el usuario está autenticado
   */
  checkAuthenticationStatus(): Observable<boolean> {
    return from(this.isAuthenticatedUseCase.execute()).pipe(
      tap(authenticated => {
        this.isAuthenticated.set(authenticated);
        if (!authenticated) {
          this.resetSignals();
        }
      })
    );
  }

  /**
   * Valida el token actual
   */
  validateToken(): Observable<boolean> {
    return from(this.validateTokenUseCase.execute()).pipe(
      tap(isValid => {
        if (!isValid) {
          this.resetSignals();
        }
      })
    );
  }

  /**
   * Actualiza el token usando el refresh token
   */
  refreshToken(): Observable<AuthSession> {
    return from(this.refreshTokenUseCase.execute()).pipe(
      tap(session => {
        // Actualizar signals con la nueva sesión
        this.authToken.set(session.token);
        this.currentUser.set(session.user);
        this.isAuthenticated.set(true);
      })
    );
  }

  /**
   * Reinicia todos los signals de autenticación
   */
  private resetSignals(): void {
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    this.authToken.set(null);
  }
}
