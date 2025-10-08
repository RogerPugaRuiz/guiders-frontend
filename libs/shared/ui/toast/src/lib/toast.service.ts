import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Toast, ToastConfig, ToastPosition } from './toast.types';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private readonly toastsSubject = new BehaviorSubject<Toast[]>([]);
  readonly toasts$ = this.toastsSubject.asObservable();

  private readonly positionSubject = new BehaviorSubject<ToastPosition>('top-right');
  readonly position$ = this.positionSubject.asObservable();

  private defaultDuration = 3000; // 3 segundos por defecto

  /**
   * Muestra un toast con la configuración especificada
   * @param config Configuración del toast
   * @returns ID del toast creado
   */
  show(config: ToastConfig): string {
    const toast: Toast = {
      id: this.generateId(),
      message: config.message,
      type: config.type || 'info',
      duration: config.duration ?? this.defaultDuration
    };

    const currentToasts = this.toastsSubject.value;
    this.toastsSubject.next([...currentToasts, toast]);

    // Auto-remover el toast después de la duración especificada
    if (toast.duration !== undefined && toast.duration > 0) {
      setTimeout(() => this.remove(toast.id), toast.duration);
    }

    return toast.id;
  }

  /**
   * Muestra un toast de éxito
   */
  success(message: string, duration?: number): string {
    return this.show({ message, type: 'success', duration });
  }

  /**
   * Muestra un toast de error
   */
  error(message: string, duration?: number): string {
    return this.show({ message, type: 'error', duration });
  }

  /**
   * Muestra un toast de advertencia
   */
  warning(message: string, duration?: number): string {
    return this.show({ message, type: 'warning', duration });
  }

  /**
   * Muestra un toast de información
   */
  info(message: string, duration?: number): string {
    return this.show({ message, type: 'info', duration });
  }

  /**
   * Remueve un toast específico por su ID
   */
  remove(id: string): void {
    const currentToasts = this.toastsSubject.value;
    this.toastsSubject.next(currentToasts.filter(toast => toast.id !== id));
  }

  /**
   * Remueve todos los toasts
   */
  clear(): void {
    this.toastsSubject.next([]);
  }

  /**
   * Establece la posición donde aparecerán los toasts
   */
  setPosition(position: ToastPosition): void {
    this.positionSubject.next(position);
  }

  /**
   * Obtiene la posición actual
   */
  getPosition(): ToastPosition {
    return this.positionSubject.value;
  }

  /**
   * Genera un ID único para el toast
   */
  private generateId(): string {
    return `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
}
