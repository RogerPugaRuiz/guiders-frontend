import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
  APP_INITIALIZER,
  inject,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAuth, authInterceptor } from 'angular-auth-oidc-client';
import { appRoutes } from './app.routes';
import { environment } from '../environments/environment';
import {
  ENVIRONMENT_TOKEN,
  authRefreshInterceptor,
  UserService,
  SessionGuardianService,
} from '@guiders-frontend/auth/data-access/session';
import { firstValueFrom } from 'rxjs';

/**
 * Factory para inicializar el usuario al arrancar la aplicación.
 * Simplificado para admin - no requiere presencia comercial ni WebSocket.
 */
function initializeApp() {
  const userService = inject(UserService);

  return async () => {
    // Cargar usuario
    console.log('[Admin AppInitializer] Cargando usuario...');
    try {
      const user = await firstValueFrom(userService.fetchUser());
      console.log('[Admin AppInitializer] Usuario cargado:', user.sub);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.warn(
        '[Admin AppInitializer] No se pudo cargar el usuario:',
        errorMessage
      );
    }
  };
}

/**
 * Factory para inicializar el SessionGuardian
 * Protege la sesión contra expiraciones silenciosas
 */
function initializeSessionGuardian() {
  const sessionGuardian = inject(SessionGuardianService);

  return () => {
    sessionGuardian.initialize({
      inactivityRefreshMinutes: 5,
      inactivityExpiredMinutes: 30,
      heartbeatIntervalMinutes: 0,
      debug: !environment.production,
    });
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(appRoutes),
    provideHttpClient(
      withInterceptors([authRefreshInterceptor, authInterceptor()])
    ),
    provideAuth({
      config: {
        authority: environment.auth.authority,
        redirectUrl: window.location.origin,
        postLogoutRedirectUri: window.location.origin,
        clientId: environment.auth.clientId,
        scope: environment.auth.scope,
        responseType: 'code',
        useRefreshToken: true,
        silentRenew: true,
        secureRoutes: environment.auth.secureRoutes,
      },
    }),
    { provide: ENVIRONMENT_TOKEN, useValue: environment },
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      multi: true,
    },
    {
      provide: APP_INITIALIZER,
      useFactory: initializeSessionGuardian,
      multi: true,
    },
  ],
};
