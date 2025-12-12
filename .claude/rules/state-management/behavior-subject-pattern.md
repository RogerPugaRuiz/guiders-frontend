# BehaviorSubject Pattern

## Descripción

Patrón de estado reactivo usando BehaviorSubject privado con Observable público para gestionar estado en servicios.

## Referencia

`libs/auth/data-access/session/src/lib/user.service.ts`

## Estructura Base

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
  // Estado privado mutable
  private readonly _state = new BehaviorSubject<ChatState>(initialState);

  // Observable público inmutable
  readonly state$ = this._state.asObservable();

  // Selectores derivados
  readonly chats$ = this.select(state => state.chats);
  readonly loading$ = this.select(state => state.loading);
  readonly error$ = this.select(state => state.error);
  readonly selectedChat$ = this.select(state =>
    state.chats.find(c => c.id === state.selectedChatId) ?? null
  );

  // Helper para crear selectores
  private select<T>(selector: (state: ChatState) => T): Observable<T> {
    return this.state$.pipe(
      map(selector),
      distinctUntilChanged()
    );
  }

  // Métodos para modificar estado
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

  // Helper para actualizar estado parcialmente
  private updateState(partial: Partial<ChatState>): void {
    this._state.next({
      ...this._state.getValue(),
      ...partial,
    });
  }

  // Reset al estado inicial
  reset(): void {
    this._state.next(initialState);
  }
}
```

## Selectores Avanzados

```typescript
@Injectable({ providedIn: 'root' })
export class ChatStateService {
  // Selector con filtro
  readonly activeChats$ = this.chats$.pipe(
    map(chats => chats.filter(c => c.status === 'active'))
  );

  // Selector con contador
  readonly unreadCount$ = this.chats$.pipe(
    map(chats => chats.reduce((sum, c) => sum + c.unreadCount, 0))
  );

  // Selector combinado
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

  // Selector por ID (función que retorna Observable)
  getChatById$(id: string): Observable<Chat | undefined> {
    return this.chats$.pipe(
      map(chats => chats.find(c => c.id === id))
    );
  }
}
```

## Integración con HTTP

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

  // Métodos delegados
  get chats$() { return this.state.chats$; }
  get loading$() { return this.state.loading$; }
}
```

## Signal vs BehaviorSubject

```typescript
// Usar Signal para:
// - Estado sincrónico simple
// - Computed values
// - Integración con templates

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly _user = signal<User | null>(null);
  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null);

  setUser(user: User | null): void {
    this._user.set(user);
  }
}

// Usar BehaviorSubject para:
// - Estado que se consume como Observable
// - Integración con RxJS pipes
// - Operaciones asíncronas complejas

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

## Uso en Componentes

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

## Reglas de Naming

| Elemento | Patrón | Ejemplo |
|----------|--------|---------|
| State Service | `{Domain}StateService` | `ChatStateService` |
| Facade Service | `{Domain}FacadeService` | `ChatFacadeService` |
| State Interface | `{Domain}State` | `ChatState` |
| Observable | `{name}$` | `chats$`, `loading$` |

## Checklist

- [ ] BehaviorSubject privado (`_state`)
- [ ] Observable público (`.asObservable()`)
- [ ] Estado inicial definido
- [ ] Selectores con `distinctUntilChanged()`
- [ ] Métodos de update inmutables
- [ ] Método `reset()` para limpiar estado

## Anti-patrones

- Exponer BehaviorSubject directamente
- Mutar el estado en lugar de crear nuevo objeto
- Selectores sin `distinctUntilChanged()`
- Estado sin tipado (usar interfaces)
- Lógica de negocio en componentes
- Subscripciones sin cleanup
