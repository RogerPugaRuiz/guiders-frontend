import { Component, computed, input, output, signal, ViewChild, ElementRef, AfterViewInit, AfterViewChecked, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Message, Chat } from '@guiders-frontend/shared/types';
import { TextField } from '@guiders-frontend/text-field';
import { Button } from '@guiders-frontend/button';
import { UnreadMessagesService } from '@guiders-frontend/unread-messages-service';
import { PresenceService } from '@guiders-frontend/presence-service';
import { TypingIndicator } from '@guiders-frontend/typing-indicator';

@Component({
  selector: 'guiders-chat-messages',
  imports: [CommonModule, FormsModule, TextField, Button, TypingIndicator],
  templateUrl: './chat-messages.html',
  styleUrl: './chat-messages.scss',
})
export class ChatMessages implements AfterViewInit, AfterViewChecked {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;

  // Servicios
  private readonly unreadMessagesService = inject(UnreadMessagesService);
  private readonly presenceService = inject(PresenceService);

  // IntersectionObserver para detectar mensajes visibles
  private intersectionObserver: IntersectionObserver | null = null;

  // Mapa de mensajes observados (messageId => timeout)
  private observedMessages = new Map<string, NodeJS.Timeout>();

  // Inputs usando signals API
  readonly chat = input.required<Chat>();
  readonly messages = input.required<Message[]>();
  readonly currentUserId = input.required<string>();
  readonly loading = input<boolean>(false);
  readonly canSendMessages = input<boolean>(true);

  // Outputs usando signals API
  readonly messageSend = output<{ content: string; type: 'text' | 'image' | 'file' }>();
  readonly messageRead = output<Message>();
  readonly messageEdit = output<{ messageId: string; newContent: string }>();
  readonly messageDelete = output<string>();

  // Estado interno con signals
  readonly newMessage = signal<string>('');
  readonly isTyping = signal<boolean>(false);
  readonly editingMessageId = signal<string | null>(null);
  readonly editingContent = signal<string>('');

  // Typing indicators
  readonly typingUsers = signal<{ userId: string; userName: string; userType: 'commercial' | 'visitor' }[]>([]);

  // Effect para actualizar typing users desde PresenceService
  constructor() {
    effect(() => {
      const chatId = this.chat().chatId;
      const typingUserIds = this.presenceService.getTypingUsers(chatId);
      const participants = this.chat().participants;

      // Mapear userIds a información completa
      const typingUsersInfo = typingUserIds
        .map(userId => {
          const participant = participants.find(p => p.id === userId);
          if (!participant || participant.id === this.currentUserId()) {
            return null; // No mostrar typing del usuario actual
          }
          return {
            userId: participant.id,
            userName: participant.name || participant.email || 'Usuario',
            userType: (participant.role === 'commercial' ? 'commercial' : 'visitor') as 'commercial' | 'visitor'
          };
        })
        .filter(u => u !== null) as { userId: string; userName: string; userType: 'commercial' | 'visitor' }[];

      this.typingUsers.set(typingUsersInfo);
    });
  }

  // Computed values
  readonly groupedMessages = computed(() => {
    const messages = this.messages();
    const grouped: { date: string; messages: Message[] }[] = [];
    
    messages.forEach(message => {
      const date = new Date(message.sentAt).toDateString();
      let group = grouped.find(g => g.date === date);
      
      if (!group) {
        group = { date, messages: [] };
        grouped.push(group);
      }
      
      group.messages.push(message);
    });
    
    return grouped;
  });

  readonly otherParticipant = computed(() => {
    const chat = this.chat();
    if (chat.participants && chat.participants.length > 2) return null;
    return chat.participants.find(p => p.id !== this.currentUserId());
  });

  ngAfterViewInit() {
    this.scrollToBottom();
    this.initializeIntersectionObserver();
  }

  ngAfterViewChecked() {
    // Observar mensajes no leídos después de cada actualización
    this.observeUnreadMessages();
  }

  ngOnDestroy() {
    // Cleanup del IntersectionObserver
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }

