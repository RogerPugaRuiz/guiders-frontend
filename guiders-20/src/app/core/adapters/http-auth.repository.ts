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

import { StorageService } from '../services/storage.service';
import { environment } from '../../../environments/environment';
import { decodeJwtPayload, extractUserFromToken, isTokenExpired, JwtPayload } from '../utils/jwt.utils';

/**
 * Implementación HTTP del repositorio de autenticación para la aplicación Guiders-20
 */
@Injectable()
export class HttpAuthRepository implements AuthRepositoryPort {
  private readonly API_BASE_URL = `${environment.apiUrl || '/api'}/auth`;
  private readonly STORAGE_KEYS = {
    TOKEN: 'guiders20_auth_token',
    REFRESH_TOKEN: 'guiders20_refresh_token',
    USER: 'guiders20_user',
    SESSION: 'guiders20_session'
  };

  constructor(
    private http: HttpClient,
    private storageService: StorageService
  ) {}

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      // La respuesta del backend tiene esta estructura:
      // { access_token: string, refresh_token: string }
      const backendResponse = await firstValueFrom(
        this.http.post<{ access_token: string; refresh_token: string }>(`${this.API_BASE_URL}/login`, credentials)
      );

      // Extraer información del usuario desde el access_token
      const userInfo = extractUserFromToken(backendResponse.access_token);
      if (!userInfo) {
        throw new Error('No se pudo extraer información del usuario del token');
      }

      // Obtener información de expiración del token
      const payload = decodeJwtPayload<JwtPayload>(backendResponse.access_token);
      if (!payload) {
        throw new Error('Token inválido recibido del servidor');
      }

      // Crear el objeto User según nuestras interfaces
      const user: User = {
        id: userInfo.id,
        email: userInfo.email,
        name: userInfo.email, // Por ahora usamos el email como nombre
        role: userInfo.role,
        companyId: userInfo.companyId,
        isActive: true,
        lastLoginAt: new Date(),
        createdAt: new Date(), // No tenemos esta info del JWT, usamos fecha actual
        updatedAt: new Date()
      };

      // Crear la sesión según nuestras interfaces
      const session: AuthSession = {
        token: backendResponse.access_token,
        refreshToken: backendResponse.refresh_token,
        expiresAt: new Date(payload.exp * 1000), // Convertir de segundos a milisegundos
        user: user
      };

      // Crear la respuesta según nuestras interfaces
      const response: AuthResponse = {
        success: true,
        user: user,
        session: session,
        message: 'Login exitoso'
      };

      // Guardar en localStorage
      await this.saveSession(session);

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
      if (!session?.user) {
        return null;
      }

      // Devolver directamente el usuario almacenado en la sesión
      // que ya fue extraído del token durante el login
      return session.user;
    } catch (error) {
      console.error('Error al obtener usuario de la sesión:', error);
      return null;
    }
  }

  async getSession(): Promise<AuthSession | null> {
    try {
      const sessionData = this.storageService.getItem(this.STORAGE_KEYS.SESSION);
      if (!sessionData) {
        console.warn('No session data found in storage');
        return null;
      }

      const session: AuthSession = JSON.parse(sessionData);
      
      // Verificar si el token ha expirado usando la utilidad JWT
      if (isTokenExpired(session.token)) {
        console.warn('Session token has expired');
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
    return session !== null && !isTokenExpired(session.token);
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
        console.warn('Token validation failed, session may be expired');
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

      const refresh = await firstValueFrom(
        this.http.post<{ accessToken: string }>(`${this.API_BASE_URL}/refresh`, {
          refreshToken: session.refreshToken
        })
      );
      
      const payload = decodeJwtPayload<JwtPayload>(refresh.accessToken);
      if (!payload) {
        throw new Error('Token inválido recibido del servidor');
      }

      // Crear la nueva sesión manteniendo la estructura correcta
      const currentUser = await this.getCurrentUser();
      if (!currentUser) {
        throw new Error('No se pudo obtener el usuario actual');
      }

      const newSession: AuthSession = {
        token: refresh.accessToken,
        refreshToken: session.refreshToken, // Preservar el refresh token
        expiresAt: new Date(payload.exp * 1000), // Convertir de segundos a milisegundos
        user: currentUser
      };

      await this.saveSession(newSession);
      return newSession;
    } catch (error) {
      console.error('Error refreshing token:', error);
      await this.clearSession();
      throw this.handleHttpError(error);
    }
  }

  async clearSession(): Promise<void> {
    console.log('Clearing session data from storage');
    this.storageService.removeItem(this.STORAGE_KEYS.TOKEN);
    this.storageService.removeItem(this.STORAGE_KEYS.REFRESH_TOKEN);
    this.storageService.removeItem(this.STORAGE_KEYS.USER);
    this.storageService.removeItem(this.STORAGE_KEYS.SESSION);
  }

  private async saveSession(session: AuthSession): Promise<void> {
    this.storageService.setItem(this.STORAGE_KEYS.SESSION, JSON.stringify(session));
    this.storageService.setItem(this.STORAGE_KEYS.TOKEN, session.token);
    if (session.refreshToken) {
      this.storageService.setItem(this.STORAGE_KEYS.REFRESH_TOKEN, session.refreshToken);
    }
    this.storageService.setItem(this.STORAGE_KEYS.USER, JSON.stringify(session.user));
  }

  private handleHttpError(error: any): Error {
    if (error instanceof HttpErrorResponse) {
      switch (error.status) {
        case 400:
          return new ValidationError('credentials', 'Parece que hay un problema con los datos que ingresaste. Por favor, revísalos e inténtalo de nuevo.');
        case 401:
          return new AuthenticationError('El email o la contraseña no son correctos. ¿Quizás te equivocaste al escribirlos?');
        case 403:
          return new UnauthorizedError('No tienes permisos para acceder en este momento. Si crees que esto es un error, contacta con soporte.');
        case 0:
          return new Error('No pudimos conectarnos con el servidor');
        case 404:
          return new Error('El servicio que intentas usar no está disponible en este momento. Inténtalo más tarde.');
        case 429:
          return new Error('Has realizado demasiados intentos. Espera unos minutos antes de volver a intentarlo.');
        case 500:
          return new Error('Ocurrió algo inesperado');
        case 503:
          return new Error('El servicio está temporalmente no disponible. Estamos realizando mantenimiento. Vuelve pronto.');
        default:
          return new Error('Ups, algo no salió como esperábamos. Inténtalo de nuevo en unos momentos.');
      }
    }

    return new Error('Ocurrió algo inesperado. Si el problema persiste, contacta con nosotros.');
  }
}
