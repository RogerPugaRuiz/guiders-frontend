import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { 
  ChatRepositoryPort,
  Chat,
  ChatListResponse,
  MessageListResponse,
  GetChatsParams,
  GetMessagesParams,
  GetChatByIdParams,
  ChatNotFoundError,
  ChatAccessDeniedError,
  ValidationError,
  UnauthorizedError,
  NetworkError,
  PaginationEndError
} from '../../../../../libs/feature/chat';

import {
  ChatV2,
  ChatListResponseV2,
  GetChatsV2Params,
  CommercialMetricsV2,
  ResponseTimeStatsV2,
  mapChatListV2ToV1,
  mapGetChatsParamsToV2,
  mapChatV2ToV1
} from '../../../../../libs/feature/chat/domain/entities/chat-v2.entity';

import { environment } from '../../../environments/environment';
import { firstValueFrom, catchError, throwError } from 'rxjs';
import { CacheStore } from '../services/cache.store';

/**
 * Adaptador HTTP que implementa ChatRepositoryPort usando HttpClient
 * para operaciones HTTP con manejo de errores reactivo y CacheStore externo.
 * Incluye soporte para API V1 (legacy) y V2 (optimizada).
 */
@Injectable({
  providedIn: 'root'
})
export class HttpChatAdapter implements ChatRepositoryPort {
  private readonly httpClient = inject(HttpClient);
  private readonly cacheStore = inject(CacheStore);
  private readonly API_BASE_URL = `${environment.apiUrl}/chats`;
  private readonly API_V2_BASE_URL = `${environment.apiUrl}/v2/chats`;

  // === Métodos API V1 (Legacy) ===

  async getChats(params?: GetChatsParams): Promise<ChatListResponse | null> {
    try {
      console.log('🔄 [HttpChatAdapter] Usando API V2 con compatibilidad V1...');
      
      // Convertir parámetros V1 a V2
      const v2Params = mapGetChatsParamsToV2(params);
      
      // Llamar a la API V2
      const v2Response = await this.getChatsV2(v2Params);
      
      if (!v2Response) {
        return null;
      }
      
      // Convertir respuesta V2 a formato V1
      const v1Response = mapChatListV2ToV1(v2Response);
      
      console.log('✅ [HttpChatAdapter] Respuesta V2 convertida a V1:', v1Response);
      return v1Response;

    } catch (error) {
      console.warn('⚠️ [HttpChatAdapter] Error en API V2, fallback a V1:', error);
      
      // Fallback a API V1 legacy
      return this.getChatsLegacy(params);
    }
  }

  /**
   * Método fallback que usa la API V1 original
   */
  private async getChatsLegacy(params?: GetChatsParams): Promise<ChatListResponse | null> {
    try {
      // Usar valores por defecto si no se proporcionan parámetros
      const limit = params?.limit ?? 10;
      const cursor = params?.cursor ?? "";
      const include = params?.include ?? [];

      // Generar clave de caché basada en los parámetros
      const cacheParams = { limit, cursor, include };
      const cacheKey = this.cacheStore.generateKey('getChatsLegacy', cacheParams);
      
      console.log('🔑 Cache key generada para V1:', cacheKey);

      // Usar getOrSet para evitar múltiples peticiones simultáneas
      return await this.cacheStore.getOrSet(cacheKey, async () => {
        console.log('🌐 Realizando petición HTTP V1...');
        
        // Construir parámetros HTTP
        let httpParams = new HttpParams()
          .set('limit', limit.toString())
          .set('cursor', cursor);

        // Agregar parámetros de inclusión si existen
        if (include.length > 0) {
          httpParams = httpParams.set('include', include.join(','));
        }

        // Realizar petición HTTP a la API V1
        const response = await firstValueFrom(
          this.httpClient.get<any>(this.API_BASE_URL, { params: httpParams })
            .pipe(
              catchError(error => throwError(() => this.handleHttpError(error)))
            )
        );

        console.log('📨 Respuesta cruda V1 recibida:', response);
        
        // Transformar la respuesta al formato esperado
        let transformedResponse: ChatListResponse;
        
        if (response.chats && Array.isArray(response.chats)) {
          // Formato de API real con chats, total, hasMore, nextCursor
          transformedResponse = {
            data: response.chats,
            pagination: {
              hasMore: response.hasMore ?? false,
              limit: limit,
              total: response.total,
              nextCursor: response.nextCursor
            }
          };
        } else if (response.data && Array.isArray(response.data)) {
          // Formato estándar con data y pagination
          transformedResponse = response;
        } else if (response.chats && Array.isArray(response.chats)) {
          // Formato con chats directamente
          transformedResponse = {
            data: response.chats,
            pagination: {
              hasMore: response.hasMore ?? false,
              limit: limit,
              total: response.total,
              nextCursor: response.nextCursor
            }
          };
        } else {
          // Fallback: respuesta vacía
          transformedResponse = {
            data: [],
            pagination: {
              hasMore: false,
              limit: limit,
              total: 0
            }
          };
        }
        
        console.log('🔄 Respuesta V1 transformada:', transformedResponse);
        console.log('✅ Petición HTTP V1 completada');
        return transformedResponse;
      });
    } catch (error) {
      // Re-lanzar errores de dominio o crear error de red genérico
      if (error instanceof ValidationError || 
          error instanceof UnauthorizedError ||
          error instanceof ChatAccessDeniedError ||
          error instanceof ChatNotFoundError ||
          error instanceof PaginationEndError ||
          error instanceof NetworkError) {
        throw error;
      }
      
      throw new NetworkError('Ocurrió un error inesperado al obtener los chats.');
    }
  }

