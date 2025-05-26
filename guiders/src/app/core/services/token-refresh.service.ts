import { Injectable, NgZone, inject, OnDestroy } from '@angular/core';
import { interval, Subscription, fromEvent, merge, Subject, takeUntil } from 'rxjs';
import { debounceTime, filter, switchMap, tap } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { isTokenNearExpiration } from '../utils/jwt.utils';

/**
 * Servicio para gestionar la renovación automática del token cuando el usuario está activo
 * en la aplicación, independientemente de si está realizando peticiones HTTP.
 */
@Injectable({
  providedIn: 'root'
})
export class TokenRefreshService implements OnDestroy {
  private authService = inject(AuthService);
  private ngZone = inject(NgZone);
  
  private destroy$ = new Subject<void>();
  private userActivity$ = new Subject<void>();
  
  // Subscripciones para limpiar al destruir el servicio
  private checkIntervalSubscription?: Subscription;
  private activitySubscription?: Subscription;
  
  // Configuración
  private readonly TOKEN_CHECK_INTERVAL = 60 * 1000; // Verificar el token cada minuto
  private readonly USER_ACTIVITY_DEBOUNCE = 30 * 1000; // Considerar al usuario activo si interactúa cada 30 segundos

  /**
   * Inicializa el servicio de renovación de token basado en actividad del usuario
   */
  initialize(): void {
    this.ngZone.runOutsideAngular(() => {
      // Monitorear eventos de actividad del usuario
      const userEvents = merge(
        fromEvent(document, 'mousemove'),
        fromEvent(document, 'click'),
        fromEvent(document, 'keydown'),
        fromEvent(document, 'scroll'),
        fromEvent(document, 'touchstart')
      );
      
      // Suscribirse a los eventos de actividad del usuario
      this.activitySubscription = userEvents.pipe(
        debounceTime(this.USER_ACTIVITY_DEBOUNCE),
        takeUntil(this.destroy$)
      ).subscribe(() => {
        this.userActivity$.next();
      });
      
      // Verificación periódica del token
      this.checkIntervalSubscription = interval(this.TOKEN_CHECK_INTERVAL).pipe(
        takeUntil(this.destroy$),
        switchMap(() => this.authService.getSession()),
        filter(session => !!session?.token),
        filter(session => isTokenNearExpiration(session!.token, 300)), // 5 minutos antes de expirar
        tap(() => {
          this.ngZone.run(() => {
            console.log('Token próximo a expirar. Refrescando automáticamente...');
            this.authService.refreshToken().subscribe({
              next: () => console.log('Token refrescado correctamente'),
              error: err => console.error('Error al refrescar el token:', err)
            });
          });
        })
      ).subscribe();
    });
  }
  
  /**
   * Limpia las subscripciones cuando se destruye el servicio
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    
    this.checkIntervalSubscription?.unsubscribe();
    this.activitySubscription?.unsubscribe();
  }
}
