import { AuthRepositoryPort, AuthSession } from '@libs/feature/auth';

/**
 * Caso de uso para refrescar el token de acceso
 */
export class RefreshTokenUseCase {
  constructor(private authRepository: AuthRepositoryPort) {}

  /**
   * Ejecuta la actualización del token de acceso
   * @returns La sesión actualizada con el nuevo token
   */
  async execute(): Promise<AuthSession> {
    return await this.authRepository.refreshToken();
  }
}