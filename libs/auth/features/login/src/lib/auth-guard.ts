import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { OidcSecurityService } from 'angular-auth-oidc-client';


export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const oidcSecurityService = inject(OidcSecurityService);

  // Verificar si existe el access-token en localStorage
  const token = localStorage.getItem('access-token');
  
  if (token) {
    return true; // Permitir acceso
  } else {
    // Redirigir a login si no hay token
    oidcSecurityService.authorize();
    return false;
  }
};
