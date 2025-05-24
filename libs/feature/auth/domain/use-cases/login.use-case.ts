import { LoginCredentials, AuthResponse } from '../entities/user.entity';
import { AuthRepositoryPort } from '../ports/auth-repository.port';

/**
 * Caso de uso para el login de usuarios
 */
export class LoginUseCase {
  constructor(private authRepository: AuthRepositoryPort) {}

  async execute(credentials: LoginCredentials): Promise<AuthResponse> {
    // Validaciones de dominio
    if (!credentials.email || !credentials.password) {
      throw new Error('Email y contraseña son requeridos');
    }

    if (!this.isValidEmail(credentials.email)) {
      throw new Error('El formato del email no es válido');
    }

    if (credentials.password.length < 6) {
      throw new Error('La contraseña debe tener al menos 6 caracteres');
    }

    // Delegar al repositorio la implementación específica
    return await this.authRepository.login(credentials);
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
