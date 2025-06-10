import { Component, inject, input, linkedSignal, signal, computed, viewChild, ElementRef, effect, AfterViewInit } from '@angular/core';
import { ChatData, Message, MessagesListResponse } from '../../models/chat.models';
import { HttpClient, httpResource } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { ChatStateService } from '../../services/chat-state.service';

@Component({
  selector: 'app-chat-messages',
  imports: [],
  standalone: true,
  templateUrl: './chat-messages.html',
  styleUrl: './chat-messages.scss'
})
export class ChatMessages implements AfterViewInit {
  private readonly http = inject(HttpClient);
  private readonly chatStateService = inject(ChatStateService);

  // Referencia al contenedor de mensajes para el scroll
  messagesContainer = viewChild<ElementRef>('messagesContainer');

  // Flag para evitar cargas múltiples de mensajes históricos
  private isLoadingMore = false;
  
  // Variables para manejar el scroll fluido durante la carga de mensajes
  private savedScrollPosition = 0;
  private savedScrollHeight = 0;
  private shouldMaintainScrollPosition = false;

  // Signal para mostrar el indicador de carga de scroll infinito
  isLoadingHistory = signal(false);

  // Input usando signals (Angular 20)
  selectedChat = input<ChatData | null>(null);

  limit = signal(100);
  cursor = signal<string>('');

  // Signal para acumular todos los mensajes HTTP
  allMessages = signal<Message[]>([]);

  messagesResource = httpResource<MessagesListResponse>(() => {
    if (!this.selectedChat()) return undefined;
    return {
      url: `${environment.apiUrl}/chats/${this.selectedChat()?.id}/messages`,
      method: 'GET',
      params: {
        limit: this.limit(),
        cursor: this.cursor()
      }
    };
  });

  // Computed signal que determina si es la primera carga
  private isFirstLoad = computed(() => this.cursor() === '');

  message = linkedSignal(() => {
    const chat = this.selectedChat();
    if (!chat) return [];

    // Usar mensajes acumulados en lugar de messagesResource.value()
    const httpMessages = this.allMessages();

    // Obtener mensajes en tiempo real del estado
    const stateMessages = this.chatStateService.messages();

    // Si no hay mensajes en tiempo real, usar solo los del HTTP
    if (stateMessages.length === 0) {
      return httpMessages;
    }

    // Combinar mensajes: HTTP + nuevos del WebSocket
    // Filtrar mensajes del estado que no estén ya en httpMessages
    const httpMessageIds = new Set(httpMessages.map(msg => msg.id));
    const newStateMessages = stateMessages.filter(msg => !httpMessageIds.has(msg.id));

    // Convertir nuevos mensajes del estado para compatibilidad con template
    const convertedStateMessages = newStateMessages.map(msg => ({
      ...msg,
      createdAt: msg.timestamp || new Date().toISOString()
    }));

    // Combinar y ordenar por timestamp
    const allMessages = [...httpMessages, ...convertedStateMessages];
    return allMessages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  });

  // Método para formatear la hora del mensaje considerando UTC
  formatMessageTime(createdAt: string): string {
    if (!createdAt) return '';

    // Crear fecha desde string ISO (que viene del servidor en UTC)
    const date = new Date(createdAt);

    // Convertir a zona horaria local del usuario
    const localHours = date.getHours().toString().padStart(2, '0');
    const localMinutes = date.getMinutes().toString().padStart(2, '0');

    return `${localHours}:${localMinutes}`;
  }

  // Método para determinar si el mensaje es enviado o recibido
  isMessageSent(senderId: string): boolean {
    const chat = this.selectedChat();
    if (!chat) return false;

    const visitor = chat.participants.find(p => p.isVisitor);
    return senderId !== visitor?.id;
  }

  nextPage() {
    const messagesResponse = this.messagesResource.value();
    console.log('📜 [ChatMessages] Cargando siguiente página de mensajes');

    if (messagesResponse && messagesResponse.hasMore) {
      // Actualizar cursor para la siguiente página
      this.cursor.set(messagesResponse.cursor || '');
      console.log('📜 [ChatMessages] Nuevo cursor establecido:', this.cursor());
    }
  }

  // Método para resetear mensajes (útil al cambiar de chat)
  resetMessages() {
    this.cursor.set('');
    this.allMessages.set([]);
    this.isLoadingMore = false;
    this.shouldMaintainScrollPosition = false;
    this.savedScrollPosition = 0;
    this.savedScrollHeight = 0;
    this.isLoadingHistory.set(false);
    console.log('📜 [ChatMessages] Mensajes reseteados');
  }

