import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, tap, throwError } from 'rxjs';

import { 
  AuthResponse, 
  LoginCredentials, 
  User, 
  AuthenticationError, 
  ValidationError 
} from '../models/auth.models';
import { StorageService } from './storage.service';

/**
 * Servicio para manejar la autenticación de usuarios
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private storageService = inject(StorageService);
  
  // URL base para las peticiones de autenticación
  private baseUrl = '/api/auth';
  
  // Signal para el usuario actual
  currentUser = signal<User | null>(null);
  // Signal para el estado de autenticación
  isAuthenticated = signal<boolean>(false);
  // Signal para el token de autenticación
  authToken = signal<string | null>(null);

  constructor() {
    // Intentar recuperar la sesión al iniciar el servicio
    this.checkAuthStatus();
  }

  /**
   * Verifica el estado de autenticación actual
   * @returns Observable con el estado de autenticación
   */
  checkAuthStatus(): Observable<boolean> {
    const token = this.storageService.getItem('auth_token');
    
    if (!token) {
      this.resetAuth();
      return of(false);
    }
    
    // En un entorno real, aquí se haría una petición al servidor para validar el token
    // Por ahora, simplemente simulamos que el token es válido
    try {
      const userDataStr = this.storageService.getItem('user_data');
      
      if (userDataStr) {
        const userData: User = JSON.parse(userDataStr);
        this.setAuth(userData, token);
        return of(true);
      }
      
      return of(false);
    } catch (error) {
      console.error('Error al analizar los datos del usuario:', error);
      this.resetAuth();
      return of(false);
    }
  }

  /**
   * Realiza el proceso de inicio de sesión
   * @param credentials Credenciales de usuario
   * @returns Observable con la respuesta de autenticación
   */
  login(credentials: LoginCredentials): Observable<AuthResponse> {
    // En un entorno real, aquí se haría una petición al servidor
    // Por ahora, simulamos el comportamiento
    
    // Simulamos validaciones básicas
    if (!credentials.email) {
      return throwError(() => new ValidationError('email', 'El email es requerido'));
    }
    
    if (!credentials.password) {
      return throwError(() => new ValidationError('password', 'La contraseña es requerida'));
    }
    
    // Simulación de credenciales incorrectas para pruebas
    if (credentials.email === 'error@test.com') {
      return throwError(() => new AuthenticationError('Credenciales inválidas'));
    }
    
    // Simulamos una respuesta exitosa después de un delay
    return of({
      user: {
        id: 'user-1',
        email: credentials.email,
        name: 'Usuario Demo',
        role: 'user'
      },
      token: 'jwt-token-demo-123456'
    }).pipe(
      tap(response => {
        // Guardar datos en local storage
        this.storageService.setItem('auth_token', response.token || '');
        this.storageService.setItem('user_data', JSON.stringify(response.user));
        
        // Actualizar signals
        this.setAuth(response.user, response.token || null);
      })
    );
  }

  /**
   * Cierra la sesión del usuario
   * @returns Observable que indica éxito o fracaso
   */
  logout(): Observable<boolean> {
    // En un entorno real, aquí se haría una petición al servidor
    this.resetAuth();
    return of(true);
  }

  /**
   * Establece la información de autenticación
   * @param user Información del usuario
   * @param token Token de autenticación
   */
  private setAuth(user: User, token: string | null): void {
    this.currentUser.set(user);
    this.authToken.set(token);
    this.isAuthenticated.set(!!user && !!token);
  }

  /**
   * Reinicia toda la información de autenticación
   */
  private resetAuth(): void {
    this.storageService.removeItem('auth_token');
    this.storageService.removeItem('user_data');
    this.currentUser.set(null);
    this.authToken.set(null);
    this.isAuthenticated.set(false);
  }
}
