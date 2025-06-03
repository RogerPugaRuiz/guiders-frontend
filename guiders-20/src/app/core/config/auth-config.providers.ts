import { Provider, InjectionToken } from '@angular/core';
import { 
  AuthRepositoryPort,
  LoginUseCase,
  LogoutUseCase,
  GetCurrentUserUseCase,
  GetSessionUseCase,
  IsAuthenticatedUseCase,
  ValidateTokenUseCase,
  RefreshTokenUseCase
} from '@libs/feature/auth';
import { HttpAuthAdapter } from '../adapters/http-auth.adapter';

/**
 * Token de inyección para el repositorio de autenticación
 */
export const AUTH_REPOSITORY_TOKEN = new InjectionToken<AuthRepositoryPort>('AuthRepositoryPort');

/**
 * Tokens de inyección para los casos de uso
 */
export const LOGIN_USE_CASE_TOKEN = new InjectionToken<LoginUseCase>('LoginUseCase');
export const LOGOUT_USE_CASE_TOKEN = new InjectionToken<LogoutUseCase>('LogoutUseCase');
export const GET_CURRENT_USER_USE_CASE_TOKEN = new InjectionToken<GetCurrentUserUseCase>('GetCurrentUserUseCase');
export const GET_SESSION_USE_CASE_TOKEN = new InjectionToken<GetSessionUseCase>('GetSessionUseCase');
export const IS_AUTHENTICATED_USE_CASE_TOKEN = new InjectionToken<IsAuthenticatedUseCase>('IsAuthenticatedUseCase');
export const VALIDATE_TOKEN_USE_CASE_TOKEN = new InjectionToken<ValidateTokenUseCase>('ValidateTokenUseCase');
export const REFRESH_TOKEN_USE_CASE_TOKEN = new InjectionToken<RefreshTokenUseCase>('RefreshTokenUseCase');

/**
 * Factories para crear los casos de uso
 */
export function createLoginUseCase(authRepository: AuthRepositoryPort): LoginUseCase {
  return new LoginUseCase(authRepository);
}

export function createLogoutUseCase(authRepository: AuthRepositoryPort): LogoutUseCase {
  return new LogoutUseCase(authRepository);
}

export function createGetCurrentUserUseCase(authRepository: AuthRepositoryPort): GetCurrentUserUseCase {
  return new GetCurrentUserUseCase(authRepository);
}

export function createGetSessionUseCase(authRepository: AuthRepositoryPort): GetSessionUseCase {
  return new GetSessionUseCase(authRepository);
}

export function createIsAuthenticatedUseCase(authRepository: AuthRepositoryPort): IsAuthenticatedUseCase {
  return new IsAuthenticatedUseCase(authRepository);
}

export function createValidateTokenUseCase(authRepository: AuthRepositoryPort): ValidateTokenUseCase {
  return new ValidateTokenUseCase(authRepository);
}

export function createRefreshTokenUseCase(authRepository: AuthRepositoryPort): RefreshTokenUseCase {
  return new RefreshTokenUseCase(authRepository);
}

/**
 * Configuración de proveedores de autenticación para la aplicación Guiders-20
 */
export const GUIDERS20_AUTH_PROVIDERS: Provider[] = [
  // Proporcionar la implementación específica del repositorio
  {
    provide: AUTH_REPOSITORY_TOKEN,
    useClass: HttpAuthAdapter
  },
  // Proporcionar los casos de uso
  {
    provide: LOGIN_USE_CASE_TOKEN,
    useFactory: createLoginUseCase,
    deps: [AUTH_REPOSITORY_TOKEN]
  },
  {
    provide: LOGOUT_USE_CASE_TOKEN,
    useFactory: createLogoutUseCase,
    deps: [AUTH_REPOSITORY_TOKEN]
  },
  {
    provide: GET_CURRENT_USER_USE_CASE_TOKEN,
    useFactory: createGetCurrentUserUseCase,
    deps: [AUTH_REPOSITORY_TOKEN]
  },
  {
    provide: GET_SESSION_USE_CASE_TOKEN,
    useFactory: createGetSessionUseCase,
    deps: [AUTH_REPOSITORY_TOKEN]
  },
  {
    provide: IS_AUTHENTICATED_USE_CASE_TOKEN,
    useFactory: createIsAuthenticatedUseCase,
    deps: [AUTH_REPOSITORY_TOKEN]
  },
  {
    provide: VALIDATE_TOKEN_USE_CASE_TOKEN,
    useFactory: createValidateTokenUseCase,
    deps: [AUTH_REPOSITORY_TOKEN]
  },
  {
    provide: REFRESH_TOKEN_USE_CASE_TOKEN,
    useFactory: createRefreshTokenUseCase,
    deps: [AUTH_REPOSITORY_TOKEN]
  }
];
