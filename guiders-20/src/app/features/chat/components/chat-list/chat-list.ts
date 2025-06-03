import { Component, inject, OnInit, OnDestroy, signal, computed, effect, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, catchError, of, map, startWith, Subject, takeUntil } from 'rxjs';

import { Chat, ChatStatus, Participant } from '../../../../../../../libs/feature/chat/domain/entities/chat.entity';
import { ChatService } from '../../services/chat.service';
import { WebSocketService } from '../../../../core/services/websocket.service';
import { HttpClient } from '@angular/common/http';
import { AvatarService } from '../../../../core/services/avatar.service';

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
export class ChatListComponent implements OnInit, OnDestroy {
  private chatService = inject(ChatService);
  private cdr = inject(ChangeDetectorRef);
  private avatarService = inject(AvatarService);
  private destroy$ = new Subject<void>();

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

  // Signal para almacenar los chats
  chats = signal<Chat[]>([]);

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

  constructor() {
    // Effect para debugging - monitora cambios en el signal de chats
    effect(() => {
      const chats = this.chats();
      console.log('🔄 Effect: Chats signal changed:', {
        count: chats?.length || 0,
        chats: chats,
        isArray: Array.isArray(chats)
      });
    });

    // Effect para debugging - monitora el estado de loading
    effect(() => {
      const loading = this.isLoading();
      console.log('🔄 Effect: Loading state changed:', loading);
    });

    // Effect para debugging - monitora el estado de error
    effect(() => {
      const error = this.error();
      console.log('🔄 Effect: Error state changed:', error);
    });

    // Effect para debugging - monitora los chats filtrados
    effect(() => {
      const filtered = this.filteredChats();
      console.log('🔄 Effect: Filtered chats changed:', {
        count: filtered?.length || 0,
        filtered: filtered
      });
    });
  }

  ngOnInit() {
    this.loadChats();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadChats() {
    console.log('🚀 [ChatList] Iniciando carga de chats...');
    this.isLoading.set(true);
    this.error.set(null);
    
    console.log('🔧 [ChatList] Llamando chatService.getChats...');
    this.chatService.getChats({ limit: 50 }).subscribe({
      next: (response) => {
        console.log('📨 [ChatList] Respuesta recibida del servicio:', {
          response,
          responseType: typeof response,
          hasResponse: !!response,
          responseKeys: response ? Object.keys(response) : 'No response'
        });
        
        // Extraer los chats de la respuesta normalizada
        const chats = response.data || [];
        console.log('📝 [ChatList] Chats extraídos:', {
          chats,
          length: chats.length,
          isArray: Array.isArray(chats),
          firstItem: chats[0]
        });
        
        // Asignar los chats al signal
        this.chats.set(chats);
        
        console.log('✅ [ChatList] Chats asignados al signal. Verificando estado:', {
          signalValue: this.chats(),
          signalLength: this.chats().length,
          signalIsArray: Array.isArray(this.chats())
        });
        
        this.isLoading.set(false);
        
        // Forzar detección de cambios
        this.cdr.detectChanges();
        console.log('🔄 [ChatList] Detección de cambios forzada');
      },
      error: (error) => {
        console.error('❌ [ChatList] Error loading chats:', error);
        this.error.set('Error al cargar los chats. Por favor, inténtalo de nuevo.');
        this.isLoading.set(false);
        this.cdr.detectChanges();
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
        console.log('Chats recargados:', response);
        const chats = response.data || [];
        this.chats.set(chats);
        this.isRetryLoading.set(false);
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error retrying chats:', error);
        this.error.set('Error al cargar los chats. Por favor, inténtalo de nuevo.');
        this.isRetryLoading.set(false);
        this.cdr.detectChanges();
      }
    });
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
}
