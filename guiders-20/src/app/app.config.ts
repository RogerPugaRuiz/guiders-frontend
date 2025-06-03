import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { allAdapterProviders, allUseCaseProviders } from './core/providers';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { GUIDERS20_AUTH_PROVIDERS } from './core/config/auth-config.providers';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    // Configurar HttpClient con interceptores funcionales
    provideHttpClient(
      withFetch(),
      withInterceptors([authInterceptor])
    ),
    // Configuración de adaptadores (infraestructura)
    ...allAdapterProviders,
    // Configuración de casos de uso (aplicación)
    ...allUseCaseProviders,
    // Configuración de auth con arquitectura hexagonal
    ...GUIDERS20_AUTH_PROVIDERS,
  ]
};
