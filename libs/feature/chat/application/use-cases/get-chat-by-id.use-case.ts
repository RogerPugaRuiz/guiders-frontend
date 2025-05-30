import { Chat, GetChatByIdParams } from '../../domain/entities/chat.entity';
import { ChatRepositoryPort } from '../../domain/ports/chat-repository.port';
import { ValidationError } from '../../domain/entities/chat-error.entity';

/**
 * Caso de uso para obtener información de un chat específico por ID
 * Disponible para usuarios con rol 'visitor' o 'commercial'
 */
export class GetChatByIdUseCase {
  constructor(private chatRepository: ChatRepositoryPort) {}

  async execute(params: GetChatByIdParams): Promise<Chat> {
    // Validaciones de dominio
    if (!params.chatId) {
      throw new ValidationError('chatId', 'ID del chat es requerido');
    }

    if (!this.isValidUUID(params.chatId)) {
      throw new ValidationError('chatId', 'Formato de ID del chat inválido');
    }

    // Delegar al repositorio la implementación específica
    return await this.chatRepository.getChatById(params);
  }

  private isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }
}