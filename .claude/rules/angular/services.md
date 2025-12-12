# Servicios Angular

## Descripción

Servicios inyectables con `providedIn: 'root'`, function injection y patrones reactivos.

## Referencia
`libs/auth/data-access/session/src/lib/session.service.ts`

## Estructura Base

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

## Patrón BehaviorSubject + Observable

```typescript
@Injectable({ providedIn: 'root' })
export class ChatStateService {
  // Estado privado mutable
  private readonly _chats = new BehaviorSubject<Chat[]>([]);
  private readonly _loading = new BehaviorSubject<boolean>(false);
  private readonly _error = new BehaviorSubject<string | null>(null);

  // Exposición pública inmutable
  readonly chats$ = this._chats.asObservable();
  readonly loading$ = this._loading.asObservable();
  readonly error$ = this._error.asObservable();

  // Métodos para modificar estado
  setChats(chats: Chat[]): void {
    this._chats.next(chats);
  }

  setLoading(loading: boolean): void {
    this._loading.next(loading);
  }

  setError(error: string | null): void {
    this._error.next(error);
  }

  // Selector derivado
  readonly activeChats$ = this.chats$.pipe(
    map(chats => chats.filter(c => c.status === 'active')),
    distinctUntilChanged()
  );
}
```

## Servicio HTTP con Cache

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

## Servicio con Signal State

```typescript
@Injectable({ providedIn: 'root' })
export class UserService {
  // Signal para estado sincrónico
  private readonly _currentUser = signal<User | null>(null);

  // Exposición como readonly
  readonly currentUser = this._currentUser.asReadonly();

  // Computed derivado
  readonly isAuthenticated = computed(() => this._currentUser() !== null);
  readonly userName = computed(() => this._currentUser()?.name ?? 'Anónimo');

  setUser(user: User | null): void {
    this._currentUser.set(user);
  }

  clearUser(): void {
    this._currentUser.set(null);
  }
}
```

## Inyección de Dependencias

```typescript
@Injectable({ providedIn: 'root' })
export class MyService {
  // Servicios Angular
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  // Servicios propios
  private readonly sessionService = inject(SessionService);

  // Tokens de inyección
  private readonly environment = inject(ENVIRONMENT_TOKEN);

  // DestroyRef para cleanup
  private readonly destroyRef = inject(DestroyRef);

  // Servicio opcional
  private readonly analytics = inject(AnalyticsService, { optional: true });
}
```

## Cleanup y Lifecycle

```typescript
@Injectable({ providedIn: 'root' })
export class WebSocketService {
  private readonly destroyRef = inject(DestroyRef);
  private connection?: WebSocket;

  constructor() {
    // Cleanup automático al destruir
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

## Operadores RxJS Comunes

```typescript
// Cache con shareReplay
.pipe(shareReplay({ bufferSize: 1, refCount: true }))

// Evitar duplicados
.pipe(distinctUntilChanged())

// Cleanup automático
.pipe(takeUntilDestroyed(this.destroyRef))

// Manejo de errores
.pipe(
  catchError(error => {
    console.error('Error:', error);
    return of(null);
  })
)

// Retry con backoff
.pipe(
  retry({ count: 3, delay: 1000 })
)
```

## Reglas de Naming

| Elemento | Patrón | Ejemplo |
|----------|--------|---------|
| Servicio | `{Name}Service` | `SessionService`, `ChatService` |
| Data Service | `{Entity}DataService` | `VisitorsDataService` |
| State Service | `{Domain}StateService` | `ChatStateService` |
| Archivo | `{name}.service.ts` | `session.service.ts` |

## Checklist

- [ ] `@Injectable({ providedIn: 'root' })`
- [ ] `inject()` para dependencias
- [ ] BehaviorSubject privado, Observable público
- [ ] `shareReplay` para cache de HTTP
- [ ] `takeUntilDestroyed` para cleanup
- [ ] Métodos claros para modificar estado

## Anti-patrones

- Constructor injection
- BehaviorSubject público (exponer solo Observable)
- Olvidar `withCredentials: true` en HTTP
- Subscripciones sin cleanup
- Estado mutable expuesto directamente
- Lógica de UI en servicios
