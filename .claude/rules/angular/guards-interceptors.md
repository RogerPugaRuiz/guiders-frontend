# Guards and Interceptors

## Description

Functional guards to protect routes and functional interceptors to modify HTTP requests.

## Reference

- Guard: `libs/auth/features/login/src/lib/auth-guard.ts`
- Interceptor: `libs/auth/data-access/session/src/lib/auth-refresh.interceptor.ts`

## Functional Guard

```typescript
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { SessionService, ENVIRONMENT_TOKEN } from '@guiders-frontend/auth/data-access/session';

export const authGuard: CanActivateFn = () => {
  const sessionService = inject(SessionService);
  const router = inject(Router);
  const environment = inject(ENVIRONMENT_TOKEN);

  return sessionService.ensureSession$().pipe(
    map(user => !!user),
    catchError(() => {
      // Redirect to external login
      const returnUrl = encodeURIComponent(router.url);
      location.replace(`${environment.api.baseUrl}/bff/auth/login?redirect=${returnUrl}`);
      return of(false);
    })
  );
};
```

## Guard with Roles

```typescript
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { SessionService } from '@guiders-frontend/auth/data-access/session';

export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  return () => {
    const sessionService = inject(SessionService);
    const router = inject(Router);

    return sessionService.ensureSession$().pipe(
      map(user => {
        const hasRole = user.roles.some(role => allowedRoles.includes(role));
        if (!hasRole) {
          router.navigate(['/unauthorized']);
          return false;
        }
        return true;
      })
    );
  };
};

// Usage in routes
export const routes: Route[] = [
  {
    path: 'admin',
    loadComponent: () => import('./admin.component'),
    canActivate: [authGuard, roleGuard(['admin', 'superadmin'])],
  },
];
```

## Deactivation Guard

```typescript
import { CanDeactivateFn } from '@angular/router';

export interface CanComponentDeactivate {
  canDeactivate: () => boolean | Promise<boolean>;
}

export const unsavedChangesGuard: CanDeactivateFn<CanComponentDeactivate> = (component) => {
  if (component.canDeactivate && !component.canDeactivate()) {
    return confirm('You have unsaved changes. Do you want to leave?');
  }
  return true;
};

// Implementation in component
@Component({ /* ... */ })
export class EditForm implements CanComponentDeactivate {
  hasUnsavedChanges = false;

  canDeactivate(): boolean {
    return !this.hasUnsavedChanges;
  }
}
```

## Functional Interceptor

```typescript
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthRefreshService } from './auth-refresh.service';

export const authRefreshInterceptor: HttpInterceptorFn = (req, next) => {
  const authRefreshService = inject(AuthRefreshService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Only handle 401
      if (error.status !== 401) {
        return throwError(() => error);
      }

      // Attempt refresh
      return authRefreshService.refreshSession().pipe(
        switchMap(() => next(req)), // Retry original request
        catchError(refreshError => {
          // Refresh failed, redirect to login
          authRefreshService.redirectToLogin();
          return throwError(() => refreshError);
        })
      );
    })
  );
};
```

## Logging Interceptor

```typescript
import { HttpInterceptorFn } from '@angular/common/http';
import { tap, finalize } from 'rxjs';

export const loggingInterceptor: HttpInterceptorFn = (req, next) => {
  const startTime = Date.now();

  console.log(`[HTTP] ${req.method} ${req.url}`);

  return next(req).pipe(
    tap({
      next: (event) => {
        if (event.type === 4) { // HttpResponse
          console.log(`[HTTP] ${req.method} ${req.url} - ${Date.now() - startTime}ms`);
        }
      },
      error: (error) => {
        console.error(`[HTTP] ${req.method} ${req.url} - Error:`, error);
      },
    })
  );
};
```

## Headers Interceptor

```typescript
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { ENVIRONMENT_TOKEN } from '@guiders-frontend/shared/types';

export const apiHeadersInterceptor: HttpInterceptorFn = (req, next) => {
  const environment = inject(ENVIRONMENT_TOKEN);

  // Only add headers to our API requests
  if (!req.url.startsWith(environment.api.baseUrl)) {
    return next(req);
  }

  const modifiedReq = req.clone({
    setHeaders: {
      'X-Client-Version': '1.0.0',
      'X-Request-Id': crypto.randomUUID(),
    },
  });

  return next(modifiedReq);
};
```

## Registration in App Config

```typescript
// apps/console/src/app/app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([
        loggingInterceptor,
        apiHeadersInterceptor,
        authRefreshInterceptor,
      ])
    ),
  ],
};
```

## Using Guards in Routes

```typescript
// app.routes.ts
export const routes: Route[] = [
  {
    path: '',
    redirectTo: 'inbox',
    pathMatch: 'full',
  },
  {
    path: 'inbox',
    loadChildren: () => import('@guiders-frontend/chat/features/inbox').then(m => m.routes),
    canActivate: [authGuard],
  },
  {
    path: 'login',
    loadComponent: () => import('@guiders-frontend/auth/features/login').then(m => m.Login),
  },
  {
    path: 'settings',
    loadChildren: () => import('@guiders-frontend/admin/features/settings').then(m => m.routes),
    canActivate: [authGuard, roleGuard(['admin'])],
    canDeactivate: [unsavedChangesGuard],
  },
];
```

## Naming Rules

| Element | Pattern | Example |
|----------|--------|---------|
| Guard | `{name}Guard` (camelCase) | `authGuard`, `roleGuard` |
| Interceptor | `{name}Interceptor` | `authRefreshInterceptor` |
| Guard File | `{name}.guard.ts` | `auth.guard.ts` |
| Interceptor File | `{name}.interceptor.ts` | `auth-refresh.interceptor.ts` |

## Guards Checklist

- [ ] `CanActivateFn` function (not class)
- [ ] `inject()` for dependencies
- [ ] Return `Observable<boolean>` or `boolean`
- [ ] Handle errors with `catchError`
- [ ] Appropriate redirect on failure

## Interceptors Checklist

- [ ] `HttpInterceptorFn` function (not class)
- [ ] `inject()` for dependencies
- [ ] Call `next(req)` to continue the chain
- [ ] Register in `provideHttpClient(withInterceptors([...]))`
- [ ] Correct order (logging first, auth last)

## Anti-patterns

- Class-based guards (use functions)
- Class-based interceptors (use functions)
- Not handling errors in guards
- Interceptors that block requests without retrying
- Synchronous guards when async is needed
