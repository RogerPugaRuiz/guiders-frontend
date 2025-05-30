import { Injectable, inject } from '@angular/core';
import { Observable, from } from 'rxjs';
import { 
  Chat,
  ChatListResponse,
  MessageListResponse,
  GetChatsParams,
  GetMessagesParams,
  GetChatByIdParams,
  GetChatsUseCase,
  GetMessagesUseCase,
  GetChatByIdUseCase,
  StartChatUseCase
} from '@libs/feature/chat';
import {
  GET_CHATS_USE_CASE_TOKEN,
  GET_MESSAGES_USE_CASE_TOKEN,
  GET_CHAT_BY_ID_USE_CASE_TOKEN,
  START_CHAT_USE_CASE_TOKEN
} from '../infrastructure/chat-config.providers';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private getChatsUseCase: GetChatsUseCase = inject(GET_CHATS_USE_CASE_TOKEN);
  private getMessagesUseCase: GetMessagesUseCase = inject(GET_MESSAGES_USE_CASE_TOKEN);
  private getChatByIdUseCase: GetChatByIdUseCase = inject(GET_CHAT_BY_ID_USE_CASE_TOKEN);
  private startChatUseCase: StartChatUseCase = inject(START_CHAT_USE_CASE_TOKEN);

  /**
   * Obtiene la lista de chats del usuario autenticado
   */
  getChats(params?: GetChatsParams): Observable<ChatListResponse> {
    return from(this.getChatsUseCase.execute(params));
  }

  /**
   * Obtiene los mensajes paginados de un chat específico
   */
  getMessages(params: GetMessagesParams): Observable<MessageListResponse> {
    return from(this.getMessagesUseCase.execute(params));
  }

  /**
   * Obtiene la información de un chat específico por ID
   */
  getChatById(params: GetChatByIdParams): Observable<Chat> {
    return from(this.getChatByIdUseCase.execute(params));
  }

  /**
   * Inicia un chat (para visitantes)
   */
  startChat(chatId: string): Observable<Chat> {
    return from(this.startChatUseCase.execute(chatId));
  }
}