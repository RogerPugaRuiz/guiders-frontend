import { ChatListResponse, GetChatsParams } from '../../domain/entities/chat.entity';
import { ChatRepositoryPort } from '../../domain/ports/chat-repository.port';
import { ValidationError } from '../../domain/entities/chat-error.entity';

/**
 * Caso de uso para obtener la lista de chats del usuario autenticado
 * Solo disponible para usuarios con rol 'commercial'
 */
export class GetChatsUseCase {
  constructor(private chatRepository: ChatRepositoryPort) {}

  async execute(params: GetChatsParams = {}): Promise<ChatListResponse> {
    // Validaciones de dominio
    if (params.limit !== undefined) {
      if (params.limit < 1 || params.limit > 100) {
        throw new ValidationError('limit', 'Debe estar entre 1 y 100');
      }
    }

    if (params.include && params.include.length > 0) {
      const validIncludes = ['participants', 'lastMessage', 'metadata'];
      const invalidIncludes = params.include.filter(field => validIncludes.indexOf(field) === -1);
      if (invalidIncludes.length > 0) {
        throw new ValidationError('include', `Campos inválidos: ${invalidIncludes.join(', ')}`);
      }
    }

    // Establecer valores por defecto
    const normalizedParams: GetChatsParams = {
      limit: params.limit || 50,
      cursor: params.cursor,
      include: params.include || []
    };

    // Delegar al repositorio la implementación específica
    const result =  await this.chatRepository.getChats(normalizedParams);
    if (!result) {
      throw new Error('No se pudieron obtener los chats');
    }

    return result;
  }
}