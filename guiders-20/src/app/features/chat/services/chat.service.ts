import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, from } from 'rxjs';
import { 
  ChatListResponse, 
  MessageListResponse, 
  Chat,
  GetChatsParams,
  GetMessagesParams,
  GetChatByIdParams,
  GetChatsUseCase,
  GetMessagesUseCase,
  GetChatByIdUseCase,
  StartChatUseCase,
  
  // Importaciones V2
  ChatV2,
  ChatListResponseV2,
  GetChatsV2Params,
  CommercialMetricsV2,
  ResponseTimeStatsV2,
  GetChatsV2UseCase,
  GetChatByIdV2UseCase,
  GetCommercialChatsV2UseCase,
  GetVisitorChatsV2UseCase,
  GetPendingQueueV2UseCase,
  GetCommercialMetricsV2UseCase,
  GetResponseTimeStatsV2UseCase,
  AssignChatV2UseCase,
  CloseChatV2UseCase,
  
  // Funciones de mapeo
  mapChatListV2ToV1,
  mapChatV2ToV1
} from '../../../../../../libs/feature/chat';
import { 
  GET_CHATS_USE_CASE_TOKEN,
  GET_MESSAGES_USE_CASE_TOKEN,
  GET_CHAT_BY_ID_USE_CASE_TOKEN,
  START_CHAT_USE_CASE_TOKEN,
  
  // Tokens V2
  GET_CHATS_V2_USE_CASE_TOKEN,
  GET_CHAT_BY_ID_V2_USE_CASE_TOKEN,
  GET_COMMERCIAL_CHATS_V2_USE_CASE_TOKEN,
  GET_VISITOR_CHATS_V2_USE_CASE_TOKEN,
  GET_PENDING_QUEUE_V2_USE_CASE_TOKEN,
  GET_COMMERCIAL_METRICS_V2_USE_CASE_TOKEN,
  GET_RESPONSE_TIME_STATS_V2_USE_CASE_TOKEN,
  ASSIGN_CHAT_V2_USE_CASE_TOKEN,
  CLOSE_CHAT_V2_USE_CASE_TOKEN
} from '../../../core/providers';
import { HttpClient } from '@angular/common/http';

/**
 * Servicio Angular para gestión de chat que usa los casos de uso inyectados
 * Convierte las operaciones de los casos de uso a Observables para compatibilidad con Angular
 * Incluye soporte para API V1 (legacy) y V2 (optimizada)
 */
@Injectable({
  providedIn: 'root'
})
export class ChatService {
  // Inyección de casos de uso V1 (legacy)
  private getChatsUseCase = inject(GET_CHATS_USE_CASE_TOKEN);
  private getMessagesUseCase = inject(GET_MESSAGES_USE_CASE_TOKEN);
  private getChatByIdUseCase = inject(GET_CHAT_BY_ID_USE_CASE_TOKEN);
  private startChatUseCase = inject(START_CHAT_USE_CASE_TOKEN);

  // Inyección de casos de uso V2 (optimizada)
  private getChatsV2UseCase = inject(GET_CHATS_V2_USE_CASE_TOKEN);
  private getChatByIdV2UseCase = inject(GET_CHAT_BY_ID_V2_USE_CASE_TOKEN);
  private getCommercialChatsV2UseCase = inject(GET_COMMERCIAL_CHATS_V2_USE_CASE_TOKEN);
  private getVisitorChatsV2UseCase = inject(GET_VISITOR_CHATS_V2_USE_CASE_TOKEN);
  private getPendingQueueV2UseCase = inject(GET_PENDING_QUEUE_V2_USE_CASE_TOKEN);
  private getCommercialMetricsV2UseCase = inject(GET_COMMERCIAL_METRICS_V2_USE_CASE_TOKEN);
  private getResponseTimeStatsV2UseCase = inject(GET_RESPONSE_TIME_STATS_V2_USE_CASE_TOKEN);
  private assignChatV2UseCase = inject(ASSIGN_CHAT_V2_USE_CASE_TOKEN);
  private closeChatV2UseCase = inject(CLOSE_CHAT_V2_USE_CASE_TOKEN);

  // Signals para estado reactivo
  private loading = signal(false);
  private error = signal<string | null>(null);
  
  // Computed signals públicos
  readonly isLoading = computed(() => this.loading());
  readonly currentError = computed(() => this.error());

