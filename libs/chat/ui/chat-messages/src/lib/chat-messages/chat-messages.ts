import { Component, computed, input, output, signal, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Message, Chat } from '@guiders-frontend/shared/types';

@Component({
  selector: 'guiders-chat-messages',
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-messages.html',
  styleUrl: './chat-messages.scss',
})
export class ChatMessages implements AfterViewInit {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;

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

  formatMessageTime(timestamp: Date): string {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  formatDateHeader(date: string): string {
    const messageDate = new Date(date);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    
    if (messageDate.toDateString() === today.toDateString()) {
      return 'Hoy';
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Ayer';
    } else {
      return messageDate.toLocaleDateString();
    }
  }

  getSenderName(senderId: string): string {
    const chat = this.chat();
    const sender = chat.participants.find(p => p.id === senderId);
    return sender?.name || 'Usuario desconocido';
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
}
