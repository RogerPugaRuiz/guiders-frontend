import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, fromEvent, merge } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

export interface UserStatus {
  isOnline: boolean;
  lastSeen?: Date;
  connectionType?: 'online' | 'offline' | 'away';
}

@Injectable({
  providedIn: 'root'
})
export class UserStatusService {
  private userStatusSubject = new BehaviorSubject<UserStatus>({
    isOnline: navigator.onLine,
    lastSeen: new Date(),
    connectionType: navigator.onLine ? 'online' : 'offline'
  });

  private awayTimer: any;
  private readonly AWAY_TIME = 5 * 60 * 1000; // 5 minutos para considerar "away"

  constructor() {
    this.initializeNetworkListeners();
    this.initializeActivityListeners();
  }

  /**
   * Observable del estado actual del usuario
   */
  get userStatus$(): Observable<UserStatus> {
    return this.userStatusSubject.asObservable();
  }

  /**
   * Obtiene el estado actual del usuario
   */
  getCurrentStatus(): UserStatus {
    return this.userStatusSubject.value;
  }

  /**
   * Observable que solo emite el estado de conexión (boolean)
   */
  get isOnline$(): Observable<boolean> {
    return this.userStatus$.pipe(
      map(status => status.isOnline)
    );
  }

  /**
   * Obtiene el texto descriptivo del estado
   */
  getStatusText(): string {
    const status = this.getCurrentStatus();
    
    if (!status.isOnline) {
      return 'Sin conexión';
    }
    
    switch (status.connectionType) {
      case 'online':
        return 'En línea';
      case 'away':
        return 'Ausente';
      case 'offline':
        return 'Desconectado';
      default:
        return 'En línea';
    }
  }

  /**
   * Obtiene la clase CSS para el indicador de estado
   */
  getStatusClass(): string {
    const status = this.getCurrentStatus();
    
    if (!status.isOnline) {
      return 'status--offline';
    }
    
    switch (status.connectionType) {
      case 'online':
        return 'status--online';
      case 'away':
        return 'status--away';
      case 'offline':
        return 'status--offline';
      default:
        return 'status--online';
    }
  }

  /**
   * Fuerza una actualización del estado a "online"
   */
  setOnline(): void {
    this.updateStatus({
      isOnline: true,
      lastSeen: new Date(),
      connectionType: 'online'
    });
  }

  /**
   * Fuerza una actualización del estado a "away"
   */
  setAway(): void {
    const currentStatus = this.getCurrentStatus();
    if (currentStatus.isOnline) {
      this.updateStatus({
        ...currentStatus,
        connectionType: 'away'
      });
    }
  }

  /**
   * Inicializa los listeners para detectar cambios de red
   */
  private initializeNetworkListeners(): void {
    if (typeof window !== 'undefined') {
      // Detectar cambios en la conexión a internet
      const online$ = fromEvent(window, 'online').pipe(map(() => true));
      const offline$ = fromEvent(window, 'offline').pipe(map(() => false));
      
      merge(online$, offline$)
        .pipe(startWith(navigator.onLine))
        .subscribe(isOnline => {
          this.updateStatus({
            isOnline,
            lastSeen: new Date(),
            connectionType: isOnline ? 'online' : 'offline'
          });
        });
    }
  }

  /**
   * Inicializa los listeners para detectar actividad del usuario
   */
  private initializeActivityListeners(): void {
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
      
      activityEvents.forEach(event => {
        document.addEventListener(event, () => this.onUserActivity(), { passive: true });
      });

      // Iniciar el timer de inactividad
      this.resetAwayTimer();
    }
  }

  /**
   * Maneja la actividad del usuario
   */
  private onUserActivity(): void {
    const currentStatus = this.getCurrentStatus();
    
    // Si el usuario estaba ausente, marcarlo como online
    if (currentStatus.connectionType === 'away' && currentStatus.isOnline) {
      this.setOnline();
    }
    
    // Reiniciar el timer de inactividad
    this.resetAwayTimer();
  }

  /**
   * Reinicia el timer para marcar al usuario como ausente
   */
  private resetAwayTimer(): void {
    if (this.awayTimer) {
      clearTimeout(this.awayTimer);
    }

    this.awayTimer = setTimeout(() => {
      this.setAway();
    }, this.AWAY_TIME);
  }

  /**
   * Actualiza el estado del usuario
   */
  private updateStatus(newStatus: UserStatus): void {
    this.userStatusSubject.next(newStatus);
  }
}
