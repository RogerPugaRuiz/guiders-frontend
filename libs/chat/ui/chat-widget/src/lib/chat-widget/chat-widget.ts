import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  computed,
  inject,
  ChangeDetectorRef,
  ViewChild,
  ElementRef,
  AfterViewChecked
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { ChatWidgetService, WidgetState } from '@guiders-frontend/chat/data-access/chat-widget-service';
import { ChatService } from '@guiders-frontend/chat-service';
import { MessageInput } from '@guiders-frontend/chat/ui/message-input';
import { Message, SendMessageRequest, Visitor } from '@guiders-frontend/shared/types';
import { UserService } from '@guiders-frontend/auth/data-access/session';

@Component({
  selector: 'guiders-chat-widget',
  standalone: true,
  imports: [CommonModule, MessageInput],
  templateUrl: './chat-widget.html',
  styleUrls: ['./chat-widget.scss']
})
export class ChatWidgetComponent implements OnInit, OnDestroy, AfterViewChecked {
  private readonly widgetService = inject(ChatWidgetService);
  private readonly chatService = inject(ChatService);
  private readonly userService = inject(UserService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  @ViewChild('messagesContainer') messagesContainer?: ElementRef<HTMLDivElement>;
  @ViewChild('scrollAnchor') scrollAnchor?: ElementRef<HTMLDivElement>;
  
  // Estado del widget
  readonly widgetState = signal<WidgetState>('closed');
  readonly currentVisitor = signal<Visitor | null>(null);
  readonly currentChatId = signal<string | null>(null);
  readonly currentUserId = signal<string | null>(null); // Se obtiene dinámicamente cuando se necesita
  readonly messages = signal<Message[]>([]);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly shouldShow = signal<boolean>(true);
  
  // Control de scroll infinito
  readonly isLoadingMore = signal<boolean>(false);
  readonly hasMoreMessages = signal<boolean>(false);
  private nextCursor: string | undefined = undefined;
  private intersectionObserver?: IntersectionObserver;
  private isHandlingIntersection = false;
  
  // Control de auto-scroll
  private shouldScrollToBottom = false;
  private isNearBottom = true;
  private previousScrollHeight = 0;
  
  // Control para evitar carga duplicada al crear chat
  private isCreatingChat = false;

  // Computed
  readonly isOpen = computed(() => this.widgetState() === 'open');
  readonly isMinimized = computed(() => this.widgetState() === 'minimized');
  readonly isClosed = computed(() => this.widgetState() === 'closed');
  readonly isVisible = computed(() => !this.isClosed() && this.shouldShow());

  readonly visitorName = computed(() => {
    const visitor = this.currentVisitor();
    return visitor?.name || visitor?.email || 'Visitante anónimo';
  });

  ngOnInit(): void {
    // Suscribirse al estado del widget
    this.widgetService.widgetData$
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        console.log('[ChatWidget] Estado actualizado:', data);
        
        const previousChatId = this.currentChatId();
        const isNewChat = data.chatId && data.chatId !== previousChatId;
        const isNewVisitor = data.visitor && (!this.currentVisitor() || data.visitor.id !== this.currentVisitor()?.id);
        
        // 🔄 Si hay un cambio de chat o visitante, limpiar estado anterior
        if ((isNewChat || isNewVisitor) && previousChatId) {
          console.log('[ChatWidget] 🧹 Limpiando estado anterior - Chat anterior:', previousChatId, 'Nuevo chat:', data.chatId);
          
          // Salir de la sala WebSocket anterior
          this.chatService.webSocketService.leaveRoom(previousChatId);
          
          // Limpiar mensajes y errores
          this.messages.set([]);
          this.error.set(null);
        }
        
        this.widgetState.set(data.state);
        this.currentVisitor.set(data.visitor);
        this.currentChatId.set(data.chatId);

        // ⚠️ Si estamos creando un chat, NO cargar mensajes aquí
        // La carga ya se está manejando en createChatWithFirstMessage()
        if (this.isCreatingChat) {
          console.log('[ChatWidget] ⏭️ Saltando carga de mensajes - chat en creación');
          return;
        }

        // Si se abre el widget con un chatId, cargar mensajes
        if (data.state === 'open' && data.chatId) {
          this.loadMessages(data.chatId);
        }

        // Si se abre el widget sin chatId, solo mostrar el widget vacío
        // El chat se creará cuando el usuario envíe el primer mensaje
        if (data.state === 'open' && !data.chatId && data.visitor) {
          console.log('[ChatWidget] Widget abierto sin chat - esperando primer mensaje del usuario');
          this.messages.set([]);
          this.error.set(null);
          this.loading.set(false);
        }

        this.cdr.detectChanges();
      });

