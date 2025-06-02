import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { ThemeStateService } from './theme-state.service';
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
  private themeStateService = inject(ThemeStateService);
  private storageService = inject(StorageService);

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

  // Señales
  private selectedPrimaryColor = signal<string>('');
  
  // Señales computadas
  readonly isDarkMode = computed(() => this.themeStateService.isDarkMode());
  readonly currentColorOptions = computed(() => 
    this.isDarkMode() ? this.darkModeColorOptions : this.lightModeColorOptions
  );
  readonly selectedColor = computed(() => this.selectedPrimaryColor());

  // Señal de cambio de color para notificaciones externas
  readonly colorChange = computed(() => this.selectedPrimaryColor());

  constructor() {
    this.initializeColor();
    this.setupThemeChangeEffect();
  }

  private initializeColor(): void {
    // Solo ejecutar en el navegador
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      try {
        // Verificar si hay un color guardado
        const savedColor = this.storageService.getItem('primaryColor');
        if (savedColor) {
          this.selectedPrimaryColor.set(savedColor);
          this.applyPrimaryColor(savedColor);
          return;
        }

        // Obtener el color primario actual para preseleccionarlo
        const rootStyles = getComputedStyle(document.documentElement);
        const currentPrimaryColor = rootStyles.getPropertyValue('--color-primary').trim();
        
        // Buscar el color en nuestras opciones (según modo actual)
        const colorOptions = this.currentColorOptions();
        const foundColor = colorOptions.find(option => 
          option.value.toLowerCase() === currentPrimaryColor.toLowerCase() || 
          `#${currentPrimaryColor.toLowerCase()}` === option.value.toLowerCase()
        );
        
        const colorToSet = foundColor ? foundColor.value : colorOptions[0].value;
        this.selectedPrimaryColor.set(colorToSet);
        this.applyPrimaryColor(colorToSet);
      } catch (error) {
        console.warn('Error al obtener el color primario actual:', error);
        // Usar el primer color como predeterminado en caso de error
        const defaultColor = this.currentColorOptions()[0].value;
        this.selectedPrimaryColor.set(defaultColor);
        this.applyPrimaryColor(defaultColor);
      }
    } else {
      // En SSR, usar el primer color como predeterminado
      const defaultColor = this.currentColorOptions()[0].value;
      this.selectedPrimaryColor.set(defaultColor);
    }
  }

  private setupThemeChangeEffect(): void {
    // Effect para manejar cambios de tema automáticamente
    effect(() => {
      const isDark = this.isDarkMode();
      const currentColor = this.selectedPrimaryColor();
      
      if (currentColor) {
        const colorName = this.getColorNameByValue(currentColor);
        if (colorName) {
          const newThemeOptions = isDark ? this.darkModeColorOptions : this.lightModeColorOptions;
          const matchingColor = newThemeOptions.find(c => c.name === colorName);
          
          if (matchingColor && matchingColor.value !== currentColor) {
            this.selectedPrimaryColor.set(matchingColor.value);
            this.applyPrimaryColor(matchingColor.value);
          }
        }
      }
    });
  }

  getLightModeColorOptions(): ColorOption[] {
    return [...this.lightModeColorOptions];
  }

  getDarkModeColorOptions(): ColorOption[] {
    return [...this.darkModeColorOptions];
  }

  getCurrentColorOptions(): ColorOption[] {
    return this.currentColorOptions();
  }

  getSelectedColor(): string {
    return this.selectedColor();
  }
  
  setLightTheme(): void {
    if (this.isDarkMode()) {
      // Guardar el nombre del color actual antes de cambiar el tema
      const colorName = this.getColorNameByValue(this.selectedPrimaryColor());
      console.log('Cambiando a tema claro. Color actual:', colorName);
      
      this.themeStateService.setDarkMode(false);
      
      // El effect se encargará de aplicar el color correspondiente
    }
  }
  
  setDarkTheme(): void {
    if (!this.isDarkMode()) {
      // Guardar el nombre del color actual antes de cambiar el tema
      const colorName = this.getColorNameByValue(this.selectedPrimaryColor());
      console.log('Cambiando a tema oscuro. Color actual:', colorName);
      
      this.themeStateService.setDarkMode(true);
      
      // El effect se encargará de aplicar el color correspondiente
    }
  }

  changePrimaryColor(color: string): void {
    this.selectedPrimaryColor.set(color);
    this.applyPrimaryColor(color);
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
        
        // Guardar la preferencia de color
        this.storageService.setItem('primaryColor', hexColor);
      } catch (error) {
        console.warn('Error al aplicar el color primario:', error);
      }
    }
  }
  
  resetToDefaultColor(): void {
    const defaultColor = this.getCurrentColorOptions()[0].value;
    this.selectedPrimaryColor.set(defaultColor);
    this.applyPrimaryColor(defaultColor);
  }
  
  // Método para obtener el nombre de un color a partir de su valor hexadecimal
  getColorNameByValue(hexValue: string): string | undefined {
    // Buscar primero en el modo actual
    let colorOptions = this.isDarkMode() ? this.darkModeColorOptions : this.lightModeColorOptions;
    let foundColor = colorOptions.find(c => c.value === hexValue);
    
    // Si no lo encuentra, buscar en el otro conjunto
    if (!foundColor) {
      colorOptions = this.isDarkMode() ? this.lightModeColorOptions : this.darkModeColorOptions;
      foundColor = colorOptions.find(c => c.value === hexValue);
    }
    
    return foundColor?.name;
  }
  
  toggleTheme(): void {
    const isCurrentlyDark = this.themeStateService.isDarkMode();
    this.themeStateService.setDarkMode(!isCurrentlyDark);
  }
}
