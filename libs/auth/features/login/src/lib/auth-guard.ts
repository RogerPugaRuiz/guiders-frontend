// auth.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { SessionService, ENVIRONMENT_TOKEN } from '@guiders-frontend/auth/data-access/session';

export const authGuard: CanActivateFn = () => {
  const sessionService = inject(SessionService);
  const router = inject(Router);
  const environment = inject(ENVIRONMENT_TOKEN);

  console.log('AuthGuard: Checking user session...');

  return sessionService.ensureSession$().pipe(
    map(user => {
      // Si hay usuario, permitir acceso
      return !!user;
    }),
    catchError(error => {
      const ret = encodeURIComponent(router.url);
      location.replace(`${environment.api.baseUrl}/bff/auth/login?redirect=${ret}`);
      return of(false);
    })
  );
};
