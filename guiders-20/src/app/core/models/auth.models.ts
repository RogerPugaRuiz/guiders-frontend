
/**
 * Interfaz para las credenciales de inicio de sesión
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Error de validación con campo y mensaje
 */
export class ValidationError extends Error {
  constructor(
    public field: string, 
    public override message: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Error de autenticación con mensaje
 */
export class AuthenticationError extends Error {
  constructor(public override message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

/**
 * Interfaz para el usuario autenticado
 */
export interface User {
  id?: string;
  email: string;
  name?: string;
  role?: string;
}

/**
 * Interfaz para la respuesta de autenticación
 */
export interface AuthResponse {
  user: User;
  token?: string;
}