  async getMessages(params: GetMessagesParams): Promise<MessageListResponse | null> {
    try {
      // Generar clave de caché basada en los parámetros
      const cacheKey = this.cacheStore.generateKey('getMessages', params);

      // Usar getOrSet para evitar múltiples peticiones simultáneas
      return await this.cacheStore.getOrSet(cacheKey, async () => {
        console.log('🌐 Realizando petición HTTP para obtener mensajes...');
        
        // Construir parámetros HTTP
        let httpParams = new HttpParams();
        
        if (params.limit) {
          httpParams = httpParams.set('limit', params.limit.toString());
        }
        if (params.cursor) {
          httpParams = httpParams.set('cursor', params.cursor);
        }

        // Realizar petición HTTP usando el chatId en la URL
        const response = await firstValueFrom(
          this.httpClient.get<MessageListResponse>(`${this.API_BASE_URL}/${params.chatId}/messages`, { params: httpParams })
            .pipe(
              catchError(error => throwError(() => this.handleHttpError(error)))
            )
        );

        console.log('📨 Respuesta de mensajes recibida:', response);
        console.log('✅ Petición HTTP de mensajes completada');
        
        return response;
      });
    } catch (error) {
      // Re-lanzar errores de dominio o crear error de red genérico
      if (error instanceof ValidationError || 
          error instanceof UnauthorizedError ||
          error instanceof ChatAccessDeniedError ||
          error instanceof ChatNotFoundError ||
          error instanceof PaginationEndError ||
          error instanceof NetworkError) {
        throw error;
      }
      
      throw new NetworkError('Ocurrió un error inesperado al obtener los mensajes.');
    }
  }

  async getChatById(params: GetChatByIdParams): Promise<Chat | null> {
    try {
      // Generar clave de caché basada en los parámetros
      const cacheKey = this.cacheStore.generateKey('getChatById', params);

      // Usar getOrSet para evitar múltiples peticiones simultáneas
      return await this.cacheStore.getOrSet(cacheKey, async () => {
        console.log('🌐 Realizando petición HTTP para obtener chat por ID...');
        
        // Realizar petición HTTP
        const response = await firstValueFrom(
          this.httpClient.get<Chat>(`${this.API_BASE_URL}/${params.chatId}`)
            .pipe(
              catchError(error => throwError(() => this.handleHttpError(error)))
            )
        );

        console.log('📨 Respuesta de chat por ID recibida:', response);
        console.log('✅ Petición HTTP de chat por ID completada');
        
        return response;
      });
    } catch (error) {
      // Re-lanzar errores de dominio o crear error de red genérico
      if (error instanceof ValidationError || 
          error instanceof UnauthorizedError ||
          error instanceof ChatAccessDeniedError ||
          error instanceof ChatNotFoundError ||
          error instanceof PaginationEndError ||
          error instanceof NetworkError) {
        throw error;
      }
      
      throw new NetworkError('Ocurrió un error inesperado al obtener el chat.');
    }
  }

