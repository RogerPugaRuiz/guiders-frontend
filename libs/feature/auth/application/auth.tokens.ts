import { InjectionToken } from '@angular/core';
import { AuthRepositoryPort } from '../domain/ports/auth-repository.port';
import { AuthApplicationService } from '../application/auth-application.service';

/**
 * Token de inyección para el repositorio de autenticación
 */
export const AUTH_REPOSITORY_TOKEN = new InjectionToken<AuthRepositoryPort>('AuthRepositoryPort');

/**
 * Token de inyección para el servicio de aplicación de autenticación
 */
export const AUTH_APPLICATION_SERVICE_TOKEN = new InjectionToken<AuthApplicationService>('AuthApplicationService');
