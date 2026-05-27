import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { EMPTY, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { SessionService } from './session.service';
import { ENVIRONMENT_TOKEN } from './environment.token';

/**
 * Guard to prevent duplicate 401 redirects when multiple concurrent requests
 * fail simultaneously. Reset to false after navigation completes.
 */
let redirectingToLogin = false;

/**
 * Global HTTP error boundary interceptor.
 *
 * Handles:
 * - 401 Unauthorized (after authRefreshInterceptor has already tried token refresh):
 *   clears the user session and redirects to the BFF login endpoint.
 * - 403 Forbidden with reason=user_not_provisioned:
 *   the JWT is valid but the user does not exist in the backend DB.
 *   Redirecting to login would cause an infinite loop (OAuth completes → same 403 → loop).
 *   Instead, navigates to /account-not-configured so the user sees a clear error message.
 * - 500 Internal Server Error, 503 Service Unavailable, 0 (network error):
 *   logs to console and rethrows so individual components can show their own error state.
 * - All other errors: passes through unchanged.
 *
 * IMPORTANT: This interceptor must be registered AFTER authRefreshInterceptor and authInterceptor()
 * in withInterceptors([authRefreshInterceptor, authInterceptor(), globalErrorInterceptor]).
 */
export const globalErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const sessionService = inject(SessionService);
  const environment = inject(ENVIRONMENT_TOKEN);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse)) {
        return throwError(() => error);
      }

      if (error.status === 401) {
        if (!redirectingToLogin) {
          redirectingToLogin = true;
          console.warn('[GlobalErrorInterceptor] Unrecoverable 401 — clearing session and redirecting to BFF login', req.url);
          sessionService.clearCache();
          const ret = encodeURIComponent(window.location.href);
          location.replace(`${environment.api.baseUrl}/bff/auth/login?redirect=${ret}`);
          setTimeout(() => { redirectingToLogin = false; }, 5000);
        }
        return EMPTY;
      }

      // 403 user_not_provisioned: el JWT de Keycloak es válido pero el usuario
      // no existe en la BD del backend. Redirigir al login causaría un loop
      // infinito — en su lugar mostramos una página de error específica.
      if (error.status === 403 && req.url.includes('/bff/auth/me')) {
        const body = error.error as { reason?: string } | null;
        if (body?.reason === 'user_not_provisioned') {
          console.warn('[GlobalErrorInterceptor] 403 user_not_provisioned — usuario autenticado pero no configurado en BD', req.url);
          sessionService.clearCache();
          location.replace('/account-not-configured');
          return EMPTY;
        }
      }

      if (error.status === 500 || error.status === 503 || error.status === 0) {
        console.error('[GlobalErrorInterceptor] HTTP error', error.status, req.url, error.message ?? error);
      }

      return throwError(() => error);
    })
  );
};
