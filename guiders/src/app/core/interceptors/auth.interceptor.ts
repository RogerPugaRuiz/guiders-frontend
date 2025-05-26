import { Injectable, inject } from '@angular/core';
import { 
  HttpInterceptor, 
  HttpRequest, 
  HttpHandler, 
  HttpEvent, 
  HttpErrorResponse 
} from '@angular/common/http';
import { Observable, throwError, from, switchMap, catchError, lastValueFrom } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { isTokenAboutToExpire } from '../utils/jwt.utils';

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
    return from(this.getSessionWithRefreshIfNeeded()).pipe(
      switchMap(session => {
        const authReq = this.addAuthHeader(req, session?.token);
        
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

  private async getSessionWithRefreshIfNeeded() {
    try {
      const session = await lastValueFrom(this.authService.getSession());
      
      // If no session or no token, return null
      if (!session || !session.token) {
        return null;
      }

      // Check if token is about to expire
      if (isTokenAboutToExpire(session.token)) {
        console.log('Access token is about to expire, refreshing...');
        try {
          // Try to refresh the token
          return await this.authService.refreshToken();
        } catch (error: any) {
          // Handle specific error cases for refresh token
          if (error instanceof HttpErrorResponse) {
            if (error.status === 400 || error.status === 401 || error.status === 500) {
              // For 400 (malformed token), 401 (invalid refresh) or 500 (server error)
              // Clear session and redirect to login
              this.handleAuthError();
            }
          }
          return null;
        }
      }

      return session;
    } catch (error) {
      console.error('Error in getSessionWithRefreshIfNeeded:', error);
      return null;
    }
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