  async startChat(chatId: string): Promise<Chat | null> {
    try {
      // Para operaciones POST normalmente no usamos caché, pero invalidamos caché relacionada
      // Limpiar caché relacionada con este chat específico
      this.cacheStore.invalidatePattern(chatId);
      this.cacheStore.invalidatePattern('getChats');
      
      console.log('🌐 Realizando petición HTTP para iniciar chat...');
      
      // Realizar petición HTTP POST
      const response = await firstValueFrom(
        this.httpClient.post<Chat>(`${this.API_BASE_URL}/${chatId}/start`, {})
          .pipe(
            catchError(error => throwError(() => this.handleHttpError(error)))
          )
      );

      console.log('📨 Respuesta de iniciar chat recibida:', response);
      console.log('✅ Petición HTTP de iniciar chat completada');
      
      return response;
    } catch (error) {
      // Re-lanzar errores de dominio o crear error de red genérico
      if (error instanceof ValidationError || 
          error instanceof UnauthorizedError ||
          error instanceof ChatAccessDeniedError ||
          error instanceof ChatNotFoundError ||
          error instanceof PaginationEndError ||
          error instanceof NetworkError) {
        throw error;
      }
      
      throw new NetworkError('Ocurrió un error inesperado al iniciar el chat.');
    }
  }

  /**
   * Obtiene estadísticas de la caché
   */
  public getCacheStats() {
    return this.cacheStore.getStats();
  }

  /**
   * Limpia toda la caché manualmente
   */
  public clearCache(): void {
    this.cacheStore.clear();
  }

  // === Métodos API V2 (Optimizada) ===

  async getChatsV2(params?: GetChatsV2Params): Promise<ChatListResponseV2 | null> {
    try {
      const cacheKey = this.cacheStore.generateKey('getChatsV2', params);
      
      return await this.cacheStore.getOrSet(cacheKey, async () => {
        console.log('🌐 Realizando petición HTTP V2 para obtener chats...');
        
        let httpParams = new HttpParams();
        
        if (params?.cursor) {
          httpParams = httpParams.set('cursor', params.cursor);
        }
        if (params?.limit) {
          httpParams = httpParams.set('limit', params.limit.toString());
        }
        if (params?.filters) {
          httpParams = httpParams.set('filters', JSON.stringify(params.filters));
        }
        if (params?.sort) {
          httpParams = httpParams.set('sort', JSON.stringify(params.sort));
        }

        const response = await firstValueFrom(
          this.httpClient.get<ChatListResponseV2>(this.API_V2_BASE_URL, { params: httpParams })
            .pipe(
              catchError(error => throwError(() => this.handleHttpError(error)))
            )
        );

        console.log('📨 Respuesta V2 chats recibida:', response);
        console.log('✅ Petición HTTP V2 chats completada');
        
        return response;
      });
    } catch (error) {
      if (error instanceof ValidationError || 
          error instanceof UnauthorizedError ||
          error instanceof ChatAccessDeniedError ||
          error instanceof ChatNotFoundError ||
          error instanceof PaginationEndError ||
          error instanceof NetworkError) {
        throw error;
      }
      
      throw new NetworkError('Ocurrió un error inesperado al obtener los chats V2.');
    }
  }

  async getChatByIdV2(chatId: string): Promise<ChatV2 | null> {
    try {
      const cacheKey = this.cacheStore.generateKey('getChatByIdV2', { chatId });

      return await this.cacheStore.getOrSet(cacheKey, async () => {
        console.log('🌐 Realizando petición HTTP V2 para obtener chat por ID...');
        
        const response = await firstValueFrom(
          this.httpClient.get<ChatV2>(`${this.API_V2_BASE_URL}/${chatId}`)
            .pipe(
              catchError(error => throwError(() => this.handleHttpError(error)))
            )
        );

        console.log('📨 Respuesta V2 chat por ID recibida:', response);
        console.log('✅ Petición HTTP V2 chat por ID completada');
        
        return response;
      });
    } catch (error) {
      if (error instanceof ValidationError || 
          error instanceof UnauthorizedError ||
          error instanceof ChatAccessDeniedError ||
          error instanceof ChatNotFoundError ||
          error instanceof PaginationEndError ||
          error instanceof NetworkError) {
        throw error;
      }
      
      throw new NetworkError('Ocurrió un error inesperado al obtener el chat V2.');
    }
  }

