import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ColorThemeService } from '../../../core/services/color-theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button 
      class="theme-toggle" 
      (click)="toggleTheme()" 
      [attr.aria-label]="isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
      title="{{ isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro' }}"
    >
      <!-- Ícono de sol para modo claro -->
      <svg *ngIf="isDarkMode" class="theme-toggle__icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="5"></circle>
        <line x1="12" y1="1" x2="12" y2="3"></line>
        <line x1="12" y1="21" x2="12" y2="23"></line>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
        <line x1="1" y1="12" x2="3" y2="12"></line>
        <line x1="21" y1="12" x2="23" y2="12"></line>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
      </svg>
      
      <!-- Ícono de luna para modo oscuro -->
      <svg *ngIf="!isDarkMode" class="theme-toggle__icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
      </svg>
    </button>
  `,
  styles: [`
    .theme-toggle {
      background: transparent;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 8px;
      border-radius: var(--border-radius-sm);
      color: #ffffff;
      transition: background-color 0.2s, color 0.2s;
    }
    
    .theme-toggle:hover {
      // background-color: var(--color-background);
      color: var(--color-primary);
    }
    
    .theme-toggle__icon {
      width: 20px;
      height: 20px;
    }
  `]
})
export class ThemeToggleComponent {
  
  constructor(private colorThemeService: ColorThemeService) {}
  
  get isDarkMode(): boolean {
    return this.colorThemeService.isDarkMode;
  }
  
  toggleTheme(): void {
    if (this.isDarkMode) {
      this.colorThemeService.setLightTheme();
    } else {
      this.colorThemeService.setDarkTheme();
    }
  }
}
