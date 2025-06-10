import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, catchError, throwError, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { 
  AuthResponse, 
  AuthSession,
  LoginCredentials, 
  User,
  ValidationError,
  UnauthorizedError,
  NetworkError
} from '../models/auth.models';
import { StorageService } from '../../../core/services/storage.service';

/**
 * Servicio Angular simple para autenticación sin arquitectura hexagonal
 * Utiliza HttpClient directamente y maneja el estado con signals
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly httpClient = inject(HttpClient);
  private readonly storageService = inject(StorageService);
  private readonly API_BASE_URL = `${environment.apiUrl}/auth`;

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
      const session = await this.getStoredSession();
      if (session && session.token) {
        const isValid = await this.validateStoredToken(session.token);
        if (isValid) {
          this.currentUser.set(session.user);
          this.isAuthenticated.set(true);
          this.authToken.set(session.token);
        } else {
          this.clearAuthState();
        }
      }
    } catch (error) {
      console.error('Error initializing auth state:', error);
      this.clearAuthState();
    }
  }

  /**
   * Realiza el proceso de inicio de sesión
   */
  login(credentials: LoginCredentials): Observable<AuthResponse> {
    // Validaciones básicas
    if (!credentials.email || !credentials.password) {
      return throwError(() => new ValidationError('credentials', 'Email y contraseña son requeridos'));
    }

    if (!this.isValidEmail(credentials.email)) {
      return throwError(() => new ValidationError('email', 'Email no válido'));
    }

    return from(this.performLogin(credentials)).pipe(
      tap(response => {
        // Actualizar signals después del login exitoso
        if (response.success && response.user && response.session) {
          this.currentUser.set(response.user);
          this.isAuthenticated.set(true);
          this.authToken.set(response.session.token);
          this.storeSession(response.session);
        }
      }),
      catchError(error => {
        console.error('❌ [AuthService] Error en login:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Cierra la sesión del usuario
   */
  logout(): Observable<void> {
    return from(this.performLogout()).pipe(
      tap(() => {
        // Limpiar signals después del logout
        this.clearAuthState();
      }),
      catchError(error => {
        console.error('❌ [AuthService] Error en logout:', error);
        // Aún así limpiar el estado local
        this.clearAuthState();
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtiene el usuario actual
   */
  getCurrentUser(): Observable<User | null> {
    return from(this.fetchCurrentUser());
  }

  /**
   * Obtiene la sesión actual
   */
  getSession(): Observable<AuthSession | null> {
    return from(this.getStoredSession());
  }

  /**
   * Verifica si el usuario está autenticado
   */
  checkAuthenticationStatus(): Observable<boolean> {
    return from(this.checkAuth()).pipe(
      tap(authenticated => {
        this.isAuthenticated.set(authenticated);
        if (!authenticated) {
          this.clearAuthState();
        }
      })
    );
  }

  /**
   * Valida el token actual
   */
  validateToken(): Observable<boolean> {
    const token = this.authToken();
    if (!token) {
      return from(Promise.resolve(false));
    }

    return from(this.validateStoredToken(token)).pipe(
      tap(isValid => {
        if (!isValid) {
          this.clearAuthState();
        }
      })
    );
  }

  /**
   * Actualiza el token usando el refresh token
   */
  refreshToken(): Observable<AuthSession> {
    return from(this.performTokenRefresh()).pipe(
      tap(session => {
        // Actualizar signals con la nueva sesión
        this.authToken.set(session.token);
        this.currentUser.set(session.user);
        this.isAuthenticated.set(true);
        this.storeSession(session);
      }),
      catchError(error => {
        console.error('❌ [AuthService] Error en refresh token:', error);
        this.clearAuthState();
        return throwError(() => error);
      })
    );
  }

  // Private HTTP methods

  private async performLogin(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await this.httpClient.post<any>(`${this.API_BASE_URL}/login`, credentials).toPromise();
      
      // Transformar respuesta según formato esperado
      return {
        success: true,
        user: response.user || response.data?.user,
        session: response.session || response.data?.session,
        message: response.message
      };
    } catch (error: any) {
      throw this.handleHttpError(error);
    }
  }

  private async performLogout(): Promise<void> {
    try {
      const token = this.authToken();
      if (token) {
        await this.httpClient.post(`${this.API_BASE_URL}/logout`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        }).toPromise();
      }
      
      // Limpiar storage
      this.clearStoredSession();
    } catch (error: any) {
      // En caso de error, aún limpiar el storage local
      this.clearStoredSession();
      throw this.handleHttpError(error);
    }
  }

  private async fetchCurrentUser(): Promise<User | null> {
    try {
      const token = this.authToken();
      if (!token) {
        return null;
      }

      const response = await this.httpClient.get<any>(`${this.API_BASE_URL}/me`, {
        headers: { Authorization: `Bearer ${token}` }
      }).toPromise();

      return response.user || response.data || response;
    } catch (error: any) {
      console.error('Error fetching current user:', error);
      return null;
    }
  }

  private async checkAuth(): Promise<boolean> {
    try {
      const session = await this.getStoredSession();
      if (!session || !session.token) {
        return false;
      }

      // Verificar si el token es válido haciendo una petición
      return await this.validateStoredToken(session.token);
    } catch (error) {
      return false;
    }
  }

  private async validateStoredToken(token: string): Promise<boolean> {
    try {
      await this.httpClient.get(`${this.API_BASE_URL}/validate`, {
        headers: { Authorization: `Bearer ${token}` }
      }).toPromise();
      
      return true;
    } catch (error) {
      return false;
    }
  }

  private async performTokenRefresh(): Promise<AuthSession> {
    try {
      const session = await this.getStoredSession();
      if (!session || !session.refreshToken) {
        throw new UnauthorizedError('No refresh token disponible');
      }

      const response = await this.httpClient.post<any>(`${this.API_BASE_URL}/refresh`, {
        refreshToken: session.refreshToken
      }).toPromise();

      return response.session || response.data?.session || response;
    } catch (error: any) {
      throw this.handleHttpError(error);
    }
  }

  // Storage methods

  private async storeSession(session: AuthSession): Promise<void> {
    try {
      await this.storageService.setItem('auth_session', JSON.stringify(session));
    } catch (error) {
      console.error('Error storing session:', error);
    }
  }

  private async getStoredSession(): Promise<AuthSession | null> {
    try {
      const sessionData = await this.storageService.getItem('auth_session');
      if (sessionData) {
        return JSON.parse(sessionData);
      }
      return null;
    } catch (error) {
      console.error('Error retrieving session:', error);
      return null;
    }
  }

  private async clearStoredSession(): Promise<void> {
    try {
      await this.storageService.removeItem('auth_session');
    } catch (error) {
      console.error('Error clearing session:', error);
    }
  }

  // Utility methods

  private clearAuthState(): void {
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    this.authToken.set(null);
    this.clearStoredSession();
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private handleHttpError(error: any): Error {
    const status = error.status || (error.response?.status);
    
    if (status) {
      switch (status) {
        case 400:
          return new ValidationError('request', 'Los datos proporcionados no son válidos');
        case 401:
          return new UnauthorizedError('Credenciales incorrectas');
        case 403:
          return new UnauthorizedError('No tienes permisos para esta operación');
        case 0:
          return new NetworkError('No se pudo conectar con el servidor');
        case 500:
          return new NetworkError('Error interno del servidor');
        default:
          return new NetworkError('Error inesperado');
      }
    }

    return new NetworkError('Error de conexión');
  }
}