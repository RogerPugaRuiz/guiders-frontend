import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  
  // Verificar si existe el access-token en localStorage
  const token = localStorage.getItem('access-token');
  
  if (token) {
    return true; // Permitir acceso
  } else {
    // Redirigir a login si no hay token
    router.navigate(['/login']);
    return false;
  }
};