    // Suscribirse a la visibilidad según la ruta
    this.widgetService.shouldShow$
      .pipe(takeUntil(this.destroy$))
      .subscribe(shouldShow => {
        this.shouldShow.set(shouldShow);
        this.cdr.detectChanges();
      });

    // Suscribirse a mensajes del WebSocket
    this.chatService.webSocketService.messageReceived$
      .pipe(takeUntil(this.destroy$))
      .subscribe(message => {
        if (message && message.chatId === this.currentChatId()) {
          console.log('[ChatWidget] Nuevo mensaje recibido via WebSocket:', message);
          
          // ✨ FILTRAR MENSAJES PROPIOS - Ya fueron agregados por la respuesta HTTP
          const currentUserId = this.userService.getUserId();
          if (currentUserId && message.senderId === currentUserId) {
            console.log('[ChatWidget] ⏭️ Mensaje propio ignorado (ya agregado por HTTP):', message.messageId);
            return;
          }
          
          console.log('[ChatWidget] ✅ Mensaje de otro usuario, agregando:', message.messageId);
          this.addMessageToList(message);
          this.shouldScrollToBottom = true;
          this.cdr.detectChanges();
        }
      });
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom && this.messagesContainer) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  ngOnDestroy(): void {
    this.cleanupIntersectionObserver();
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Crear un nuevo chat con el primer mensaje del usuario
   */
  private createChatWithFirstMessage(visitor: Visitor, firstMessageContent: string): void {
    console.log('[ChatWidget] 🆕 Creando nuevo chat con primer mensaje para:', visitor.name || visitor.id);
    
    // Limpiar estado anterior
    this.messages.set([]);
    this.error.set(null);
    this.loading.set(true);
    
    // 🚩 Activar bandera para evitar carga duplicada
    this.isCreatingChat = true;

    // Construir location si hay city y/o country
    const location = [visitor.city, visitor.country].filter(Boolean).join(', ') || undefined;

    this.chatService.createChatWithMessage({
      firstMessage: {
        content: firstMessageContent,
        type: 'text'
      },
      visitorInfo: {
        visitorId: visitor.id, // REQUERIDO para comerciales
        name: visitor.name,
        email: visitor.email,
        phone: visitor.phone,
        location: location
      },
      metadata: {
        department: 'sales',
        priority: 'NORMAL',
        source: visitor.source || 'website',
        initialUrl: visitor.currentUrl
      }
    }).subscribe({
      next: (result) => {
        if (result && result.chatId && result.messageId) {
          console.log('[ChatWidget] ✅ Chat creado exitosamente:', result.chatId);
          
          this.currentChatId.set(result.chatId);
          
          // Obtener userId del UserService
          const userId = this.userService.getUserId();
          
          if (!userId) {
            console.error('[ChatWidget] ❌ No se puede crear mensaje sin userId');
            this.error.set('Error de autenticación. Por favor, recarga la página.');
            this.loading.set(false);
            this.isCreatingChat = false;
            return;
          }
          
          // Crear mensaje optimista
          const optimisticMessage: Message = {
            messageId: result.messageId,
            chatId: result.chatId,
            senderId: userId,
            senderType: 'COMMERCIAL',
            content: firstMessageContent,
            type: 'TEXT',
            sentAt: new Date(),
            status: 'SENT'
          };
          
          this.messages.set([optimisticMessage]);
          this.shouldScrollToBottom = true;
          
          // Unirse a la sala de WebSocket
          this.chatService.webSocketService.joinRoom(result.chatId);
          
          // ✅ Actualizar chatId en el servicio y desactivar la bandera
          setTimeout(() => {
            this.widgetService.updateChatId(result.chatId);
            this.isCreatingChat = false;
            console.log('[ChatWidget] ✅ Bandera de creación desactivada');
          }, 100);
        }
        this.loading.set(false);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('[ChatWidget] Error al crear chat:', err);
        this.error.set('No se pudo crear el chat. Por favor, intenta nuevamente.');
        this.loading.set(false);
        this.isCreatingChat = false; // Desactivar bandera en caso de error
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Cargar mensajes de un chat existente
   */
  private loadMessages(chatId: string): void {
    console.log('[ChatWidget] 📥 Cargando mensajes para chat:', chatId);
    
    // Limpiar mensajes anteriores antes de cargar los nuevos
    this.messages.set([]);
    this.error.set(null);
    this.loading.set(true);
    this.nextCursor = undefined;
    this.hasMoreMessages.set(false);

    this.chatService.getMessagesV2(chatId, { 
      limit: 50
      // El endpoint por defecto devuelve sentAt DESC (más recientes primero)
    }).subscribe({
        next: (response) => {
          console.log('[ChatWidget] Mensajes cargados:', response.messages.length);
          
          // Los mensajes vienen en orden descendente (más recientes primero)
          // Los revertimos para mostrarlos ascendente (más antiguos arriba)
          const messages = [...response.messages].reverse();
          this.messages.set(messages);

          
          // Configurar paginación
          this.nextCursor = response.nextCursor;
          this.hasMoreMessages.set(response.hasMore);
          
          this.shouldScrollToBottom = true;
          this.loading.set(false);
          
          // Unirse a la sala de WebSocket
          this.chatService.webSocketService.joinRoom(chatId);
          
          // Configurar scroll infinito si hay más mensajes
          if (response.hasMore) {
            setTimeout(() => {
              this.setupIntersectionObserver();
            }, 500);
          }
          
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('[ChatWidget] Error al cargar mensajes:', err);
          this.error.set('No se pudieron cargar los mensajes.');
          this.loading.set(false);
          this.cdr.detectChanges();
        }
      });
  }

  /**
   * Agregar un mensaje a la lista
   */
  private addMessageToList(message: Message): void {
    const currentMessages = this.messages();
    
    // Evitar duplicados
    const exists = currentMessages.some(m => m.messageId === message.messageId);
    if (!exists) {
      console.log('[ChatWidget] ➕ Agregando mensaje a la lista:', {
        messageId: message.messageId,
        senderId: message.senderId,
        senderType: message.senderType,
        currentUserId: this.currentUserId(),
        willBeOwnMessage: this.isOwnMessage(message)
      });
      this.messages.set([...currentMessages, message]);
    } else {
      console.log('[ChatWidget] ⏭️ Mensaje duplicado, no se agrega:', message.messageId);
    }
  }

  /**
   * Enviar mensaje
   */
  onSendMessage(content: string): void {
    const chatId = this.currentChatId();
    const visitor = this.currentVisitor();

    // Si no hay chatId, es el primer mensaje - crear el chat primero
    if (!chatId && visitor) {
      console.log('[ChatWidget] 🆕 Primer mensaje - creando chat con mensaje:', content);
      this.createChatWithFirstMessage(visitor, content);
      return;
    }

    // Si ya hay chatId, enviar mensaje normal
    // ✨ Obtener userId DIRECTAMENTE del UserService (no usar ChatService)
    const currentUserId = this.userService.getUserId();

    if (!chatId || !currentUserId) {
      console.error('[ChatWidget] No se puede enviar mensaje: falta chatId o userId');
      return;
    }

    const request: SendMessageRequest = {
      chatId,
      content,
      type: 'text'
    };

    console.log('[ChatWidget] Enviando mensaje:', request);
    console.log('[ChatWidget] 🔑 CurrentUserId para mensaje optimista:', currentUserId);

    // Agregar mensaje optimista
    const optimisticMessage: Message = {
      messageId: `temp-${Date.now()}`,
      chatId,
      senderId: currentUserId,
      senderType: 'COMMERCIAL',
      content,
      type: 'TEXT',
      sentAt: new Date(),
      status: 'SENT'
    };

    console.log('[ChatWidget] 📤 Mensaje optimista creado:', {
      messageId: optimisticMessage.messageId,
      senderId: optimisticMessage.senderId,
      senderType: optimisticMessage.senderType,
      currentUserIdSignal: this.currentUserId()
    });

    this.addMessageToList(optimisticMessage);
    this.shouldScrollToBottom = true;
    this.cdr.detectChanges();

    // Enviar mensaje al servidor
    this.chatService.sendMessage(request).subscribe({
      next: (message) => {
        if (message) {
          console.log('[ChatWidget] 📥 Mensaje recibido del servidor:', {
            messageId: message.messageId,
            senderId: message.senderId,
            senderType: message.senderType,
            currentUserIdSignal: this.currentUserId()
          });
          
          // Reemplazar mensaje optimista con el real
          const messages = this.messages().filter(m => m.messageId !== optimisticMessage.messageId);
          this.messages.set([...messages, message]);
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('[ChatWidget] Error al enviar mensaje:', err);
        // Eliminar mensaje optimista en caso de error
        const messages = this.messages().filter(m => m.messageId !== optimisticMessage.messageId);
        this.messages.set(messages);
        this.error.set('No se pudo enviar el mensaje.');
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Minimizar widget
   */
  onMinimize(): void {
    this.widgetService.minimizeWidget();
  }

  /**
   * Restaurar widget desde minimizado
   */
  onRestore(): void {
    this.widgetService.restoreWidget();
  }

  /**
   * Cerrar widget
   */
  onClose(): void {
    const chatId = this.currentChatId();
    console.log('[ChatWidget] 🚪 Cerrando widget - Chat:', chatId);
    
    if (chatId) {
      // Salir de la sala de WebSocket
      this.chatService.webSocketService.leaveRoom(chatId);
    }
    
    // Limpiar completamente el estado
    this.messages.set([]);
    this.error.set(null);
    this.loading.set(false);
    this.currentChatId.set(null);
    this.currentVisitor.set(null);
    
    this.widgetService.closeWidget();
  }

  /**
   * Alternar entre abierto y minimizado
   */
  onToggleMinimize(): void {
    this.widgetService.toggleMinimize();
  }

  /**
   * Scroll al final del contenedor de mensajes
   */
  private scrollToBottom(): void {
    if (this.messagesContainer) {
      const element = this.messagesContainer.nativeElement;
      element.scrollTop = element.scrollHeight;
    }
  }

  /**
   * Detectar si el usuario está cerca del final del scroll
   */
  onScroll(): void {
    if (this.messagesContainer) {
      const element = this.messagesContainer.nativeElement;
      const threshold = 150;
      this.isNearBottom = element.scrollHeight - element.scrollTop - element.clientHeight < threshold;
    }
  }

  /**
   * Formatear fecha del mensaje
   */
  formatMessageTime(date: Date): string {
    const messageDate = new Date(date);
    return messageDate.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  /**
   * Verificar si el mensaje es del usuario actual
   */
  isOwnMessage(message: Message): boolean {
    // ✨ Obtener userId DIRECTAMENTE del UserService (no usar ChatService)
    const currentUserId = this.userService.getUserId();
    
    if (!currentUserId || !message.senderId) {
      return false;
    }
    
    // ✅ Comparar senderId del mensaje con el userId actual
    return message.senderId === currentUserId;
  }

  /**
   * Verificar si es un mensaje del sistema
   */
  isSystemMessage(message: Message): boolean {
    return message.senderType === 'SYSTEM';
  }

  /**
   * Obtener nombre para mostrar del chat
   */
  getChatDisplayName(): string {
    const visitor = this.currentVisitor();
    if (!visitor) return 'Chat';

    if (visitor.name && visitor.name.trim()) {
      return visitor.name;
    }

    if (visitor.email && visitor.email.trim()) {
      return visitor.email;
    }

    return 'Visitante anónimo';
  }

  /**
   * Obtener información del estado del chat
   */
  getChatStatusInfo(): { label: string; color: string } {
    // Como no tenemos info de estado del chat aún, devolvemos "En línea"
    return { label: 'En línea', color: 'success' };
  }

  /**
   * Verificar si debe mostrar separador de fecha
   */
  shouldShowDateSeparator(index: number): boolean {
    const messages = this.messages();
    if (index === 0) return true; // Siempre mostrar para el primer mensaje
    
    const currentMessage = messages[index];
    const previousMessage = messages[index - 1];
    
    if (!currentMessage || !previousMessage) return false;
    
    const currentDate = new Date(currentMessage.sentAt);
    const previousDate = new Date(previousMessage.sentAt);
    
    // Mostrar si son días diferentes
    return currentDate.toDateString() !== previousDate.toDateString();
  }

  /**
   * Formatear separador de fecha
   */
  formatDateSeparator(date: Date): string {
    const messageDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (messageDate.toDateString() === today.toDateString()) {
      return 'Hoy';
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Ayer';
    } else {
      return messageDate.toLocaleDateString('es-ES', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      });
    }
  }

  /**
   * Obtener etiqueta del remitente
   */
  getSenderLabel(message: Message): string {
    if (this.isOwnMessage(message)) {
      return 'Tú';
    }
    
    const visitor = this.currentVisitor();
    return visitor?.name || visitor?.email || 'Visitante';
  }

  /**
   * Track by para ngFor de mensajes
   */
  trackMessageById(index: number, message: Message): string {
    return message.messageId;
  }

  /**
   * Configurar IntersectionObserver para scroll infinito
   */
  private setupIntersectionObserver(): void {
    console.log('[ChatWidget] Configurando IntersectionObserver para scroll infinito');
    
    if (!this.scrollAnchor || !this.messagesContainer) {
      console.warn('[ChatWidget] No se puede configurar observer: elementos no disponibles');
      return;
    }

    this.cleanupIntersectionObserver();

    const options: IntersectionObserverInit = {
      root: this.messagesContainer.nativeElement,
      rootMargin: '50px',
      threshold: 0.1
    };

    this.intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        console.log('[ChatWidget] IntersectionObserver:', {
          isIntersecting: entry.isIntersecting,
          isLoadingMore: this.isLoadingMore(),
          hasMoreMessages: this.hasMoreMessages(),
          isHandlingIntersection: this.isHandlingIntersection
        });

        if (entry.isIntersecting && 
            !this.isLoadingMore() && 
            this.hasMoreMessages() && 
            !this.isHandlingIntersection) {
          
          console.log('[ChatWidget] ✅ Cargando más mensajes antiguos');
          this.isHandlingIntersection = true;
          this.loadMoreMessages();
        }
      });
    }, options);

    this.intersectionObserver.observe(this.scrollAnchor.nativeElement);
    console.log('[ChatWidget] IntersectionObserver configurado');
  }

  /**
   * Limpiar IntersectionObserver
   */
  private cleanupIntersectionObserver(): void {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
      this.intersectionObserver = undefined;
      console.log('[ChatWidget] IntersectionObserver limpiado');
    }
  }

  /**
   * Cargar más mensajes antiguos (scroll infinito)
   */
  private loadMoreMessages(): void {
    const chatId = this.currentChatId();
    if (!chatId || this.isLoadingMore() || !this.hasMoreMessages()) {
      console.log('[ChatWidget] No se puede cargar más mensajes:', { 
        chatId: !!chatId, 
        isLoadingMore: this.isLoadingMore(), 
        hasMore: this.hasMoreMessages() 
      });
      return;
    }

    console.log('[ChatWidget] 📥 Cargando mensajes antiguos con cursor:', this.nextCursor);
    this.isLoadingMore.set(true);
    this.previousScrollHeight = this.messagesContainer?.nativeElement.scrollHeight || 0;

    this.chatService.getMessagesV2(chatId, {
      cursor: this.nextCursor,
      limit: 50
      // El endpoint por defecto devuelve sentAt DESC
    }).subscribe({
      next: (response) => {
        console.log('[ChatWidget] Mensajes antiguos cargados:', response.messages.length);
        
        // Los mensajes vienen en orden descendente
        // Los revertimos y los agregamos AL INICIO del array existente
        const newMessages = [...response.messages].reverse();
        const currentMessages = this.messages();
        this.messages.set([...newMessages, ...currentMessages]);
        
        // Actualizar paginación
        this.nextCursor = response.nextCursor;
        this.hasMoreMessages.set(response.hasMore);
        this.isLoadingMore.set(false);
        this.isHandlingIntersection = false;
        
        // Preservar posición de scroll
        this.preserveScrollPosition();
        
        // Reconfigurar observer si hay más mensajes
        if (response.hasMore) {
          this.cleanupIntersectionObserver();
          setTimeout(() => {
            this.setupIntersectionObserver();
          }, 200);
        } else {
          this.cleanupIntersectionObserver();
        }
        
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('[ChatWidget] Error al cargar mensajes antiguos:', err);
        this.isLoadingMore.set(false);
        this.isHandlingIntersection = false;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Preservar posición de scroll al agregar mensajes antiguos
   */
  private preserveScrollPosition(): void {
    if (!this.messagesContainer) return;
    
    const element = this.messagesContainer.nativeElement;
    const newScrollHeight = element.scrollHeight;
    const scrollDiff = newScrollHeight - this.previousScrollHeight;
    
    // Ajustar scroll para mantener la posición visual
    element.scrollTop = element.scrollTop + scrollDiff;
    
    console.log('[ChatWidget] Posición de scroll preservada:', {
      previousHeight: this.previousScrollHeight,
      newHeight: newScrollHeight,
      scrollDiff,
      newScrollTop: element.scrollTop
    });
  }

  /**
   * Programar scroll al final
   */
  private scheduleScrollToBottom(): void {
    setTimeout(() => {
      this.scrollToBottom();
    }, 0);
  }
}