  async getCommercialChatsV2(commercialId: string, params?: GetChatsV2Params): Promise<ChatListResponseV2 | null> {
    try {
      const cacheKey = this.cacheStore.generateKey('getCommercialChatsV2', { commercialId, ...params });

      return await this.cacheStore.getOrSet(cacheKey, async () => {
        console.log('🌐 Realizando petición HTTP V2 para obtener chats de comercial...');
        
        let httpParams = new HttpParams();
        
        if (params?.cursor) {
          httpParams = httpParams.set('cursor', params.cursor);
        }
        if (params?.limit) {
          httpParams = httpParams.set('limit', params.limit.toString());
        }
        if (params?.filters) {
          httpParams = httpParams.set('filters', JSON.stringify(params.filters));
        }
        if (params?.sort) {
          httpParams = httpParams.set('sort', JSON.stringify(params.sort));
        }

        const response = await firstValueFrom(
          this.httpClient.get<ChatListResponseV2>(`${this.API_V2_BASE_URL}/commercial/${commercialId}`, { params: httpParams })
            .pipe(
              catchError(error => throwError(() => this.handleHttpError(error)))
            )
        );

        console.log('📨 Respuesta V2 chats de comercial recibida:', response);
        console.log('✅ Petición HTTP V2 chats de comercial completada');
        
        return response;
      });
    } catch (error) {
      if (error instanceof ValidationError || 
          error instanceof UnauthorizedError ||
          error instanceof ChatAccessDeniedError ||
          error instanceof ChatNotFoundError ||
          error instanceof PaginationEndError ||
          error instanceof NetworkError) {
        throw error;
      }
      
      throw new NetworkError('Ocurrió un error inesperado al obtener los chats del comercial V2.');
    }
  }

  async getVisitorChatsV2(visitorId: string, cursor?: string, limit?: number): Promise<ChatListResponseV2 | null> {
    try {
      const cacheKey = this.cacheStore.generateKey('getVisitorChatsV2', { visitorId, cursor, limit });

      return await this.cacheStore.getOrSet(cacheKey, async () => {
        console.log('🌐 Realizando petición HTTP V2 para obtener chats de visitante...');
        
        let httpParams = new HttpParams();
        
        if (cursor) {
          httpParams = httpParams.set('cursor', cursor);
        }
        if (limit) {
          httpParams = httpParams.set('limit', limit.toString());
        }

        const response = await firstValueFrom(
          this.httpClient.get<ChatListResponseV2>(`${this.API_V2_BASE_URL}/visitor/${visitorId}`, { params: httpParams })
            .pipe(
              catchError(error => throwError(() => this.handleHttpError(error)))
            )
        );

        console.log('📨 Respuesta V2 chats de visitante recibida:', response);
        console.log('✅ Petición HTTP V2 chats de visitante completada');
        
        return response;
      });
    } catch (error) {
      if (error instanceof ValidationError || 
          error instanceof UnauthorizedError ||
          error instanceof ChatAccessDeniedError ||
          error instanceof ChatNotFoundError ||
          error instanceof PaginationEndError ||
          error instanceof NetworkError) {
        throw error;
      }
      
      throw new NetworkError('Ocurrió un error inesperado al obtener los chats del visitante V2.');
    }
  }

