import { AuthRepositoryPort } from '../ports/auth-repository.port';
import { AuthSession } from '../models/auth-session.model';

/**
 * Caso de uso para refrescar el token de autenticación
 */
export class RefreshTokenUseCase {
  constructor(private authRepository: AuthRepositoryPort) {}

  async execute(): Promise<AuthSession> {
    return await this.authRepository.refreshToken();
  }
}