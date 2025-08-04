import { ChatRepositoryPort } from '../../domain/ports/chat-repository.port';
import {
  ChatV2,
  ChatListResponseV2,
  GetChatsV2Params,
  CommercialMetricsV2,
  ResponseTimeStatsV2
} from '../../domain/entities/chat-v2.entity';

/**
 * Caso de uso para obtener chats usando la API V2 optimizada
 * Con filtros avanzados y paginación cursor
 */
export class GetChatsV2UseCase {
  constructor(private readonly chatRepository: ChatRepositoryPort) {}

  async execute(params?: GetChatsV2Params): Promise<ChatListResponseV2> {
    const result = await this.chatRepository.getChatsV2(params);
    
    if (!result) {
      throw new Error('No se pudieron obtener los chats');
    }
    
    return result;
  }
}

/**
 * Caso de uso para obtener un chat específico usando la API V2
 */
export class GetChatByIdV2UseCase {
  constructor(private readonly chatRepository: ChatRepositoryPort) {}

  async execute(chatId: string): Promise<ChatV2> {
    const result = await this.chatRepository.getChatByIdV2(chatId);
    
    if (!result) {
      throw new Error('No se pudo encontrar el chat especificado');
    }
    
    return result;
  }
}

/**
 * Caso de uso para obtener chats de un comercial usando la API V2
 */
export class GetCommercialChatsV2UseCase {
  constructor(private readonly chatRepository: ChatRepositoryPort) {}

  async execute(commercialId: string, params?: GetChatsV2Params): Promise<ChatListResponseV2> {
    const result = await this.chatRepository.getCommercialChatsV2(commercialId, params);
    
    if (!result) {
      throw new Error('No se pudieron obtener los chats del comercial');
    }
    
    return result;
  }
}

/**
 * Caso de uso para obtener chats de un visitante usando la API V2
 */
export class GetVisitorChatsV2UseCase {
  constructor(private readonly chatRepository: ChatRepositoryPort) {}

  async execute(visitorId: string, cursor?: string, limit?: number): Promise<ChatListResponseV2> {
    const result = await this.chatRepository.getVisitorChatsV2(visitorId, cursor, limit);
    
    if (!result) {
      throw new Error('No se pudieron obtener los chats del visitante');
    }
    
    return result;
  }
}

/**
 * Caso de uso para obtener la cola de chats pendientes usando la API V2
 */
export class GetPendingQueueV2UseCase {
  constructor(private readonly chatRepository: ChatRepositoryPort) {}

  async execute(department?: string, limit?: number): Promise<ChatV2[]> {
    const result = await this.chatRepository.getPendingQueueV2(department, limit);
    
    if (!result) {
      throw new Error('No se pudo obtener la cola de chats pendientes');
    }
    
    return result;
  }
}

/**
 * Caso de uso para obtener métricas de un comercial usando la API V2
 */
export class GetCommercialMetricsV2UseCase {
  constructor(private readonly chatRepository: ChatRepositoryPort) {}

  async execute(commercialId: string, dateFrom?: Date, dateTo?: Date): Promise<CommercialMetricsV2> {
    const result = await this.chatRepository.getCommercialMetricsV2(commercialId, dateFrom, dateTo);
    
    if (!result) {
      throw new Error('No se pudieron obtener las métricas del comercial');
    }
    
    return result;
  }
}

/**
 * Caso de uso para obtener estadísticas de tiempo de respuesta usando la API V2
 */
export class GetResponseTimeStatsV2UseCase {
  constructor(private readonly chatRepository: ChatRepositoryPort) {}

  async execute(dateFrom?: Date, dateTo?: Date, groupBy?: 'hour' | 'day' | 'week'): Promise<ResponseTimeStatsV2[]> {
    const result = await this.chatRepository.getResponseTimeStatsV2(dateFrom, dateTo, groupBy);
    
    if (!result) {
      throw new Error('No se pudieron obtener las estadísticas de tiempo de respuesta');
    }
    
    return result;
  }
}

/**
 * Caso de uso para asignar un chat a un comercial usando la API V2
 */
export class AssignChatV2UseCase {
  constructor(private readonly chatRepository: ChatRepositoryPort) {}

  async execute(chatId: string, commercialId: string): Promise<ChatV2> {
    const result = await this.chatRepository.assignChatV2(chatId, commercialId);
    
    if (!result) {
      throw new Error('No se pudo asignar el chat al comercial');
    }
    
    return result;
  }
}

/**
 * Caso de uso para cerrar un chat usando la API V2
 */
export class CloseChatV2UseCase {
  constructor(private readonly chatRepository: ChatRepositoryPort) {}

  async execute(chatId: string): Promise<ChatV2> {
    const result = await this.chatRepository.closeChatV2(chatId);
    
    if (!result) {
      throw new Error('No se pudo cerrar el chat');
    }
    
    return result;
  }
}
