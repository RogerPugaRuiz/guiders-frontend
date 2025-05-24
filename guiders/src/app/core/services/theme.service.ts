import { Injectable, Renderer2, RendererFactory2, PLATFORM_ID, Inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';

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
    @Inject(PLATFORM_ID) private platformId: Object
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
    
    // En el cliente, recuperamos el tema que ya se aplicó en el script inicial
    const currentThemeAttribute = document.documentElement.getAttribute('data-theme') as Theme;
    
    // Si el tema ya está aplicado en el HTML (por el script inicial), lo usamos
    if (currentThemeAttribute) {
      this.theme.next(currentThemeAttribute as Theme);
    } else {
      // Verificar si existe un tema guardado en localStorage
      const savedTheme = localStorage.getItem('theme') as Theme;
      
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
      if (!localStorage.getItem('theme')) {
        this.setTheme(e.matches ? Theme.Dark : Theme.Light);
      }
    });
  }

  public toggleTheme(): void {
    const newTheme = this.theme.value === Theme.Light ? Theme.Dark : Theme.Light;
    this.setTheme(newTheme);
  }
  
  public setTheme(theme: Theme): void {
    if (this.isBrowser) {
      // Guardar en localStorage para persistir la preferencia
      localStorage.setItem('theme', theme);
      
      // Actualizar atributo data-theme en el documento
      this.renderer.setAttribute(document.documentElement, 'data-theme', theme);
    }
    
    // Actualizar el subject (esto funciona tanto en el servidor como en el cliente)
    this.theme.next(theme);
  }
  
  public getCurrentTheme(): Theme {
    return this.theme.value;
  }
  
  public isDarkMode(): boolean {
    return this.theme.value === Theme.Dark;
  }
}
