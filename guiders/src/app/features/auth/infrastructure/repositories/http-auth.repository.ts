import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { 
  AuthRepositoryPort, 
  User, 
  AuthSession, 
  LoginCredentials, 
  AuthResponse,
  AuthenticationError,
  ValidationError,
  SessionExpiredError,
  UnauthorizedError
} from '@libs/feature/auth';

import { StorageService } from '../../../../core/services/storage.service';

/**
 * Implementación HTTP del repositorio de autenticación para la aplicación Guiders
 */
@Injectable()
export class HttpAuthRepository implements AuthRepositoryPort {
  private readonly API_BASE_URL = '/api/auth';
  private readonly STORAGE_KEYS = {
    TOKEN: 'guiders_auth_token',
    REFRESH_TOKEN: 'guiders_refresh_token',
    USER: 'guiders_user',
    SESSION: 'guiders_session'
  };

  constructor(
    private http: HttpClient,
    private storageService: StorageService
  ) {}

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await firstValueFrom(
        this.http.post<AuthResponse>(`${this.API_BASE_URL}/login`, credentials)
      );

      // Guardar en localStorage
      if (response.success && response.session) {
        await this.saveSession(response.session);
      }

      return response;
    } catch (error) {
      throw this.handleHttpError(error);
    }
  }

  async logout(): Promise<void> {
    try {
      const session = await this.getSession();
      if (session?.token) {
        await firstValueFrom(
          this.http.post(`${this.API_BASE_URL}/logout`, {}, {
            headers: { Authorization: `Bearer ${session.token}` }
          })
        );
      }
    } catch (error) {
      // Ignorar errores del servidor en logout
      console.warn('Error during server logout:', error);
    } finally {
      // Siempre limpiar la sesión local
      await this.clearSession();
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const session = await this.getSession();
      if (!session?.token) {
        return null;
      }

      const user = await firstValueFrom(
        this.http.get<User>(`${this.API_BASE_URL}/me`, {
          headers: { Authorization: `Bearer ${session.token}` }
        })
      );

      return user;
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        await this.clearSession();
        return null;
      }
      throw this.handleHttpError(error);
    }
  }

  async getSession(): Promise<AuthSession | null> {
    try {
      const sessionData = this.storageService.getItem(this.STORAGE_KEYS.SESSION);
      if (!sessionData) {
        return null;
      }

      const session: AuthSession = JSON.parse(sessionData);
      
      // Verificar si la sesión ha expirado
      if (new Date(session.expiresAt) <= new Date()) {
        await this.clearSession();
        return null;
      }

      return session;
    } catch (error) {
      console.error('Error parsing session data:', error);
      await this.clearSession();
      return null;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    const session = await this.getSession();
    return session !== null && new Date(session.expiresAt) > new Date();
  }

  async validateToken(): Promise<boolean> {
    try {
      const session = await this.getSession();
      if (!session?.token) {
        return false;
      }

      await firstValueFrom(
        this.http.get(`${this.API_BASE_URL}/validate`, {
          headers: { Authorization: `Bearer ${session.token}` }
        })
      );

      return true;
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        await this.clearSession();
        return false;
      }
      return false;
    }
  }

  async refreshToken(): Promise<AuthSession> {
    try {
      const session = await this.getSession();
      if (!session?.refreshToken) {
        throw new SessionExpiredError('No refresh token available');
      }

      const newSession = await firstValueFrom(
        this.http.post<AuthSession>(`${this.API_BASE_URL}/refresh`, {
          refreshToken: session.refreshToken
        })
      );

      await this.saveSession(newSession);
      return newSession;
    } catch (error) {
      await this.clearSession();
      throw this.handleHttpError(error);
    }
  }

  async clearSession(): Promise<void> {
    localStorage.removeItem(this.STORAGE_KEYS.TOKEN);
    localStorage.removeItem(this.STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(this.STORAGE_KEYS.USER);
    localStorage.removeItem(this.STORAGE_KEYS.SESSION);
  }

  private async saveSession(session: AuthSession): Promise<void> {
    localStorage.setItem(this.STORAGE_KEYS.SESSION, JSON.stringify(session));
    localStorage.setItem(this.STORAGE_KEYS.TOKEN, session.token);
    localStorage.setItem(this.STORAGE_KEYS.REFRESH_TOKEN, session.refreshToken);
    localStorage.setItem(this.STORAGE_KEYS.USER, JSON.stringify(session.user));
  }

  private handleHttpError(error: any): Error {
    if (error instanceof HttpErrorResponse) {
      switch (error.status) {
        case 400:
          return new ValidationError('credentials', error.error?.message || 'Datos inválidos');
        case 401:
          return new AuthenticationError(error.error?.message || 'Credenciales inválidas');
        case 403:
          return new UnauthorizedError(error.error?.message || 'Acceso denegado');
        case 0:
          return new Error('Error de conexión. Verifica tu conexión a internet.');
        default:
          return new Error(error.error?.message || 'Error del servidor');
      }
    }

    return error instanceof Error ? error : new Error('Error desconocido');
  }
}
