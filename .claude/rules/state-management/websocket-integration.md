# WebSocket Integration

## Descripción

Patrones para integrar WebSocket (Socket.IO) en aplicaciones Angular para comunicación en tiempo real.

## Referencia

`libs/chat/data-access/websocket-service/`

## Servicio WebSocket Base

```typescript
import { Injectable, inject, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { ENVIRONMENT_TOKEN } from '@guiders-frontend/shared/types';

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

@Injectable({ providedIn: 'root' })
export class WebSocketService implements OnDestroy {
  private readonly environment = inject(ENVIRONMENT_TOKEN);
  private socket?: Socket;

  private readonly _status = new BehaviorSubject<ConnectionStatus>('disconnected');
  readonly status$ = this._status.asObservable();

  private readonly _messages = new Subject<WebSocketMessage>();
  readonly messages$ = this._messages.asObservable();

  connect(token?: string): void {
    if (this.socket?.connected) return;

    this._status.next('connecting');

    this.socket = io(this.environment.websocket?.url || this.environment.api.baseUrl, {
      path: '/socket.io/',
      transports: ['websocket', 'polling'],
      auth: token ? { token } : undefined,
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.setupListeners();
  }

  private setupListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('[WebSocket] Connected:', this.socket?.id);
      this._status.next('connected');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[WebSocket] Disconnected:', reason);
      this._status.next('disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('[WebSocket] Connection error:', error);
      this._status.next('error');
    });
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = undefined;
    this._status.next('disconnected');
  }

  emit<T>(event: string, data: T): void {
    if (!this.socket?.connected) {
      console.warn('[WebSocket] Cannot emit - not connected');
      return;
    }
    this.socket.emit(event, data);
  }

  on<T>(event: string): Observable<T> {
    return new Observable<T>(observer => {
      const handler = (data: T) => observer.next(data);
      this.socket?.on(event, handler);

      return () => {
        this.socket?.off(event, handler);
      };
    });
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
```

## Servicio de Chat con WebSocket

```typescript
import { Injectable, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BehaviorSubject, filter, tap } from 'rxjs';
import { WebSocketService } from './websocket.service';

interface ChatMessage {
  id: string;
  chatId: string;
  content: string;
  senderId: string;
  sentAt: string;
}

@Injectable({ providedIn: 'root' })
export class ChatWebSocketService {
  private readonly ws = inject(WebSocketService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly _messages = new BehaviorSubject<ChatMessage[]>([]);
  readonly messages$ = this._messages.asObservable();

  private currentChatId?: string;

  constructor() {
    this.setupMessageListener();
  }

  private setupMessageListener(): void {
    this.ws.on<ChatMessage>('message:new')
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        filter(msg => msg.chatId === this.currentChatId),
        tap(msg => {
          const current = this._messages.getValue();
          this._messages.next([...current, msg]);
        })
      )
      .subscribe();
  }

  joinChat(chatId: string): void {
    this.currentChatId = chatId;
    this.ws.emit('chat:join', { chatId });
  }

  leaveChat(chatId: string): void {
    this.ws.emit('chat:leave', { chatId });
    if (this.currentChatId === chatId) {
      this.currentChatId = undefined;
      this._messages.next([]);
    }
  }

  sendMessage(content: string): void {
    if (!this.currentChatId) return;

    this.ws.emit('chat:send-message', {
      chatId: this.currentChatId,
      content,
    });
  }
}
```

## Uso en Componentes

