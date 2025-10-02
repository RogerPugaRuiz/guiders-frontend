import { ChangeDetectionStrategy, Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chat, User } from '@guiders-frontend/shared/types';
import { Button } from '@guiders-frontend/button';
import { IconComponent } from '@guiders-frontend/icon';

@Component({
  selector: 'guiders-chat-placeholder',
  standalone: true,
  imports: [CommonModule, Button, IconComponent],
  templateUrl: './chat-placeholder.html',
  styleUrl: './chat-placeholder.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GuidersChatPlaceholderComponent {
  @Input({ required: true }) selectedChat!: Chat;
  @Input() showActions = true;
  @Input() placeholderMessage = 'Aquí se mostraría la interfaz de chat cuando esté disponible';

  @Output() settingsClicked = new EventEmitter<void>();
  @Output() closeChat = new EventEmitter<void>();

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
}