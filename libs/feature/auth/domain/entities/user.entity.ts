export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
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