  // Función para generar separadores de fecha dinámicos considerando UTC
  getDateSeparator(date: string | Date): string {
    if (!date) return '';

    // Crear fecha desde string ISO (UTC) y convertir a zona horaria local
    const messageDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    // Normalizar fechas para comparar solo día/mes/año en zona horaria local
    const normalizeDate = (d: Date) => {
      const localDate = new Date(d.getTime());
      return new Date(localDate.getFullYear(), localDate.getMonth(), localDate.getDate());
    };

    const normalizedMessageDate = normalizeDate(messageDate);
    const normalizedToday = normalizeDate(today);
    const normalizedYesterday = normalizeDate(yesterday);

    // Si es hoy
    if (normalizedMessageDate.getTime() === normalizedToday.getTime()) {
      return 'Hoy';
    }

    // Si es ayer
    if (normalizedMessageDate.getTime() === normalizedYesterday.getTime()) {
      return 'Ayer';
    }

    // Calcular diferencia en días
    const diffTime = normalizedToday.getTime() - normalizedMessageDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Si está dentro de la semana (últimos 7 días)
    if (diffDays > 0 && diffDays <= 7) {
      const daysOfWeek = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
      return daysOfWeek[messageDate.getDay()];
    }

    // Si no está dentro de la semana, mostrar fecha completa en zona horaria local
    const months = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];

    const day = messageDate.getDate();
    const month = months[messageDate.getMonth()];
    const year = messageDate.getFullYear();

