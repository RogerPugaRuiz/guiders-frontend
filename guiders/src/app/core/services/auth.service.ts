import { Injectable, inject } from '@angular/core';
import { Observable, from } from 'rxjs';
import { 
  LoginCredentials, 
  AuthResponse, 
  User, 
  AuthSession,
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
} from '../../features/auth/infrastructure/auth-config.providers';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private loginUseCase: LoginUseCase = inject(LOGIN_USE_CASE_TOKEN);
  private logoutUseCase: LogoutUseCase = inject(LOGOUT_USE_CASE_TOKEN);
  private getCurrentUserUseCase: GetCurrentUserUseCase = inject(GET_CURRENT_USER_USE_CASE_TOKEN);
  private getSessionUseCase: GetSessionUseCase = inject(GET_SESSION_USE_CASE_TOKEN);
  private isAuthenticatedUseCase: IsAuthenticatedUseCase = inject(IS_AUTHENTICATED_USE_CASE_TOKEN);
  private validateTokenUseCase: ValidateTokenUseCase = inject(VALIDATE_TOKEN_USE_CASE_TOKEN);
  private refreshTokenUseCase: RefreshTokenUseCase = inject(REFRESH_TOKEN_USE_CASE_TOKEN);

  login(credentials: LoginCredentials): Observable<AuthResponse> {
    return from(this.loginUseCase.execute(credentials));
  }

  logout(): Observable<void> {
    return from(this.logoutUseCase.execute());
  }

  getCurrentUser(): Observable<User | null> {
    return from(this.getCurrentUserUseCase.execute());
  }

  getSession(): Observable<AuthSession | null> {
    return from(this.getSessionUseCase.execute());
  }

  isAuthenticated(): Observable<boolean> {
    return from(this.isAuthenticatedUseCase.execute());
  }

  validateToken(): Observable<boolean> {
    return from(this.validateTokenUseCase.execute());
  }

  /**
   * Refresca el token de acceso usando el refresh token
   */
  async refreshToken(): Promise<AuthSession | null> {
    try {
      return await this.refreshTokenUseCase.execute();
    } catch (error) {
      console.error('Error refreshing token:', error);
      return null;
    }
  }
}
