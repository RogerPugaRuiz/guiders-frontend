import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { OidcService } from '@guiders-frontend/auth/services/oidc';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const oidcService = inject(OidcService);
  
  // Check if user is authenticated using OIDC
  if (oidcService.isAuthenticated()) {
    // Check if token will expire soon and refresh if needed
    if (oidcService.willTokenExpireSoon()) {
      oidcService.refreshToken().catch(() => {
        // If refresh fails, redirect to login
        router.navigate(['/login']);
      });
    }
    return true;
  } else {
    // Store the attempted URL for redirect after login
    sessionStorage.setItem('oidc_return_url', state.url);
    
    // Redirect to login
    router.navigate(['/login']);
    return false;
  }
};
