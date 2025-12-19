# HTTP Services

## Description

Patterns for services that make HTTP requests with HttpClient, authentication and error handling.

## Reference

`libs/chat/data-access/visitors-data-service/src/lib/visitors-data.service.ts`

## Base Structure

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

  // GET list
  getVisitors(): Observable<Visitor[]> {
    return this.http.get<Visitor[]>(this.baseUrl, {
      withCredentials: true,
    });
  }

  // GET by ID
  getVisitorById(id: string): Observable<Visitor> {
    return this.http.get<Visitor>(`${this.baseUrl}/${id}`, {
      withCredentials: true,
    });
  }

  // POST create
  createVisitor(data: CreateVisitorDto): Observable<Visitor> {
    return this.http.post<Visitor>(this.baseUrl, data, {
      withCredentials: true,
    });
  }

  // PUT update
  updateVisitor(id: string, data: UpdateVisitorDto): Observable<Visitor> {
    return this.http.put<Visitor>(`${this.baseUrl}/${id}`, data, {
      withCredentials: true,
    });
  }

  // DELETE delete
  deleteVisitor(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`, {
      withCredentials: true,
    });
  }
}
```

## Cache with shareReplay

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

  // Invalidate cache after mutations
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

// Alternative with HttpParamsOptions
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

## Error Handling

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

        // Return empty array as fallback
        return of([]);

        // Or propagate the error
        // return throwError(() => new Error('Could not load visitors'));
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

## Custom Headers

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

## Response Typing

```typescript
// Response interfaces
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

// Service usage
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

## Naming Rules

| Element | Pattern | Example |
|----------|--------|---------|
| Data Service | `{Entity}DataService` | `VisitorsDataService` |
| DTO Create | `Create{Entity}Dto` | `CreateVisitorDto` |
| DTO Update | `Update{Entity}Dto` | `UpdateVisitorDto` |
| Filters | `{Entity}Filters` | `VisitorFilters` |
| File | `{entity}-data.service.ts` | `visitors-data.service.ts` |

## Checklist

- [ ] `@Injectable({ providedIn: 'root' })`
- [ ] `inject(HttpClient)` and `inject(ENVIRONMENT_TOKEN)`
- [ ] `withCredentials: true` in all requests
- [ ] Cache with `shareReplay` when applicable
- [ ] `invalidateCache()` after mutations
- [ ] Typing of requests and responses
- [ ] Error handling with `catchError`

## Anti-patterns

- Hardcode URLs (use ENVIRONMENT_TOKEN)
- Forget `withCredentials: true`
- Cache without invalidation
- Requests without typing
- Errors without handling
- Subscriptions in the service (return Observable)
