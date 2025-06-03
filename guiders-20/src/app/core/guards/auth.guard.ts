import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { CanActivate, CanActivateChild, Router, UrlTree } from '@angular/router';
import { Observable, map, tap, defer, of } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../services/auth.service';

/**
 * Guard de autenticación para proteger rutas en Guiders-20
 * Verifica si el usuario está autenticado antes de permitir el acceso
 */
@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate, CanActivateChild {
  private authService = inject(AuthService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  canActivate(): Observable<boolean | UrlTree> {
    return this.checkAuthentication();
  }

  canActivateChild(): Observable<boolean | UrlTree> {
    return this.checkAuthentication();
  }

  private checkAuthentication(): Observable<boolean | UrlTree> {
    // En SSR, permitir acceso temporalmente para evitar problemas de hidratación
    // La autenticación real se verificará después de la hidratación en el cliente
    if (!isPlatformBrowser(this.platformId)) {
      console.log('AuthGuard: Ejecutándose en servidor - permitiendo acceso temporal');
      return of(true);
    }

    // En el cliente, usar defer para asegurar que la verificación ocurre
    // después de que Angular esté completamente hidratado
    return defer(() => {
      return this.authService.checkAuthenticationStatus().pipe(
        tap(isAuthenticated => {
          if (!isAuthenticated) {
            console.log('Usuario no autenticado, redirigiendo al login');
          } else {
            console.log('Usuario autenticado, permitiendo acceso');
          }
        }),
        map(isAuthenticated => {
          if (isAuthenticated) {
            return true;
          } else {
            // Redirigir al login si no está autenticado
            return this.router.createUrlTree(['/login']);
          }
        })
      );
    });
  }
}
