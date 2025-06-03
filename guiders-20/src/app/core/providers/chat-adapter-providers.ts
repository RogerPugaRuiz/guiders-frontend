import { InjectionToken, Provider } from '@angular/core';
import { ChatRepositoryPort } from '../../../../../libs/feature/chat';
import { HttpChatAdapter } from '../adapters/http-chat.adapter';

// Tokens de inyección para los puertos/repositorios
export const CHAT_REPOSITORY_TOKEN = new InjectionToken<ChatRepositoryPort>('ChatRepositoryPort');

/**
 * Configuración de providers para los adaptadores de infraestructura
 * Mapea las interfaces de dominio (puertos) a sus implementaciones concretas (adaptadores)
 */
export const chatAdapterProviders: Provider[] = [
  // Chat Repository - Mapea el puerto a la implementación HTTP
  {
    provide: CHAT_REPOSITORY_TOKEN,
    useClass: HttpChatAdapter
  }
  
  // Aquí se pueden agregar más adaptadores para otros dominios
  // {
  //   provide: USER_REPOSITORY_TOKEN,
  //   useClass: HttpUserAdapter
  // }
];

/**
 * Provider específico para desarrollo/testing que permite usar mock adapters
 */
export const mockChatAdapterProviders: Provider[] = [
  // En el futuro, aquí se pueden agregar mock adapters para testing
  // {
  //   provide: CHAT_REPOSITORY_TOKEN,
  //   useClass: MockChatAdapter
  // }
];
