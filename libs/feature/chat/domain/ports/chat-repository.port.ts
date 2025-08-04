import {
  Chat,
  ChatListResponse,
  MessageListResponse,
  GetChatsParams,
  GetMessagesParams,
  GetChatByIdParams
} from '../entities/chat.entity';

import {
  ChatV2,
  ChatListResponseV2,
  GetChatsV2Params,
  CommercialMetricsV2,
  ResponseTimeStatsV2
} from '../entities/chat-v2.entity';

/**
 * Puerto (interface) que define las operaciones de repositorio de chat.
 * Las implementaciones específicas estarán en la capa de infraestructura de cada aplicación.
 */
export interface ChatRepositoryPort {
  /**
   * Obtiene la lista de chats del usuario autenticado
   * Requiere rol 'commercial'
   */
  getChats(params: GetChatsParams): Promise<ChatListResponse | null>;

  /**
   * Obtiene los mensajes paginados de un chat específico
   * Requiere rol 'visitor' o 'commercial'
   */
  getMessages(params: GetMessagesParams): Promise<MessageListResponse | null>;

  /**
   * Obtiene la información de un chat específico por ID
   * Requiere rol 'visitor' o 'commercial'
   */
  getChatById(params: GetChatByIdParams): Promise<Chat | null>;

  /**
   * Inicia un chat (para visitantes)
   * Requiere rol 'visitor'
   */
  startChat(chatId: string): Promise<Chat | null>;

  // === Métodos API V2 ===

  /**
   * Obtiene la lista de chats usando la API V2 optimizada
   * Con filtros avanzados y paginación cursor
   * Requiere rol 'commercial', 'admin' o 'supervisor'
   */
  getChatsV2(params?: GetChatsV2Params): Promise<ChatListResponseV2 | null>;

  /**
   * Obtiene un chat específico por ID usando la API V2
   * Requiere rol 'commercial', 'admin', 'supervisor' o 'visitor'
   */
  getChatByIdV2(chatId: string): Promise<ChatV2 | null>;

  /**
   * Obtiene chats asignados a un comercial específico usando la API V2
   * Requiere rol 'commercial', 'admin' o 'supervisor'
   */
  getCommercialChatsV2(commercialId: string, params?: GetChatsV2Params): Promise<ChatListResponseV2 | null>;

  /**
   * Obtiene chats de un visitante específico usando la API V2
   * Requiere rol 'commercial', 'admin', 'supervisor' o 'visitor'
   */
  getVisitorChatsV2(visitorId: string, cursor?: string, limit?: number): Promise<ChatListResponseV2 | null>;

  /**
   * Obtiene la cola de chats pendientes usando la API V2
   * Requiere rol 'commercial', 'admin' o 'supervisor'
   */
  getPendingQueueV2(department?: string, limit?: number): Promise<ChatV2[] | null>;

  /**
   * Obtiene métricas de un comercial usando la API V2
   * Requiere rol 'commercial', 'admin' o 'supervisor'
   */
  getCommercialMetricsV2(commercialId: string, dateFrom?: Date, dateTo?: Date): Promise<CommercialMetricsV2 | null>;

  /**
   * Obtiene estadísticas de tiempo de respuesta usando la API V2
   * Requiere rol 'commercial' o 'admin'
   */
  getResponseTimeStatsV2(dateFrom?: Date, dateTo?: Date, groupBy?: 'hour' | 'day' | 'week'): Promise<ResponseTimeStatsV2[] | null>;

  /**
   * Asigna un chat a un comercial usando la API V2
   * Requiere rol 'commercial', 'admin' o 'supervisor'
   */
  assignChatV2(chatId: string, commercialId: string): Promise<ChatV2 | null>;

  /**
   * Cierra un chat usando la API V2
   * Requiere rol 'commercial', 'admin' o 'supervisor'
   */
  closeChatV2(chatId: string): Promise<ChatV2 | null>;
}