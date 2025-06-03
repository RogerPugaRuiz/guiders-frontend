// Exportar todos los providers desde un punto central
import { chatAdapterProviders, CHAT_REPOSITORY_TOKEN } from "./chat-adapter-providers";

// Importar providers específicos para crear un array combinado
import { 
  chatUseCaseProviders,
  GET_CHATS_USE_CASE_TOKEN,
  GET_MESSAGES_USE_CASE_TOKEN,
  GET_CHAT_BY_ID_USE_CASE_TOKEN,
  START_CHAT_USE_CASE_TOKEN
} from './chat-use-case.providers';

// Exportar tokens para inyección
export {
  GET_CHATS_USE_CASE_TOKEN,
  GET_MESSAGES_USE_CASE_TOKEN,
  GET_CHAT_BY_ID_USE_CASE_TOKEN,
  START_CHAT_USE_CASE_TOKEN,
  CHAT_REPOSITORY_TOKEN
};

/**
 * Todos los providers de casos de uso combinados
 * Útil para importar todos los providers de una vez en la configuración de la app
 */
export const allUseCaseProviders = [
  ...chatUseCaseProviders,
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
