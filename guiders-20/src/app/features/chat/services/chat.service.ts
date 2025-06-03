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
  StartChatUseCase
} from '../../../../../../libs/feature/chat';
import { 
  GET_CHATS_USE_CASE_TOKEN,
  GET_MESSAGES_USE_CASE_TOKEN,
  GET_CHAT_BY_ID_USE_CASE_TOKEN,
  START_CHAT_USE_CASE_TOKEN
} from '../../../core/providers';
import { HttpClient } from '@angular/common/http';

/**
 * Servicio Angular para gestión de chat que usa los casos de uso inyectados
 * Convierte las operaciones de los casos de uso a Observables para compatibilidad con Angular
 */
@Injectable({
  providedIn: 'root'
})
export class ChatService {
  // Inyección de casos de uso específicos
  private getChatsUseCase = inject(GET_CHATS_USE_CASE_TOKEN);
  private getMessagesUseCase = inject(GET_MESSAGES_USE_CASE_TOKEN);
  private getChatByIdUseCase = inject(GET_CHAT_BY_ID_USE_CASE_TOKEN);
  private startChatUseCase = inject(START_CHAT_USE_CASE_TOKEN);


  // Signals para estado reactivo
  private loading = signal(false);
  private error = signal<string | null>(null);
  
  // Computed signals públicos
  readonly isLoading = computed(() => this.loading());
  readonly currentError = computed(() => this.error());

  /**
   * Obtiene la lista de chats usando el caso de uso
   */
  getChats(params?: GetChatsParams): Observable<ChatListResponse> {
    this.loading.set(true);
    this.error.set(null);
    
    return from(
      this.getChatsUseCase.execute(params)
        .then((response: ChatListResponse) => {
          this.loading.set(false);
          return response;
        })
        .catch((error: any) => {
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
}
