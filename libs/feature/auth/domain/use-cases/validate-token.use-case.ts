import { AuthRepositoryPort } from '../ports/auth-repository.port';

/**
 * Caso de uso para validar el token actual
 */
export class ValidateTokenUseCase {
  constructor(private authRepository: AuthRepositoryPort) {}

  async execute(): Promise<boolean> {
    return await this.authRepository.validateToken();
  }
}
