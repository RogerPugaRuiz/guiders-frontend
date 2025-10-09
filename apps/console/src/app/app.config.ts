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
import { ENVIRONMENT_TOKEN, authRefreshInterceptor, UserService } from '@guiders-frontend/auth/data-access/session';
import { firstValueFrom } from 'rxjs';

/**
 * Factory para inicializar el usuario al arrancar la aplicación.
 * Esto asegura que el UserService tenga el usuario cargado antes de que
 * los componentes intenten acceder a él.
 */
function initializeUser() {
  const userService = inject(UserService);
  
  return () => {
    console.log('[AppInitializer] 🚀 Cargando usuario...');
    return firstValueFrom(userService.fetchUser())
      .then(user => {
        console.log('[AppInitializer] ✅ Usuario cargado:', user.sub);
      })
      .catch(error => {
        console.warn('[AppInitializer] ⚠️ No se pudo cargar el usuario:', error.message);
        // No lanzar error para permitir que la app continúe
        // El auth guard manejará la redirección al login si es necesario
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
    // Inicializar el usuario al arrancar la aplicación
    {
      provide: APP_INITIALIZER,
      useFactory: initializeUser,
      multi: true,
    },
  ],
};
