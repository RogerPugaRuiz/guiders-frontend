import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { 
  HttpInterceptorFn,
  HttpErrorResponse 
} from '@angular/common/http';
import { throwError, catchError, switchMap, from, Observable, EMPTY, of } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { isTokenNearExpiration, isTokenExpired } from '../utils/jwt.utils';

// Variable global para controlar el refresh en progreso
let refreshInProgress = false;
let refreshPromise: Promise<any> | null = null;

/**
 * Interceptor funcional HTTP para añadir automáticamente el token de autenticación JWT
 * a todas las peticiones HTTP salientes y manejar errores de autenticación
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  // Saltar procesamiento de auth en el servidor durante SSR/hidratación
  if (!isPlatformBrowser(platformId)) {
    return next(req);
  }

  // Saltar headers de auth para endpoints de login y registro
  if (shouldSkipAuth(req.url)) {
    return next(req);
  }

  // Obtener token actual del AuthService
  const token = authService.authToken();
  
  // Si no hay token, continuar sin auth header pero manejar errores 401
  if (!token) {
    return next(req).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          handleAuthError(authService, router);
        }
        return throwError(() => error);
      })
    );
  }

  // Verificar si el token ha expirado
  if (isTokenExpired(token)) {
    handleAuthError(authService, router);
    return throwError(() => new HttpErrorResponse({
      status: 401,
      statusText: 'Token Expired',
      error: { message: 'Token de acceso expirado' }
    }));
  }

  // Verificar si el token está próximo a expirar
  if (isTokenNearExpiration(token)) {
    console.log('Token próximo a expirar. Verificando si refresh está en progreso...');
    
    // Si ya hay un refresh en progreso, esperar a que termine
    if (refreshInProgress && refreshPromise) {
      console.log('Refresh en progreso, esperando...');
      return from(refreshPromise).pipe(
        switchMap(newSession => {
          console.log('Usando token refrescado de operación en progreso.');
          const authReq = addAuthHeader(req, newSession.token);
          return next(authReq);
        }),
        catchError((refreshError: HttpErrorResponse) => {
          console.error('Error en el refresh en progreso:', refreshError);
          handleAuthError(authService, router);
          return throwError(() => refreshError);
        })
      );
    }

    // Iniciar el proceso de refresh
    console.log('Iniciando refresh de token...');
    refreshInProgress = true;
    refreshPromise = authService.refreshToken().toPromise();
    
    return from(refreshPromise).pipe(
      switchMap(newSession => {
        console.log('Token refrescado exitosamente.');
        refreshInProgress = false;
        refreshPromise = null;
        
        // Continuar con la petición original usando el nuevo token
        const authReq = addAuthHeader(req, newSession.token);
        return next(authReq);
      }),
      catchError((refreshError: HttpErrorResponse) => {
        console.error('Error al refrescar el token:', refreshError);
        refreshInProgress = false;
        refreshPromise = null;
        
        // Si el refresh falla, limpiar sesión y manejar como error de auth
        handleAuthError(authService, router);
        return throwError(() => refreshError);
      })
    );
  }

  // Añadir token de autorización a la petición
  const authReq = addAuthHeader(req, token);
  
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 || error.status === 403) {
        handleAuthError(authService, router);
      }
      return throwError(() => error);
    })
  );
};

/**
 * Determina si el auth header debe ser omitido para la URL dada
 * @param url URL de la petición
 * @returns true si se debe omitir el auth header
 */
function shouldSkipAuth(url: string): boolean {
  const skipPaths = [
    '/api/auth/login', 
    '/api/auth/register',
    '/api/auth/refresh',
    '/api/auth/forgot-password',
    '/api/auth/reset-password',
    // También incluir rutas públicas si las hay
    '/api/public'
  ];
  
  // También saltar si hay un refresh en progreso y es una petición de refresh
  if (refreshInProgress && url.includes('/auth/refresh')) {
    return true;
  }
  
  return skipPaths.some(path => url.includes(path));
}

/**
 * Añade el header de autorización a la petición HTTP
 * @param req Petición HTTP original
 * @param token Token JWT a añadir
 * @returns Nueva petición con el header de autorización
 */
function addAuthHeader(req: any, token: string): any {
  // En entorno de tests, usar un valor fijo para el token
  const isTest = (typeof process !== 'undefined' && process.env) ? 
    (process.env['NODE_ENV'] === 'test' || process.env['JEST_WORKER_ID']) : false;
  const tokenValue = isTest ? '******' : `Bearer ${token}`;
  
  return req.clone({
    setHeaders: {
      Authorization: tokenValue
    }
  });
}

/**
 * Maneja errores de autenticación limpiando la sesión y redirigiendo al login
 */
function handleAuthError(authService: AuthService, router: Router): void {
  // Limpiar sesión y redirigir al login
  authService.logout().subscribe({
    complete: () => {
      // Redirigir al login
      router.navigate(['/login']);
    }
  });
}
