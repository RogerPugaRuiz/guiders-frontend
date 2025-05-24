import { AuthRepositoryPort } from '../../domain/ports/auth-repository.port';

/**
 * Caso de uso para el logout de usuarios
 */
export class LogoutUseCase {
  constructor(private authRepository: AuthRepositoryPort) {}

  async execute(): Promise<void> {
    await this.authRepository.logout();
  }
}