  // === Métodos API V1 (Legacy) ===

  /**
   * Obtiene la lista de chats usando el caso de uso
   */
  getChats(params?: GetChatsParams): Observable<ChatListResponse> {
    console.log('🚀 [ChatService] getChats llamado con params:', params);
    this.loading.set(true);
    this.error.set(null);
    
    console.log('🔧 [ChatService] Ejecutando getChatsUseCase...');
    
    return from(
      this.getChatsUseCase.execute(params)
        .then((response: ChatListResponse) => {
          console.log('✅ [ChatService] getChatsUseCase.execute completado. Respuesta:', {
            response,
            hasData: !!response.data,
            dataLength: response.data?.length,
            dataType: typeof response.data,
            isArray: Array.isArray(response.data)
          });
          
          this.loading.set(false);
          console.log('📤 [ChatService] Retornando respuesta al componente:', response);
          return response;
        })
        .catch((error: any) => {
          console.error('❌ [ChatService] Error en getChatsUseCase.execute:', error);
          this.loading.set(false);
          this.error.set(error.message || 'Error al cargar los chats');
          throw error;
        })
    );
  }

  /**
   * Obtiene los mensajes de un chat específico usando el caso de uso
   */
  getMessages(params: GetMessagesParams): Observable<MessageListResponse> {
    this.loading.set(true);
    this.error.set(null);
    
    return from(
      this.getMessagesUseCase.execute(params)
        .then((response: MessageListResponse) => {
          this.loading.set(false);
          return response;
        })
        .catch((error: any) => {
          this.loading.set(false);
          this.error.set(error.message || 'Error al cargar los mensajes');
          throw error;
        })
    );
  }

  /**
   * Obtiene un chat específico por ID usando el caso de uso
   */
  getChatById(params: GetChatByIdParams): Observable<Chat> {
    this.loading.set(true);
    this.error.set(null);
    
    return from(
      this.getChatByIdUseCase.execute(params)
        .then((response: Chat) => {
          this.loading.set(false);
          return response;
        })
        .catch((error: any) => {
          this.loading.set(false);
          this.error.set(error.message || 'Error al cargar el chat');
          throw error;
        })
    );
  }

