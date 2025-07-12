import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { 
  AvailableChatsResponse,
  ClaimChatRequest,
  ReleaseChatClaimRequest,
  ClaimChatResponse
} from '../models/chat.models';

@Injectable({
  providedIn: 'root'
})
export class ChatClaimService {
  private http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  /**
   * Obtiene la lista de chats disponibles para ser reclamados
   */
  getAvailableChats(): Observable<AvailableChatsResponse> {
    console.log('🎯 [ChatClaimService] Obteniendo chats disponibles');
    return this.http.get<AvailableChatsResponse>(`${this.apiUrl}/chat-claims/available`);
  }

  /**
   * Reclama un chat específico para un comercial
   */
  claimChat(request: ClaimChatRequest): Observable<ClaimChatResponse> {
    console.log('🎯 [ChatClaimService] Reclamando chat:', request);
    return this.http.post<ClaimChatResponse>(`${this.apiUrl}/chat-claims/claim`, request);
  }

  /**
   * Libera el claim de un chat específico
   */
  releaseChatClaim(request: ReleaseChatClaimRequest): Observable<void> {
    console.log('🎯 [ChatClaimService] Liberando claim del chat:', request);
    return this.http.post<void>(`${this.apiUrl}/chat-claims/release`, request);
  }

  /**
   * Verifica si un chat está disponible para ser reclamado
   */
  isChatAvailable(chatId: string): Observable<boolean> {
    console.log('🎯 [ChatClaimService] Verificando disponibilidad del chat:', chatId);
    return this.http.get<boolean>(`${this.apiUrl}/chat-claims/available/${chatId}`);
  }

  /**
   * Obtiene información del claim actual de un chat
   */
  getChatClaim(chatId: string): Observable<any> {
    console.log('🎯 [ChatClaimService] Obteniendo información del claim:', chatId);
    return this.http.get(`${this.apiUrl}/chat-claims/chat/${chatId}`);
  }
}
