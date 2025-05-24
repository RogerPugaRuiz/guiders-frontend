import { LoginCredentials, AuthResponse, User, AuthSession } from '../domain/entities/user.entity';
import { LoginUseCase } from './use-cases/login.use-case';
import { LogoutUseCase } from './use-cases/logout.use-case';
import { GetCurrentUserUseCase } from './use-cases/get-current-user.use-case';
import { GetSessionUseCase } from './use-cases/get-session.use-case';
import { IsAuthenticatedUseCase } from './use-cases/is-authenticated.use-case';
import { ValidateTokenUseCase } from './use-cases/validate-token.use-case';
import { AuthRepositoryPort } from '../domain/ports/auth-repository.port';

/**
 * Servicio de aplicación para la autenticación.
 * Orquesta los casos de uso sin depender de frameworks específicos.
 */
export class AuthApplicationService {
  private loginUseCase: LoginUseCase;
  private logoutUseCase: LogoutUseCase;
  private getCurrentUserUseCase: GetCurrentUserUseCase;
  private getSessionUseCase: GetSessionUseCase;
  private isAuthenticatedUseCase: IsAuthenticatedUseCase;
  private validateTokenUseCase: ValidateTokenUseCase;

  constructor(authRepository: AuthRepositoryPort) {
    this.loginUseCase = new LoginUseCase(authRepository);
    this.logoutUseCase = new LogoutUseCase(authRepository);
    this.getCurrentUserUseCase = new GetCurrentUserUseCase(authRepository);
    this.getSessionUseCase = new GetSessionUseCase(authRepository);
    this.isAuthenticatedUseCase = new IsAuthenticatedUseCase(authRepository);
    this.validateTokenUseCase = new ValidateTokenUseCase(authRepository);
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    return await this.loginUseCase.execute(credentials);
  }

  async logout(): Promise<void> {
    return await this.logoutUseCase.execute();
  }

  async getCurrentUser(): Promise<User | null> {
    return await this.getCurrentUserUseCase.execute();
  }

  async getSession(): Promise<AuthSession | null> {
    return await this.getSessionUseCase.execute();
  }

  async isAuthenticated(): Promise<boolean> {
    return await this.isAuthenticatedUseCase.execute();
  }

  async validateToken(): Promise<boolean> {
    return await this.validateTokenUseCase.execute();
  }
}
