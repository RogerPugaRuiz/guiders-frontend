import { Injectable, inject } from '@angular/core';
import { 
  HttpInterceptor, 
  HttpRequest, 
  HttpHandler, 
  HttpEvent, 
  HttpErrorResponse 
} from '@angular/common/http';
import { Observable, throwError, from, switchMap } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

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