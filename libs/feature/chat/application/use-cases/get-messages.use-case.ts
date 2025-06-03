import { MessageListResponse, GetMessagesParams } from '../../domain/entities/chat.entity';
import { ChatRepositoryPort } from '../../domain/ports/chat-repository.port';
import { ValidationError } from '../../domain/entities/chat-error.entity';

/**
 * Caso de uso para obtener mensajes paginados de un chat específico
 * Disponible para usuarios con rol 'visitor' o 'commercial'
 */
export class GetMessagesUseCase {
  constructor(private chatRepository: ChatRepositoryPort) {}

  async execute(params: GetMessagesParams): Promise<MessageListResponse> {
    // Validaciones de dominio
    if (!params.chatId) {
      throw new ValidationError('chatId', 'ID del chat es requerido');
    }

    if (!this.isValidUUID(params.chatId)) {
      throw new ValidationError('chatId', 'Formato de ID del chat inválido');
    }

    if (params.limit !== undefined) {
      if (params.limit < 1 || params.limit > 100) {
        throw new ValidationError('limit', 'Debe estar entre 1 y 100');
      }
    }

    // Establecer valores por defecto
    const normalizedParams: GetMessagesParams = {
      chatId: params.chatId,
      limit: params.limit || 10,
      cursor: params.cursor
    };

    // Delegar al repositorio la implementación específica
    const result =  await this.chatRepository.getMessages(normalizedParams);
    if (!result) {
      throw new Error('No se pudieron obtener los mensajes del chat');
    }
    return result;
  }

  private isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }
}