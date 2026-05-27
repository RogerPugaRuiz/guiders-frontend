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
 * - 500 Internal Server Error, 503 Service Unavailable, 0 (network error):
 *   logs to console and rethrows so individual components can show their own error state.
 * - All other errors: passes through unchanged.
 *
 * IMPORTANT: This interceptor must be registered AFTER authRefreshInterceptor and authInterceptor()
 * in withInterceptors([authRefreshInterceptor, authInterceptor(), globalErrorInterceptor]).
 * The authRefreshInterceptor will attempt token refresh on 401 first. Only unrecoverable
 * 401s (where refresh also fails) will propagate here.
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
        // Do not redirect if the failing request is itself a BFF auth endpoint
        // (e.g. /api/bff/auth/me, /api/bff/auth/refresh). Redirecting in that
        // case would cause an exponential encoding loop in the redirect param.
        if (req.url.includes('/bff/auth/')) {
          return throwError(() => error);
        }

        if (!redirectingToLogin) {
          redirectingToLogin = true;
          console.warn('[GlobalErrorInterceptor] Unrecoverable 401 — clearing session and redirecting to BFF login', req.url);
          sessionService.clearCache();
          // Use the dedicated bffOrigin (absolute) so location.replace triggers a
          // real browser navigation that exits the Angular SPA. Falls back to
          // deriving the origin from baseUrl for backwards compatibility.
          const bffBase = environment.api.bffOrigin
            ?? (environment.api.baseUrl.startsWith('/')
              ? window.location.origin + environment.api.baseUrl
              : environment.api.baseUrl);
          const returnPath = window.location.pathname + window.location.search;
          const ret = encodeURIComponent(returnPath);
          location.replace(`${bffBase}/bff/auth/login?redirect=${ret}`);
          setTimeout(() => { redirectingToLogin = false; }, 5000);
        }
        return EMPTY;
      }

      if (error.status === 500 || error.status === 503 || error.status === 0) {
        console.error('[GlobalErrorInterceptor] HTTP error', error.status, req.url, error.message ?? error);
      }

      return throwError(() => error);
    })
  );
};
