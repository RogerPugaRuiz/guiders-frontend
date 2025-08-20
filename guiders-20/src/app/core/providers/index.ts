// Exportar todos los providers desde un punto central
import { chatAdapterProviders, CHAT_REPOSITORY_TOKEN } from "./chat-adapter-providers";

// Importar providers específicos para crear un array combinado
import { 
  chatUseCaseProviders,
  chatV2UseCaseProviders,
  allChatUseCaseProviders,
  GET_CHATS_USE_CASE_TOKEN,
  GET_MESSAGES_USE_CASE_TOKEN,
  GET_CHAT_BY_ID_USE_CASE_TOKEN,
  START_CHAT_USE_CASE_TOKEN,
  GET_CHATS_V2_USE_CASE_TOKEN,
  GET_CHAT_BY_ID_V2_USE_CASE_TOKEN,
  GET_COMMERCIAL_CHATS_V2_USE_CASE_TOKEN,
  GET_VISITOR_CHATS_V2_USE_CASE_TOKEN,
  GET_PENDING_QUEUE_V2_USE_CASE_TOKEN,
  GET_COMMERCIAL_METRICS_V2_USE_CASE_TOKEN,
  GET_RESPONSE_TIME_STATS_V2_USE_CASE_TOKEN,
  ASSIGN_CHAT_V2_USE_CASE_TOKEN,
  CLOSE_CHAT_V2_USE_CASE_TOKEN
} from './chat-use-case.providers';

// Exportar tokens para inyección V1 (legacy)
export {
  GET_CHATS_USE_CASE_TOKEN,
  GET_MESSAGES_USE_CASE_TOKEN,
  GET_CHAT_BY_ID_USE_CASE_TOKEN,
  START_CHAT_USE_CASE_TOKEN,
  CHAT_REPOSITORY_TOKEN
};

// Exportar tokens para inyección V2 (optimizada)
export {
  GET_CHATS_V2_USE_CASE_TOKEN,
  GET_CHAT_BY_ID_V2_USE_CASE_TOKEN,
  GET_COMMERCIAL_CHATS_V2_USE_CASE_TOKEN,
  GET_VISITOR_CHATS_V2_USE_CASE_TOKEN,
  GET_PENDING_QUEUE_V2_USE_CASE_TOKEN,
  GET_COMMERCIAL_METRICS_V2_USE_CASE_TOKEN,
  GET_RESPONSE_TIME_STATS_V2_USE_CASE_TOKEN,
  ASSIGN_CHAT_V2_USE_CASE_TOKEN,
  CLOSE_CHAT_V2_USE_CASE_TOKEN
};

/**
 * Todos los providers de casos de uso combinados
 * Incluye tanto V1 (legacy) como V2 (optimizada)
 * Útil para importar todos los providers de una vez en la configuración de la app
 */
export const allUseCaseProviders = [
  ...allChatUseCaseProviders,
  // Aquí se pueden agregar más providers de otros dominios
  // ...authUseCaseProviders,
  // ...userUseCaseProviders,
];

/**
 * Todos los providers de adaptadores combinados
 * Útil para importar todos los adaptadores de una vez en la configuración de la app
 */
export const allAdapterProviders = [
  ...chatAdapterProviders,
  // Aquí se pueden agregar más providers de otros dominios
  // ...authAdapterProviders,
  // ...userAdapterProviders,
];
