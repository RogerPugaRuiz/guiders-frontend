# WebSocket Integration

## Description

Patterns for integrating WebSocket (Socket.IO) in Angular applications for real-time communication.

## Reference

`libs/chat/data-access/websocket-service/`

## Base WebSocket Service

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

## Chat Service with WebSocket

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

## Component Usage

```typescript
@Component({
  selector: 'lib-chat-room',
  template: `
    <div class="chat-status">
      @switch (connectionStatus()) {
        @case ('connecting') { <guiders-spinner /> Connecting... }
        @case ('connected') { <span class="online">Online</span> }
        @case ('disconnected') { <span class="offline">Disconnected</span> }
        @case ('error') { <span class="error">Connection error</span> }
      }
    </div>

    <div class="messages">
      @for (message of messages(); track message.id) {
        <guiders-message-bubble [message]="message" />
      }
    </div>

    <form (submit)="onSend($event)">
      <input [(ngModel)]="newMessage" placeholder="Type a message..." />
      <button type="submit" [disabled]="connectionStatus() !== 'connected'">
        Send
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

## Automatic Reconnection

```typescript
@Injectable({ providedIn: 'root' })
export class WebSocketService {
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;

  private setupListeners(): void {
    this.socket?.on('disconnect', (reason) => {
      if (reason === 'io server disconnect') {
        // Server disconnected, attempt reconnect
        this.attemptReconnect();
      }
    });

    this.socket?.on('connect', () => {
      this.reconnectAttempts = 0; // Reset on connect
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

## Typical Events

### Client → Server

```typescript
// Join room
this.ws.emit('chat:join', { chatId: '123' });

// Send message
this.ws.emit('chat:send-message', {
  chatId: '123',
  content: 'Hola!',
});

// Typing indicator
this.ws.emit('chat:typing', { chatId: '123', isTyping: true });

// Mark as read
this.ws.emit('chat:mark-read', { chatId: '123', messageId: 'msg-456' });
```

### Server → Client

```typescript
// New message
this.ws.on<ChatMessage>('message:new').subscribe(msg => { ... });

// User typing
this.ws.on<TypingEvent>('chat:typing').subscribe(event => { ... });

// Presence status
this.ws.on<PresenceEvent>('user:presence').subscribe(event => { ... });

// Chat update
this.ws.on<ChatUpdate>('chat:updated').subscribe(update => { ... });
```

## Integration with NgRx/Signals

```typescript
@Injectable({ providedIn: 'root' })
export class ChatFacade {
  private readonly ws = inject(WebSocketService);

  // State with signals
  private readonly _messages = signal<Message[]>([]);
  private readonly _typing = signal<string[]>([]);

  readonly messages = this._messages.asReadonly();
  readonly typing = this._typing.asReadonly();

  constructor() {
    // Listen to WebSocket events
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

## Naming Rules

| Element | Pattern | Example |
|----------|--------|---------|
| Base service | `WebSocketService` | - |
| Specific service | `{Domain}WebSocketService` | `ChatWebSocketService` |
| Client→Server event | `{domain}:{action}` | `chat:send-message` |
| Server→Client event | `{domain}:{event}` | `message:new` |

## Checklist

- [ ] Automatic reconnection handling
- [ ] Observable connection status
- [ ] Cleanup in `ngOnDestroy`
- [ ] `takeUntilDestroyed` in subscriptions
- [ ] Connection error handling
- [ ] Logs for debugging

## Anti-patterns

- Subscriptions without cleanup
- Not handling disconnections
- Hardcoding WebSocket URL
- Emitting without verifying connection
- Not using rooms for segmentation
