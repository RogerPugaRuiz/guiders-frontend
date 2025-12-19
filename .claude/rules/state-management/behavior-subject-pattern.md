# BehaviorSubject Pattern

## Description

Reactive state pattern using private BehaviorSubject with public Observable to manage state in services.

## Reference

`libs/auth/data-access/session/src/lib/user.service.ts`

## Base Structure

```typescript
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';

interface ChatState {
  chats: Chat[];
  loading: boolean;
  error: string | null;
  selectedChatId: string | null;
}

const initialState: ChatState = {
  chats: [],
  loading: false,
  error: null,
  selectedChatId: null,
};

@Injectable({ providedIn: 'root' })
export class ChatStateService {
  // Private mutable state
  private readonly _state = new BehaviorSubject<ChatState>(initialState);

  // Public immutable Observable
  readonly state$ = this._state.asObservable();

  // Derived selectors
  readonly chats$ = this.select(state => state.chats);
  readonly loading$ = this.select(state => state.loading);
  readonly error$ = this.select(state => state.error);
  readonly selectedChat$ = this.select(state =>
    state.chats.find(c => c.id === state.selectedChatId) ?? null
  );

  // Helper to create selectors
  private select<T>(selector: (state: ChatState) => T): Observable<T> {
    return this.state$.pipe(
      map(selector),
      distinctUntilChanged()
    );
  }

  // Methods to modify state
  setChats(chats: Chat[]): void {
    this.updateState({ chats });
  }

  setLoading(loading: boolean): void {
    this.updateState({ loading });
  }

  setError(error: string | null): void {
    this.updateState({ error });
  }

  selectChat(chatId: string | null): void {
    this.updateState({ selectedChatId: chatId });
  }

  // Helper to partially update state
  private updateState(partial: Partial<ChatState>): void {
    this._state.next({
      ...this._state.getValue(),
      ...partial,
    });
  }

  // Reset to initial state
  reset(): void {
    this._state.next(initialState);
  }
}
```

## Advanced Selectors

```typescript
@Injectable({ providedIn: 'root' })
export class ChatStateService {
  // Selector with filter
  readonly activeChats$ = this.chats$.pipe(
    map(chats => chats.filter(c => c.status === 'active'))
  );

  // Selector with counter
  readonly unreadCount$ = this.chats$.pipe(
    map(chats => chats.reduce((sum, c) => sum + c.unreadCount, 0))
  );

  // Combined selector
  readonly chatSummary$ = combineLatest([
    this.chats$,
    this.loading$,
    this.error$
  ]).pipe(
    map(([chats, loading, error]) => ({
      total: chats.length,
      active: chats.filter(c => c.status === 'active').length,
      loading,
      hasError: !!error,
    }))
  );

  // Selector by ID (function that returns Observable)
  getChatById$(id: string): Observable<Chat | undefined> {
    return this.chats$.pipe(
      map(chats => chats.find(c => c.id === id))
    );
  }
}
```

## HTTP Integration

```typescript
@Injectable({ providedIn: 'root' })
export class ChatFacadeService {
  private readonly http = inject(HttpClient);
  private readonly state = inject(ChatStateService);
  private readonly environment = inject(ENVIRONMENT_TOKEN);

  loadChats(): Observable<Chat[]> {
    this.state.setLoading(true);
    this.state.setError(null);

    return this.http.get<Chat[]>(
      `${this.environment.api.baseUrl}/chats`,
      { withCredentials: true }
    ).pipe(
      tap(chats => {
        this.state.setChats(chats);
        this.state.setLoading(false);
      }),
      catchError(error => {
        this.state.setError(error.message);
        this.state.setLoading(false);
        return throwError(() => error);
      })
    );
  }

  // Delegated methods
  get chats$() { return this.state.chats$; }
  get loading$() { return this.state.loading$; }
}
```

## Signal vs BehaviorSubject

```typescript
// Use Signal for:
// - Simple synchronous state
// - Computed values
// - Template integration

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly _user = signal<User | null>(null);
  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null);

  setUser(user: User | null): void {
    this._user.set(user);
  }
}

// Use BehaviorSubject for:
// - State consumed as Observable
// - RxJS pipes integration
// - Complex async operations

@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly _chats = new BehaviorSubject<Chat[]>([]);
  readonly chats$ = this._chats.asObservable();

  readonly filteredChats$ = this.chats$.pipe(
    switchMap(chats => this.applyFilters(chats)),
    shareReplay(1)
  );
}
```

## Component Usage

```typescript
@Component({
  selector: 'lib-chat-list',
  template: `
    @if (loading$ | async) {
      <guiders-spinner />
    }

    @for (chat of chats$ | async; track chat.id) {
      <guiders-chat-card
        [chat]="chat"
        [selected]="chat.id === (selectedChatId$ | async)"
        (click)="selectChat(chat.id)"
      />
    }
  `,
})
export class ChatList {
  private readonly chatState = inject(ChatStateService);

  readonly chats$ = this.chatState.chats$;
  readonly loading$ = this.chatState.loading$;
  readonly selectedChatId$ = this.chatState.state$.pipe(
    map(s => s.selectedChatId)
  );

  selectChat(id: string): void {
    this.chatState.selectChat(id);
  }
}
```

## Naming Rules

| Element | Pattern | Example |
|----------|--------|---------|
| State Service | `{Domain}StateService` | `ChatStateService` |
| Facade Service | `{Domain}FacadeService` | `ChatFacadeService` |
| State Interface | `{Domain}State` | `ChatState` |
| Observable | `{name}$` | `chats$`, `loading$` |

## Checklist

- [ ] Private BehaviorSubject (`_state`)
- [ ] Public Observable (`.asObservable()`)
- [ ] Initial state defined
- [ ] Selectors with `distinctUntilChanged()`
- [ ] Immutable update methods
- [ ] `reset()` method to clear state

## Anti-patterns

- Expose BehaviorSubject directly
- Mutate state instead of creating new object
- Selectors without `distinctUntilChanged()`
- Untyped state (use interfaces)
- Business logic in components
- Subscriptions without cleanup
