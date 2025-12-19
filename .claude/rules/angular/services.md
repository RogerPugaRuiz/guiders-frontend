# Angular Services

## Description

Injectable services with `providedIn: 'root'`, function injection and reactive patterns.

## Reference
`libs/auth/data-access/session/src/lib/session.service.ts`

## Base Structure

```typescript
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { shareReplay, tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly userService = inject(UserService);
  private readonly authRefreshService = inject(AuthRefreshService);

  private me$?: Observable<User>;

  ensureSession$(): Observable<User> {
    if (!this.me$) {
      this.me$ = this.userService.fetchUser().pipe(
        tap(user => console.log('Session ensured:', user.email)),
        shareReplay({ bufferSize: 1, refCount: true })
      );
    }
    return this.me$;
  }

  clearCache(): void {
    this.me$ = undefined;
  }

  getCurrentUser(): User | null {
    return this.userService.currentUser();
  }

  isAuthenticated(): boolean {
    return this.userService.isAuthenticated();
  }
}
```

## BehaviorSubject + Observable Pattern

```typescript
@Injectable({ providedIn: 'root' })
export class ChatStateService {
  // Private mutable state
  private readonly _chats = new BehaviorSubject<Chat[]>([]);
  private readonly _loading = new BehaviorSubject<boolean>(false);
  private readonly _error = new BehaviorSubject<string | null>(null);

  // Public immutable exposure
  readonly chats$ = this._chats.asObservable();
  readonly loading$ = this._loading.asObservable();
  readonly error$ = this._error.asObservable();

  // Methods to modify state
  setChats(chats: Chat[]): void {
    this._chats.next(chats);
  }

  setLoading(loading: boolean): void {
    this._loading.next(loading);
  }

  setError(error: string | null): void {
    this._error.next(error);
  }

  // Derived selector
  readonly activeChats$ = this.chats$.pipe(
    map(chats => chats.filter(c => c.status === 'active')),
    distinctUntilChanged()
  );
}
```

## HTTP Service with Cache

```typescript
@Injectable({ providedIn: 'root' })
export class VisitorsDataService {
  private readonly http = inject(HttpClient);
  private readonly environment = inject(ENVIRONMENT_TOKEN);

  private visitorsCache$?: Observable<Visitor[]>;

  getVisitors(): Observable<Visitor[]> {
    if (!this.visitorsCache$) {
      this.visitorsCache$ = this.http.get<Visitor[]>(
        `${this.environment.api.baseUrl}/visitors`,
        { withCredentials: true }
      ).pipe(
        shareReplay({ bufferSize: 1, refCount: true })
      );
    }
    return this.visitorsCache$;
  }

  invalidateCache(): void {
    this.visitorsCache$ = undefined;
  }

  createVisitor(data: CreateVisitorDto): Observable<Visitor> {
    return this.http.post<Visitor>(
      `${this.environment.api.baseUrl}/visitors`,
      data,
      { withCredentials: true }
    ).pipe(
      tap(() => this.invalidateCache())
    );
  }
}
```

## Service with Signal State

```typescript
@Injectable({ providedIn: 'root' })
export class UserService {
  // Signal for synchronous state
  private readonly _currentUser = signal<User | null>(null);

  // Exposure as readonly
  readonly currentUser = this._currentUser.asReadonly();

  // Derived computed
  readonly isAuthenticated = computed(() => this._currentUser() !== null);
  readonly userName = computed(() => this._currentUser()?.name ?? 'Anonymous');

  setUser(user: User | null): void {
    this._currentUser.set(user);
  }

  clearUser(): void {
    this._currentUser.set(null);
  }
}
```

## Dependency Injection

```typescript
@Injectable({ providedIn: 'root' })
export class MyService {
  // Angular services
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  // Own services
  private readonly sessionService = inject(SessionService);

  // Injection tokens
  private readonly environment = inject(ENVIRONMENT_TOKEN);

  // DestroyRef for cleanup
  private readonly destroyRef = inject(DestroyRef);

  // Optional service
  private readonly analytics = inject(AnalyticsService, { optional: true });
}
```

## Cleanup and Lifecycle

```typescript
@Injectable({ providedIn: 'root' })
export class WebSocketService {
  private readonly destroyRef = inject(DestroyRef);
  private connection?: WebSocket;

  constructor() {
    // Automatic cleanup on destroy
    this.destroyRef.onDestroy(() => {
      this.disconnect();
    });
  }

  connect(): void {
    this.connection = new WebSocket('wss://...');
  }

  disconnect(): void {
    this.connection?.close();
    this.connection = undefined;
  }
}
```

## Common RxJS Operators

```typescript
// Cache with shareReplay
.pipe(shareReplay({ bufferSize: 1, refCount: true }))

// Avoid duplicates
.pipe(distinctUntilChanged())

// Automatic cleanup
.pipe(takeUntilDestroyed(this.destroyRef))

// Error handling
.pipe(
  catchError(error => {
    console.error('Error:', error);
    return of(null);
  })
)

// Retry with backoff
.pipe(
  retry({ count: 3, delay: 1000 })
)
```

## Naming Rules

| Element | Pattern | Example |
|---------|---------|---------|
| Service | `{Name}Service` | `SessionService`, `ChatService` |
| Data Service | `{Entity}DataService` | `VisitorsDataService` |
| State Service | `{Domain}StateService` | `ChatStateService` |
| File | `{name}.service.ts` | `session.service.ts` |

## Checklist

- [ ] `@Injectable({ providedIn: 'root' })`
- [ ] `inject()` for dependencies
- [ ] Private BehaviorSubject, public Observable
- [ ] `shareReplay` for HTTP cache
- [ ] `takeUntilDestroyed` for cleanup
- [ ] Clear methods to modify state

## Anti-patterns

- Constructor injection
- Public BehaviorSubject (expose only Observable)
- Forgetting `withCredentials: true` in HTTP
- Subscriptions without cleanup
- Mutable state exposed directly
- UI logic in services
