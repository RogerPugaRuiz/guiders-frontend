# Testing de Servicios

## Descripción

Patrones para testing de servicios Angular con HttpClient, BehaviorSubject y dependencias.

## Referencia

`libs/auth/data-access/session/src/lib/session.service.spec.ts`

## Testing de Servicio HTTP

```typescript
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { VisitorsDataService } from './visitors-data.service';
import { ENVIRONMENT_TOKEN } from '@guiders-frontend/shared/types';

describe('VisitorsDataService', () => {
  let service: VisitorsDataService;
  let httpMock: HttpTestingController;

  const mockEnvironment = {
    production: false,
    api: { baseUrl: 'http://test-api.com' },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ENVIRONMENT_TOKEN, useValue: mockEnvironment },
        VisitorsDataService,
      ],
    });

    service = TestBed.inject(VisitorsDataService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify(); // Verificar que no hay requests pendientes
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getVisitors', () => {
    it('should fetch visitors', () => {
      const mockVisitors = [
        { id: '1', name: 'Visitor 1' },
        { id: '2', name: 'Visitor 2' },
      ];

      service.getVisitors().subscribe(visitors => {
        expect(visitors).toEqual(mockVisitors);
      });

      const req = httpMock.expectOne('http://test-api.com/visitors');
      expect(req.request.method).toBe('GET');
      expect(req.request.withCredentials).toBe(true);

      req.flush(mockVisitors);
    });

    it('should handle error', () => {
      service.getVisitors().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
        },
      });

      const req = httpMock.expectOne('http://test-api.com/visitors');
      req.flush('Server error', { status: 500, statusText: 'Server Error' });
    });
  });

  describe('createVisitor', () => {
    it('should create visitor with POST', () => {
      const newVisitor = { name: 'New Visitor', email: 'new@test.com' };
      const createdVisitor = { id: '3', ...newVisitor };

      service.createVisitor(newVisitor).subscribe(visitor => {
        expect(visitor).toEqual(createdVisitor);
      });

      const req = httpMock.expectOne('http://test-api.com/visitors');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newVisitor);

      req.flush(createdVisitor);
    });
  });

  describe('getVisitorById', () => {
    it('should fetch visitor by id', () => {
      const mockVisitor = { id: '1', name: 'Visitor 1' };

      service.getVisitorById('1').subscribe(visitor => {
        expect(visitor).toEqual(mockVisitor);
      });

      const req = httpMock.expectOne('http://test-api.com/visitors/1');
      expect(req.request.method).toBe('GET');

      req.flush(mockVisitor);
    });
  });
});
```

## Testing de Servicio con Estado

```typescript
import { TestBed } from '@angular/core/testing';
import { ChatStateService } from './chat-state.service';

describe('ChatStateService', () => {
  let service: ChatStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ChatStateService],
    });
    service = TestBed.inject(ChatStateService);
  });

  it('should have initial state', () => {
    expect(service.chats$).toBeDefined();

    service.chats$.subscribe(chats => {
      expect(chats).toEqual([]);
    });
  });

  it('should update chats', () => {
    const mockChats = [
      { id: '1', status: 'active' },
      { id: '2', status: 'pending' },
    ];

    service.setChats(mockChats);

    service.chats$.subscribe(chats => {
      expect(chats).toEqual(mockChats);
    });
  });

  it('should filter active chats', () => {
    const mockChats = [
      { id: '1', status: 'active' },
      { id: '2', status: 'pending' },
      { id: '3', status: 'active' },
    ];

    service.setChats(mockChats);

    service.activeChats$.subscribe(active => {
      expect(active.length).toBe(2);
      expect(active.every(c => c.status === 'active')).toBe(true);
    });
  });

  it('should update loading state', () => {
    service.setLoading(true);

    service.loading$.subscribe(loading => {
      expect(loading).toBe(true);
    });
  });

  it('should reset state', () => {
    service.setChats([{ id: '1', status: 'active' }]);
    service.setLoading(true);
    service.setError('Some error');

    service.reset();

    service.state$.subscribe(state => {
      expect(state.chats).toEqual([]);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });
  });
});
```

## Testing de Servicio con Signal