    // Limpiar timeouts
    this.observedMessages.forEach(timeout => clearTimeout(timeout));
    this.observedMessages.clear();
  }

  // Métodos
  onSendMessage(): void {
    const content = this.newMessage().trim();
    if (!content || !this.canSendMessages()) return;

    this.messageSend.emit({ 
      content, 
      type: 'text' 
    });
    
    this.newMessage.set('');
    this.setTyping(false);
    
    // Scroll al final después de enviar
    setTimeout(() => this.scrollToBottom(), 100);
  }

  onMessageValueChange(value: string): void {
    this.newMessage.set(value);
    
    // Indicador de escritura
    if (value.trim()) {
      this.setTyping(true);
    } else {
      this.setTyping(false);
    }
  }

  onInputChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.newMessage.set(target.value);
    
    // Indicador de escritura
    if (target.value.trim()) {
      this.setTyping(true);
    } else {
      this.setTyping(false);
    }
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.onSendMessage();
    }
  }

  setTyping(typing: boolean): void {
    this.isTyping.set(typing);
    // En una implementación real, aquí enviarías el estado de typing al servidor
  }

  startEdit(message: Message): void {
    this.editingMessageId.set(message.messageId);
    this.editingContent.set(message.content);
  }

  saveEdit(): void {
    const messageId = this.editingMessageId();
    const newContent = this.editingContent().trim();
    
    if (messageId && newContent) {
      this.messageEdit.emit({ messageId, newContent });
    }
    
    this.cancelEdit();
  }

  cancelEdit(): void {
    this.editingMessageId.set(null);
    this.editingContent.set('');
  }

  onEditInputChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.editingContent.set(target.value);
  }

  deleteMessage(messageId: string): void {
    if (confirm('¿Estás seguro de que quieres eliminar este mensaje?')) {
      this.messageDelete.emit(messageId);
    }
  }

  markAsRead(message: Message): void {
    if (message.status !== 'READ' && message.senderId !== this.currentUserId()) {
      this.messageRead.emit(message);
    }
  }

  isOwnMessage(message: Message): boolean {
    return message.senderId === this.currentUserId();
  }

  formatMessageTime(timestamp: Date | string | undefined): string {
    if (!timestamp) return '';

    try {
      const date = new Date(timestamp);

      // Verificar si la fecha es válida
      if (isNaN(date.getTime())) {
        return '';
      }

      return date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.warn('Error al formatear hora:', timestamp, error);
      return '';
    }
  }

  formatDateHeader(date: string): string {
    if (!date) return '';

    try {
      const messageDate = new Date(date);

      // Verificar si la fecha es válida
      if (isNaN(messageDate.getTime())) {
        return '';
      }

      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);

      if (messageDate.toDateString() === today.toDateString()) {
        return 'Hoy';
      } else if (messageDate.toDateString() === yesterday.toDateString()) {
        return 'Ayer';
      } else {
        return messageDate.toLocaleDateString('es-ES', {
          weekday: 'long',
          day: '2-digit',
          month: 'long',
          year: 'numeric'
        });
      }
    } catch (error) {
      console.warn('Error al formatear fecha de encabezado:', date, error);
      return '';
    }
  }

  getSenderName(senderId: string): string {
    const chat = this.chat();
    const sender = chat.participants?.find(p => p.id === senderId);

    if (sender?.name && sender.name.trim()) {
      return sender.name;
    }

    if (sender?.email && sender.email.trim()) {
      return sender.email;
    }

    // Si es el usuario actual
    if (senderId === this.currentUserId()) {
      return 'Tú';
    }

    return 'Visitante';
  }

  getSenderAvatar(senderId: string): string {
    const chat = this.chat();
    const sender = chat.participants.find(p => p.id === senderId);
    return sender?.avatar || '👤';
  }

  getMessageStatusIcon(message: Message): string {
    switch (message.status) {
      case 'SENT': return '✓';
      case 'DELIVERED': return '✓✓';
      case 'READ': return '✓✓';
      default: return '';
    }
  }

  private scrollToBottom(): void {
    if (this.messagesContainer) {
      const element = this.messagesContainer.nativeElement;
      element.scrollTop = element.scrollHeight;
    }
  }

  /**
   * Inicializar Intersection Observer para detectar mensajes visibles
   */
  private initializeIntersectionObserver(): void {
    if (!this.messagesContainer) return;

    const options = {
      root: this.messagesContainer.nativeElement,
      threshold: 1.0, // 100% visible
      rootMargin: '0px',
    };

    this.intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const messageElement = entry.target as HTMLElement;
          const messageId = messageElement.dataset['messageId'];

          if (messageId) {
            this.handleMessageVisible(messageId);
          }
        } else {
          // Si el mensaje deja de estar visible, cancelar el timeout
          const messageElement = entry.target as HTMLElement;
          const messageId = messageElement.dataset['messageId'];

          if (messageId && this.observedMessages.has(messageId)) {
            const timeout = this.observedMessages.get(messageId);
            if (timeout) {
              clearTimeout(timeout);
              this.observedMessages.delete(messageId);
            }
          }
        }
      });
    }, options);
  }

  /**
   * Observar mensajes no leídos del chat actual
   */
  private observeUnreadMessages(): void {
    if (!this.intersectionObserver || !this.messagesContainer) return;

    const container = this.messagesContainer.nativeElement;
    const messageElements = container.querySelectorAll('[data-message-id]');

    messageElements.forEach((element: Element) => {
      const messageId = (element as HTMLElement).dataset['messageId'];
      if (!messageId) return;

      // Buscar el mensaje en la lista
      const message = this.messages().find(m => m.messageId === messageId);
      if (!message) return;

      // Solo observar si:
      // 1. El mensaje no ha sido leído (isRead === false o undefined)
      // 2. No es mensaje propio
      // 3. No está siendo observado ya
      const isUnread = message.isRead === false || message.isRead === undefined;
      const isNotOwnMessage = message.senderId !== this.currentUserId();

      if (isUnread && isNotOwnMessage && !this.observedMessages.has(messageId)) {
        this.intersectionObserver.observe(element);
      }
    });
  }

  /**
   * Manejar mensaje visible (marcar como leído después de 2 segundos)
   */
  private handleMessageVisible(messageId: string): void {
    // Si ya tiene un timeout activo, no hacer nada
    if (this.observedMessages.has(messageId)) {
      return;
    }

    // Crear timeout para marcar como leído después de 2 segundos
    const timeout = setTimeout(() => {
      console.log('[ChatMessages] Marcando mensaje como leído:', messageId);

      this.unreadMessagesService.markAsRead([messageId]).subscribe({
        next: (response) => {
          if (response.success) {
            console.log('[ChatMessages] Mensaje marcado como leído:', messageId);
          }
        },
        error: (error) => {
          console.error('[ChatMessages] Error al marcar mensaje como leído:', error);
        }
      });

      // Remover del mapa después de marcarlo
      this.observedMessages.delete(messageId);

      // Dejar de observar el elemento
      if (this.intersectionObserver) {
        const element = document.querySelector(`[data-message-id="${messageId}"]`);
        if (element) {
          this.intersectionObserver.unobserve(element);
        }
      }
    }, 2000); // 2 segundos

    // Guardar el timeout
    this.observedMessages.set(messageId, timeout);
  }
}
