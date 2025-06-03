import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ChatService } from './chat.service';
import { Chat, Message } from '../../../../../../libs/feature/chat';

/**
 * Servicio de estado global para el chat usando signals de Angular 20
 * Maneja el estado completo de la aplicación de chat de forma reactiva
 */
@Injectable({
  providedIn: 'root'
})
export class ChatStateService {
  private chatService = inject(ChatService);
  
  // Estados privados con signals
  private _chats = signal<Chat[]>([]);
  private _selectedChatId = signal<string | null>(null);
  private _messages = signal<Message[]>([]);
  private _isConnected = signal(false);
  
  // Estados públicos computados
  readonly chats = computed(() => this._chats());
  readonly selectedChatId = computed(() => this._selectedChatId());
  readonly messages = computed(() => this._messages());
  readonly isConnected = computed(() => this._isConnected());
  
  // Chat seleccionado computado
  readonly selectedChat = computed(() => {
    const chatId = this._selectedChatId();
    return chatId ? this._chats().find(chat => chat.id === chatId) : null;
  });
  
  // Estados derivados
  readonly hasChats = computed(() => this._chats().length > 0);
  readonly hasMessages = computed(() => this._messages().length > 0);
  readonly canSendMessage = computed(() => this._isConnected() && this._selectedChatId() !== null);
  
  // Estados de loading del servicio
  readonly isLoading = computed(() => this.chatService.isLoading());
  readonly error = computed(() => this.chatService.currentError());
  
  constructor() {
    // Effect para log de debugging
    effect(() => {
      console.log('Estado del chat actualizado:', {
        chatsCount: this._chats().length,
        selectedChatId: this._selectedChatId(),
        messagesCount: this._messages().length,
        isConnected: this._isConnected()
      });
    });
  }
  
  /**
   * Inicializa el estado cargando los chats
   */
  async initialize(): Promise<void> {
    try {
      await this.loadChats();
      this._isConnected.set(true);
    } catch (error) {
      console.error('Error al inicializar el estado del chat:', error);
      this._isConnected.set(false);
    }
  }
  
  /**
   * Carga todos los chats disponibles
   */
  async loadChats(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.chatService.getChats({
        include: ['messages', 'participants'],
        limit: 100
      }).subscribe({
        next: (response) => {
          this._chats.set(response.data || []);
          resolve();
        },
        error: (error) => {
          reject(error);
        }
      });
    });
  }
  
  /**
   * Selecciona un chat y carga sus mensajes
   */
  async selectChat(chatId: string): Promise<void> {
    if (this._selectedChatId() === chatId) {
      return; // Ya está seleccionado
    }
    
    this._selectedChatId.set(chatId);
    await this.loadMessages(chatId);
  }
  
  /**
   * Carga los mensajes de un chat específico
   */
  async loadMessages(chatId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.chatService.getMessages({
        chatId,
        limit: 100
      }).subscribe({
        next: (response) => {
          this._messages.set(response.data || []);
          resolve();
        },
        error: (error) => {
          reject(error);
        }
      });
    });
  }
  
  /**
   * Crea un nuevo chat
   */
  async createChat(): Promise<Chat> {
    const newChatId = `chat-${Date.now()}`;
    
    return new Promise((resolve, reject) => {
      this.chatService.startChat(newChatId).subscribe({
        next: (newChat) => {
          // Agregar el nuevo chat al estado
          this._chats.update(chats => [...chats, newChat]);
          resolve(newChat);
        },
        error: (error) => {
          reject(error);
        }
      });
    });
  }
  
  /**
   * Remueve un chat del estado
   */
  removeChat(chatId: string): void {
    this._chats.update(chats => chats.filter(chat => chat.id !== chatId));
    
    // Si era el chat seleccionado, deseleccionarlo
    if (this._selectedChatId() === chatId) {
      this._selectedChatId.set(null);
      this._messages.set([]);
    }
  }
  
  /**
   * Actualiza un chat específico en el estado
   */
  updateChat(updatedChat: Chat): void {
    this._chats.update(chats => 
      chats.map(chat => chat.id === updatedChat.id ? updatedChat : chat)
    );
  }
  
  /**
   * Agrega un nuevo mensaje al chat seleccionado
   */
  addMessage(message: Message): void {
    this._messages.update(messages => [...messages, message]);
  }
  
  /**
   * Deselecciona el chat actual
   */
  clearSelection(): void {
    this._selectedChatId.set(null);
    this._messages.set([]);
  }
  
  /**
   * Limpia todo el estado
   */
  reset(): void {
    this._chats.set([]);
    this._selectedChatId.set(null);
    this._messages.set([]);
    this._isConnected.set(false);
  }
  
  /**
   * Filtra chats por texto de búsqueda
   */
  searchChats(searchTerm: string): Chat[] {
    if (!searchTerm.trim()) {
      return this._chats();
    }
    
    const term = searchTerm.toLowerCase();
    return this._chats().filter(chat => {
      // Buscar en nombres de participantes
      const participantNames = chat.participants.map(p => p.name.toLowerCase()).join(' ');
      
      // Buscar en el último mensaje
      const lastMessageContent = chat.lastMessage?.content.toLowerCase() || '';
      
      return participantNames.includes(term) || lastMessageContent.includes(term);
    });
  }
  
  /**
   * Obtiene estadísticas del estado actual
   */
  getStats() {
    return computed(() => ({
      totalChats: this._chats().length,
      totalMessages: this._messages().length,
      hasSelection: this._selectedChatId() !== null,
      isConnected: this._isConnected(),
      isLoading: this.isLoading()
    }));
  }
}
