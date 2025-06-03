import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
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

/**
 * Adaptador HTTP que implementa ChatRepositoryPort usando HttpClient
 * para todas las operaciones HTTP con manejo de errores apropiado
 */
@Injectable()
export class HttpChatAdapter implements ChatRepositoryPort {
  private readonly http = inject(HttpClient);
  private readonly API_BASE_URL = `${environment.apiUrl}`;

  /**
   * ✅ HttpClient para GET - Simple y confiable
   */
  async getChats(params?: GetChatsParams): Promise<ChatListResponse> {
    try {
      const url = this.buildChatsUrl(params);
      
      return await firstValueFrom(
        this.http.get<ChatListResponse>(url)
      );
    } catch (error) {
      console.error('Error al obtener chats:', error);
      throw this.handleHttpError(error);
    }
  }

  /**
   * ✅ HttpClient para GET - Simple y confiable
   */
  async getMessages(params: GetMessagesParams): Promise<MessageListResponse> {
    try {
      const url = this.buildMessagesUrl(params);
      
      return await firstValueFrom(
        this.http.get<MessageListResponse>(url)
      );
    } catch (error) {
      throw this.handleHttpError(error);
    }
  }

  /**
   * ✅ HttpClient para GET - Simple y confiable
   */
  async getChatById(params: GetChatByIdParams): Promise<Chat> {
    try {
      const url = `${this.API_BASE_URL}/${params.chatId}`;
      
      return await firstValueFrom(
        this.http.get<Chat>(url)
      );
    } catch (error) {
      throw this.handleHttpError(error);
    }
  }

  /**
   * ✅ HttpClient para POST - Operación de escritura/transaccional
   */
  async startChat(chatId: string): Promise<Chat> {
    try {
      // HttpClient es mejor para operaciones POST/PUT/DELETE
      // Son transaccionales y no necesitan cacheo
      return await firstValueFrom(
        this.http.post<Chat>(`${this.API_BASE_URL}/${chatId}`, {})
      );
    } catch (error) {
      throw this.handleHttpError(error);
    }
  }

  /**
   * Construye la URL para obtener chats con parámetros de consulta
   */
  private buildChatsUrl(params?: GetChatsParams): string {
    const queryParams = new URLSearchParams();
    
    if (params?.limit) {
      queryParams.append('limit', params.limit.toString());
    }
    if (params?.cursor) {
      queryParams.append('cursor', params.cursor);
    }
    if (params?.include && params.include.length > 0) {
      queryParams.append('include', params.include.join(','));
    }

    return `${this.API_BASE_URL}/chats${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
  }

  /**
   * Construye la URL para obtener mensajes con parámetros de consulta
   */
  private buildMessagesUrl(params: GetMessagesParams): string {
    const queryParams = new URLSearchParams();
    
    if (params.limit) {
      queryParams.append('limit', params.limit.toString());
    }
    if (params.cursor) {
      queryParams.append('cursor', params.cursor);
    }

    return `${this.API_BASE_URL}/${params.chatId}/messages${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
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
