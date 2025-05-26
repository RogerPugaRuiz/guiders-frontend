import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { CanActivate, CanActivateChild, Router, UrlTree } from '@angular/router';
import { Observable, map, tap, defer, of } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate, CanActivateChild {
  constructor(
    private authService: AuthService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  canActivate(): Observable<boolean | UrlTree> {
    return this.checkAuthentication();
  }

  canActivateChild(): Observable<boolean | UrlTree> {
    return this.checkAuthentication();
  }

  private checkAuthentication(): Observable<boolean | UrlTree> {
    // En SSR, permitir acceso temporalmente para evitar el flash
    // La autenticación real se verificará después de la hidratación
    if (!isPlatformBrowser(this.platformId)) {
      console.log('AuthGuard: Ejecutándose en servidor - permitiendo acceso temporal');
      return of(true);
    }

    // En el cliente, usar defer para asegurar que la verificación ocurre
    // después de que Angular esté completamente hidratado
    return defer(() => {
      return this.authService.isAuthenticated().pipe(
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
            return this.router.createUrlTree(['/auth/login']);
          }
        })
      );
    });
  }
}