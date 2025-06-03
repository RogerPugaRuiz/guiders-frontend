import { InjectionToken, Provider } from '@angular/core';
import { 
  ChatRepositoryPort,
  GetChatsUseCase,
  GetMessagesUseCase,
  GetChatByIdUseCase,
  StartChatUseCase
} from '../../../../../libs/feature/chat';
import { CHAT_REPOSITORY_TOKEN } from './chat-adapter-providers';

// Tokens de inyección para los casos de uso del chat
export const GET_CHATS_USE_CASE_TOKEN = new InjectionToken<GetChatsUseCase>('GetChatsUseCase');
export const GET_MESSAGES_USE_CASE_TOKEN = new InjectionToken<GetMessagesUseCase>('GetMessagesUseCase');
export const GET_CHAT_BY_ID_USE_CASE_TOKEN = new InjectionToken<GetChatByIdUseCase>('GetChatByIdUseCase');
export const START_CHAT_USE_CASE_TOKEN = new InjectionToken<StartChatUseCase>('StartChatUseCase');

/**
 * Providers para los casos de uso del chat
 * Estos providers configuran la inyección de dependencias para los casos de uso,
 * utilizando el repositorio HTTP como dependencia
 */
export const chatUseCaseProviders: Provider[] = [
  // GetChatsUseCase - Obtener lista de chats
  {
    provide: GET_CHATS_USE_CASE_TOKEN,
    useFactory: (repository: ChatRepositoryPort) => new GetChatsUseCase(repository),
    deps: [CHAT_REPOSITORY_TOKEN]
  },
  
  // GetMessagesUseCase - Obtener mensajes de un chat
  {
    provide: GET_MESSAGES_USE_CASE_TOKEN,
    useFactory: (repository: ChatRepositoryPort) => new GetMessagesUseCase(repository),
    deps: [CHAT_REPOSITORY_TOKEN]
  },
  
  // GetChatByIdUseCase - Obtener un chat específico por ID
  {
    provide: GET_CHAT_BY_ID_USE_CASE_TOKEN,
    useFactory: (repository: ChatRepositoryPort) => new GetChatByIdUseCase(repository),
    deps: [CHAT_REPOSITORY_TOKEN]
  },
  
  // StartChatUseCase - Iniciar un nuevo chat
  {
    provide: START_CHAT_USE_CASE_TOKEN,
    useFactory: (repository: ChatRepositoryPort) => new StartChatUseCase(repository),
    deps: [CHAT_REPOSITORY_TOKEN]
  }
];

/**
 * Providers para testing/mock de casos de uso del chat
 * Útil para pruebas unitarias y desarrollo
 */
export const mockChatUseCaseProviders: Provider[] = [
  // Aquí se pueden agregar implementaciones mock para testing
  // Ejemplo:
  // {
  //   provide: GET_CHATS_USE_CASE_TOKEN,
  //   useFactory: (repository: ChatRepositoryPort) => new MockGetChatsUseCase(repository),
  //   deps: [CHAT_REPOSITORY_TOKEN]
  // }
];