  async getPendingQueueV2(department?: string, limit?: number): Promise<ChatV2[] | null> {
    try {
      const cacheKey = this.cacheStore.generateKey('getPendingQueueV2', { department, limit });

      return await this.cacheStore.getOrSet(cacheKey, async () => {
        console.log('🌐 Realizando petición HTTP V2 para obtener cola pendiente...');
        
        let httpParams = new HttpParams();
        
        if (department) {
          httpParams = httpParams.set('department', department);
        }
        if (limit) {
          httpParams = httpParams.set('limit', limit.toString());
        }

        const response = await firstValueFrom(
          this.httpClient.get<ChatV2[]>(`${this.API_V2_BASE_URL}/queue/pending`, { params: httpParams })
            .pipe(
              catchError(error => throwError(() => this.handleHttpError(error)))
            )
        );

        console.log('📨 Respuesta V2 cola pendiente recibida:', response);
        console.log('✅ Petición HTTP V2 cola pendiente completada');
        
        return response;
      });
    } catch (error) {
      if (error instanceof ValidationError || 
          error instanceof UnauthorizedError ||
          error instanceof ChatAccessDeniedError ||
          error instanceof ChatNotFoundError ||
          error instanceof PaginationEndError ||
          error instanceof NetworkError) {
        throw error;
      }
      
      throw new NetworkError('Ocurrió un error inesperado al obtener la cola pendiente V2.');
    }
  }

  async getCommercialMetricsV2(commercialId: string, dateFrom?: Date, dateTo?: Date): Promise<CommercialMetricsV2 | null> {
    try {
      const cacheKey = this.cacheStore.generateKey('getCommercialMetricsV2', { commercialId, dateFrom, dateTo });

      return await this.cacheStore.getOrSet(cacheKey, async () => {
        console.log('🌐 Realizando petición HTTP V2 para obtener métricas de comercial...');
        
        let httpParams = new HttpParams();
        
        if (dateFrom) {
          httpParams = httpParams.set('dateFrom', dateFrom.toISOString());
        }
        if (dateTo) {
          httpParams = httpParams.set('dateTo', dateTo.toISOString());
        }

        const response = await firstValueFrom(
          this.httpClient.get<CommercialMetricsV2>(`${this.API_V2_BASE_URL}/metrics/commercial/${commercialId}`, { params: httpParams })
            .pipe(
              catchError(error => throwError(() => this.handleHttpError(error)))
            )
        );

        console.log('📨 Respuesta V2 métricas de comercial recibida:', response);
        console.log('✅ Petición HTTP V2 métricas de comercial completada');
        
        return response;
      });
    } catch (error) {
      if (error instanceof ValidationError || 
          error instanceof UnauthorizedError ||
          error instanceof ChatAccessDeniedError ||
          error instanceof ChatNotFoundError ||
          error instanceof PaginationEndError ||
          error instanceof NetworkError) {
        throw error;
      }
      
      throw new NetworkError('Ocurrió un error inesperado al obtener las métricas del comercial V2.');
    }
  }

  async getResponseTimeStatsV2(dateFrom?: Date, dateTo?: Date, groupBy?: 'hour' | 'day' | 'week'): Promise<ResponseTimeStatsV2[] | null> {
    try {
      const cacheKey = this.cacheStore.generateKey('getResponseTimeStatsV2', { dateFrom, dateTo, groupBy });

      return await this.cacheStore.getOrSet(cacheKey, async () => {
        console.log('🌐 Realizando petición HTTP V2 para obtener estadísticas de tiempo de respuesta...');
        
        let httpParams = new HttpParams();
        
        if (dateFrom) {
          httpParams = httpParams.set('dateFrom', dateFrom.toISOString());
        }
        if (dateTo) {
          httpParams = httpParams.set('dateTo', dateTo.toISOString());
        }
        if (groupBy) {
          httpParams = httpParams.set('groupBy', groupBy);
        }

        const response = await firstValueFrom(
          this.httpClient.get<ResponseTimeStatsV2[]>(`${this.API_V2_BASE_URL}/response-time-stats`, { params: httpParams })
            .pipe(
              catchError(error => throwError(() => this.handleHttpError(error)))
            )
        );

        console.log('📨 Respuesta V2 estadísticas de tiempo de respuesta recibida:', response);
        console.log('✅ Petición HTTP V2 estadísticas de tiempo de respuesta completada');
        
        return response;
      });
    } catch (error) {
      if (error instanceof ValidationError || 
          error instanceof UnauthorizedError ||
          error instanceof ChatAccessDeniedError ||
          error instanceof ChatNotFoundError ||
          error instanceof PaginationEndError ||
          error instanceof NetworkError) {
        throw error;
      }
      
      throw new NetworkError('Ocurrió un error inesperado al obtener las estadísticas de tiempo de respuesta V2.');
    }
  }