  /**
   * Inicia un nuevo chat usando el caso de uso
   */
  startChat(chatId: string): Observable<Chat> {
    this.loading.set(true);
    this.error.set(null);
    
    return from(
      this.startChatUseCase.execute(chatId)
        .then((response: Chat) => {
          this.loading.set(false);
          return response;
        })
        .catch((error: any) => {
          this.loading.set(false);
          this.error.set(error.message || 'Error al iniciar el chat');
          throw error;
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

  // === Métodos API V2 (Optimizada) ===

  /**
   * Obtiene la lista de chats usando la API V2 optimizada
   * Con filtros avanzados y paginación cursor
   */
  getChatsV2(params?: GetChatsV2Params): Observable<ChatListResponseV2> {
    console.log('🚀 [ChatService] getChatsV2 llamado con params:', params);
    this.loading.set(true);
    this.error.set(null);
    
    return from(
      this.getChatsV2UseCase.execute(params)
        .then((response: ChatListResponseV2) => {
          console.log('✅ [ChatService] getChatsV2UseCase.execute completado:', response);
          this.loading.set(false);
          return response;
        })
        .catch((error: any) => {
          console.error('❌ [ChatService] Error en getChatsV2UseCase.execute:', error);
          this.loading.set(false);
          this.error.set(error.message || 'Error al cargar los chats V2');
          throw error;
        })
    );
  }

  /**
   * Obtiene un chat específico por ID usando la API V2
   */
  getChatByIdV2(chatId: string): Observable<ChatV2> {
    console.log('🚀 [ChatService] getChatByIdV2 llamado con chatId:', chatId);
    this.loading.set(true);
    this.error.set(null);
    
    return from(
      this.getChatByIdV2UseCase.execute(chatId)
        .then((response: ChatV2) => {
          console.log('✅ [ChatService] getChatByIdV2UseCase.execute completado:', response);
          this.loading.set(false);
          return response;
        })
        .catch((error: any) => {
          console.error('❌ [ChatService] Error en getChatByIdV2UseCase.execute:', error);
          this.loading.set(false);
          this.error.set(error.message || 'Error al cargar el chat V2');
          throw error;
        })
    );
  }

  /**
   * Obtiene chats de un comercial específico usando la API V2
   */
  getCommercialChatsV2(commercialId: string, params?: GetChatsV2Params): Observable<ChatListResponseV2> {
    console.log('🚀 [ChatService] getCommercialChatsV2 llamado:', { commercialId, params });
    this.loading.set(true);
    this.error.set(null);
    
    return from(
      this.getCommercialChatsV2UseCase.execute(commercialId, params)
        .then((response: ChatListResponseV2) => {
          console.log('✅ [ChatService] getCommercialChatsV2UseCase.execute completado:', response);
          this.loading.set(false);
          return response;
        })
        .catch((error: any) => {
          console.error('❌ [ChatService] Error en getCommercialChatsV2UseCase.execute:', error);
          this.loading.set(false);
          this.error.set(error.message || 'Error al cargar los chats del comercial V2');
          throw error;
        })
    );
  }

  /**
   * Obtiene chats de un visitante específico usando la API V2
   */
  getVisitorChatsV2(visitorId: string, cursor?: string, limit?: number): Observable<ChatListResponseV2> {
    console.log('🚀 [ChatService] getVisitorChatsV2 llamado:', { visitorId, cursor, limit });
    this.loading.set(true);
    this.error.set(null);
    
    return from(
      this.getVisitorChatsV2UseCase.execute(visitorId, cursor, limit)
        .then((response: ChatListResponseV2) => {
          console.log('✅ [ChatService] getVisitorChatsV2UseCase.execute completado:', response);
          this.loading.set(false);
          return response;
        })
        .catch((error: any) => {
          console.error('❌ [ChatService] Error en getVisitorChatsV2UseCase.execute:', error);
          this.loading.set(false);
          this.error.set(error.message || 'Error al cargar los chats del visitante V2');
          throw error;
        })
    );
  }

  /**
   * Obtiene la cola de chats pendientes usando la API V2
   */
  getPendingQueueV2(department?: string, limit?: number): Observable<ChatV2[]> {
    console.log('🚀 [ChatService] getPendingQueueV2 llamado:', { department, limit });
    this.loading.set(true);
    this.error.set(null);
    
    return from(
      this.getPendingQueueV2UseCase.execute(department, limit)
        .then((response: ChatV2[]) => {
          console.log('✅ [ChatService] getPendingQueueV2UseCase.execute completado:', response);
          this.loading.set(false);
          return response;
        })
        .catch((error: any) => {
          console.error('❌ [ChatService] Error en getPendingQueueV2UseCase.execute:', error);
          this.loading.set(false);
          this.error.set(error.message || 'Error al cargar la cola pendiente V2');
          throw error;
        })
    );
  }

  /**
   * Obtiene métricas de un comercial usando la API V2
   */
  getCommercialMetricsV2(commercialId: string, dateFrom?: Date, dateTo?: Date): Observable<CommercialMetricsV2> {
    console.log('🚀 [ChatService] getCommercialMetricsV2 llamado:', { commercialId, dateFrom, dateTo });
    this.loading.set(true);
    this.error.set(null);
    
    return from(
      this.getCommercialMetricsV2UseCase.execute(commercialId, dateFrom, dateTo)
        .then((response: CommercialMetricsV2) => {
          console.log('✅ [ChatService] getCommercialMetricsV2UseCase.execute completado:', response);
          this.loading.set(false);
          return response;
        })
        .catch((error: any) => {
          console.error('❌ [ChatService] Error en getCommercialMetricsV2UseCase.execute:', error);
          this.loading.set(false);
          this.error.set(error.message || 'Error al cargar las métricas del comercial V2');
          throw error;
        })
    );
  }

  /**
   * Obtiene estadísticas de tiempo de respuesta usando la API V2
   */
  getResponseTimeStatsV2(dateFrom?: Date, dateTo?: Date, groupBy?: 'hour' | 'day' | 'week'): Observable<ResponseTimeStatsV2[]> {
    console.log('🚀 [ChatService] getResponseTimeStatsV2 llamado:', { dateFrom, dateTo, groupBy });
    this.loading.set(true);
    this.error.set(null);
    
    return from(
      this.getResponseTimeStatsV2UseCase.execute(dateFrom, dateTo, groupBy)
        .then((response: ResponseTimeStatsV2[]) => {
          console.log('✅ [ChatService] getResponseTimeStatsV2UseCase.execute completado:', response);
          this.loading.set(false);
          return response;
        })
        .catch((error: any) => {
          console.error('❌ [ChatService] Error en getResponseTimeStatsV2UseCase.execute:', error);
          this.loading.set(false);
          this.error.set(error.message || 'Error al cargar las estadísticas de tiempo de respuesta V2');
          throw error;
        })
    );
  }

  /**
   * Asigna un chat a un comercial usando la API V2
   */
  assignChatV2(chatId: string, commercialId: string): Observable<ChatV2> {
    console.log('🚀 [ChatService] assignChatV2 llamado:', { chatId, commercialId });
    this.loading.set(true);
    this.error.set(null);
    
    return from(
      this.assignChatV2UseCase.execute(chatId, commercialId)
        .then((response: ChatV2) => {
          console.log('✅ [ChatService] assignChatV2UseCase.execute completado:', response);
          this.loading.set(false);
          return response;
        })
        .catch((error: any) => {
          console.error('❌ [ChatService] Error en assignChatV2UseCase.execute:', error);
          this.loading.set(false);
          this.error.set(error.message || 'Error al asignar el chat V2');
          throw error;
        })
    );
  }

  /**
   * Cierra un chat usando la API V2
   */
  closeChatV2(chatId: string): Observable<ChatV2> {
    console.log('🚀 [ChatService] closeChatV2 llamado con chatId:', chatId);
    this.loading.set(true);
    this.error.set(null);
    
    return from(
      this.closeChatV2UseCase.execute(chatId)
        .then((response: ChatV2) => {
          console.log('✅ [ChatService] closeChatV2UseCase.execute completado:', response);
          this.loading.set(false);
          return response;
        })
        .catch((error: any) => {
          console.error('❌ [ChatService] Error en closeChatV2UseCase.execute:', error);
          this.loading.set(false);
          this.error.set(error.message || 'Error al cerrar el chat V2');
          throw error;
        })
    );
  }

  // === Métodos de compatibilidad V2 → V1 ===

  /**
   * Obtiene chats usando API V2 pero retorna en formato V1 para compatibilidad
   * Este método permite usar la API optimizada V2 sin cambiar el código existente
   */
  getChatsV2Compatible(params?: GetChatsParams): Observable<ChatListResponse> {
    console.log('🔄 [ChatService] getChatsV2Compatible llamado - usando V2 con mapeo a V1');
    
    // Convertir parámetros V1 a V2 (mapeo básico)
    const v2Params: GetChatsV2Params = {
      cursor: params?.cursor,
      limit: params?.limit,
      sort: {
        field: 'lastMessageDate',
        direction: 'desc'
      }
    };
    
    return from(
      this.getChatsV2UseCase.execute(v2Params)
        .then((v2Response: ChatListResponseV2) => {
          console.log('🔄 [ChatService] Respuesta V2 recibida, mapeando a V1:', v2Response);
          // Mapear respuesta V2 a formato V1
          const v1Response = mapChatListV2ToV1(v2Response);
          console.log('✅ [ChatService] Respuesta mapeada a V1:', v1Response);
          return v1Response;
        })
        .catch((error: any) => {
          console.error('❌ [ChatService] Error en getChatsV2Compatible:', error);
          this.error.set(error.message || 'Error al cargar los chats con compatibilidad V2');
          throw error;
        })
    );
  }

  /**
   * Obtiene un chat por ID usando API V2 pero retorna en formato V1 para compatibilidad
   */
  getChatByIdV2Compatible(chatId: string): Observable<Chat> {
    console.log('🔄 [ChatService] getChatByIdV2Compatible llamado - usando V2 con mapeo a V1');
    
    return from(
      this.getChatByIdV2UseCase.execute(chatId)
        .then((v2Response: ChatV2) => {
          console.log('🔄 [ChatService] Chat V2 recibido, mapeando a V1:', v2Response);
          // Mapear respuesta V2 a formato V1
          const v1Response = mapChatV2ToV1(v2Response);
          console.log('✅ [ChatService] Chat mapeado a V1:', v1Response);
          return v1Response;
        })
        .catch((error: any) => {
          console.error('❌ [ChatService] Error en getChatByIdV2Compatible:', error);
          this.error.set(error.message || 'Error al cargar el chat con compatibilidad V2');
          throw error;
        })
    );
  }
}
