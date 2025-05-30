import {
  Chat,
  ChatListResponse,
  MessageListResponse,
  GetChatsParams,
  GetMessagesParams,
  GetChatByIdParams
} from '../entities/chat.entity';

/**
 * Puerto (interface) que define las operaciones de repositorio de chat.
 * Las implementaciones específicas estarán en la capa de infraestructura de cada aplicación.
 */
export interface ChatRepositoryPort {
  /**
   * Obtiene la lista de chats del usuario autenticado
   * Requiere rol 'commercial'
   */
  getChats(params: GetChatsParams): Promise<ChatListResponse>;

  /**
   * Obtiene los mensajes paginados de un chat específico
   * Requiere rol 'visitor' o 'commercial'
   */
  getMessages(params: GetMessagesParams): Promise<MessageListResponse>;

  /**
   * Obtiene la información de un chat específico por ID
   * Requiere rol 'visitor' o 'commercial'
   */
  getChatById(params: GetChatByIdParams): Promise<Chat>;

  /**
   * Inicia un chat (para visitantes)
   * Requiere rol 'visitor'
   */
  startChat(chatId: string): Promise<Chat>;
}