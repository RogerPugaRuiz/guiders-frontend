import {
  ChangeDetectionStrategy,
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  AfterViewInit,
  ViewChild,
  ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chat, User } from '@guiders-frontend/shared/types';
import { Button } from '@guiders-frontend/button';
import { IconComponent } from '@guiders-frontend/icon';
import { Message } from '@guiders-frontend/shared/types';
import { MessageInput } from '@guiders-frontend/chat/ui/message-input';

@Component({
  selector: 'guiders-chat-placeholder',
  standalone: true,
  imports: [CommonModule, Button, IconComponent, MessageInput],
  templateUrl: './chat-placeholder.html',
  styleUrl: './chat-placeholder.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GuidersChatPlaceholderComponent implements OnChanges, AfterViewInit {
  @Input({ required: true }) selectedChat!: Chat;
  @Input() showActions = true;
  @Input() placeholderMessage = 'Envía un mensaje para iniciar la conversación';
  @Input() messages: Message[] = [];
  @Input() currentUserId: string | null = null;
  @Input() isLoading = false;

  @Output() settingsClicked = new EventEmitter<void>();
  @Output() closeChat = new EventEmitter<void>();
  @Output() messageSent = new EventEmitter<string>();

  @ViewChild('messagesContainer') private messagesContainer?: ElementRef<HTMLDivElement>;

  /**
   * Obtener nombre para mostrar del chat
   */
  getChatDisplayName(): string {
    const chat = this.selectedChat;
    if (chat.name && chat.name !== 'Chat sin título' && chat.name !== 'Visitante') {
      return chat.name;
    }

    const visitor = chat.participants?.find((p: User) => p.role === 'visitor');
    if (visitor?.name && visitor.name.trim()) {
      return visitor.name;
    }

    if (visitor?.email && visitor.email.trim()) {
      return visitor.email;
    }

    return 'Visitante';
  }

  /**
   * Obtener información del estado del chat
   */
  getChatStatusInfo(): { label: string; color: string; icon: string } {
    const status = this.selectedChat.status;
    switch (status) {
      case 'ACTIVE':
        return { label: 'Activo', color: 'success', icon: 'check-circle' };
      case 'PENDING':
        return { label: 'Pendiente', color: 'warning', icon: 'clock' };
      case 'CLOSED':
        return { label: 'Cerrado', color: 'neutral', icon: 'x' };
      case 'TRANSFERRED':
        return { label: 'Transferido', color: 'info', icon: 'arrow-right' };
      case 'ASSIGNED':
        return { label: 'Asignado', color: 'info', icon: 'user' };
      default:
        return { label: 'Desconocido', color: 'neutral', icon: 'help-circle' };
    }
  }

  /**
   * Manejar click en configuración
   */
  onSettingsClick(): void {
    this.settingsClicked.emit();
  }

  /**
   * Obtener nombre de ícono para el estado (con tipos válidos)
   */
  getStatusIconName(): 'check' | 'clock' | 'close' | 'arrow-right' | 'user' | 'help-circle' {
    const status = this.selectedChat.status;
    switch (status) {
      case 'ACTIVE': return 'check';
      case 'PENDING': return 'clock';
      case 'CLOSED': return 'close';
      case 'TRANSFERRED': return 'arrow-right';
      case 'ASSIGNED': return 'user';
      default: return 'help-circle';
    }
  }

  /**
   * Manejar cierre del chat
   */
  onCloseChat(): void {
    this.closeChat.emit();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['messages']) {
      this.scheduleScrollToBottom();
    }
  }

  ngAfterViewInit(): void {
    this.scheduleScrollToBottom();
  }

  trackMessageById(index: number, message: Message): string {
    return message.messageId;
  }

  isOwnMessage(message: Message): boolean {
    if (this.currentUserId) {
      return message.senderId === this.currentUserId;
    }
    return message.senderType === 'COMMERCIAL';
  }

  isSystemMessage(message: Message): boolean {
    return message.senderType === 'SYSTEM';
  }

  getSenderLabel(message: Message): string {
    if (this.isSystemMessage(message)) {
      return 'Sistema';
    }

    if (this.isOwnMessage(message)) {
      return 'Tú';
    }

    const participant = this.selectedChat.participants?.find((p: User) => p.id === message.senderId);
    if (participant?.name) {
      return participant.name;
    }
    if (participant?.email) {
      return participant.email;
    }

    switch (message.senderType) {
      case 'VISITOR':
        return 'Visitante';
      case 'COMMERCIAL':
        return 'Agente';
      default:
        return 'Sistema';
    }
  }

  formatMessageTime(value: Date | string | number | null | undefined): string {
    if (!value) {
      return '';
    }

    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }

    return new Intl.DateTimeFormat('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  onMessageSent(content: string): void {
    this.messageSent.emit(content);
  }

  private scheduleScrollToBottom(): void {
    queueMicrotask(() => this.scrollToBottom());
  }

  private scrollToBottom(): void {
    const container = this.messagesContainer?.nativeElement;
    if (!container) {
      return;
    }
    container.scrollTop = container.scrollHeight;
  }
}