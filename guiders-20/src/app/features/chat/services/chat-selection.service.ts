import { Injectable, signal } from '@angular/core';
import { ChatData } from '../models/chat.models';

@Injectable({
  providedIn: 'root'
})
export class ChatSelectionService {
  // Signal para el chat actualmente seleccionado
  private _selectedChat = signal<ChatData | null>(null);

  // Getter público para el chat seleccionado
  get selectedChat() {
    return this._selectedChat.asReadonly();
  }

  /**
   * Selecciona un chat
   */
  selectChat(chat: ChatData): void {
    this._selectedChat.set(chat);
    console.log('📌 [ChatSelection] Chat seleccionado:', chat.id, chat);
  }

  /**
   * Limpia la selección
   */
  clearSelection(): void {
    this._selectedChat.set(null);
    console.log('🔄 [ChatSelection] Selección limpiada');
  }

  /**
   * Verifica si un chat está seleccionado
   */
  isChatSelected(chatId: string): boolean {
    return this._selectedChat()?.id === chatId;
  }
}
