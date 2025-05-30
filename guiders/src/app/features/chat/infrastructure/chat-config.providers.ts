import { InjectionToken, Provider } from '@angular/core';
import { HttpChatRepository } from './repositories/http-chat.repository';
import { 
  GetChatsUseCase,
  GetMessagesUseCase,
  GetChatByIdUseCase,
  StartChatUseCase,
  ChatRepositoryPort
} from '@libs/feature/chat';

// Tokens de inyección para los casos de uso
export const GET_CHATS_USE_CASE_TOKEN = new InjectionToken<GetChatsUseCase>('GetChatsUseCase');
export const GET_MESSAGES_USE_CASE_TOKEN = new InjectionToken<GetMessagesUseCase>('GetMessagesUseCase');
export const GET_CHAT_BY_ID_USE_CASE_TOKEN = new InjectionToken<GetChatByIdUseCase>('GetChatByIdUseCase');
export const START_CHAT_USE_CASE_TOKEN = new InjectionToken<StartChatUseCase>('StartChatUseCase');

// Token para el repositorio
export const CHAT_REPOSITORY_TOKEN = new InjectionToken<ChatRepositoryPort>('ChatRepositoryPort');

// Proveedores de configuración para chat
export const CHAT_PROVIDERS: Provider[] = [
  // Repositorio
  {
    provide: CHAT_REPOSITORY_TOKEN,
    useClass: HttpChatRepository
  },
  
  // Casos de uso
  {
    provide: GET_CHATS_USE_CASE_TOKEN,
    useFactory: (chatRepository: ChatRepositoryPort) => new GetChatsUseCase(chatRepository),
    deps: [CHAT_REPOSITORY_TOKEN]
  },
  {
    provide: GET_MESSAGES_USE_CASE_TOKEN,
    useFactory: (chatRepository: ChatRepositoryPort) => new GetMessagesUseCase(chatRepository),
    deps: [CHAT_REPOSITORY_TOKEN]
  },
  {
    provide: GET_CHAT_BY_ID_USE_CASE_TOKEN,
    useFactory: (chatRepository: ChatRepositoryPort) => new GetChatByIdUseCase(chatRepository),
    deps: [CHAT_REPOSITORY_TOKEN]
  },
  {
    provide: START_CHAT_USE_CASE_TOKEN,
    useFactory: (chatRepository: ChatRepositoryPort) => new StartChatUseCase(chatRepository),
    deps: [CHAT_REPOSITORY_TOKEN]
  }
];