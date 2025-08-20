import { InjectionToken, Provider } from '@angular/core';
import { 
  ChatRepositoryPort,
  GetChatsUseCase,
  GetMessagesUseCase,
  GetChatByIdUseCase,
  StartChatUseCase,
  GetChatsV2UseCase,
  GetChatByIdV2UseCase,
  GetCommercialChatsV2UseCase,
  GetVisitorChatsV2UseCase,
  GetPendingQueueV2UseCase,
  GetCommercialMetricsV2UseCase,
  GetResponseTimeStatsV2UseCase,
  AssignChatV2UseCase,
  CloseChatV2UseCase
} from '../../../../../libs/feature/chat';
import { CHAT_REPOSITORY_TOKEN } from './chat-adapter-providers';

// Tokens de inyección para los casos de uso del chat V1 (legacy)
export const GET_CHATS_USE_CASE_TOKEN = new InjectionToken<GetChatsUseCase>('GetChatsUseCase');
export const GET_MESSAGES_USE_CASE_TOKEN = new InjectionToken<GetMessagesUseCase>('GetMessagesUseCase');
export const GET_CHAT_BY_ID_USE_CASE_TOKEN = new InjectionToken<GetChatByIdUseCase>('GetChatByIdUseCase');
export const START_CHAT_USE_CASE_TOKEN = new InjectionToken<StartChatUseCase>('StartChatUseCase');

// Tokens de inyección para los casos de uso del chat V2 (optimizada)
export const GET_CHATS_V2_USE_CASE_TOKEN = new InjectionToken<GetChatsV2UseCase>('GetChatsV2UseCase');
export const GET_CHAT_BY_ID_V2_USE_CASE_TOKEN = new InjectionToken<GetChatByIdV2UseCase>('GetChatByIdV2UseCase');
export const GET_COMMERCIAL_CHATS_V2_USE_CASE_TOKEN = new InjectionToken<GetCommercialChatsV2UseCase>('GetCommercialChatsV2UseCase');
export const GET_VISITOR_CHATS_V2_USE_CASE_TOKEN = new InjectionToken<GetVisitorChatsV2UseCase>('GetVisitorChatsV2UseCase');
export const GET_PENDING_QUEUE_V2_USE_CASE_TOKEN = new InjectionToken<GetPendingQueueV2UseCase>('GetPendingQueueV2UseCase');
export const GET_COMMERCIAL_METRICS_V2_USE_CASE_TOKEN = new InjectionToken<GetCommercialMetricsV2UseCase>('GetCommercialMetricsV2UseCase');
export const GET_RESPONSE_TIME_STATS_V2_USE_CASE_TOKEN = new InjectionToken<GetResponseTimeStatsV2UseCase>('GetResponseTimeStatsV2UseCase');
export const ASSIGN_CHAT_V2_USE_CASE_TOKEN = new InjectionToken<AssignChatV2UseCase>('AssignChatV2UseCase');
export const CLOSE_CHAT_V2_USE_CASE_TOKEN = new InjectionToken<CloseChatV2UseCase>('CloseChatV2UseCase');

/**
 * Providers para los casos de uso del chat V1 (legacy)
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
 * Providers para los casos de uso del chat V2 (optimizada)
 * Estos providers configuran la inyección de dependencias para los casos de uso V2
 */
export const chatV2UseCaseProviders: Provider[] = [
  // GetChatsV2UseCase - Obtener lista de chats con API V2
  {
    provide: GET_CHATS_V2_USE_CASE_TOKEN,
    useFactory: (repository: ChatRepositoryPort) => new GetChatsV2UseCase(repository),
    deps: [CHAT_REPOSITORY_TOKEN]
  },
  
  // GetChatByIdV2UseCase - Obtener un chat específico por ID con API V2
  {
    provide: GET_CHAT_BY_ID_V2_USE_CASE_TOKEN,
    useFactory: (repository: ChatRepositoryPort) => new GetChatByIdV2UseCase(repository),
    deps: [CHAT_REPOSITORY_TOKEN]
  },
  
  // GetCommercialChatsV2UseCase - Obtener chats de un comercial con API V2
  {
    provide: GET_COMMERCIAL_CHATS_V2_USE_CASE_TOKEN,
    useFactory: (repository: ChatRepositoryPort) => new GetCommercialChatsV2UseCase(repository),
    deps: [CHAT_REPOSITORY_TOKEN]
  },
  
  // GetVisitorChatsV2UseCase - Obtener chats de un visitante con API V2
  {
    provide: GET_VISITOR_CHATS_V2_USE_CASE_TOKEN,
    useFactory: (repository: ChatRepositoryPort) => new GetVisitorChatsV2UseCase(repository),
    deps: [CHAT_REPOSITORY_TOKEN]
  },
  
  // GetPendingQueueV2UseCase - Obtener cola de chats pendientes con API V2
  {
    provide: GET_PENDING_QUEUE_V2_USE_CASE_TOKEN,
    useFactory: (repository: ChatRepositoryPort) => new GetPendingQueueV2UseCase(repository),
    deps: [CHAT_REPOSITORY_TOKEN]
  },
  
  // GetCommercialMetricsV2UseCase - Obtener métricas de comercial con API V2
  {
    provide: GET_COMMERCIAL_METRICS_V2_USE_CASE_TOKEN,
    useFactory: (repository: ChatRepositoryPort) => new GetCommercialMetricsV2UseCase(repository),
    deps: [CHAT_REPOSITORY_TOKEN]
  },
  
  // GetResponseTimeStatsV2UseCase - Obtener estadísticas de tiempo de respuesta con API V2
  {
    provide: GET_RESPONSE_TIME_STATS_V2_USE_CASE_TOKEN,
    useFactory: (repository: ChatRepositoryPort) => new GetResponseTimeStatsV2UseCase(repository),
    deps: [CHAT_REPOSITORY_TOKEN]
  },
  
  // AssignChatV2UseCase - Asignar chat a comercial con API V2
  {
    provide: ASSIGN_CHAT_V2_USE_CASE_TOKEN,
    useFactory: (repository: ChatRepositoryPort) => new AssignChatV2UseCase(repository),
    deps: [CHAT_REPOSITORY_TOKEN]
  },
  
  // CloseChatV2UseCase - Cerrar chat con API V2
  {
    provide: CLOSE_CHAT_V2_USE_CASE_TOKEN,
    useFactory: (repository: ChatRepositoryPort) => new CloseChatV2UseCase(repository),
    deps: [CHAT_REPOSITORY_TOKEN]
  }
];

/**
 * Todos los providers de casos de uso combinados (V1 + V2)
 */
export const allChatUseCaseProviders: Provider[] = [
  ...chatUseCaseProviders,
  ...chatV2UseCaseProviders
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
