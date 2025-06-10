import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, from, catchError, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { 
  ChatListResponse, 
  MessageListResponse, 
  Chat,
  ChatData,
  GetChatsParams,
  GetMessagesParams,
  GetChatByIdParams
} from '../models/chat.models';
import { CacheStore } from '../../../core/services/cache.store';

/**
 * Servicio Angular simple para gestión de chat sin arquitectura hexagonal
 * Utiliza HttpClient directamente y maneja el estado con signals
 */
@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private readonly httpClient = inject(HttpClient);
  private readonly cacheStore = inject(CacheStore);
  private readonly API_BASE_URL = `${environment.apiUrl}/chats`;

  // Signals para estado reactivo
  private loading = signal(false);
  private error = signal<string | null>(null);
  
  // Computed signals públicos
  readonly isLoading = computed(() => this.loading());
  readonly currentError = computed(() => this.error());

  /**
   * Obtiene la lista de chats
   */
  getChats(params?: GetChatsParams): Observable<ChatListResponse> {
    console.log('🚀 [ChatService] getChats llamado con params:', params);
    this.loading.set(true);
    this.error.set(null);
    
    return from(this.fetchChats(params)).pipe(
      catchError(error => {
        console.error('❌ [ChatService] Error al obtener chats:', error);
        this.loading.set(false);
        this.error.set(error.message || 'Error al cargar los chats');
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtiene los mensajes de un chat específico
   */
  getMessages(params: GetMessagesParams): Observable<MessageListResponse> {
    this.loading.set(true);
    this.error.set(null);
    
    return from(this.fetchMessages(params)).pipe(
      catchError(error => {
        console.error('❌ [ChatService] Error al obtener mensajes:', error);
        this.loading.set(false);
        this.error.set(error.message || 'Error al cargar los mensajes');
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtiene un chat específico por ID
   */
  getChatById(params: GetChatByIdParams): Observable<ChatData> {
    this.loading.set(true);
    this.error.set(null);
    
    return from(this.fetchChatById(params)).pipe(
      catchError(error => {
        console.error('❌ [ChatService] Error al obtener chat:', error);
        this.loading.set(false);
        this.error.set(error.message || 'Error al cargar el chat');
        return throwError(() => error);
      })
    );
  }

  /**
   * Inicia un nuevo chat
   */
  startChat(chatId: string): Observable<ChatData> {
    this.loading.set(true);
    this.error.set(null);
    
    return from(this.createChat(chatId)).pipe(
      catchError(error => {
        console.error('❌ [ChatService] Error al iniciar chat:', error);
        this.loading.set(false);
        this.error.set(error.message || 'Error al iniciar el chat');
        return throwError(() => error);
      })
    );
  }

  /**
   * Limpia el estado de error
   */
  clearError(): void {
    this.error.set(null);
  }

  /**
   * Método de compatibilidad para la implementación actual
   * @deprecated Use getChats instead
   */
  getChats_deprecated(params: { include: string[] }): Observable<any> {
    const chatsParams: GetChatsParams = {
      include: params.include,
      limit: 50 // valor por defecto
    };
    
    return this.getChats(chatsParams);
  }

  // Private HTTP methods

  private async fetchChats(params?: GetChatsParams): Promise<ChatListResponse> {
    try {
      // Validaciones básicas
      if (params?.limit !== undefined && (params.limit < 1 || params.limit > 100)) {
        throw new Error('El límite debe estar entre 1 y 100');
      }

      // Usar valores por defecto
      const limit = params?.limit ?? 50;
      const cursor = params?.cursor ?? "";
      const include = params?.include ?? [];

      // Generar clave de caché
      const cacheParams = { limit, cursor, include };
      const cacheKey = this.cacheStore.generateKey('getChats', cacheParams);
      
      console.log('🔑 Cache key generada:', cacheKey);

      // Usar caché si está disponible
      return await this.cacheStore.getOrSet(cacheKey, async () => {
        console.log('🌐 Realizando petición HTTP...');
        
        // Construir parámetros HTTP
        let httpParams = new HttpParams()
          .set('limit', limit.toString())
          .set('cursor', cursor);

        if (include.length > 0) {
          httpParams = httpParams.set('include', include.join(','));
        }

        // Realizar petición HTTP
        const response = await this.httpClient.get<any>(this.API_BASE_URL, { params: httpParams }).toPromise();

        console.log('📨 Respuesta cruda recibida:', response);
        
        // Transformar respuesta al formato esperado
        let transformedResponse: ChatListResponse;
        
        if (response.chats && Array.isArray(response.chats)) {
          // Formato de API real - convert to ChatData for backward compatibility
          const chatsData = response.chats.map((chat: any) => ({
            ...chat,
            lastMessage: typeof chat.lastMessage === 'object' ? chat.lastMessage?.content : chat.lastMessage
          }));
          
          transformedResponse = {
            data: chatsData,
            chats: chatsData, // Backward compatibility
            pagination: {
              hasMore: response.hasMore ?? false,
              limit: limit,
              total: response.total,
              nextCursor: response.nextCursor
            }
          };
        } else if (response.data && Array.isArray(response.data)) {
          // Formato estándar - convert to ChatData
          const chatsData = response.data.map((chat: any) => ({
            ...chat,
            lastMessage: typeof chat.lastMessage === 'object' ? chat.lastMessage?.content : chat.lastMessage
          }));
          
          transformedResponse = {
            ...response,
            data: chatsData,
            chats: chatsData // Add backward compatibility
          };
        } else {
          // Fallback: respuesta vacía
          transformedResponse = {
            data: [],
            chats: [], // Backward compatibility
            pagination: {
              hasMore: false,
              limit: limit,
              total: 0
            }
          };
        }
        
        console.log('🔄 Respuesta transformada:', transformedResponse);
        this.loading.set(false);
        return transformedResponse;
      });
    } catch (error: any) {
      this.loading.set(false);
      throw new Error(error.message || 'Error inesperado al obtener los chats');
    }
  }

  private async fetchMessages(params: GetMessagesParams): Promise<MessageListResponse> {
    try {
      // Validaciones básicas
      if (!params.chatId) {
        throw new Error('ID del chat es requerido');
      }

      // Generar clave de caché
      const cacheKey = this.cacheStore.generateKey('getMessages', params);

      // Verificar caché
      const cachedResult = this.cacheStore.get<MessageListResponse>(cacheKey);
      if (cachedResult) {
        this.loading.set(false);
        return cachedResult;
      }

      // Por ahora retornar respuesta vacía - implementar según API
      const response: MessageListResponse = {
        data: [],
        pagination: {
          hasMore: false,
          limit: params.limit || 50,
          total: 0
        }
      };

      this.cacheStore.set(cacheKey, response);
      this.loading.set(false);
      return response;
    } catch (error: any) {
      this.loading.set(false);
      throw new Error(error.message || 'Error inesperado al obtener los mensajes');
    }
  }

  private async fetchChatById(params: GetChatByIdParams): Promise<ChatData> {
    try {
      // Validaciones básicas
      if (!params.chatId) {
        throw new Error('ID del chat es requerido');
      }

      // Generar clave de caché
      const cacheKey = this.cacheStore.generateKey('getChatById', params);

      // Verificar caché
      const cachedResult = this.cacheStore.get<ChatData>(cacheKey);
      if (cachedResult) {
        this.loading.set(false);
        return cachedResult;
      }

      // Por ahora lanzar error - implementar según API
      this.loading.set(false);
      throw new Error('Chat no encontrado');
    } catch (error: any) {
      this.loading.set(false);
      throw new Error(error.message || 'Error inesperado al obtener el chat');
    }
  }

  private async createChat(chatId: string): Promise<ChatData> {
    try {
      // Validaciones básicas
      if (!chatId) {
        throw new Error('ID del chat es requerido');
      }

      // Limpiar caché relacionada
      this.cacheStore.invalidatePattern(chatId);
      this.cacheStore.invalidatePattern('getChats');

      // Por ahora lanzar error - implementar según API
      this.loading.set(false);
      throw new Error('Funcionalidad no implementada');
    } catch (error: any) {
      this.loading.set(false);
      throw new Error(error.message || 'Error inesperado al iniciar el chat');
    }
  }
}
