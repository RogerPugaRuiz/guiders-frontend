import { AuthSession } from '../../domain/entities/user.entity';
import { AuthRepositoryPort } from '../../domain/ports/auth-repository.port';

/**
 * Caso de uso para obtener la sesión actual
 */
export class GetSessionUseCase {
  constructor(private authRepository: AuthRepositoryPort) {}

  async execute(): Promise<AuthSession | null> {
    return await this.authRepository.getSession();
  }
}
