import { Component, OnInit } from '@angular/core';
import { ThemeService } from '../../../core/services/theme.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface ColorOption {
  name: string;
  value: string;
  variable: string;
}

@Component({
  selector: 'app-appearance-settings',
  standalone: true,
  template: `
    <div class="appearance-settings">
      <h2 class="appearance-settings__title">Aspecto</h2>
      <p class="appearance-settings__description">Personaliza el aspecto de la interfaz según tus preferencias.</p>
      
      <div class="appearance-settings__section">
        <h3 class="appearance-settings__subtitle">Tema</h3>
        
        <div class="theme-options">
          <div 
            class="theme-option" 
            [class.theme-option--active]="!isDarkMode" 
            (click)="setLightTheme()"
          >
            <div class="theme-option__preview theme-option__preview--light">
              <div class="theme-option__header"></div>
              <div class="theme-option__sidebar">
                <div class="sidebar-item sidebar-item--active" [style.backgroundColor]="!isDarkMode ? selectedPrimaryColor : null"></div>
                <div class="sidebar-item"></div>
                <div class="sidebar-item"></div>
              </div>
              <div class="theme-option__content">
                <div class="content-line"></div>
                <div class="content-line content-line--short" ></div>
              </div>
            </div>
            <div class="theme-option__label">
              <span>Modo claro</span>
              <svg *ngIf="!isDarkMode" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
          </div>
          
          <div 
            class="theme-option" 
            [class.theme-option--active]="isDarkMode" 
            (click)="setDarkTheme()"
          >
            <div class="theme-option__preview theme-option__preview--dark">
              <div class="theme-option__header"></div>
              <div class="theme-option__sidebar">
                <div class="sidebar-item sidebar-item--active" [style.backgroundColor]="isDarkMode ? selectedPrimaryColor : null"></div>
                <div class="sidebar-item"></div>
                <div class="sidebar-item"></div>
              </div>
              <div class="theme-option__content">
                <div class="content-line"></div>
                <div class="content-line content-line--short"></div>
              </div>
            </div>
            <div class="theme-option__label">
              <span>Modo oscuro</span>
              <svg *ngIf="isDarkMode" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
          </div>
        </div>
        
        <p class="appearance-settings__note">
          También puedes cambiar rápidamente entre temas usando el botón en la barra superior.
        </p>
      </div>
			
      
      <div class="appearance-settings__section">
        <h3 class="appearance-settings__subtitle">Color de acento</h3>
        <p class="appearance-settings__description">Elige el color primario que se usará en toda la interfaz.</p>
        
        <div class="color-options">
          <div 
            *ngFor="let color of primaryColorOptions" 
            class="color-option" 
            [style.backgroundColor]="color.value"
            [class.color-option--active]="selectedPrimaryColor === color.value"
            (click)="changePrimaryColor(color.value)"
          >
            <div class="color-option__check" *ngIf="selectedPrimaryColor === color.value">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <div class="color-option__tooltip">{{color.name}}</div>
          </div>
        </div>
        
        <p class="appearance-settings__note">
          El color de acento se aplica a enlaces, botones y elementos interactivos principales.
        </p>


      </div>
    </div>
  `,
  styleUrl: './appearance-settings.component.scss',
  imports: [CommonModule, FormsModule]
})
export class AppearanceSettingsComponent implements OnInit {
  primaryColorOptions: ColorOption[] = [
    { name: 'Azul GitHub (Predeterminado)', value: '#0969da', variable: '--color-primary' },
    { name: 'Verde Éxito', value: '#2da44e', variable: '--color-primary' },
    { name: 'Violeta Creatividad', value: '#8250df', variable: '--color-primary' },
    { name: 'Naranja Energía', value: '#bc4c00', variable: '--color-primary' },
    { name: 'Rojo Acción', value: '#cf222e', variable: '--color-primary' }
  ];
  
  selectedPrimaryColor: string = '';
  
  constructor(private themeService: ThemeService) {}
  
  ngOnInit(): void {
    // Solo ejecutar en el navegador
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      try {
        // Obtener el color primario actual para preseleccionarlo
        const rootStyles = getComputedStyle(document.documentElement);
        const currentPrimaryColor = rootStyles.getPropertyValue('--color-primary').trim();
        
        // Buscar el color en nuestras opciones
        const foundColor = this.primaryColorOptions.find(option => 
          option.value.toLowerCase() === currentPrimaryColor.toLowerCase() || 
          `#${currentPrimaryColor.toLowerCase()}` === option.value.toLowerCase()
        );
        
        this.selectedPrimaryColor = foundColor ? foundColor.value : this.primaryColorOptions[0].value;
      } catch (error) {
        console.warn('Error al obtener el color primario actual:', error);
        // Usar el primer color como predeterminado en caso de error
        this.selectedPrimaryColor = this.primaryColorOptions[0].value;
      }
    } else {
      // En SSR, usar el primer color como predeterminado
      this.selectedPrimaryColor = this.primaryColorOptions[0].value;
    }
  }
  
  get isDarkMode(): boolean {
    return this.themeService.isDarkMode();
  }
  
  setLightTheme(): void {
    if (this.isDarkMode) {
      this.themeService.toggleTheme();
    }
  }
  
  setDarkTheme(): void {
    if (!this.isDarkMode) {
      this.themeService.toggleTheme();
    }
  }
  
  changePrimaryColor(color: string): void {
    this.selectedPrimaryColor = color;
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
        
        // Guardar la preferencia de color en localStorage
        localStorage.setItem('primaryColor', hexColor);
      } catch (error) {
        console.warn('Error al aplicar el color primario:', error);
      }
    }
  }
  
  resetToDefaultColor(): void {
    const defaultColor = this.primaryColorOptions[0].value;
    this.selectedPrimaryColor = defaultColor;
    this.applyPrimaryColor(defaultColor);
    
    // Opcional: mostrar mensaje de confirmación
    alert('El color primario se ha restablecido al valor predeterminado.');
  }
}
