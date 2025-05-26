import { Injectable, Renderer2, RendererFactory2, PLATFORM_ID, Inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { StorageService } from './storage.service';

enum Theme {
  Light = 'light',
  Dark = 'dark'
}

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private renderer: Renderer2;
  private theme = new BehaviorSubject<Theme>(Theme.Light);
  public readonly theme$ = this.theme.asObservable();
  private isBrowser: boolean;

  constructor(
    rendererFactory: RendererFactory2,
    @Inject(PLATFORM_ID) private platformId: Object,
    private storageService: StorageService
  ) {
    this.renderer = rendererFactory.createRenderer(null, null);
    this.isBrowser = isPlatformBrowser(this.platformId);
    
    // Inicializar con el tema guardado o con preferencias del sistema
    this.initializeTheme();
  }

  private initializeTheme(): void {
    // En el servidor, establecemos un tema predeterminado dark para evitar el destello
    if (!this.isBrowser) {
      // En el servidor, suponemos tema oscuro para minimizar el destello
      // El tema real se aplicará en el cliente durante la hidratación
      this.theme.next(Theme.Dark);
      return;
    }
    
    try {
      // En el cliente, recuperamos el tema que ya se aplicó en el script inicial
      const currentThemeAttribute = document.documentElement.getAttribute('data-theme') as Theme;
      
      // Aplicar color primario personalizado si existe
      this.applyCustomPrimaryColor();
      
      // Si el tema ya está aplicado en el HTML (por el script inicial), lo usamos
      if (currentThemeAttribute) {
        this.theme.next(currentThemeAttribute as Theme);
      } else {
        // Verificar si existe un tema guardado en el storage
        const savedTheme = this.storageService.getItem('theme') as Theme;
        
        if (savedTheme) {
          this.setTheme(savedTheme);
        } else {
          // Detectar preferencia del sistema
          const prefersDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
          this.setTheme(prefersDarkMode ? Theme.Dark : Theme.Light);
        }
      }
      
      // Escuchar cambios en la preferencia del sistema
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        // Solo cambiar automáticamente si el usuario no ha establecido explícitamente un tema
        if (!this.storageService.getItem('theme')) {
          this.setTheme(e.matches ? Theme.Dark : Theme.Light);
        }
      });
    } catch (error) {
      // Capturar cualquier error que pueda ocurrir durante la hidratación o casos edge en SSR
      console.warn('Error al inicializar el tema:', error);
      this.theme.next(Theme.Dark); // Tema predeterminado en caso de error
    }
  }
  
  private applyCustomPrimaryColor(): void {
    try {
      const savedColor = this.storageService.getItem('primaryColor');
      if (savedColor) {
        // Aplicar color guardado
        document.documentElement.style.setProperty('--color-primary', savedColor);
        
        // Convertir hex a rgb para la variable --color-primary-rgb
        const r = parseInt(savedColor.slice(1, 3), 16);
        const g = parseInt(savedColor.slice(3, 5), 16);
        const b = parseInt(savedColor.slice(5, 7), 16);
        
        document.documentElement.style.setProperty('--color-primary-rgb', `${r}, ${g}, ${b}`);
      }
    } catch (e) {
      console.warn('Error al aplicar color primario personalizado:', e);
    }
  }

  public toggleTheme(): void {
    const newTheme = this.theme.value === Theme.Light ? Theme.Dark : Theme.Light;
    this.setTheme(newTheme);
  }
  
  public setTheme(theme: Theme): void {
    // Actualizar el subject (esto funciona tanto en el servidor como en el cliente)
    this.theme.next(theme);
    
    if (this.isBrowser) {
      try {
        // Guardar en storage para persistir la preferencia
        this.storageService.setItem('theme', theme);
        
        // Actualizar atributo data-theme en el documento
        this.renderer.setAttribute(document.documentElement, 'data-theme', theme);
      } catch (error) {
        console.warn('Error al establecer el tema:', error);
      }
    }
  }
  
  public getCurrentTheme(): Theme {
    return this.theme.value;
  }
  
  public isDarkMode(): boolean {
    return this.theme.value === Theme.Dark;
  }
}