```typescript
import { TestBed } from '@angular/core/testing';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [UserService],
    });
    service = TestBed.inject(UserService);
  });

  it('should have null user initially', () => {
    expect(service.currentUser()).toBeNull();
  });

  it('should set user', () => {
    const mockUser = { id: '1', name: 'Test User', email: 'test@test.com' };

    service.setUser(mockUser);

    expect(service.currentUser()).toEqual(mockUser);
  });

  it('should compute isAuthenticated', () => {
    expect(service.isAuthenticated()).toBe(false);

    service.setUser({ id: '1', name: 'Test', email: 'test@test.com' });

    expect(service.isAuthenticated()).toBe(true);
  });

  it('should clear user', () => {
    service.setUser({ id: '1', name: 'Test', email: 'test@test.com' });
    service.clearUser();

    expect(service.currentUser()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });
});
```

## Mock de Servicios Dependientes

```typescript
import { TestBed } from '@angular/core/testing';
import { SessionService } from './session.service';
import { UserService } from './user.service';
import { AuthRefreshService } from './auth-refresh.service';
import { of } from 'rxjs';

describe('SessionService', () => {
  let service: SessionService;
  let userServiceSpy: jasmine.SpyObj<UserService>;
  let authRefreshSpy: jasmine.SpyObj<AuthRefreshService>;

  beforeEach(() => {
    // Crear spies
    userServiceSpy = jasmine.createSpyObj('UserService', [
      'fetchUser',
      'clearUser',
      'currentUser',
      'isAuthenticated',
    ]);
    authRefreshSpy = jasmine.createSpyObj('AuthRefreshService', [
      'scheduleProactiveRefresh',
      'cancelScheduledRefresh',
    ]);

    TestBed.configureTestingModule({
      providers: [
        SessionService,
        { provide: UserService, useValue: userServiceSpy },
        { provide: AuthRefreshService, useValue: authRefreshSpy },
      ],
    });

    service = TestBed.inject(SessionService);
  });

  it('should ensure session', () => {
    const mockUser = { id: '1', name: 'Test', email: 'test@test.com' };
    userServiceSpy.fetchUser.and.returnValue(of(mockUser));

    service.ensureSession$().subscribe(user => {
      expect(user).toEqual(mockUser);
    });

    expect(userServiceSpy.fetchUser).toHaveBeenCalled();
  });

  it('should cache session', () => {
    const mockUser = { id: '1', name: 'Test', email: 'test@test.com' };
    userServiceSpy.fetchUser.and.returnValue(of(mockUser));

    // Primera llamada
    service.ensureSession$().subscribe();
    // Segunda llamada (debería usar cache)
    service.ensureSession$().subscribe();

    // fetchUser solo se llama una vez
    expect(userServiceSpy.fetchUser).toHaveBeenCalledTimes(1);
  });

  it('should clear cache', () => {
    service.clearCache();

    expect(userServiceSpy.clearUser).toHaveBeenCalled();
    expect(authRefreshSpy.cancelScheduledRefresh).toHaveBeenCalled();
  });
});
```

## Testing con Vitest Mocks

```typescript
import { vi } from 'vitest';

describe('ServiceWithVitest', () => {
  it('should mock dependency', () => {
    const mockFetch = vi.fn().mockResolvedValue({ data: 'test' });

    // Usar mock
    const result = await mockFetch();
    expect(result).toEqual({ data: 'test' });
    expect(mockFetch).toHaveBeenCalled();
  });

  it('should spy on method', () => {
    const service = TestBed.inject(MyService);
    const spy = vi.spyOn(service, 'someMethod');

    service.someMethod();

    expect(spy).toHaveBeenCalled();
  });
});
```

## Reglas de Naming

| Elemento | Patrón | Ejemplo |
|----------|--------|---------|
| Archivo | `{service}.service.spec.ts` | `visitors-data.service.spec.ts` |
| describe | Nombre del servicio | `describe('VisitorsDataService', ...)` |
| Mock | `mock{Name}` | `mockEnvironment`, `mockVisitors` |
| Spy | `{name}Spy` | `userServiceSpy` |

## Checklist

- [ ] `provideHttpClient()` y `provideHttpClientTesting()`
- [ ] Mock de `ENVIRONMENT_TOKEN`
- [ ] `httpMock.verify()` en `afterEach`
- [ ] Verificar método HTTP y URL
- [ ] Verificar `withCredentials`
- [ ] Testar casos de error
- [ ] Testar estados iniciales

## Anti-patrones

- No verificar requests pendientes (`httpMock.verify()`)
- Tests que dependen del orden
- Mocks que no limpian estado
- No testar casos de error
- Subscripciones sin cleanup