    return `${day} de ${month} de ${year}`;
  }

  // Función para agrupar mensajes por fecha en zona horaria local
  getGroupedMessages() {
    const messages = this.message();
    if (!messages || messages.length === 0) return [];

    // Primero ordenar todos los mensajes por fecha (más antiguos primero)
    const sortedMessages = [...messages].sort((a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    const groups: { date: string, dateLabel: string, messages: any[] }[] = [];

    sortedMessages.forEach(message => {
      // Convertir UTC a zona horaria local
      const messageDate = new Date(message.createdAt);

      // Crear clave única basada en fecha local (año-mes-día)
      const dateKey = `${messageDate.getFullYear()}-${messageDate.getMonth()}-${messageDate.getDate()}`;
      const dateLabel = this.getDateSeparator(message.createdAt);

      let existingGroup = groups.find(group => group.date === dateKey);

      if (!existingGroup) {
        existingGroup = {
          date: dateKey,
          dateLabel: dateLabel,
          messages: []
        };
        groups.push(existingGroup);
      }

      existingGroup.messages.push(message);
    });

    // Los grupos ya están ordenados por fecha (más antiguos primero)
    // Los mensajes dentro de cada grupo también están ordenados (más antiguos primero)
    return groups;
  }

  // Método para determinar si un mensaje está pendiente (programación positiva)
  isMessagePending(message: any): boolean {
    return message.metadata?.isPending === true;
  }

  // Método para determinar si un mensaje está confirmado
  isMessageConfirmed(message: any): boolean {
    return message.metadata?.isPending === false && message.metadata?.isTemporary === false;
  }

  constructor() {
    // Effect para acumular mensajes cuando cambian los datos del httpResource
    effect(() => {
      const newData = this.messagesResource.value();
      const isFirst = this.isFirstLoad();
      const currentChat = this.selectedChat();

      if (newData?.messages && currentChat) {
        if (isFirst) {
          // Primera carga: reemplazar todos los mensajes
          this.allMessages.set(newData.messages);
          console.log('📜 [ChatMessages] Primera carga:', newData.messages.length, 'mensajes');
        } else {
          // Cargas posteriores: acumular mensajes (añadir al principio para orden cronológico)
          this.allMessages.update(current => {
            const existingIds = new Set(current.map(msg => msg.id));
            const newMessages = newData.messages.filter(msg => !existingIds.has(msg.id));

            // Añadir nuevos mensajes al principio (son más antiguos)
            const combined = [...newMessages, ...current];
            console.log('📜 [ChatMessages] Mensajes acumulados:', newMessages.length, 'nuevos,', combined.length, 'total');
            return combined;
          });
          
          // Si estamos cargando más mensajes, mantener la posición de scroll
          if (this.shouldMaintainScrollPosition) {
            this.maintainScrollPosition();
          }
        }
        
        // Si no hay más mensajes para cargar, ocultar el indicador
        if (!newData.hasMore && this.isLoadingHistory()) {
          this.isLoadingHistory.set(false);
          this.isLoadingMore = false;
        }
      }
    });

    // Effect para resetear mensajes cuando cambia el chat seleccionado
    effect(() => {
      const chat = this.selectedChat();
      if (chat) {
        this.resetMessages();
        console.log('📜 [ChatMessages] Chat cambiado, mensajes reseteados para:', chat.id);
      }
    }, { allowSignalWrites: true });

    // Effect para hacer scroll automático cuando cambian los mensajes
    effect(() => {
      const messages = this.message();
      const chat = this.selectedChat();

      if (messages.length > 0 && chat && this.isFirstLoad()) {
        // Solo hacer scroll automático en la primera carga, no al cargar más mensajes históricos
        setTimeout(() => {
          this.scrollToBottom();
        }, 0);
      }
    });
  }

  ngAfterViewInit() {
    // Scroll inicial cuando se carga el componente
    this.scrollToBottom();

    // Configurar listener para scroll al top (cargar más mensajes históricos)
    this.setupScrollListener();
  }

  /**
   * Hace scroll automático hacia abajo en el contenedor de mensajes
   */
  private scrollToBottom(): void {
    try {
      const container = this.messagesContainer()?.nativeElement;
      if (container) {
        container.scrollTop = container.scrollHeight;
        console.log('📜 [ChatMessages] Scroll automático hacia abajo ejecutado');
      }
    } catch (error) {
      console.error('❌ [ChatMessages] Error al hacer scroll automático:', error);
    }
  }

  /**
   * Configura el listener para detectar scroll al top y cargar más mensajes
   */
  private setupScrollListener(): void {
    const container = this.messagesContainer()?.nativeElement;
    if (!container) return;

    let lastScrollTop = 0;
    let scrollTimeout: ReturnType<typeof setTimeout> | null = null;

    container.addEventListener('scroll', () => {
      const currentScrollTop = container.scrollTop;
      
      // Detectar cuando el scroll está cerca del top (tolerancia de 50px)
      // Y asegurar que el usuario está scrolleando hacia arriba
      if (currentScrollTop <= 50 && 
          currentScrollTop < lastScrollTop && 
          !this.isLoadingMore && 
          !this.shouldMaintainScrollPosition) {
        
        // Debounce para evitar múltiples cargas rápidas
        if (scrollTimeout) {
          clearTimeout(scrollTimeout);
        }
        
        scrollTimeout = setTimeout(() => {
          console.log('📜 [ChatMessages] Scroll detectado en el top, cargando más mensajes...');
          this.loadMoreMessages();
          scrollTimeout = null;
        }, 100);
      }
      
      lastScrollTop = currentScrollTop;
    });
  }

  /**
   * Carga más mensajes históricos cuando el usuario hace scroll al top
   */
  private loadMoreMessages(): void {
    const messagesResponse = this.messagesResource.value();
    const container = this.messagesContainer()?.nativeElement;

    if (!container) return;

    // Verificar si hay más mensajes para cargar
    if (!messagesResponse || !messagesResponse.hasMore) {
      console.log('📜 [ChatMessages] No hay más mensajes históricos para cargar');
      return;
    }

    // Evitar cargas múltiples simultáneas
    if (this.isLoadingMore) {
      console.log('📜 [ChatMessages] Ya se está cargando más mensajes, ignorando...');
      return;
    }

    this.isLoadingMore = true;
    this.shouldMaintainScrollPosition = true;
    this.isLoadingHistory.set(true);
    console.log('📜 [ChatMessages] Iniciando carga de más mensajes históricos...');

    // Guardar la posición de scroll actual para mantenerla después de cargar
    this.savedScrollHeight = container.scrollHeight;
    this.savedScrollPosition = container.scrollTop;

    // Ejecutar nextPage() para cargar más mensajes
    this.nextPage();
  }

  /**
   * Mantiene la posición de scroll después de cargar nuevos mensajes históricos
   */
  private maintainScrollPosition(): void {
    const container = this.messagesContainer()?.nativeElement;
    if (!container || !this.shouldMaintainScrollPosition) return;

    // Usar requestAnimationFrame para asegurar que el DOM se haya actualizado
    requestAnimationFrame(() => {
      if (!container) return;

      const newScrollHeight = container.scrollHeight;
      const heightDifference = newScrollHeight - this.savedScrollHeight;
      
      // Calcular la nueva posición de scroll manteniendo la posición relativa
      const newScrollTop = this.savedScrollPosition + heightDifference;
      
      // Aplicar el nuevo scroll de forma suave
      container.scrollTop = Math.max(newScrollTop, 50); // Mínimo 50px del top
      
      console.log('📜 [ChatMessages] Posición de scroll mantenida de forma fluida');
      console.log('📜 [ChatMessages] Altura anterior:', this.savedScrollHeight, 'Nueva altura:', newScrollHeight);
      console.log('📜 [ChatMessages] Scroll anterior:', this.savedScrollPosition, 'Nuevo scroll:', container.scrollTop);
      
      // Resetear flags con un pequeño delay para mostrar el resultado de la carga
      setTimeout(() => {
        this.shouldMaintainScrollPosition = false;
        this.isLoadingMore = false;
        this.isLoadingHistory.set(false);
      }, 300); // 300ms para mostrar brevemente el resultado antes de ocultar el loader
    });
  }
}