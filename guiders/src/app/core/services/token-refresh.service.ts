import { Injectable, NgZone, inject, OnDestroy, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { interval, Subscription, Subject, takeUntil, EMPTY } from 'rxjs';
import { filter, switchMap, catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { isTokenNearExpiration } from '../utils/jwt.utils';
import { AuthSession } from '@libs/feature/auth';

/**
 * Servicio para gestionar la renovación automática del token mientras la aplicación esté activa
 */
@Injectable({
  providedIn: 'root'
})
export class TokenRefreshService implements OnDestroy {
  private authService = inject(AuthService);
  private ngZone = inject(NgZone);
  private platformId = inject(PLATFORM_ID);
  
  private destroy$ = new Subject<void>();
  
  // Subscripciones para limpiar al destruir el servicio
  private checkIntervalSubscription?: Subscription;
  
  // Control para evitar múltiples refreshes simultáneos
  private isRefreshing = false;
  
  // Configuración
  private readonly TOKEN_CHECK_INTERVAL = 60 * 1000; // Verificar el token cada minuto

  /**
   * Inicializa el servicio de renovación de token automática
   */
  initialize(): void {
    // Solo ejecutar en el navegador
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    console.log('Iniciando servicio de renovación automática de tokens');
    this.setupTokenRefreshCheck();
  }

  /**
   * Configura la verificación periódica del token
   */
  private setupTokenRefreshCheck(): void {
    // Ejecutar el intervalo fuera de la zona de Angular para evitar problemas con la hidratación SSR
    this.ngZone.runOutsideAngular(() => {
      this.checkIntervalSubscription = interval(this.TOKEN_CHECK_INTERVAL).pipe(
        takeUntil(this.destroy$),
        switchMap(() => this.authService.getSession()),
        filter(session => !!session?.token),
        filter(session => isTokenNearExpiration(session!.token, 300)), // 5 minutos antes de expirar
        filter(() => !this.isRefreshing), // Evitar múltiples refreshes simultáneos
        switchMap(() => {
          console.log('Token próximo a expirar. Refrescando automáticamente...');
          return this.performTokenRefresh();
        }),
        catchError(err => {
          console.error('Error en la verificación del token:', err);
          this.isRefreshing = false;
          return EMPTY;
        })
      ).subscribe();
    });
  }

  /**
   * Realiza el refresh del token
   */
  private performTokenRefresh() {
    return new Promise<void>((resolve, reject) => {
      this.ngZone.run(() => {
        this.isRefreshing = true;
        
        this.authService.refreshToken().subscribe({
          next: (authSession: AuthSession) => {
            console.log('Token refrescado correctamente', authSession);
            this.isRefreshing = false;
            resolve();
          },
          error: err => {
            console.error('Error al refrescar el token:', err);
            this.isRefreshing = false;
            reject(err);
          }
        });
      });
    });
  }
  
  /**
   * Limpia las subscripciones cuando se destruye el servicio
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    
    this.checkIntervalSubscription?.unsubscribe();
  }
}
