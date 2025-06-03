import { Component, ElementRef, OnInit, viewChild, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../services/chat.service';
import { ChatData, ChatListResponse, SelectOption } from '../../models/chat.models';
import { ChatListComponent } from '../chat-list/chat-list';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [FormsModule, ChatListComponent],
  templateUrl: './chat.html',
  styleUrls: ['./chat.scss']
})
export class ChatComponent implements OnInit {
  // Referencias a elementos del template usando viewChild signal
  trackingInfoPanel = viewChild<ElementRef>('trackingInfoPanel');
  messageTextarea = viewChild<ElementRef<HTMLTextAreaElement>>('messageTextarea');
  
  // Inyección de servicios usando la función inject()
  private chatService = inject(ChatService);
  
  // Estado utilizando signals (nuevo en Angular 20)
  chats = signal<ChatData[]>([]);
  selectedFilterValue = signal<string>('all');
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);
  isRetryLoading = signal<boolean>(false);
  showTrackingPanel = signal<boolean>(false);
  currentMessage = signal<string>('');
  
  // Opciones para el selector de filtro
  filterOptions: SelectOption[] = [
    { value: 'all', label: 'Todas' },
    { value: 'unassigned', label: 'Sin asignar' },
    { value: 'active', label: 'Activas' },
    { value: 'closed', label: 'Cerradas' }
  ];
  
  // Valores calculados usando computed
  filteredChats = computed(() => {
    if (this.chats().length === 0) return [];
    
    switch (this.selectedFilterValue()) {
      case 'unassigned':
        return this.chats().filter(chat => chat.status === 'waiting');
      case 'active':
        return this.chats().filter(chat => chat.status === 'active');
      case 'closed':
        return this.chats().filter(chat => chat.status === 'closed');
      case 'all':
      default:
        return this.chats();
    }
  });

  // Estados calculados para la UI
  hasChats = computed(() => this.chats().length > 0);
  showEmptyState = computed(() => !this.isLoading() && !this.error() && this.filteredChats().length === 0);
  showErrorState = computed(() => this.error() !== null && !this.isLoading());
  canSendMessage = computed(() => this.currentMessage().trim().length > 0);
  
  ngOnInit(): void {
    this.loadChats();
  }
  
  // Método para cargar los chats desde el servicio
  loadChats(): void {
    this.isLoading.set(true);
    this.isRetryLoading.set(true);
    this.error.set(null);

    const params = { include: [] as string[] };
    
    this.chatService.getChats(params).subscribe({
      next: (response: ChatListResponse) => {
        const chats = response.data || [];
        this.chats.set(chats);
        this.isLoading.set(false);
        this.isRetryLoading.set(false);
      },
      error: (error: unknown) => {
        this.error.set('Error al cargar los chats. Por favor, intente nuevamente.');
        this.isLoading.set(false);
        this.isRetryLoading.set(false);
        console.error('Error loading chats:', error);
      }
    });
  }
  
  // Método para obtener las iniciales de un participante
  getParticipantInitials(chat: ChatData): string {
    const visitor = chat.participants.find(p => p.role === 'visitor');
    if (visitor?.name) {
      return visitor.name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return 'VS';
  }
  
  // Método para obtener el nombre del participante visitante
  getVisitorName(chat: ChatData): string {
    const visitor = chat.participants.find(p => p.role === 'visitor');
    return visitor?.name || 'Visitante';
  }
  
  // Método para verificar si hay participantes online
  hasOnlineParticipant(chat: ChatData): boolean {
    return chat.participants.some(p => p.isOnline);
  }
  
  // Método para obtener el estado CSS del participante
  getParticipantStatusClass(chat: ChatData): string {
    const visitor = chat.participants.find(p => p.role === 'visitor');
    if (visitor?.isOnline) {
      return 'chat-item__status--online';
    }
    return 'chat-item__status--offline';
  }
  
  // Método para formatear la fecha del último mensaje
  formatLastMessageTime(chat: ChatData): string {
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
  getLastMessagePreview(chat: ChatData): string {
    if (!chat.lastMessage) return 'Sin mensajes';
    return chat.lastMessage.content.length > 60 
      ? chat.lastMessage.content.substring(0, 60) + '...'
      : chat.lastMessage.content;
  }
  
  // Métodos para manejar los eventos de click
  toggleTrackingInfo(): void {
    this.showTrackingPanel.update(value => !value);
  }
  
  closeTrackingInfo(): void {
    this.showTrackingPanel.set(false);
  }
  
  // Método para manejar el cambio de filtro
  onFilterChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedFilterValue.set(target.value);
  }
  
  // Método para reintentar cargar chats
  retryLoadChats(): void {
    this.isRetryLoading.set(true);
    this.loadChats();
  }

  // Métodos para manejar el envío de mensajes
  onMessageInput(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    this.currentMessage.set(target.value);
    this.adjustTextareaHeight();
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      if (event.shiftKey) {
        // Shift + Enter: permitir salto de línea (comportamiento por defecto)
        return;
      } else {
        // Enter solo: enviar mensaje si es válido
        event.preventDefault();
        if (this.canSendMessage()) {
          this.sendMessage();
        }
      }
    }
  }

  sendMessage(): void {
    if (!this.canSendMessage()) return;
    
    const message = this.currentMessage().trim();
    // Aquí se implementaría la lógica para enviar el mensaje al servicio
    console.log('Enviando mensaje:', message);
    
    // Limpiar el textarea
    this.currentMessage.set('');
    const textarea = this.messageTextarea();
    if (textarea) {
      textarea.nativeElement.value = '';
      this.adjustTextareaHeight();
    }
  }

  private adjustTextareaHeight(): void {
    const textareaRef = this.messageTextarea();
    if (textareaRef) {
      const textarea = textareaRef.nativeElement;
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  }
}