import { AuthSession } from '../entities/user.entity';
import { AuthRepositoryPort } from '../ports/auth-repository.port';

/**
 * Caso de uso para obtener la sesión actual
 */
export class GetSessionUseCase {
  constructor(private authRepository: AuthRepositoryPort) {}

  async execute(): Promise<AuthSession | null> {
    return await this.authRepository.getSession();
  }
}
