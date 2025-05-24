import { User, AuthSession, LoginCredentials, AuthResponse } from '../entities/user.entity';

/**
 * Puerto (interface) que define las operaciones de repositorio de autenticación.
 * Las implementaciones específicas estarán en la capa de infraestructura de cada aplicación.
 */
export interface AuthRepositoryPort {
  /**
   * Inicia sesión con las credenciales proporcionadas
   */
  login(credentials: LoginCredentials): Promise<AuthResponse>;

  /**
   * Cierra la sesión del usuario actual
   */
  logout(): Promise<void>;

  /**
   * Obtiene el usuario actual de la sesión
   */
  getCurrentUser(): Promise<User | null>;

  /**
   * Obtiene la sesión actual
   */
  getSession(): Promise<AuthSession | null>;

  /**
   * Verifica si el usuario está autenticado
   */
  isAuthenticated(): Promise<boolean>;

  /**
   * Valida el token actual
   */
  validateToken(): Promise<boolean>;

  /**
   * Actualiza el token usando el refresh token
   */
  refreshToken(): Promise<AuthSession>;

  /**
   * Limpia la sesión local
   */
  clearSession(): Promise<void>;
}
