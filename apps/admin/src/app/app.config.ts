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
import { ENVIRONMENT_TOKEN, authRefreshInterceptor, SessionGuardianService } from '@guiders-frontend/auth/data-access/session';

/**
 * Factory para inicializar el SessionGuardian
 */
function initializeSessionGuardian() {
  const sessionGuardian = inject(SessionGuardianService);

  return () => {
    sessionGuardian.initialize({
      inactivityRefreshMinutes: 5,
      inactivityExpiredMinutes: 30,
      heartbeatIntervalMinutes: 0,
      debug: !environment.production
    });
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(appRoutes),
    provideHttpClient(withInterceptors([
      authRefreshInterceptor, // Refresh automático antes que el auth interceptor  
      authInterceptor()
    ])),
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
    // Proporcionar el environment a las librerías
    { provide: ENVIRONMENT_TOKEN, useValue: environment },
    // Inicializar SessionGuardian para protección de sesión
    {
      provide: APP_INITIALIZER,
      useFactory: initializeSessionGuardian,
      multi: true,
    },
  ],
};
