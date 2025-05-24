import { Provider } from '@angular/core';
import { AuthRepositoryPort } from '../domain/ports/auth-repository.port';
import { AuthApplicationService } from './auth-application.service';
import { LoginUseCase } from '../domain/use-cases/login.use-case';
import { LogoutUseCase } from '../domain/use-cases/logout.use-case';
import { GetCurrentUserUseCase } from '../domain/use-cases/get-current-user.use-case';
import { GetSessionUseCase } from '../domain/use-cases/get-session.use-case';
import { IsAuthenticatedUseCase } from '../domain/use-cases/is-authenticated.use-case';
import { ValidateTokenUseCase } from '../domain/use-cases/validate-token.use-case';
import { AUTH_REPOSITORY_TOKEN, AUTH_APPLICATION_SERVICE_TOKEN } from './auth.tokens';

/**
 * Factory para crear el servicio de aplicación de autenticación
 */
export function createAuthApplicationService(authRepository: AuthRepositoryPort): AuthApplicationService {
  const loginUseCase = new LoginUseCase(authRepository);
  const logoutUseCase = new LogoutUseCase(authRepository);
  const getCurrentUserUseCase = new GetCurrentUserUseCase(authRepository);
  const getSessionUseCase = new GetSessionUseCase(authRepository);
  const isAuthenticatedUseCase = new IsAuthenticatedUseCase(authRepository);
  const validateTokenUseCase = new ValidateTokenUseCase(authRepository);

  return new AuthApplicationService(
    loginUseCase,
    logoutUseCase,
    getCurrentUserUseCase,
    getSessionUseCase,
    isAuthenticatedUseCase,
    validateTokenUseCase
  );
}

/**
 * Proveedores de Angular para la configuración de autenticación
 * Nota: AUTH_REPOSITORY_TOKEN debe ser proporcionado por cada aplicación
 * con su implementación específica de infraestructura
 */
export const AUTH_PROVIDERS: Provider[] = [
  {
    provide: AUTH_APPLICATION_SERVICE_TOKEN,
    useFactory: createAuthApplicationService,
    deps: [AUTH_REPOSITORY_TOKEN]
  }
];
