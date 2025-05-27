import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Servicio de almacenamiento compatible con SSR
 * Proporciona una interfaz consistente para localStorage que funciona tanto en browser como en servidor
 */
@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  /**
   * Obtiene un item del localStorage
   * Retorna null si no existe o si estamos en servidor
   */
  getItem(key: string): string | null {
    if (!this.isBrowser) {
      return null; // En servidor, siempre retorna null
    }
    
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.warn('Error accessing localStorage:', error);
      return null;
    }
  }

  /**
   * Guarda un item en localStorage
   * No hace nada si estamos en servidor
   */
  setItem(key: string, value: string): void {
    if (!this.isBrowser) {
      return; // En servidor, no hace nada
    }
    
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.warn('Error writing to localStorage:', error);
    }
  }

  /**
   * Remueve un item del localStorage
   * No hace nada si estamos en servidor
   */
  removeItem(key: string): void {
    if (!this.isBrowser) {
      return; // En servidor, no hace nada
    }
    
    try {
      console.log(`Removing item from localStorage: ${key} - this is a test log [1]`);
      // localStorage.removeItem(key);
    } catch (error) {
      console.warn('Error removing from localStorage:', error);
    }
  }

  /**
   * Limpia todo el localStorage
   * No hace nada si estamos en servidor
   */
  clear(): void {
    if (!this.isBrowser) {
      return; // En servidor, no hace nada
    }
    
    try {
      localStorage.clear();
    } catch (error) {
      console.warn('Error clearing localStorage:', error);
    }
  }

  /**
   * Verifica si localStorage está disponible
   */
  isAvailable(): boolean {
    return this.isBrowser;
  }
}
