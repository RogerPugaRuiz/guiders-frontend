import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoaderService {
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  private loaderHidden = true;

  /**
   * Observable que indica si el loader está activo
   */
  public readonly isLoading$: Observable<boolean> = this.isLoadingSubject.asObservable();

  constructor() {
    this.initializeLoader();
  }

  /**
   * Inicializa el loader y configura la detección automática de carga
   */
  private initializeLoader(): void {
    // Solo ejecutar en el cliente
    if (typeof window === 'undefined') {
      return;
    }

    // LOADER DESACTIVADO - No inicializar
    // El loader ya está oculto por defecto
    console.log('📱 Loader desactivado - Inicio directo de aplicación');
  }

  /**
   * Oculta el loader manualmente
   */
  public hideLoader(): void {
    if (this.loaderHidden) {
      return;
    }

    this.loaderHidden = true;
    this.isLoadingSubject.next(false);

    // Disparar evento personalizado para el script del index.html
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('app:ready'));
    }
  }

  /**
   * Muestra el loader (útil para navegación entre rutas)
   */
  public showLoader(): void {
    if (typeof window === 'undefined') {
      return;
    }

    this.loaderHidden = false;
    this.isLoadingSubject.next(true);

    // Solo mostrar si el elemento del loader existe
    const loader = document.getElementById('guidersLoader');
    if (loader) {
      loader.style.display = 'flex';
      loader.classList.remove('fade-out');
      document.body.classList.remove('app-loaded');
    }
  }

  /**
   * Obtiene el estado actual del loading
   */
  public get isLoading(): boolean {
    return this.isLoadingSubject.value;
  }

  /**
   * Simula una carga con progreso (útil para operaciones específicas)
   */
  public simulateProgress(duration: number = 2000): Observable<number> {
    return new Observable(observer => {
      let progress = 0;
      const interval = duration / 100; // 100 steps

      const timer = setInterval(() => {
        progress += 1;
        observer.next(progress);

        if (progress >= 100) {
          clearInterval(timer);
          observer.complete();
        }
      }, interval);

      // Cleanup function
      return () => clearInterval(timer);
    });
  }

  /**
   * Actualiza los textos del loader dinámicamente
   */
  public updateLoaderText(mainText: string, subText?: string): void {
    if (typeof window === 'undefined') {
      return;
    }

    const mainTextElement = document.querySelector('.loading-text');
    const subTextElement = document.querySelector('.loading-subtext');

    if (mainTextElement) {
      mainTextElement.textContent = mainText;
    }

    if (subTextElement && subText) {
      subTextElement.textContent = subText;
    }
  }

  /**
   * Añade una animación de pulso al logo
   */
  public pulseAnimation(): void {
    if (typeof window === 'undefined') {
      return;
    }

    const logo = document.querySelector('.guiders-logo');
    if (logo) {
      logo.classList.add('pulse-animation');
      setTimeout(() => {
        logo.classList.remove('pulse-animation');
      }, 1000);
    }
  }
}
