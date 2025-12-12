# Guards e Interceptors

## Descripción

Guards funcionales para proteger rutas e interceptors funcionales para modificar peticiones HTTP.

## Referencia

- Guard: `libs/auth/features/login/src/lib/auth-guard.ts`
- Interceptor: `libs/auth/data-access/session/src/lib/auth-refresh.interceptor.ts`

## Guard Funcional

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
      // Redirect a login externo
      const returnUrl = encodeURIComponent(router.url);
      location.replace(`${environment.api.baseUrl}/bff/auth/login?redirect=${returnUrl}`);
      return of(false);
    })
  );
};
```

## Guard con Roles

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

// Uso en rutas
export const routes: Route[] = [
  {
    path: 'admin',
    loadComponent: () => import('./admin.component'),
    canActivate: [authGuard, roleGuard(['admin', 'superadmin'])],
  },
];
```

## Guard de Deactivation

```typescript
import { CanDeactivateFn } from '@angular/router';

export interface CanComponentDeactivate {
  canDeactivate: () => boolean | Promise<boolean>;
}

export const unsavedChangesGuard: CanDeactivateFn<CanComponentDeactivate> = (component) => {
  if (component.canDeactivate && !component.canDeactivate()) {
    return confirm('Tienes cambios sin guardar. ¿Deseas salir?');
  }
  return true;
};

// Implementación en componente
@Component({ /* ... */ })
export class EditForm implements CanComponentDeactivate {
  hasUnsavedChanges = false;

  canDeactivate(): boolean {
    return !this.hasUnsavedChanges;
  }
}
```

## Interceptor Funcional

```typescript
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthRefreshService } from './auth-refresh.service';

export const authRefreshInterceptor: HttpInterceptorFn = (req, next) => {
  const authRefreshService = inject(AuthRefreshService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Solo manejar 401
      if (error.status !== 401) {
        return throwError(() => error);
      }

      // Intentar refresh
      return authRefreshService.refreshSession().pipe(
        switchMap(() => next(req)), // Reintentar request original
        catchError(refreshError => {
          // Refresh falló, redirigir a login
          authRefreshService.redirectToLogin();
          return throwError(() => refreshError);
        })
      );
    })
  );
};
```

## Interceptor de Logging

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

## Interceptor de Headers

```typescript
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { ENVIRONMENT_TOKEN } from '@guiders-frontend/shared/types';

export const apiHeadersInterceptor: HttpInterceptorFn = (req, next) => {
  const environment = inject(ENVIRONMENT_TOKEN);

  // Solo añadir headers a peticiones de nuestra API
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

## Registro en App Config

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

## Uso de Guards en Rutas

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

## Reglas de Naming

| Elemento | Patrón | Ejemplo |
|----------|--------|---------|
| Guard | `{name}Guard` (camelCase) | `authGuard`, `roleGuard` |
| Interceptor | `{name}Interceptor` | `authRefreshInterceptor` |
| Archivo Guard | `{name}.guard.ts` | `auth.guard.ts` |
| Archivo Interceptor | `{name}.interceptor.ts` | `auth-refresh.interceptor.ts` |

## Checklist Guards

- [ ] Función `CanActivateFn` (no clase)
- [ ] `inject()` para dependencias
- [ ] Retornar `Observable<boolean>` o `boolean`
- [ ] Manejar errores con `catchError`
- [ ] Redirect apropiado en caso de fallo

## Checklist Interceptors

- [ ] Función `HttpInterceptorFn` (no clase)
- [ ] `inject()` para dependencias
- [ ] Llamar `next(req)` para continuar la cadena
- [ ] Registrar en `provideHttpClient(withInterceptors([...]))`
- [ ] Orden correcto (logging primero, auth último)

## Anti-patrones

- Guards basados en clases (usar funciones)
- Interceptors basados en clases (usar funciones)
- No manejar errores en guards
- Interceptors que bloquean requests sin reintentar
- Guards síncronos cuando se necesita async
