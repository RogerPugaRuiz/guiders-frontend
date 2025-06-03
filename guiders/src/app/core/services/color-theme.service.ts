import { Injectable, Inject } from '@angular/core';
import { ThemeStateService } from './theme-state.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { StorageService } from './storage.service';

export interface ColorOption {
  name: string;
  value: string;
  variable: string;
}

@Injectable({
  providedIn: 'root'
})
export class ColorThemeService {
  // Opciones de color para el modo claro
  private lightModeColorOptions: ColorOption[] = [
    { name: 'Azul GitHub (Predeterminado)', value: '#0969da', variable: '--color-primary' },
    { name: 'Verde Éxito', value: '#2da44e', variable: '--color-primary' },
    { name: 'Violeta Creatividad', value: '#8250df', variable: '--color-primary' },
    { name: 'Naranja Energía', value: '#bc4c00', variable: '--color-primary' },
    { name: 'Rojo Acción', value: '#cf222e', variable: '--color-primary' }
  ];
  
  // Opciones de color para el modo oscuro - colores más brillantes para mejor contraste
  private darkModeColorOptions: ColorOption[] = [
    { name: 'Azul GitHub (Predeterminado)', value: '#58a6ff', variable: '--color-primary' },
    { name: 'Verde Éxito', value: '#3fb950', variable: '--color-primary' },
    { name: 'Violeta Creatividad', value: '#a371f7', variable: '--color-primary' },
    { name: 'Naranja Energía', value: '#e3b341', variable: '--color-primary' },
    { name: 'Rojo Acción', value: '#f85149', variable: '--color-primary' }
  ];
  
  private selectedPrimaryColor: string = '';
  private colorChange = new BehaviorSubject<string>('');
  public readonly colorChange$ = this.colorChange.asObservable();

  private themeMode = new BehaviorSubject<boolean>(this.isDarkMode);
  public readonly themeMode$ = this.themeMode.asObservable();

  constructor(
    @Inject(ThemeStateService) private themeStateService: ThemeStateService,
    private storageService: StorageService
  ) {
    this.initializeColor();

    // Suscribirse a cambios de tema para actualizar colores automáticamente
    this.themeStateService.isDarkMode$.subscribe((isDarkMode) => {
      const colorName = this.getColorNameByValue(this.selectedPrimaryColor);
      if (colorName) {
        const newThemeOptions = this.getCurrentColorOptions();
        const matchingColor = newThemeOptions.find(c => c.name === colorName);
        if (matchingColor && matchingColor.value !== this.selectedPrimaryColor) {
          this.selectedPrimaryColor = matchingColor.value;
          this.applyPrimaryColor(matchingColor.value);
        }
      }
    });
  }

