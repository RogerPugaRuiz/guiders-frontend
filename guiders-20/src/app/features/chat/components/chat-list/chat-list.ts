import { Component, input, output, signal, computed, inject, effect, resource, ResourceStreamItem, Signal, OnInit, linkedSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AvatarService } from '../../../../core/services/avatar.service';
import { HttpClient, httpResource } from '@angular/common/http';
import { ChatData, ChatListResponse, ChatStatus, Participant } from '../../models/chat.models';
import { environment } from 'src/environments/environment';
import { WebSocketConnectionStateDefault, WebSocketMessage, WebSocketService } from 'src/app/core/services';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { WebSocketMessageType } from 'src/app/core/enums';
import { catchError, EMPTY, filter, tap } from 'rxjs';

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
export class ChatListComponent  implements OnInit {
  // Injection of services
  private avatarService = inject(AvatarService);
  private ws = inject(WebSocketService);
  private http = inject(HttpClient);

  // Output events
  chatSelected = output<ChatSelectionEvent>();
  
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
      console.log('🔄 Resource Status:', this.chatsResource.status());
      console.log('📊 Resource Value:', this.chatsResource.value());
      console.log('🔄 Is Loading:', this.chatsResource.isLoading());
      console.log('❌ Error:', this.chatsResource.error());
      console.log('📦 Chats computed:', this.chats());
      console.log('🎯 Filtered chats:', this.filteredChats());
    });

    effect(() => {
      const status = this.wsConnected();
      if (status.connected && this.chatsResource.status() === 'idle') {
        this.chatsResource.reload();
      }
    });
  }
  ngOnInit(): void {
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

  connectionTrigger = toSignal(
    this.ws.getConnectionStatus(),
    { initialValue: null }
  );
  // Convierte el observable del WebSocket a signal
  wsConnected = toSignal(this.ws.getConnectionStatus(), {
    initialValue: {
      connected: false,
      connecting: false,
      error: null,
      lastConnected: null,
      reconnectAttempts: 0
    }
  });


  chatsResource = httpResource<ChatListResponse>(() => {
    // Solo ejecuta la petición si el WebSocket está conectado
    if (!this.wsConnected().connected) return undefined;

    return {
      url: `${environment.apiUrl}/chats`,
      params: {
        limit: this.limit(),
        cursor: this.cursor(),
        include: this.include().join(',')
      }
    };
  });

  participantStatusUpdate = toSignal(
    this.ws.getMessagesByType(WebSocketMessageType.PARTICIPANT_ONLINE_STATUS_UPDATED)
      .pipe(
        // Añadir console.log para ver el contenido del observable
        tap(message => {
        }),
        filter(message => message && message.data),
        catchError(err => {
          console.error('❌ Error in chat status update stream:', err);
          return EMPTY;
        })
      ),
    { initialValue: null }
  );


  chats = linkedSignal(() => {
    const allChats = this.chatsResource.value()?.chats || [];
    const participantStatusUpdate = this.participantStatusUpdate();

    if (!participantStatusUpdate?.data?.data) { // 👈 Nota el .data.data
      return allChats;
    }

    console.log('🔄 [ChatList] Participant status update:', participantStatusUpdate);

    // Acceder al nivel correcto de datos
    const { isOnline, participantId } = participantStatusUpdate.data.data as {
      isOnline: boolean;
      participantId: string;
    };

    console.log('🔍 Debug - participantId:', participantId, 'isOnline:', isOnline);

    const newAllChats = allChats.map(chat => {
      console.log('🔍 Processing chat:', chat.id);
      const updatedParticipants = chat.participants.map(participant => {
        console.log('🔍 Checking participant:', participant.id, 'against:', participantId);
        if (participant.id === participantId) {
          console.log('✅ Found matching participant, updating isOnline to:', isOnline);
          return { ...participant, isOnline };
        }
        return participant;
      });

      return {
        ...chat,
        participants: updatedParticipants
      };
    });

    console.log('🔄 [ChatList] Updated chats with participant status:', newAllChats);
    return newAllChats;
  });

  filteredChats = computed(() => {
    const allChats = this.chats() || [];
    if (this.selectedFilter() === 'all') return allChats;
    return allChats.filter(chat => chat.status === this.selectedFilter());
  });

  // functions
  retryLoadChats() {}

  isChatSelected(chat: ChatData): boolean {
    return this.selectedChat()?.id === chat.id;
  }

  selectChat(chat: ChatData): void {
    // Usar signal local para mantener el estado seleccionado
    this.selectedChat.set(chat);
    
    // Emitir evento al componente padre
    this.chatSelected.emit({ chat });
    
    console.log('✅ [ChatList] Chat seleccionado mediante signal y output:', chat.id, chat);
  }

  getChatAvatar(chat: ChatData): string {
    const visitor = this.getVisitorName(chat);
    return this.avatarService.generateVisitorAvatar(visitor);
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
    const visitor = this.getVisitor(chat);
    if (!visitor) return 'chat-item__status--offline';
    
    if (visitor.isTyping) {
      return 'chat-item__status--typing';
    }
    
    if (visitor.isViewing) {
      return 'chat-item__status--viewing';
    }
    
    if (visitor.isOnline) {
      return 'chat-item__status--online';
    }
    
    // Si no está online, verificar si ha estado activo recientemente
    if (visitor.lastSeenAt) {
      const lastSeen = new Date(visitor.lastSeenAt);
      const now = new Date();
      const diffMinutes = (now.getTime() - lastSeen.getTime()) / (1000 * 60);
      
      // Si estuvo activo en los últimos 5 minutos, considerarlo inactivo, sino offline
      if (diffMinutes <= 5) {
        return 'chat-item__status--inactive';
      }
    }
    
    return 'chat-item__status--offline';
  }

  getParticipantStatusText(chat: ChatData): string {
    const visitor = this.getVisitor(chat);
    if (!visitor) return 'Usuario no disponible';
    
    if (visitor.isTyping) {
      return 'Escribiendo...';
    }
    
    if (visitor.isViewing) {
      return 'Viendo la conversación';
    }
    
    if (visitor.isOnline) {
      return 'En línea';
    }
    
    // Si no está online, verificar cuándo fue la última vez que estuvo activo
    if (visitor.lastSeenAt) {
      const lastSeen = new Date(visitor.lastSeenAt);
      const now = new Date();
      const diffMinutes = (now.getTime() - lastSeen.getTime()) / (1000 * 60);
      
      if (diffMinutes <= 1) {
        return 'Activo hace menos de un minuto';
      } else if (diffMinutes <= 5) {
        return `Activo hace ${Math.floor(diffMinutes)} minutos`;
      } else if (diffMinutes <= 60) {
        return `Visto hace ${Math.floor(diffMinutes)} minutos`;
      } else if (diffMinutes <= 1440) { // 24 horas
        const hours = Math.floor(diffMinutes / 60);
        return `Visto hace ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
      } else {
        const days = Math.floor(diffMinutes / 1440);
        return `Visto hace ${days} ${days === 1 ? 'día' : 'días'}`;
      }
    }
    
    return 'Fuera de línea';
  }

  isAnonymousVisitor(chat: ChatData): boolean {
    return chat.participants.some(participant => participant.isVisitor && participant.isAnonymous);
  }

  formatLastMessageTime(chat: ChatData): string { 
    const lastMessage = chat.lastMessage;
    if (!lastMessage) return '';
    
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
