import { Component, OnInit } from '@angular/core';
import { ColorThemeService, ColorOption } from '../../../core/services/color-theme.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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
  selectedPrimaryColor: string = '';
  
  constructor(private colorThemeService: ColorThemeService) {
    // Suscribirse a cambios de color
    this.colorThemeService.colorChange$.subscribe(color => {
      if (color) {
        this.selectedPrimaryColor = color;
      }
    });
  }
  
  ngOnInit(): void {
    this.selectedPrimaryColor = this.colorThemeService.getSelectedColor();
  }
  
  get isDarkMode(): boolean {
    return this.colorThemeService.isDarkMode;
  }
  
  setLightTheme(): void {
    if (this.isDarkMode) {
      this.colorThemeService.setLightTheme();
      this.selectedPrimaryColor = this.colorThemeService.getSelectedColor();
    }
  }
  
  setDarkTheme(): void {
    if (!this.isDarkMode) {
      this.colorThemeService.setDarkTheme();
      this.selectedPrimaryColor = this.colorThemeService.getSelectedColor();
    }
  }
  
  changePrimaryColor(color: string): void {
    this.selectedPrimaryColor = color;
    this.colorThemeService.changePrimaryColor(color);
  }
  
  resetToDefaultColor(): void {
    this.colorThemeService.resetToDefaultColor();
    this.selectedPrimaryColor = this.colorThemeService.getSelectedColor();
    
    // Opcional: mostrar mensaje de confirmación
    alert('El color primario se ha restablecido al valor predeterminado.');
  }
  
  get primaryColorOptions(): ColorOption[] {
    return this.colorThemeService.getCurrentColorOptions();
  }
}
