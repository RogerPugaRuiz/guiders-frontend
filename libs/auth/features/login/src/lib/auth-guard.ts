// auth.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { SessionService, ENVIRONMENT_TOKEN } from '@guiders-frontend/auth/data-access/session';

export const authGuard: CanActivateFn = () => {
  const sessionService = inject(SessionService);
  const environment = inject(ENVIRONMENT_TOKEN);

  console.log('AuthGuard: Checking user session...');

  return sessionService.ensureSession$().pipe(
    map(user => {
      // Si hay usuario, permitir acceso
      return !!user;
    }),
    catchError(error => {
      const bffBase = environment.api.bffOrigin
        ?? (environment.api.baseUrl.startsWith('/')
          ? window.location.origin + environment.api.baseUrl
          : environment.api.baseUrl);
      const ret = encodeURIComponent(window.location.pathname + window.location.search);
      location.replace(`${bffBase}/bff/auth/login?redirect=${ret}`);
      return of(false);
    })
  );
};
