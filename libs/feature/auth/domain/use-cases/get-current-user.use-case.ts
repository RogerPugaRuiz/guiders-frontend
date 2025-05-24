import { User } from '../entities/user.entity';
import { AuthRepositoryPort } from '../ports/auth-repository.port';

/**
 * Caso de uso para obtener el usuario actual
 */
export class GetCurrentUserUseCase {
  constructor(private authRepository: AuthRepositoryPort) {}

  async execute(): Promise<User | null> {
    return await this.authRepository.getCurrentUser();
  }
}
