import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Router } from '@angular/router';
import { EMPTY, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { SessionService } from './session.service';

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
 *   clears the user session and redirects to /login.
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
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse)) {
        return throwError(() => error);
      }

      if (error.status === 401) {
        if (!redirectingToLogin) {
          redirectingToLogin = true;
          console.warn('[GlobalErrorInterceptor] Unrecoverable 401 — clearing session and redirecting to /login', req.url);
          sessionService.clearCache();
          router.navigate(['/login']).catch((navErr) =>
            console.error('[GlobalErrorInterceptor] Failed to redirect to /login', navErr)
          ).finally(() => {
            redirectingToLogin = false;
          });
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
