import { Injectable, inject } from '@angular/core';
import { 
  HttpInterceptor, 
  HttpRequest, 
  HttpHandler, 
  HttpEvent, 
  HttpErrorResponse 
} from '@angular/common/http';
import { Observable, throwError, from, switchMap, catchError } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { isTokenNearExpiration } from '../utils/jwt.utils';
import { AuthSession } from '@libs/feature/auth';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private authService = inject(AuthService);
  private router = inject(Router);

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Skip auth headers for login and refresh endpoints
    if (this.shouldSkipAuth(req.url)) {
      return next.handle(req);
    }

    // Get current session and add auth header
    return from(this.authService.getSession()).pipe(
      switchMap(session => {
        // Si no hay sesión, no hay token que verificar
        if (!session?.token) {
          return next.handle(req).pipe(
            catchError((error: HttpErrorResponse) => {
              if (error.status === 401) {
                this.handleAuthError();
              }
              return throwError(() => error);
            })
          );
        }
        
        // Verificar si el token está próximo a expirar
        if (isTokenNearExpiration(session.token)) {
          // El token está próximo a expirar, intentar refrescarlo
          return this.refreshAndContinueRequest(req, next);
        }
        
        // El token es válido, continuar con la petición original
        const authReq = this.addAuthHeader(req, session.token);
        return next.handle(authReq).pipe(
          catchError((error: HttpErrorResponse) => {
            if (error.status === 401) {
              this.handleAuthError();
            }
            return throwError(() => error);
          })
        );
      })
    );
  }

  /**
   * Refresca el token de acceso y continúa con la petición original utilizando el nuevo token
   */
  private refreshAndContinueRequest(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return from(this.authService.refreshToken()).pipe(
      switchMap((newSession: AuthSession) => {
        // Continuar con la petición original usando el nuevo token
        const authReq = this.addAuthHeader(req, newSession.token);
        return next.handle(authReq);
      }),
      catchError((error: HttpErrorResponse) => {
        // Si hay un error al refrescar el token, limpiar sesión y redirigir al login
        if (error.status === 400 || error.status === 401 || error.status === 500) {
          this.handleAuthError();
        }
        return throwError(() => error);
      })
    );
  }

  private shouldSkipAuth(url: string): boolean {
    const skipPaths = ['/api/auth/login', '/api/auth/refresh', '/api/auth/register'];
    return skipPaths.some(path => url.includes(path));
  }

  private addAuthHeader(req: HttpRequest<any>, token?: string): HttpRequest<any> {
    if (token) {
      return req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }
    return req;
  }

  private handleAuthError(): void {
    // Clear session and redirect to login
    this.authService.logout().subscribe({
      complete: () => {
        this.router.navigate(['/auth/login']);
      }
    });
  }
}