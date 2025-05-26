import { AuthRepositoryPort } from '../../domain/ports/auth-repository.port';
import { AuthSession } from '../../domain/models/auth-session.model';

/**
 * Caso de uso para refrescar el token de autenticación
 */
export class RefreshTokenUseCase {
  constructor(private authRepository: AuthRepositoryPort) {}

  async execute(): Promise<AuthSession> {
    return await this.authRepository.refreshToken();
  }
}