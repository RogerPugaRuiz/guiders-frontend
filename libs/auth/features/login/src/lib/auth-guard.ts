// auth.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { SessionService, ENVIRONMENT_TOKEN } from '@guiders-frontend/auth/data-access/session';

export const authGuard: CanActivateFn = () => {
  const sessionService = inject(SessionService);
  const environment = inject(ENVIRONMENT_TOKEN);

  console.log('AuthGuard: Checking user session...');

  return sessionService.ensureSession$().pipe(
    map(user => !!user),
    catchError((error: unknown) => {
      // 403 user_not_provisioned: el usuario está autenticado en Keycloak pero
      // no existe en la BD del backend. Redirigir al login causaría un loop
      // infinito; en su lugar navegamos a /account-not-configured para mostrar
      // la página de error específica. El guard devuelve false para bloquear
      // la ruta protegida.
      if (
        error instanceof HttpErrorResponse &&
        error.status === 403 &&
        (error.error as { reason?: string })?.reason === 'user_not_provisioned'
      ) {
        if (window.location.pathname !== '/account-not-configured') {
          location.replace('/account-not-configured');
        }
        return of(false);
      }

      // Cualquier otro error (401, red, etc.): redirigir al login BFF
      const ret = encodeURIComponent(window.location.href);
      location.replace(`${environment.api.baseUrl}/bff/auth/login?redirect=${ret}`);
      return of(false);
    })
  );
};