  private initializeColor(): void {
    // Solo ejecutar en el navegador
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      try {
        // Obtener el color primario actual para preseleccionarlo
        const rootStyles = getComputedStyle(document.documentElement);
        const currentPrimaryColor = rootStyles.getPropertyValue('--color-primary').trim();
        
        // Buscar el color en nuestras opciones (según modo actual)
        const colorOptions = this.isDarkMode ? this.darkModeColorOptions : this.lightModeColorOptions;
        const foundColor = colorOptions.find(option => 
          option.value.toLowerCase() === currentPrimaryColor.toLowerCase() || 
          `#${currentPrimaryColor.toLowerCase()}` === option.value.toLowerCase()
        );
        
        this.selectedPrimaryColor = foundColor ? foundColor.value : colorOptions[0].value;
      } catch (error) {
        console.warn('Error al obtener el color primario actual:', error);
        // Usar el primer color como predeterminado en caso de error
        this.selectedPrimaryColor = this.getCurrentColorOptions()[0].value;
      }
    } else {
      // En SSR, usar el primer color como predeterminado
      this.selectedPrimaryColor = this.getCurrentColorOptions()[0].value;
    }
  }
  
  get isDarkMode(): boolean {
    if (!this.themeStateService) {
      console.warn('ThemeStateService no está inicializado. Devolviendo valor predeterminado.');
      return false; // Valor predeterminado
    }
    return this.themeStateService.isDarkMode;
  }

  getLightModeColorOptions(): ColorOption[] {
    return [...this.lightModeColorOptions];
  }

  getDarkModeColorOptions(): ColorOption[] {
    return [...this.darkModeColorOptions];
  }

  getCurrentColorOptions(): ColorOption[] {
    return this.isDarkMode ? this.darkModeColorOptions : this.lightModeColorOptions;
  }

  getSelectedColor(): string {
    return this.selectedPrimaryColor;
  }
  
  setLightTheme(): void {
    if (this.isDarkMode) {
      // Guardar el nombre del color actual antes de cambiar el tema
      const colorName = this.getColorNameByValue(this.selectedPrimaryColor);
      console.log('Cambiando a tema claro. Color actual:', colorName);
      
      this.themeStateService.setDarkMode(false);
      
      // Aplicar el color correspondiente en el nuevo tema
      if (colorName) {
        const lightModeColor = this.lightModeColorOptions.find(c => c.name === colorName);
        if (lightModeColor) {
          console.log('Aplicando equivalente en modo claro:', lightModeColor.value);
          this.selectedPrimaryColor = lightModeColor.value;
          this.applyPrimaryColor(lightModeColor.value);
        }
      }
    }
  }
  
  setDarkTheme(): void {
    if (!this.isDarkMode) {
      // Guardar el nombre del color actual antes de cambiar el tema
      const colorName = this.getColorNameByValue(this.selectedPrimaryColor);
      console.log('Cambiando a tema oscuro. Color actual:', colorName);
      
      this.themeStateService.setDarkMode(true);
      
      // Aplicar el color correspondiente en el nuevo tema
      if (colorName) {
        const darkModeColor = this.darkModeColorOptions.find(c => c.name === colorName);
        if (darkModeColor) {
          console.log('Aplicando equivalente en modo oscuro:', darkModeColor.value);
          this.selectedPrimaryColor = darkModeColor.value;
          this.applyPrimaryColor(darkModeColor.value);
        }
      }
    }
  }
  
  changePrimaryColor(color: string): void {
    this.selectedPrimaryColor = color;
    this.applyPrimaryColor(color);
    // Notificar el cambio de color
    this.colorChange.next(color);
  }
  
  /**
   * Calcula un color hover basado en el color primario
   * En modo claro, oscurece el color. En modo oscuro, lo aclara.
   */
  private calculateHoverColor(hexColor: string): string {
    // Convertir hex a RGB
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    
    let newR: number, newG: number, newB: number;
    
    if (this.isDarkMode) {
      // En modo oscuro, aclarar el color (aumentar valores RGB)
      const lightening = 0.15; // 15% más claro
      newR = Math.min(255, Math.round(r + (255 - r) * lightening));
      newG = Math.min(255, Math.round(g + (255 - g) * lightening));
      newB = Math.min(255, Math.round(b + (255 - b) * lightening));
    } else {
      // En modo claro, oscurecer el color (reducir valores RGB)
      const darkening = 0.1; // 10% más oscuro
      newR = Math.max(0, Math.round(r * (1 - darkening)));
      newG = Math.max(0, Math.round(g * (1 - darkening)));
      newB = Math.max(0, Math.round(b * (1 - darkening)));
    }
    
    // Convertir de vuelta a hex
    const toHex = (n: number) => n.toString(16).padStart(2, '0');
    return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
  }
  
  applyPrimaryColor(hexColor: string): void {
    // Solo ejecutar en el navegador
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      try {
        // Aplica el color primario al documento
        document.documentElement.style.setProperty('--color-primary', hexColor);
        
        // Convertir hex a rgb para la variable --color-primary-rgb
        const r = parseInt(hexColor.slice(1, 3), 16);
        const g = parseInt(hexColor.slice(3, 5), 16);
        const b = parseInt(hexColor.slice(5, 7), 16);
        
        document.documentElement.style.setProperty('--color-primary-rgb', `${r}, ${g}, ${b}`);
        
        // Calcular y aplicar el color hover
        const hoverColor = this.calculateHoverColor(hexColor);
        document.documentElement.style.setProperty('--color-primary-hover', hoverColor);
        
        // Guardar la preferencia de color
        this.storageService.setItem('primaryColor', hexColor);
      } catch (error) {
        console.warn('Error al aplicar el color primario:', error);
      }
    }
    
    // Notificar el cambio de color (incluso si falla la aplicación)
    this.colorChange.next(hexColor);
  }
  
  resetToDefaultColor(): void {
    const defaultColor = this.getCurrentColorOptions()[0].value;
    this.selectedPrimaryColor = defaultColor;
    this.applyPrimaryColor(defaultColor);
    // La notificación del cambio ya se hace en applyPrimaryColor
  }
  
  // Método para obtener el nombre de un color a partir de su valor hexadecimal
  getColorNameByValue(hexValue: string): string | undefined {
    // Buscar primero en el modo actual
    let colorOptions = this.isDarkMode ? this.darkModeColorOptions : this.lightModeColorOptions;
    let foundColor = colorOptions.find(c => c.value === hexValue);
    
    // Si no lo encuentra, buscar en el otro conjunto
    if (!foundColor) {
      colorOptions = this.isDarkMode ? this.lightModeColorOptions : this.darkModeColorOptions;
      foundColor = colorOptions.find(c => c.value === hexValue);
    }
    
    return foundColor?.name;
  }
  
  toggleTheme(): void {
    const isCurrentlyDark = this.themeStateService.isDarkMode;
    this.themeStateService.setDarkMode(!isCurrentlyDark);
  }
}
