import {
  Chat,
  ChatListResponse,
  MessageListResponse,
  GetChatsParams,
  GetMessagesParams,
  GetChatByIdParams
} from '../../domain/entities/chat.entity';
import { ChatRepositoryPort } from '../../domain/ports/chat-repository.port';
import { GetChatsUseCase } from '../../domain/use-cases/get-chats.use-case';
import { GetMessagesUseCase } from '../../domain/use-cases/get-messages.use-case';
import { GetChatByIdUseCase } from '../../domain/use-cases/get-chat-by-id.use-case';
import { StartChatUseCase } from '../../domain/use-cases/start-chat.use-case';

/**
 * Servicio de aplicación para orchestrar las operaciones de chat
 * Utiliza los casos de uso del dominio y coordina las operaciones
 */
export class ChatService {
  private getChatsUseCase: GetChatsUseCase;
  private getMessagesUseCase: GetMessagesUseCase;
  private getChatByIdUseCase: GetChatByIdUseCase;
  private startChatUseCase: StartChatUseCase;

  constructor(private chatRepository: ChatRepositoryPort) {
    this.getChatsUseCase = new GetChatsUseCase(chatRepository);
    this.getMessagesUseCase = new GetMessagesUseCase(chatRepository);
    this.getChatByIdUseCase = new GetChatByIdUseCase(chatRepository);
    this.startChatUseCase = new StartChatUseCase(chatRepository);
  }

  /**
   * Obtiene la lista de chats del usuario autenticado
   */
  async getChats(params?: GetChatsParams): Promise<ChatListResponse> {
    return await this.getChatsUseCase.execute(params);
  }

  /**
   * Obtiene los mensajes paginados de un chat específico
   */
  async getMessages(params: GetMessagesParams): Promise<MessageListResponse> {
    return await this.getMessagesUseCase.execute(params);
  }

  /**
   * Obtiene la información de un chat específico por ID
   */
  async getChatById(params: GetChatByIdParams): Promise<Chat> {
    return await this.getChatByIdUseCase.execute(params);
  }

  /**
   * Inicia un chat (para visitantes)
   */
  async startChat(chatId: string): Promise<Chat> {
    return await this.startChatUseCase.execute(chatId);
  }
}