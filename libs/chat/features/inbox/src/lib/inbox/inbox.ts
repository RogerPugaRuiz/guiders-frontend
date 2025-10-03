import { Component, inject, signal, computed, OnInit, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ChatService } from '@guiders-frontend/chat-service';
import { Chat, Message } from '@guiders-frontend/shared/types';
import { SessionService } from '@guiders-frontend/auth/data-access/session';
import { GuidersInboxSidebarComponent } from '@guiders-frontend/chat/ui/inbox-sidebar';
import { GuidersChatWelcomeStateComponent } from '@guiders-frontend/chat/ui/chat-welcome-state';
import { GuidersChatPlaceholderComponent } from '@guiders-frontend/chat/ui/chat-placeholder';

/**
 * Inbox - Coordinador principal del chat
 * 
 * Responsabilidades simplificadas:
 * - Coordinar comunicación entre componentes UI modulares
 * - Manejar estado global de conversaciones y selección
 * - Gestionar servicios de datos (ChatService, SessionService)
 * - Sincronizar datos entre sidebar, welcome state y placeholder
 * 
 * Componentes UI utilizados:
 * - GuidersInboxSidebarComponent: Panel lateral completo
 * - GuidersChatWelcomeStateComponent: Estado sin chat seleccionado  
 * - GuidersChatPlaceholderComponent: Placeholder para chat seleccionado
 */

@Component({
  selector: 'chat-inbox',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    GuidersInboxSidebarComponent,
    GuidersChatWelcomeStateComponent,
    GuidersChatPlaceholderComponent
  ],
  templateUrl: './inbox.html',
  styleUrl: './inbox.scss',
})
export class Inbox implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly chatService = inject(ChatService);
  private readonly sessionService = inject(SessionService);

  // ===== ESTADO PRINCIPAL =====
  readonly selectedConversationId = signal<string | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly conversations = signal<Chat[]>([]);
  readonly messagesMap = signal<Record<string, Message[]>>({});

  // ===== COMPUTED VALUES =====
  readonly currentUser = computed(() => this.sessionService.getCurrentUser());
  readonly currentUserId = computed(() => this.currentUser()?.sub || null);
  readonly currentMessages = computed(() => {
    const chatId = this.selectedConversationId();
    if (!chatId) {
      return [] as Message[];
    }
    return this.messagesMap()[chatId] ?? [];
  });
  
  readonly selectedChat = computed(() => {
    const chatId = this.selectedConversationId();
    if (!chatId) return null;
    return this.conversations().find(chat => chat.chatId === chatId) || null;
  });

  // ===== LIFECYCLE =====
  ngOnInit() {
    this.initializeDataSubscriptions();
    this.loadInitialData();
  }

  // ===== INICIALIZACIÓN =====
  private initializeDataSubscriptions(): void {
    // Sincronizar chats del servicio con la señal local
    this.chatService.chats$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((chats: Chat[]) => {
        this.conversations.set(chats);
      });

    // Sincronizar estado de carga
    this.chatService.loading$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((loading: boolean) => {
        this.isLoading.set(loading);
      });

    // Sincronizar errores
    this.chatService.error$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((errorMessage: string | null) => {
        this.error.set(errorMessage);
      });

    // Sincronizar chat seleccionado del servicio
    this.chatService.selectedChat$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((chatId: string | null) => {
        this.selectedConversationId.set(chatId);
      });

    // Sincronizar mensajes por chat
    this.chatService.messages$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((messagesByChat: Record<string, Message[]>) => {
        this.messagesMap.set({ ...messagesByChat });
      });
  }

  private loadInitialData(): void {
    const userId = this.currentUserId();
    if (!userId) {
      console.error('No se pudo obtener el ID del usuario');
      return;
    }

    this.loadChats();
  }

  private loadChats(): void {
    const commercialId = this.currentUserId();
    if (!commercialId) return;

    this.chatService.getCommercialChats(commercialId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
      next: (chats) => {
        console.log('Chats cargados:', chats.length);
      },
      error: (error) => {
        console.error('Error al cargar chats:', error);
        this.error.set('Error al cargar las conversaciones');
      }
    });
  }

  // ===== EVENT HANDLERS - COORDINACIÓN ENTRE COMPONENTES =====

  /**
   * Manejar selección de conversación desde el sidebar
   */
  onUserSelected(conversation: Chat): void {
    console.log('Conversación seleccionada:', conversation.chatId);
    
    this.selectedConversationId.set(conversation.chatId);
    this.chatService.selectChat(conversation.chatId);
    
    // Cargar mensajes para la conversación seleccionada
    this.loadMessages(conversation.chatId);
  }

  /**
   * Manejar creación de nueva conversación
   */
  onNewChatClick(): void {
    console.log('Crear nueva conversación');
    // TODO: Implementar modal de creación de chat
    // this.openNewChatModal();
  }

  /**
   * Manejar configuración del chat desde placeholder
   */
  onChatSettings(): void {
    const chatId = this.selectedConversationId();
    console.log('Configuración del chat:', chatId);
    // TODO: Implementar modal de configuración
    // this.openChatSettingsModal(chatId);
  }

  /**
   * Manejar cierre del chat desde placeholder
   */
  onCloseChat(): void {
    console.log('Cerrar chat');
    this.selectedConversationId.set(null);
    this.chatService.selectChat(null);
  }

  // ===== MÉTODOS AUXILIARES =====

  private loadMessages(chatId: string): void {
    this.chatService.getMessages(chatId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
      next: (messages) => {
        console.log(`Mensajes cargados para ${chatId}:`, messages.length);
      },
      error: (error) => {
        console.error('Error al cargar mensajes:', error);
      }
    });
  }

  /**
   * Refrescar datos del inbox
   */
  refresh(): void {
    this.loadChats();
    const chatId = this.selectedConversationId();
    if (chatId) {
      this.loadMessages(chatId);
    }
  }

  /**
   * Limpiar error
   */
  clearError(): void {
    this.error.set(null);
  }
}