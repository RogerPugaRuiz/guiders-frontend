// auth.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { map, take } from 'rxjs/operators';

export const authGuard: CanActivateFn = (_route, state) => {
  const oidc = inject(OidcSecurityService);

  return oidc.checkAuth().pipe(
    take(1),
    map(({ isAuthenticated }) => {
      if (isAuthenticated) return true;

      // Redirige a Keycloak y vuelve a la URL solicitada
      oidc.authorize();

      return false;
    })
  );
};
