import { ApplicationConfig, provideZoneChangeDetection, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi, withFetch } from '@angular/common/http';
import { 
  provideClientHydration, 
  withEventReplay, 
  withNoHttpTransferCache
} from '@angular/platform-browser';
import { HTTP_INTERCEPTORS } from '@angular/common/http';

import { routes } from './app.routes';
import { GUIDERS_AUTH_PROVIDERS } from './features/auth/infrastructure/auth-config.providers';
import { AuthInterceptor } from './core/interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }), 
    provideRouter(routes), 
    provideHttpClient(withInterceptorsFromDi(), withFetch()),
    // Configuración de hidratación más robusta
    provideClientHydration(
      withEventReplay(),
      // withNoHttpTransferCache()
    ),
    ...GUIDERS_AUTH_PROVIDERS,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ]
};
