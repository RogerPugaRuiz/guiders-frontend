export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  companyId?: string;
}

export interface AuthSession {
  token: string;
  refreshToken: string;
  expiresAt: Date;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  user: User;
  session: AuthSession;
  message?: string;
}

// Error types for auth operations
export class AuthError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

export class ValidationError extends AuthError {
  constructor(
    public field: string, 
    message: string
  ) {
    super(`${field}: ${message}`, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
  }
}

export class UnauthorizedError extends AuthError {
  constructor(message: string = 'No autorizado') {
    super(message, 'UNAUTHORIZED', 401);
    this.name = 'UnauthorizedError';
  }
}

export class NetworkError extends AuthError {
  constructor(message: string = 'Error de conexión') {
    super(message, 'NETWORK_ERROR', 0);
    this.name = 'NetworkError';
  }
}