import { Component, input, output, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Chat, ChatStatus, Participant } from '../../../../../../../libs/feature/chat/domain/entities/chat.entity';
import { AvatarService } from '../../../../core/services/avatar.service';

interface FilterOption {
  value: string;
  label: string;
}

// Interfaces para los eventos emitidos
export interface ChatSearchEvent {
  searchTerm: string;
}

export interface ChatFilterEvent {
  filter: ChatStatus | 'all';
}

export interface ChatSelectionEvent {
  chat: Chat;
}

export interface ChatRetryEvent {
  // Evento simple para indicar retry
}

@Component({
  selector: 'app-chat-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-list.html',
  styleUrl: './chat-list.scss'
})
export class ChatListComponent {
  private avatarService = inject(AvatarService);

  // Signal inputs - datos que recibe del componente padre (Angular 20+)
  chats = input<Chat[]>([]);
  filteredChats = input<Chat[]>([]);
  searchTerm = input<string>('');
  selectedFilter = input<ChatStatus | 'all'>('all');
  isLoading = input<boolean>(false);
  error = input<string | null>(null);
  isRetryLoading = input<boolean>(false);
  selectedChatId = input<string | null>(null);

  // Signal outputs - eventos que emite al componente padre (Angular 20+)
  searchChange = output<ChatSearchEvent>();
  filterChange = output<ChatFilterEvent>();
  chatSelection = output<ChatSelectionEvent>();
  retryLoad = output<ChatRetryEvent>();

  // Signals internos para el estado local del componente
  private _searchTerm = signal('');
  private _selectedFilter = signal<ChatStatus | 'all'>('all');

  // Opciones de filtro
  filterOptions: FilterOption[] = [
    { value: 'all', label: 'Todos los chats' },
    { value: 'active', label: 'Activos' },
    { value: 'inactive', label: 'Inactivos' },
    { value: 'pending', label: 'Pendientes' },
    { value: 'archived', label: 'Archivados' },
    { value: 'closed', label: 'Cerrados' }
  ];

  // Computed signals
  showEmptyState = computed(() => {
    return !this.isLoading() && !this.error() && this.filteredChats().length === 0;
  });

  showErrorState = computed(() => 
    !this.isLoading() && this.error() !== null
  );

  selectedFilterValue = computed(() => this.selectedFilter());

  // Métodos para manejar eventos del template
  onSearchChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const searchTerm = target.value;
    this._searchTerm.set(searchTerm);
    this.searchChange.emit({ searchTerm });
  }

  onFilterChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const filter = target.value as ChatStatus | 'all';
    this._selectedFilter.set(filter);
    this.filterChange.emit({ filter });
  }

  retryLoadChats() {
    this.retryLoad.emit({});
  }

  // Métodos de utilidad para manejar participantes visitantes
  getVisitor(chat: Chat): Participant | undefined {
    return chat.participants?.find(p => p.isVisitor);
  }

  getVisitorName(chat: Chat): string {
    const visitor = this.getVisitor(chat);
    // Si el nombre es un UUID (formato común para visitantes anónimos), mostrar algo más amigable
    if (visitor?.name && visitor.name.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      return `Visitante ${visitor.name.substring(0, 4)}`;
    }
    return visitor?.name || 'Visitante Anónimo';
  }

  isAnonymousVisitor(chat: Chat): boolean {
    const visitor = this.getVisitor(chat);
    return visitor?.isAnonymous ?? false;
  }

  getParticipantInitials(chat: Chat): string {
    const name = this.getVisitorName(chat);
    return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2);
  }

  getParticipantAvatarUrl(chat: Chat): string {
    const visitor = this.getVisitor(chat);
    const name = visitor?.name || 'Visitante Anónimo';
    return this.avatarService.generateVisitorAvatar(name, 32);
  }

  onAvatarError(event: any, chat: Chat): void {
    // Ocultar la imagen y mostrar el fallback
    const img = event.target as HTMLImageElement;
    const avatarDiv = img.parentElement;
    if (avatarDiv) {
      img.style.display = 'none';
      const fallback = avatarDiv.querySelector('.chat-item__avatar-fallback') as HTMLElement;
      if (fallback) {
        fallback.style.display = 'flex';
      }
    }
  }

  getParticipantStatusClass(chat: Chat): string {
    const visitor = this.getVisitor(chat);
    
    if (visitor?.isViewing) {
      return 'chat-item__status--viewing';
    } else if (visitor?.isTyping) {
      return 'chat-item__status--typing';
    } else if (visitor?.isOnline) {
      return 'chat-item__status--online';
    } else if (visitor?.lastSeenAt) {
      // Si el visitante tiene lastSeenAt, significa que ha estado conectado pero inactivo
      const lastSeen = new Date(visitor.lastSeenAt);
      const now = new Date();
      const diffMinutes = (now.getTime() - lastSeen.getTime()) / (1000 * 60);
      
      // Si la última vez que se vio fue hace menos de 30 minutos, está inactivo
      if (diffMinutes < 30) {
        return 'chat-item__status--inactive';
      }
    }
    
    // Por defecto, estado desconectado
    return 'chat-item__status--offline';
  }
  
  getParticipantStatusText(chat: Chat): string {
    const visitor = this.getVisitor(chat);
    
    if (visitor?.isViewing) {
      return 'Viendo página';
    } else if (visitor?.isTyping) {
      return 'Escribiendo...';
    } else if (visitor?.isOnline) {
      return 'Conectado';
    } else if (visitor?.lastSeenAt) {
      const lastSeen = new Date(visitor.lastSeenAt);
      const now = new Date();
      const diffMinutes = (now.getTime() - lastSeen.getTime()) / (1000 * 60);
      
      // Si la última vez que se vio fue hace menos de 30 minutos, está inactivo
      if (diffMinutes < 30) {
        return 'Inactivo';
      } else if (diffMinutes < 60) {
        return 'Visto recientemente';
      } else {
        const diffInHours = Math.floor(diffMinutes / 60);
        if (diffInHours < 24) {
          return `Visto hace ${diffInHours}h`;
        } else {
          const days = Math.floor(diffInHours / 24);
          return `Visto hace ${days}d`;
        }
      }
    } else {
      return 'Desconectado';
    }
  }

  getLastMessagePreview(chat: Chat): string {
    return chat.lastMessage?.content || 'Sin mensajes';
  }

  formatLastMessageTime(chat: Chat): string {
    // Usar lastMessage.timestamp si existe, o lastMessageAt si no
    const timestamp = chat.lastMessage?.timestamp || chat.lastMessageAt;
    
    if (!timestamp) return '';
    
    const messageDate = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const minutes = Math.floor(diffInHours * 60);
      return `${minutes}m`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h`;
    } else {
      return messageDate.toLocaleDateString('es-ES', { 
        day: 'numeric', 
        month: 'short' 
      });
    }
  }

  /**
   * Verifica si un chat está seleccionado
   */
  isChatSelected(chatId: string): boolean {
    return this.selectedChatId() === chatId;
  }

  /**
   * Selecciona un chat y emite el evento al padre
   */
  selectChat(chat: Chat): void {
    this.chatSelection.emit({ chat });
    console.log('📌 [ChatList] Chat seleccionado para emisión:', chat.id);
  }
}
