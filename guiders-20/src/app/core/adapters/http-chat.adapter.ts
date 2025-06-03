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
import { environment } from '../../../environments/environment';
import { firstValueFrom, catchError, throwError } from 'rxjs';
import { CacheStore } from '../services/cache.store';

/**
 * Adaptador HTTP que implementa ChatRepositoryPort usando HttpClient
 * para operaciones HTTP con manejo de errores reactivo y CacheStore externo
 */
@Injectable({
  providedIn: 'root'
})
export class HttpChatAdapter implements ChatRepositoryPort {
  private readonly httpClient = inject(HttpClient);
  private readonly cacheStore = inject(CacheStore);
  private readonly API_BASE_URL = `${environment.apiUrl}/chats`;

  async getChats(params?: GetChatsParams): Promise<ChatListResponse | null> {
    try {
      // Usar valores por defecto si no se proporcionan parámetros
      const limit = params?.limit ?? 10;
      const cursor = params?.cursor ?? "";
      const include = params?.include ?? [];

      // Generar clave de caché basada en los parámetros
      const cacheParams = { limit, cursor, include };
      const cacheKey = this.cacheStore.generateKey('getChats', cacheParams);
      
      console.log('🔑 Cache key generada:', cacheKey);

      // Usar getOrSet para evitar múltiples peticiones simultáneas
      return await this.cacheStore.getOrSet(cacheKey, async () => {
        console.log('🌐 Realizando petición HTTP...');
        
        // Construir parámetros HTTP
        let httpParams = new HttpParams()
          .set('limit', limit.toString())
          .set('cursor', cursor);

        // Agregar parámetros de inclusión si existen
        if (include.length > 0) {
          httpParams = httpParams.set('include', include.join(','));
        }

        // Realizar petición HTTP
        const response = await firstValueFrom(
          this.httpClient.get<any>(this.API_BASE_URL, { params: httpParams })
            .pipe(
              catchError(error => throwError(() => this.handleHttpError(error)))
            )
        );

        console.log('📨 Respuesta cruda recibida:', response);
        
        // Transformar la respuesta al formato esperado
        let transformedResponse: ChatListResponse;
        
        if (response.data && Array.isArray(response.data)) {
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
        
        console.log('🔄 Respuesta transformada:', transformedResponse);

        console.log('✅ Petición HTTP completada');
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

      // Verificar si existe en caché
      const cachedResult = this.cacheStore.get<MessageListResponse>(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }

      return null;

      // Construir parámetros HTTP
      // let httpParams = new HttpParams();
      
      // if (params.chatId) {
      //   httpParams = httpParams.set('chatId', params.chatId);
      // }
      // if (params.limit) {
      //   httpParams = httpParams.set('limit', params.limit.toString());
      // }
      // if (params.cursor) {
      //   httpParams = httpParams.set('cursor', params.cursor);
      // }

      // // Realizar petición HTTP
      // const response = await firstValueFrom(
      //   this.httpClient.get<MessageListResponse>(`${this.API_BASE_URL}/messages`, { params: httpParams })
      //     .pipe(
      //       catchError(error => throwError(() => this.handleHttpError(error)))
      //     )
      // );

      // // Almacenar en caché antes de retornar
      // this.cacheStore.set(cacheKey, response);

      // return response;
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

      // Verificar si existe en caché
      const cachedResult = this.cacheStore.get<Chat>(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }

      return null;

      // Realizar petición HTTP
      // const response = await firstValueFrom(
      //   this.httpClient.get<Chat>(`${this.API_BASE_URL}/${params.chatId}`)
      //     .pipe(
      //       catchError(error => throwError(() => this.handleHttpError(error)))
      //     )
      // );

      // // Almacenar en caché antes de retornar
      // this.cacheStore.set(cacheKey, response);

      // return response;
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
      return null;
      // Realizar petición HTTP POST
      const response = await firstValueFrom(
        this.httpClient.post<Chat>(`${this.API_BASE_URL}/${chatId}/start`, {})
          .pipe(
            catchError(error => throwError(() => this.handleHttpError(error)))
          )
      );

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
