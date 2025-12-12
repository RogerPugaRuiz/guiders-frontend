# Servicios HTTP

## Descripción

Patrones para servicios que realizan peticiones HTTP con HttpClient, autenticación y manejo de errores.

## Referencia

`libs/chat/data-access/visitors-data-service/src/lib/visitors-data.service.ts`

## Estructura Base

```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { shareReplay, tap, catchError } from 'rxjs/operators';
import { ENVIRONMENT_TOKEN } from '@guiders-frontend/shared/types';

@Injectable({ providedIn: 'root' })
export class VisitorsDataService {
  private readonly http = inject(HttpClient);
  private readonly environment = inject(ENVIRONMENT_TOKEN);

  private get baseUrl(): string {
    return `${this.environment.api.baseUrl}/visitors`;
  }

  // GET lista
  getVisitors(): Observable<Visitor[]> {
    return this.http.get<Visitor[]>(this.baseUrl, {
      withCredentials: true,
    });
  }

  // GET por ID
  getVisitorById(id: string): Observable<Visitor> {
    return this.http.get<Visitor>(`${this.baseUrl}/${id}`, {
      withCredentials: true,
    });
  }

  // POST crear
  createVisitor(data: CreateVisitorDto): Observable<Visitor> {
    return this.http.post<Visitor>(this.baseUrl, data, {
      withCredentials: true,
    });
  }

  // PUT actualizar
  updateVisitor(id: string, data: UpdateVisitorDto): Observable<Visitor> {
    return this.http.put<Visitor>(`${this.baseUrl}/${id}`, data, {
      withCredentials: true,
    });
  }

  // DELETE eliminar
  deleteVisitor(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`, {
      withCredentials: true,
    });
  }
}
```

## Cache con shareReplay

```typescript
@Injectable({ providedIn: 'root' })
export class VisitorsDataService {
  private visitorsCache$?: Observable<Visitor[]>;

  getVisitors(): Observable<Visitor[]> {
    if (!this.visitorsCache$) {
      this.visitorsCache$ = this.http.get<Visitor[]>(this.baseUrl, {
        withCredentials: true,
      }).pipe(
        shareReplay({ bufferSize: 1, refCount: true })
      );
    }
    return this.visitorsCache$;
  }

  // Invalidar cache después de mutaciones
  invalidateCache(): void {
    this.visitorsCache$ = undefined;
  }

  createVisitor(data: CreateVisitorDto): Observable<Visitor> {
    return this.http.post<Visitor>(this.baseUrl, data, {
      withCredentials: true,
    }).pipe(
      tap(() => this.invalidateCache())
    );
  }
}
```

## Query Parameters

```typescript
@Injectable({ providedIn: 'root' })
export class VisitorsDataService {
  getVisitors(filters?: VisitorFilters): Observable<Visitor[]> {
    let params = new HttpParams();

    if (filters?.status) {
      params = params.set('status', filters.status);
    }
    if (filters?.search) {
      params = params.set('search', filters.search);
    }
    if (filters?.page) {
      params = params.set('page', filters.page.toString());
    }
    if (filters?.limit) {
      params = params.set('limit', filters.limit.toString());
    }

    return this.http.get<Visitor[]>(this.baseUrl, {
      params,
      withCredentials: true,
    });
  }
}

// Alternativa con HttpParamsOptions
getVisitors(filters?: VisitorFilters): Observable<Visitor[]> {
  const params = new HttpParams({
    fromObject: {
      ...(filters?.status && { status: filters.status }),
      ...(filters?.search && { search: filters.search }),
      ...(filters?.page && { page: filters.page.toString() }),
    },
  });

  return this.http.get<Visitor[]>(this.baseUrl, {
    params,
    withCredentials: true,
  });
}
```

## Manejo de Errores

```typescript
import { throwError, of, retry } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class VisitorsDataService {
  getVisitors(): Observable<Visitor[]> {
    return this.http.get<Visitor[]>(this.baseUrl, {
      withCredentials: true,
    }).pipe(
      retry({ count: 2, delay: 1000 }),
      catchError(error => {
        console.error('Error fetching visitors:', error);

        // Retornar array vacío como fallback
        return of([]);

        // O propagar el error
        // return throwError(() => new Error('No se pudieron cargar los visitantes'));
      })
    );
  }
}
```

## Environment Token

```typescript
// libs/shared/types/src/lib/environment.interface.ts
export interface Environment {
  production: boolean;
  api: {
    baseUrl: string;
  };
  websocket?: {
    url: string;
  };
}

export const ENVIRONMENT_TOKEN = new InjectionToken<Environment>('environment');

// apps/console/src/app/app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    {
      provide: ENVIRONMENT_TOKEN,
      useValue: environment,
    },
    // ...
  ],
};
```

## Headers Personalizados

```typescript
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  postWithHeaders<T>(url: string, body: unknown): Observable<T> {
    return this.http.post<T>(url, body, {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
        'X-Custom-Header': 'value',
      },
    });
  }
}
```

## Tipado de Respuestas

```typescript
// Interfaces de respuesta
interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// Uso en servicio
@Injectable({ providedIn: 'root' })
export class VisitorsDataService {
  getVisitorsPaginated(page: number, limit: number): Observable<PaginatedResponse<Visitor>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<PaginatedResponse<Visitor>>(this.baseUrl, {
      params,
      withCredentials: true,
    });
  }
}
```

## Reglas de Naming

| Elemento | Patrón | Ejemplo |
|----------|--------|---------|
| Data Service | `{Entity}DataService` | `VisitorsDataService` |
| DTO Create | `Create{Entity}Dto` | `CreateVisitorDto` |
| DTO Update | `Update{Entity}Dto` | `UpdateVisitorDto` |
| Filters | `{Entity}Filters` | `VisitorFilters` |
| Archivo | `{entity}-data.service.ts` | `visitors-data.service.ts` |

## Checklist

- [ ] `@Injectable({ providedIn: 'root' })`
- [ ] `inject(HttpClient)` y `inject(ENVIRONMENT_TOKEN)`
- [ ] `withCredentials: true` en todas las peticiones
- [ ] Cache con `shareReplay` cuando aplique
- [ ] `invalidateCache()` después de mutaciones
- [ ] Tipado de requests y responses
- [ ] Manejo de errores con `catchError`

## Anti-patrones

- Hardcodear URLs (usar ENVIRONMENT_TOKEN)
- Olvidar `withCredentials: true`
- Cache sin invalidación
- Peticiones sin tipado
- Errores sin manejo
- Subscripciones en el servicio (retornar Observable)
