import { InjectionToken } from '@angular/core';
import { LoginUseCase } from './use-cases/login.use-case';
import { LogoutUseCase } from './use-cases/logout.use-case';
import { GetCurrentUserUseCase } from './use-cases/get-current-user.use-case';
import { GetSessionUseCase } from './use-cases/get-session.use-case';
import { IsAuthenticatedUseCase } from './use-cases/is-authenticated.use-case';
import { ValidateTokenUseCase } from './use-cases/validate-token.use-case';

export const LOGIN_USE_CASE = new InjectionToken<LoginUseCase>('LoginUseCase');
export const LOGOUT_USE_CASE = new InjectionToken<LogoutUseCase>('LogoutUseCase');
export const GET_CURRENT_USER_USE_CASE = new InjectionToken<GetCurrentUserUseCase>('GetCurrentUserUseCase');
export const GET_SESSION_USE_CASE = new InjectionToken<GetSessionUseCase>('GetSessionUseCase');
export const IS_AUTHENTICATED_USE_CASE = new InjectionToken<IsAuthenticatedUseCase>('IsAuthenticatedUseCase');
export const VALIDATE_TOKEN_USE_CASE = new InjectionToken<ValidateTokenUseCase>('ValidateTokenUseCase');
