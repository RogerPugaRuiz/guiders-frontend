import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SideMenuComponent } from './side-menu/side-menu.component';
import { ThemeToggleComponent } from '../../shared/components/theme-toggle/theme-toggle.component';
import { ColorThemeService } from '../services/color-theme.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, SideMenuComponent, ThemeToggleComponent],
  template: `
    <header class="gh-header">
      <div class="gh-header__container">
        <div class="gh-header__logo">
          <h1>Guiders</h1>
        </div>
        <div class="gh-header__nav">
          <a href="#" class="gh-header__nav-item">Documentación</a>
          <a href="#" class="gh-header__nav-item">Soporte</a>
          <app-theme-toggle></app-theme-toggle>
          <div class="gh-header__profile">
            <div class="gh-avatar gh-avatar--sm">
              <span>U</span>
            </div>
          </div>
        </div>
      </div>
    </header>
    <div class="gh-layout">
      <app-side-menu class="gh-layout__sidebar"></app-side-menu>
      <main class="gh-layout__main">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .gh-header {
      border-bottom: 1px solid var(--color-border);
      background-color: var(--color-header-bg);
      color: white;
      padding: var(--spacing-sm) var(--spacing-md);
      position: sticky;
      top: 0;
      z-index: 30;
      
      &__container {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      
      &__logo {
        h1 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 600;
          color: white;
        }
      }
      
      &__nav {
        display: flex;
        align-items: center;
        gap: var(--spacing-lg);
      }
      
      &__nav-item {
        color: rgba(255, 255, 255, 0.7);
        text-decoration: none;
        font-size: var(--font-size-sm);
        
        &:hover {
          color: white;
          text-decoration: none;
        }
      }
      
      &__profile {
        cursor: pointer;
      }
    }
    
    .gh-layout {
      display: flex;
      height: calc(100vh - 50px); /* Restar altura del header */
      width: 100vw;
      overflow: hidden;

      &__sidebar {
        width: 256px;
        height: 100%;
        border-right: 1px solid var(--color-border);
        background-color: var(--color-sidebar-bg);
      }

      &__main {
        flex: 1;
        padding: var(--spacing-lg) var(--spacing-xl);
        overflow-y: auto;
        background-color: var(--color-background);
      }
    }
    
    .gh-avatar {
      width: 32px;
      height: 32px;
      background-color: #2da44e;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      font-weight: 600;
      
      &--sm {
        width: 24px;
        height: 24px;
        font-size: 12px;
      }
    }
  `]
})
export class LayoutComponent {
  constructor(private colorThemeService: ColorThemeService) {
    // Inicializar color y tema al cargar el componente de layout
    // Esto se asegura de que las variables CSS estén correctamente configuradas
    this.initializeTheme();
    
    // Suscribirse a los cambios de color
    this.colorThemeService.colorChange$.subscribe(color => {
      if (color) {
        console.log('Layout detectó cambio de color a:', color);
        // El color ya se aplica en el servicio, no necesitamos hacer nada más aquí
      }
    });
  }
  
  private initializeTheme(): void {
    // El ColorThemeService ya tiene lógica para inicializar colores
    // Solo necesitamos garantizar que se instancie aquí y se aplique el color actual
    const currentColor = this.colorThemeService.getSelectedColor();
    if (currentColor) {
      this.colorThemeService.applyPrimaryColor(currentColor);
    }
  }
}
