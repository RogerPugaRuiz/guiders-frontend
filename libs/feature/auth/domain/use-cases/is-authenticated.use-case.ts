import { AuthRepositoryPort } from '../ports/auth-repository.port';

/**
 * Caso de uso para verificar si el usuario está autenticado
 */
export class IsAuthenticatedUseCase {
  constructor(private authRepository: AuthRepositoryPort) {}

  async execute(): Promise<boolean> {
    return await this.authRepository.isAuthenticated();
  }
}
