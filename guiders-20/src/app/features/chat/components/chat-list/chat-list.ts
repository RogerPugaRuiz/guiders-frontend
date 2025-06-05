import { Component, input, output, signal, computed, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AvatarService } from '../../../../core/services/avatar.service';
import { HttpClient, httpResource } from '@angular/common/http';
import { ChatData, ChatListResponse, ChatStatus, Participant } from '../../models/chat.models';
import { url } from 'inspector';
import { environment } from 'src/environments/environment';

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
  chat: ChatData;
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
  // Injection of services
  private avatarService = inject(AvatarService);
  private http = inject(HttpClient);

  // Signals
  searchTerm = signal('');
  selectedFilter = signal<ChatStatus | 'all'>('all');
  isLoading = signal(false);
  error = signal<string | null>(null);
  isRetryLoading = signal(false);
  selectedChat = signal<ChatData | null>(null);
  limit = signal(20);
  cursor = signal<string>("");
  include = signal<string[]>([]);

  constructor() {
    effect(() => {
      console.log('Chats loaded:', this.chatsResource.value());
      console.log('Loading:', this.chatsResource.isLoading());
      console.log('Error:', this.chatsResource.error());
    });
  }
  

  // Triggers
  onSearchChange($event: Event) {}
  onFilterChange($event: Event) {}

  filterOptions: FilterOption[] = [
    { value: 'all', label: 'Todos' },
    { value: 'active', label: 'Activos' },
    { value: 'archived', label: 'Archivados' },
    { value: 'closed', label: 'Cerrados' },
    { value: 'pending', label: 'Pendientes' },
    { value: 'inactive', label: 'Inactivos' }
  ];

  // resources
  chatsResource = httpResource<ChatListResponse>(()=>(
    { 
      url: `${environment.apiUrl}/chats`, 
      method: 'GET',
      params: {
        limit: this.limit(),
        cursor: this.cursor(),
        include: this.include().join(',')
      }
    }
  ));

  chats = computed(() => {
    const allChats = this.chatsResource.value()?.data || [];
    return allChats
  });

  filteredChats = computed(() => {
    const allChats = this.chats();
    if (this.selectedFilter() === 'all') return allChats;
    return allChats.filter(chat => chat.status === this.selectedFilter());
  });

  // functions
  retryLoadChats() {}

  isChatSelected(chat: ChatData): boolean {
    return this.selectedChat()?.id === chat.id;
  }

  selectChat(chat: ChatData): void {}

  getChatAvatar(chat: ChatData): string {
    return ""
  }

  getVisitorName(chat: ChatData): string {
    return chat.participants
      .filter(participant => participant.isVisitor)
      .map(participant => participant.name)[0] || 'Visitante';
  }

  onAvatarError($event: Event, chat: ChatData): void {

  }


  getParticipantInitials(chat: ChatData): string {
    return chat.participants
      .filter(participant => participant.isVisitor)
      .map(participant => participant.name)
      .map(name => name.split(' ').map(part => part.charAt(0).toUpperCase()).join(''))[0] || 'V';
  }

  getParticipantStatusClass(chat: ChatData): string {
    return ""
  }

  getParticipantStatusText(chat: ChatData): string {
    return ""
  }

  isAnonymousVisitor(chat: ChatData): boolean {
    return chat.participants.some(participant => participant.isVisitor && participant.isAnonymous);
  }

  formatLastMessageTime(chat: ChatData): string { 
    const lastMessage = chat.lastMessage;
    if (!lastMessage) return 'Sin mensajes';
    
    const date = new Date(lastMessage.timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'Hace menos de un minuto';
    if (diff < 3600000) return `Hace ${Math.floor(diff / 60000)} minutos`;
    if (diff < 86400000) return `Hace ${Math.floor(diff / 3600000)} horas`;
    
    return date.toLocaleDateString();
  }

  getLastMessagePreview(chat: ChatData): string {
    return chat.lastMessage ? chat.lastMessage.content : 'Sin mensajes';
  }

  getVisitor(chat: ChatData): Participant | null {
    return chat.participants.find(participant => participant.isVisitor) || null;
  }

}
