import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { allAdapterProviders, allUseCaseProviders } from './core/providers';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { GUIDERS20_AUTH_PROVIDERS } from './core/config/auth-config.providers';
import { WEBSOCKET_PROVIDERS } from './core/providers/websocket.providers';
import { defaultChatApiConfig, CHAT_API_CONFIG_TOKEN } from './core/config/chat-api.config';

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
    // Configuración de la API de Chat (V1 + V2)
    { provide: CHAT_API_CONFIG_TOKEN, useValue: defaultChatApiConfig },
    // Configuración de adaptadores (infraestructura)
    ...allAdapterProviders,
    // Configuración de casos de uso (aplicación) - incluye V1 y V2
    ...allUseCaseProviders,
    // Configuración de auth con arquitectura hexagonal
    ...GUIDERS20_AUTH_PROVIDERS,
    // Configuración de WebSocket
    ...WEBSOCKET_PROVIDERS,
  ]
};