```typescript
@Component({
  selector: 'lib-chat-room',
  template: `
    <div class="chat-status">
      @switch (connectionStatus()) {
        @case ('connecting') { <guiders-spinner /> Conectando... }
        @case ('connected') { <span class="online">En línea</span> }
        @case ('disconnected') { <span class="offline">Desconectado</span> }
        @case ('error') { <span class="error">Error de conexión</span> }
      }
    </div>

    <div class="messages">
      @for (message of messages(); track message.id) {
        <guiders-message-bubble [message]="message" />
      }
    </div>

    <form (submit)="onSend($event)">
      <input [(ngModel)]="newMessage" placeholder="Escribe un mensaje..." />
      <button type="submit" [disabled]="connectionStatus() !== 'connected'">
        Enviar
      </button>
    </form>
  `,
})
export class ChatRoom implements OnInit, OnDestroy {
  private readonly ws = inject(WebSocketService);
  private readonly chatWs = inject(ChatWebSocketService);

  readonly chatId = input.required<string>();

  readonly connectionStatus = toSignal(this.ws.status$, { initialValue: 'disconnected' as const });
  readonly messages = toSignal(this.chatWs.messages$, { initialValue: [] });

  newMessage = '';

  ngOnInit(): void {
    this.ws.connect();
    this.chatWs.joinChat(this.chatId());
  }

  ngOnDestroy(): void {
    this.chatWs.leaveChat(this.chatId());
  }

  onSend(event: Event): void {
    event.preventDefault();
    if (!this.newMessage.trim()) return;

    this.chatWs.sendMessage(this.newMessage);
    this.newMessage = '';
  }
}
```

## Reconexión Automática

```typescript
@Injectable({ providedIn: 'root' })
export class WebSocketService {
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;

  private setupListeners(): void {
    this.socket?.on('disconnect', (reason) => {
      if (reason === 'io server disconnect') {
        // Servidor desconectó, intentar reconectar
        this.attemptReconnect();
      }
    });

    this.socket?.on('connect', () => {
      this.reconnectAttempts = 0; // Reset al conectar
    });
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[WebSocket] Max reconnection attempts reached');
      this._status.next('error');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

    console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      this.socket?.connect();
    }, delay);
  }
}
```

## Eventos Típicos

### Cliente → Servidor

```typescript
// Unirse a sala
this.ws.emit('chat:join', { chatId: '123' });

// Enviar mensaje
this.ws.emit('chat:send-message', {
  chatId: '123',
  content: 'Hola!',
});

// Indicador de escritura
this.ws.emit('chat:typing', { chatId: '123', isTyping: true });

// Marcar como leído
this.ws.emit('chat:mark-read', { chatId: '123', messageId: 'msg-456' });
```

### Servidor → Cliente

```typescript
// Nuevo mensaje
this.ws.on<ChatMessage>('message:new').subscribe(msg => { ... });

// Usuario escribiendo
this.ws.on<TypingEvent>('chat:typing').subscribe(event => { ... });

// Estado de presencia
this.ws.on<PresenceEvent>('user:presence').subscribe(event => { ... });

// Actualización de chat
this.ws.on<ChatUpdate>('chat:updated').subscribe(update => { ... });
```

## Integración con NgRx/Signals

```typescript
@Injectable({ providedIn: 'root' })
export class ChatFacade {
  private readonly ws = inject(WebSocketService);

  // State con signals
  private readonly _messages = signal<Message[]>([]);
  private readonly _typing = signal<string[]>([]);

  readonly messages = this._messages.asReadonly();
  readonly typing = this._typing.asReadonly();

  constructor() {
    // Escuchar eventos WebSocket
    this.ws.on<Message>('message:new')
      .pipe(takeUntilDestroyed())
      .subscribe(msg => {
        this._messages.update(msgs => [...msgs, msg]);
      });

    this.ws.on<TypingEvent>('chat:typing')
      .pipe(takeUntilDestroyed())
      .subscribe(event => {
        this._typing.update(users =>
          event.isTyping
            ? [...users, event.userId]
            : users.filter(u => u !== event.userId)
        );
      });
  }
}
```

## Reglas de Naming

| Elemento | Patrón | Ejemplo |
|----------|--------|---------|
| Servicio base | `WebSocketService` | - |
| Servicio específico | `{Domain}WebSocketService` | `ChatWebSocketService` |
| Evento cliente→servidor | `{domain}:{action}` | `chat:send-message` |
| Evento servidor→cliente | `{domain}:{event}` | `message:new` |

## Checklist

- [ ] Manejo de reconexión automática
- [ ] Estado de conexión observable
- [ ] Cleanup en `ngOnDestroy`
- [ ] `takeUntilDestroyed` en subscripciones
- [ ] Manejo de errores de conexión
- [ ] Logs para debugging

## Anti-patrones

- Subscripciones sin cleanup
- No manejar desconexiones
- Hardcodear URL de WebSocket
- Emitir sin verificar conexión
- No usar rooms/salas para segmentar
