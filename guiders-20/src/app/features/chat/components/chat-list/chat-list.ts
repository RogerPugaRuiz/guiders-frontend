import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, catchError, of, map, startWith } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

import { Chat, ChatStatus } from '../../../../../../../libs/feature/chat/domain/entities/chat.entity';
import { ChatService } from '../../services/chat.service';
import { HttpClient } from '@angular/common/http';

interface FilterOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-chat-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-list.html',
  styleUrl: './chat-list.scss'
})
export class ChatListComponent implements OnInit {
  private chatService = inject(ChatService);

  // Signals para el estado
  searchTerm = signal('');
  selectedFilter = signal<ChatStatus | 'all'>('all');
  isLoading = signal(false);
  error = signal<string | null>(null);
  isRetryLoading = signal(false);

  // Opciones de filtro
  filterOptions: FilterOption[] = [
    { value: 'all', label: 'Todos los chats' },
    { value: 'active', label: 'Activos' },
    { value: 'waiting', label: 'En espera' },
    { value: 'inactive', label: 'Inactivos' },
    { value: 'closed', label: 'Cerrados' }
  ];

  // Observable de chats convertido a signal
  private chats$ = this.loadChats();
  chats = toSignal(this.chats$, { initialValue: [] });

  // Computed signals
  filteredChats = computed(() => {
    const chats = this.chats();
    const search = this.searchTerm().toLowerCase().trim();
    const filter = this.selectedFilter();

    // Validación defensiva para evitar errores con chats undefined
    if (!chats || !Array.isArray(chats)) {
      return [];
    }

    return chats.filter(chat => {
      // Filtro por estado
      const matchesFilter = filter === 'all' || chat.status === filter;
      
      // Filtro por búsqueda
      const matchesSearch = !search || 
        this.getVisitorName(chat).toLowerCase().includes(search) ||
        this.getLastMessagePreview(chat).toLowerCase().includes(search);

      return matchesFilter && matchesSearch;
    });
  });

  showEmptyState = computed(() => {
    const chats = this.chats();
    // Validación defensiva para evitar errores con chats undefined
    return !this.isLoading() && !this.error() && (!chats || chats.length === 0);
  });

  showErrorState = computed(() => 
    !this.isLoading() && this.error() !== null
  );

  selectedFilterValue = computed(() => this.selectedFilter());

  ngOnInit() {
    this.loadInitialChats();
  }

  private loadChats(): Observable<Chat[]> {
    return this.chatService.getChats({ limit: 50 }).pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Error loading chats:', error);
        this.error.set('Error al cargar los chats. Por favor, inténtalo de nuevo.');
        return of([]);
      }),
      startWith([])
    );
  }

  private loadInitialChats() {
    this.isLoading.set(true);
    this.error.set(null);
    
    this.chatService.getChats({ limit: 50 }).subscribe({
      next: (response) => {
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading initial chats:', error);
        this.error.set('Error al cargar los chats. Por favor, inténtalo de nuevo.');
        this.isLoading.set(false);
      }
    });
  }

  // Métodos para el template
  onSearchChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchTerm.set(target.value);
  }

  onFilterChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.selectedFilter.set(target.value as ChatStatus | 'all');
  }

  retryLoadChats() {
    this.isRetryLoading.set(true);
    this.error.set(null);
    
    this.chatService.getChats({ limit: 50 }).subscribe({
      next: (response) => {
        this.isRetryLoading.set(false);
      },
      error: (error) => {
        console.error('Error retrying chats:', error);
        this.error.set('Error al cargar los chats. Por favor, inténtalo de nuevo.');
        this.isRetryLoading.set(false);
      }
    });
  }

  // Métodos de utilidad
  getVisitorName(chat: Chat): string {
    const visitor = chat.participants?.find(p => p.role === 'visitor');
    return visitor?.name || 'Visitante Anónimo';
  }

  getParticipantInitials(chat: Chat): string {
    const name = this.getVisitorName(chat);
    return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2);
  }

  getParticipantStatusClass(chat: Chat): string {
    const visitor = chat.participants?.find(p => p.role === 'visitor');
    return visitor?.isOnline ? 'chat-item__status--online' : 'chat-item__status--offline';
  }

  getLastMessagePreview(chat: Chat): string {
    return chat.lastMessage?.content || 'Sin mensajes';
  }

  formatLastMessageTime(chat: Chat): string {
    if (!chat.lastMessage?.timestamp) return '';
    
    const messageDate = new Date(chat.lastMessage.timestamp);
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
}
