import { Component } from '@angular/core';
import { ThemeService } from '../../../core/services/theme.service';
import { CommonModule } from '@angular/common';

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
              <div class="theme-option__sidebar"></div>
              <div class="theme-option__content"></div>
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
              <div class="theme-option__sidebar"></div>
              <div class="theme-option__content"></div>
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
    </div>
  `,
  styleUrl: './appearance-settings.component.scss',
  imports: [CommonModule]
})
export class AppearanceSettingsComponent {
  constructor(private themeService: ThemeService) {}
  
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
}
