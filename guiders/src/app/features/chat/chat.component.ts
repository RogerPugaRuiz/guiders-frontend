import { Component, AfterViewInit, OnInit, PLATFORM_ID, Inject, ElementRef, ViewChild, Renderer2 } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { GhSelectComponent, GhSelectOption } from '../../shared/components/gh-select/gh-select.component';
import { FormsModule } from '@angular/forms';
import { ChatService } from './services/chat.service';
import { CHAT_PROVIDERS } from './infrastructure/chat-config.providers';

// Import types to avoid potential barrel export issues
export interface Chat {
  id: string;
  participants: Participant[];
  status: 'active' | 'inactive' | 'closed' | 'waiting';
  lastMessage?: Message;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

export interface Participant {
  id: string;
  name: string;
  role: 'visitor' | 'commercial';
  isOnline: boolean;
  joinedAt: Date;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'system';
  timestamp: Date;
  isRead: boolean;
  metadata?: Record<string, any>;
}

export interface ChatListResponse {
  data: Chat[];
  pagination: {
    cursor?: string;
    nextCursor?: string;
    hasMore: boolean;
    limit: number;
    total?: number;
  };
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, GhSelectComponent, FormsModule],
  providers: [CHAT_PROVIDERS, ChatService],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit, AfterViewInit {
  @ViewChild('trackingInfoPanel') trackingInfoPanel!: ElementRef;
  
  // Variables para manejar el estado del panel de tracking
  showTrackingPanel = false;
  
  // Variables para el manejo de chats
  chats: Chat[] = [];
  isLoading = false;
  error: string | null = null;
  
  // Agregar una propiedad para manejar el estado de carga del botón Retry
  isRetryLoading = false;

  // Opciones para el selector de filtro
  filterOptions: GhSelectOption[] = [
    { value: 'all', label: 'Todas' },
    { value: 'unassigned', label: 'Sin asignar' },
    { value: 'active', label: 'Activas' },
    { value: 'closed', label: 'Cerradas' }
  ];
  
  selectedFilterValue: string = 'all';
  
  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private renderer: Renderer2,
    private chatService: ChatService
  ) {}
  
  ngOnInit(): void {
    this.loadChats();
  }
  
  ngAfterViewInit(): void {
    // Solo ejecutar en el navegador, no durante SSR
    if (isPlatformBrowser(this.platformId)) {
      this.setupTrackingPanel();
    }
  }
  
  // Método para cargar los chats desde el servicio
  loadChats(): void {
    this.isLoading = true;
    this.isRetryLoading = true; // Activar el spinner
    this.error = null;

    this.chatService.getChats({ include: [] }).subscribe({
      next: (response: ChatListResponse) => {
        this.chats = response.data;
        this.isLoading = false;
        this.isRetryLoading = false; // Desactivar el spinner
      },
      error: (error: unknown) => {
        this.error = 'Error al cargar los chats. Por favor, intente nuevamente.';
        this.isLoading = false;
        this.isRetryLoading = false; // Desactivar el spinner
        console.error('Error loading chats:', error);
      }
    });
  }
  
  // Método para obtener las iniciales de un participante
  getParticipantInitials(chat: Chat): string {
    const visitor = chat.participants.find(p => p.role === 'visitor');
    if (visitor && visitor.name) {
      return visitor.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return 'VS';
  }
  
  // Método para obtener el nombre del participante visitante
  getVisitorName(chat: Chat): string {
    const visitor = chat.participants.find(p => p.role === 'visitor');
    return visitor?.name || 'Visitante';
  }
  
  // Método para verificar si hay participantes online
  hasOnlineParticipant(chat: Chat): boolean {
    return chat.participants.some(p => p.isOnline);
  }
  
  // Método para obtener el estado CSS del participante
  getParticipantStatusClass(chat: Chat): string {
    const visitor = chat.participants.find(p => p.role === 'visitor');
    if (visitor?.isOnline) {
      return 'chat-item__status--online';
    }
    return 'chat-item__status--offline';
  }
  
  // Método para formatear la fecha del último mensaje
  formatLastMessageTime(chat: Chat): string {
    if (!chat.lastMessage) return '';
    
    const messageDate = new Date(chat.lastMessage.timestamp);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - messageDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      // Mismo día - mostrar hora
      return messageDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInDays === 1) {
      return 'Ayer';
    } else if (diffInDays < 7) {
      // Menos de una semana - mostrar día de la semana
      return messageDate.toLocaleDateString('es-ES', { weekday: 'short' });
    } else {
      // Más de una semana - mostrar fecha
      return messageDate.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
    }
  }
  
  // Método para obtener la vista previa del último mensaje
  getLastMessagePreview(chat: Chat): string {
    if (!chat.lastMessage) return 'Sin mensajes';
    return chat.lastMessage.content.length > 60 
      ? chat.lastMessage.content.substring(0, 60) + '...'
      : chat.lastMessage.content;
  }
  
  // Método para trackBy en el ngFor
  trackByChat(index: number, chat: Chat): string {
    return chat.id;
  }
  
  // Método para filtrar chats según el filtro seleccionado
  get filteredChats(): Chat[] {
    if (!this.chats) return [];
    
    switch (this.selectedFilterValue) {
      case 'unassigned':
        return this.chats.filter(chat => chat.status === 'waiting');
      case 'active':
        return this.chats.filter(chat => chat.status === 'active');
      case 'closed':
        return this.chats.filter(chat => chat.status === 'closed');
      case 'all':
      default:
        return this.chats;
    }
  }

  private setupTrackingPanel(): void {
    // El acceso al DOM ya es seguro aquí porque verificamos que estamos en el navegador
  }
  
  // Métodos para manejar los eventos de click (usando Angular en lugar de manipulación directa del DOM)
  toggleTrackingInfo(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.showTrackingPanel = !this.showTrackingPanel;
    }
  }
  
  closeTrackingInfo(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.showTrackingPanel = false;
    }
  }
  
  // Método para manejar el cambio de filtro
  onFilterChange(value: string): void {
    this.selectedFilterValue = value;
    // El filtrado se maneja automáticamente a través del getter filteredChats
  }
  
  // Aquí se podrían agregar métodos para obtener datos reales de tracking
  // Por ejemplo:
  // - getCurrentPageInfo()
  // - getVisitedPages()
  // - getDeviceInfo()
  // - getVisitorLocation()
  // - getSessionDuration()

  retryLoadChats(): void {
    this.isRetryLoading = true; // Mostrar el spinner
    this.loadChats();

    // Ocultar el spinner después de 2 segundos
    setTimeout(() => {
      this.isRetryLoading = false;
    }, 2000);
  }
}
