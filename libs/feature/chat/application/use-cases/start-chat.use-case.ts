import { Chat } from '../../domain/entities/chat.entity';
import { ChatRepositoryPort } from '../../domain/ports/chat-repository.port';
import { ValidationError } from '../../domain/entities/chat-error.entity';

/**
 * Caso de uso para iniciar un chat (para visitantes)
 * Disponible para usuarios con rol 'visitor'
 */
export class StartChatUseCase {
  constructor(private chatRepository: ChatRepositoryPort) {}

  async execute(chatId: string): Promise<Chat> {
    // Validaciones de dominio
    if (!chatId) {
      throw new ValidationError('chatId', 'ID del chat es requerido');
    }

    if (!this.isValidUUID(chatId)) {
      throw new ValidationError('chatId', 'Formato de ID del chat inválido');
    }

    // Delegar al repositorio la implementación específica
    const result =  await this.chatRepository.startChat(chatId);
    if (!result) {
      throw new Error('No se pudo iniciar el chat');
    }

    return result;
  }

  private isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }
}