  async assignChatV2(chatId: string, commercialId: string): Promise<ChatV2 | null> {
    try {
      // Para operaciones PUT normalmente no usamos caché, pero invalidamos caché relacionada
      this.cacheStore.invalidatePattern(chatId);
      this.cacheStore.invalidatePattern('getChatsV2');
      this.cacheStore.invalidatePattern('getCommercialChatsV2');
      
      console.log('🌐 Realizando petición HTTP V2 para asignar chat...');
      
      const response = await firstValueFrom(
        this.httpClient.put<ChatV2>(`${this.API_V2_BASE_URL}/${chatId}/assign/${commercialId}`, {})
          .pipe(
            catchError(error => throwError(() => this.handleHttpError(error)))
          )
      );

      console.log('📨 Respuesta V2 asignar chat recibida:', response);
      console.log('✅ Petición HTTP V2 asignar chat completada');
      
      return response;
    } catch (error) {
      if (error instanceof ValidationError || 
          error instanceof UnauthorizedError ||
          error instanceof ChatAccessDeniedError ||
          error instanceof ChatNotFoundError ||
          error instanceof PaginationEndError ||
          error instanceof NetworkError) {
        throw error;
      }
      
      throw new NetworkError('Ocurrió un error inesperado al asignar el chat V2.');
    }
  }

  async closeChatV2(chatId: string): Promise<ChatV2 | null> {
    try {
      // Para operaciones PUT normalmente no usamos caché, pero invalidamos caché relacionada
      this.cacheStore.invalidatePattern(chatId);
      this.cacheStore.invalidatePattern('getChatsV2');
      this.cacheStore.invalidatePattern('getCommercialChatsV2');
      
      console.log('🌐 Realizando petición HTTP V2 para cerrar chat...');
      
      const response = await firstValueFrom(
        this.httpClient.put<ChatV2>(`${this.API_V2_BASE_URL}/${chatId}/close`, {})
          .pipe(
            catchError(error => throwError(() => this.handleHttpError(error)))
          )
      );

      console.log('📨 Respuesta V2 cerrar chat recibida:', response);
      console.log('✅ Petición HTTP V2 cerrar chat completada');
      
      return response;
    } catch (error) {
      if (error instanceof ValidationError || 
          error instanceof UnauthorizedError ||
          error instanceof ChatAccessDeniedError ||
          error instanceof ChatNotFoundError ||
          error instanceof PaginationEndError ||
          error instanceof NetworkError) {
        throw error;
      }
      
      throw new NetworkError('Ocurrió un error inesperado al cerrar el chat V2.');
    }
  }

  /**
   * Maneja errores HTTP y los convierte a errores de dominio específicos
   */
  private handleHttpError(error: any): Error {
    const status = error.status || (error.response?.status);
    
    if (status) {
      switch (status) {
        case 400:
          return new ValidationError('request', 'Los datos proporcionados no son válidos. Por favor, revísalos e inténtalo de nuevo.');
        case 401:
          return new UnauthorizedError('No tienes autorización para acceder a esta funcionalidad. Por favor, inicia sesión.');
        case 403:
          return new ChatAccessDeniedError('No tienes permisos para acceder a este chat.');
        case 404:
          return new ChatNotFoundError('El chat que buscas no existe o no está disponible.');
        case 204:
          return new PaginationEndError('No hay más mensajes para mostrar.');
        case 0:
          return new NetworkError('No pudimos conectarnos con el servidor. Verifica tu conexión a internet.');
        case 500:
          return new NetworkError('Ocurrió un error interno del servidor. Inténtalo más tarde.');
        case 503:
          return new NetworkError('El servicio está temporalmente no disponible. Estamos realizando mantenimiento.');
        default:
          return new NetworkError('Ups, algo no salió como esperábamos. Inténtalo de nuevo en unos momentos.');
      }
    }

    return new NetworkError('Ocurrió un error inesperado. Si el problema persiste, contacta con nosotros.');
  }
}
