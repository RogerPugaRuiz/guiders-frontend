import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
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
} from '@libs/feature/chat';

import { environment } from '../../../../../environments/environment';

/**
 * Implementación HTTP del repositorio de chat para la aplicación Guiders
 */
@Injectable()
export class HttpChatRepository implements ChatRepositoryPort {
  private readonly API_BASE_URL = `${environment.apiUrl}/chat`;

  constructor(private http: HttpClient) {}

  async getChats(params?: GetChatsParams): Promise<ChatListResponse> {
    try {
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

      const url = `${this.API_BASE_URL}/chats${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      
      return await firstValueFrom(
        this.http.get<ChatListResponse>(url)
      );
    } catch (error) {
      throw this.handleHttpError(error);
    }
  }

  async getMessages(params: GetMessagesParams): Promise<MessageListResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.limit) {
        queryParams.append('limit', params.limit.toString());
      }
      if (params.cursor) {
        queryParams.append('cursor', params.cursor);
      }

      const url = `${this.API_BASE_URL}/${params.chatId}/messages${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      
      return await firstValueFrom(
        this.http.get<MessageListResponse>(url)
      );
    } catch (error) {
      throw this.handleHttpError(error);
    }
  }

  async getChatById(params: GetChatByIdParams): Promise<Chat> {
    try {
      return await firstValueFrom(
        this.http.get<Chat>(`${this.API_BASE_URL}/${params.chatId}`)
      );
    } catch (error) {
      throw this.handleHttpError(error);
    }
  }

  async startChat(chatId: string): Promise<Chat> {
    try {
      return await firstValueFrom(
        this.http.post<Chat>(`${this.API_BASE_URL}/${chatId}`, {})
      );
    } catch (error) {
      throw this.handleHttpError(error);
    }
  }

  private handleHttpError(error: any): Error {
    if (error instanceof HttpErrorResponse) {
      switch (error.status) {
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