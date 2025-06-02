import { Injectable, inject, signal } from '@angular/core';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root'
})
export class ThemeStateService {
  private storageService = inject(StorageService);
  
  // Signal para el estado del tema
  private isDarkModeSignal = signal<boolean>(false);
  
  // Señal de solo lectura para el estado del tema
  readonly isDarkMode = this.isDarkModeSignal.asReadonly();

  constructor() {
    // Obtener el tema guardado o usar preferencia del sistema
    const savedTheme = this.storageService.getItem('theme');
    let initialDarkMode = false;
    
    if (savedTheme) {
      initialDarkMode = savedTheme === 'dark';
    } else if (typeof window !== 'undefined') {
      initialDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    
    this.setDarkMode(initialDarkMode);
  }

  setDarkMode(isDarkMode: boolean): void {
    this.isDarkModeSignal.set(isDarkMode);
    
    // Persistir en localStorage
    this.storageService.setItem('theme', isDarkMode ? 'dark' : 'light');
    
    // Aplicar al DOM inmediatamente
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      } else {
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
      }
    }
  }

  toggleDarkMode(): void {
    this.setDarkMode(!this.isDarkMode());
  }
}
