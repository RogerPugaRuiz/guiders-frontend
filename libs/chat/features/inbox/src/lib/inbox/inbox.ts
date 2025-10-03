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
  
  // Estado de paginación de mensajes
  readonly messagePaginationMap = signal<Record<string, {
    total: number;
    hasMore: boolean;
    nextCursor?: string;
    isLoadingMore: boolean;
  }>>({});

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

  readonly currentPagination = computed(() => {
    const chatId = this.selectedConversationId();
    if (!chatId) return { total: 0, hasMore: false, isLoadingMore: false };
    return this.messagePaginationMap()[chatId] ?? { total: 0, hasMore: false, isLoadingMore: false };
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

    // Sincronizar mensajes que llegan por WebSocket
    this.chatService.messages$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((messagesMap) => {
        // Actualizar solo si hay mensajes nuevos para el chat seleccionado
        const chatId = this.selectedConversationId();
        if (chatId && messagesMap[chatId]) {
          const serviceMessages = messagesMap[chatId];
          const currentMessages = this.messagesMap()[chatId] || [];
          
          // Solo actualizar si hay mensajes nuevos que no estén en la lista local
          const newMessages = serviceMessages.filter(serviceMsg => 
            !currentMessages.some(localMsg => localMsg.messageId === serviceMsg.messageId)
          );
          
          if (newMessages.length > 0) {
            console.log(`[Inbox] Sincronizando ${newMessages.length} mensajes nuevos del servicio`);
            this.messagesMap.update(map => ({
              ...map,
              [chatId]: [...currentMessages, ...newMessages]
            }));
          }
        }
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

  /**
   * Manejar envío de mensaje
   */
  onSendMessage(content: string): void {
    const chatId = this.selectedConversationId();

    if (!chatId) {
      console.error('No se puede enviar el mensaje: falta chatId');
      return;
    }

    this.chatService.sendMessage({
      chatId,
      content,
      type: 'text'
    }).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (message) => {
          console.log('Mensaje enviado:', message);
          
          // Actualizar messagesMap del componente con el nuevo mensaje
          if (message) {
            this.messagesMap.update(map => {
              const currentMessages = map[chatId] || [];
              return {
                ...map,
                [chatId]: [...currentMessages, message]
              };
            });
          }
        },
        error: (error) => {
          console.error('Error al enviar mensaje:', error);
          this.error.set('Error al enviar el mensaje');
        }
      });
  }

  // ===== MÉTODOS AUXILIARES =====

  private loadMessages(chatId: string): void {
    this.chatService.getMessagesV2(chatId, {
      limit: 50
      // El endpoint por defecto devuelve sentAt DESC (más recientes primero)
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          console.log(`Mensajes cargados para ${chatId}:`, response.messages.length);
          
          // Los mensajes vienen en orden descendente (más recientes primero)
          // Los revertimos para mostrarlos ascendente (más antiguos arriba)
          const messages = [...response.messages].reverse();
          
          // Actualizar mensajes
          this.messagesMap.update(map => ({
            ...map,
            [chatId]: messages
          }));
          
          // Actualizar información de paginación
          this.messagePaginationMap.update(map => ({
            ...map,
            [chatId]: {
              total: response.total,
              hasMore: response.hasMore,
              nextCursor: response.nextCursor,
              isLoadingMore: false
            }
          }));
        },
        error: (error) => {
          console.error('Error al cargar mensajes:', error);
          this.error.set('Error al cargar los mensajes');
        }
      });
  }

  /**
   * Cargar más mensajes antiguos (scroll infinito)
   */
  onLoadMoreMessages(): void {
    const chatId = this.selectedConversationId();
    if (!chatId) return;

    const pagination = this.messagePaginationMap()[chatId];
    if (!pagination?.hasMore || pagination.isLoadingMore) {
      console.log('No hay más mensajes para cargar o ya está cargando');
      return;
    }

    console.log(`Cargando más mensajes para ${chatId} con cursor:`, pagination.nextCursor);

    // Marcar como cargando
    this.messagePaginationMap.update(map => ({
      ...map,
      [chatId]: {
        ...map[chatId],
        isLoadingMore: true
      }
    }));

    this.chatService.getMessagesV2(chatId, {
      cursor: pagination.nextCursor,
      limit: 50
      // El endpoint por defecto devuelve sentAt DESC
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          console.log(`Mensajes antiguos cargados: ${response.messages.length}`);
          
          // Los mensajes vienen en orden descendente
          // Los revertimos y los agregamos AL INICIO del array existente
          const newMessages = [...response.messages].reverse();
          const currentMessages = this.messagesMap()[chatId] || [];
          
          this.messagesMap.update(map => ({
            ...map,
            [chatId]: [...newMessages, ...currentMessages]
          }));
          
          // Actualizar paginación
          this.messagePaginationMap.update(map => ({
            ...map,
            [chatId]: {
              total: response.total,
              hasMore: response.hasMore,
              nextCursor: response.nextCursor,
              isLoadingMore: false
            }
          }));
        },
        error: (error) => {
          console.error('Error al cargar más mensajes:', error);
          
          // Desmarcar loading en caso de error
          this.messagePaginationMap.update(map => ({
            ...map,
            [chatId]: {
              ...map[chatId],
              isLoadingMore: false
            }
          }));
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