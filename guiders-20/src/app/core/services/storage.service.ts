import { Injectable, signal } from '@angular/core';

/**
 * Servicio para manejar el almacenamiento local del navegador
 * Compatible con SSR (Server-Side Rendering)
 */
@Injectable({
  providedIn: 'root'
})
export class StorageService {
  // Signal para detectar cambios en el almacenamiento
  private storageChange = signal<Record<string, unknown>>({});
  
  // Verificar si estamos en el navegador o en el servidor
  private isBrowser = typeof window !== 'undefined';

  /**
   * Obtiene un elemento del almacenamiento local
   * @param key Clave del elemento a obtener
   * @returns El valor almacenado o null si no existe
   */
  getItem(key: string): string | null {
    if (this.isBrowser) {
      return localStorage.getItem(key);
    }
    return null;
  }
  
  /**
   * Guarda un elemento en el almacenamiento local
   * @param key Clave del elemento a guardar
   * @param value Valor a guardar
   */
  setItem(key: string, value: string): void {
    if (this.isBrowser) {
      localStorage.setItem(key, value);
      this.notifyChange(key, value);
    }
  }
  
  /**
   * Elimina un elemento del almacenamiento local
   * @param key Clave del elemento a eliminar
   */
  removeItem(key: string): void {
    if (this.isBrowser) {
      localStorage.removeItem(key);
      this.notifyChange(key, null);
    }
  }
  
  /**
   * Limpia todo el almacenamiento local
   */
  clear(): void {
    if (this.isBrowser) {
      localStorage.clear();
      this.storageChange.set({});
    }
  }
  
  /**
   * Notifica cambios en el almacenamiento
   * @param key Clave que ha cambiado
   * @param value Nuevo valor
   */
  private notifyChange(key: string, value: unknown): void {
    this.storageChange.update(state => ({ ...state, [key]: value }));
  }
}
