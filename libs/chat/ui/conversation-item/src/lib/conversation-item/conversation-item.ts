import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chat, User, PresenceStatus } from '@guiders-frontend/shared/types';
import { UnreadBadge } from '@guiders-frontend/unread-badge';
import { PresenceBadge } from '@guiders-frontend/presence-badge';

@Component({
  selector: 'guiders-conversation-item',
  standalone: true,
  imports: [CommonModule, UnreadBadge, PresenceBadge],
  templateUrl: './conversation-item.html',
  styleUrl: './conversation-item.scss',
})
export class ConversationItem {
  // Inputs usando signals API
  readonly conversation = input.required<Chat>();
  readonly isSelected = input<boolean>(false);

  // Estado de presencia del participante (opcional)
  readonly participantPresenceStatus = input<PresenceStatus | undefined>(undefined);

  // Outputs usando signals API
  readonly conversationSelected = output<Chat>();

  // Computed para determinar si mostrar badge de presencia
  readonly showPresenceBadge = computed(() => {
    return this.participantPresenceStatus() !== undefined;
  });

  /**
   * Manejar click en la conversación
   */
  onConversationClick(): void {
    this.conversationSelected.emit(this.conversation());
  }

  /**
   * Obtener nombre para mostrar del chat
   */
  getChatDisplayName(): string {
    const chat = this.conversation();
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
   * Obtener avatar del chat
   */
  getChatAvatar(): string {
    const chat = this.conversation();
    if (chat.participants && chat.participants.length > 2) {
      return '👥';
    }

  const visitor = chat.participants?.find((p: User) => p.role === 'visitor');
    return visitor?.avatar || '👤';
  }

  /**
   * Devuelve true si el avatar parece una URL (imagen remota/local).
   * Usado por la plantilla para decidir entre <img> o SVG fallback.
   */
  isAvatarUrl(): boolean {
    const avatar = this.getChatAvatar();
    if (!avatar) return false;
    // Considerar que una URL contiene 'http' o empieza con '/' (ruta relativa)
    return typeof avatar === 'string' && (avatar.startsWith('http') || avatar.startsWith('/'));
  }

  /**
   * Obtener inicial del visitante para el avatar
   */
  getVisitorInitial(): string {
    const name = this.getChatDisplayName();

    if (name && name.trim() && name !== 'Chat') {
      return name.trim().charAt(0).toUpperCase();
    }

    return 'V';
  }

  /**
   * Obtener preview del último mensaje
   */
  getChatPreview(): string {
    const chat = this.conversation();
    if (!chat.lastMessage) {
      return 'Sin mensajes';
    }

    const message = chat.lastMessage;
    if (message.type === 'TEXT') {
      return message.content.length > 60
        ? message.content.substring(0, 60) + '...'
        : message.content;
    }

    switch (message.type) {
      case 'IMAGE': return '📷 Imagen';
      case 'FILE': return '📎 Archivo';
      case 'AUDIO': return '🎵 Audio';
      case 'VIDEO': return '🎥 Video';
      case 'SYSTEM': return '📢 Mensaje del sistema';
      default: return 'Mensaje';
    }
  }

  /**
   * Formatear tiempo del chat
   */
  formatChatTime(): string {
    const chat = this.conversation();
    if (!chat.lastMessage?.sentAt) return '';

    try {
      const date = new Date(chat.lastMessage.sentAt);
      if (isNaN(date.getTime())) return '';

      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);

      if (minutes < 1) return 'Ahora';
      if (minutes < 60) return `${minutes}m`;
      if (hours < 24) return `${hours}h`;
      if (days < 7) return `${days}d`;

      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit'
      });
    } catch (error) {
      console.warn('Error al formatear fecha:', chat.lastMessage.sentAt, error);
      return '';
    }
  }

  /**
   * Obtener datetime string para el atributo HTML
   */
  getChatDatetime(): string | null {
    const chat = this.conversation();
    if (!chat.lastMessage?.sentAt) return null;

    try {
      return new Date(chat.lastMessage.sentAt).toISOString();
    } catch {
      return null;
    }
  }
}