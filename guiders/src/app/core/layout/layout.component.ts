import { Component, ElementRef, HostListener, inject, OnInit, ViewChild } from '@angular/core';
import { Router, RouterOutlet, RouterLink } from '@angular/router';
import { AsyncPipe, CommonModule } from '@angular/common';
import { SideMenuComponent } from './side-menu/side-menu.component';
import { ThemeToggleComponent } from '../../shared/components/theme-toggle/theme-toggle.component';
import { ColorThemeService } from '../services/color-theme.service';
import { AuthService } from '../services/auth.service';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, SideMenuComponent, ThemeToggleComponent, AsyncPipe, CommonModule],
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
          <div class="gh-header__profile" (click)="toggleProfileMenu()" #profileMenu>
            <div class="gh-avatar gh-avatar--sm">
              <span>{{ userInitial | async }}</span>
            </div>
            <div *ngIf="showProfileMenu" class="gh-header__profile-menu">
              <div class="gh-header__profile-info">
                <span class="gh-header__profile-email">{{ userEmail | async }}</span>
              </div>
              <div class="gh-header__profile-actions">
                <a routerLink="/settings/profile" class="gh-header__profile-action">Perfil</a>
                <button class="gh-header__profile-action gh-header__profile-action--logout" (click)="logout()">Cerrar sesión</button>
              </div>
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
        position: relative;
      }

      &__profile-menu {
        position: absolute;
        top: 100%;
        right: 0;
        margin-top: 8px;
        width: 200px;
        background-color: var(--color-surface);
        border: 1px solid var(--color-border);
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 1;
        overflow: hidden;
      }

      &__profile-info {
        padding: var(--spacing-sm) var(--spacing-md);
        border-bottom: 1px solid var(--color-border);
      }

      &__profile-email {
        font-size: var(--font-size-xs);
        color: var(--color-text-secondary);
        word-break: break-all;
      }

      &__profile-actions {
        display: flex;
        flex-direction: column;
      }

      &__profile-action {
        padding: var(--spacing-sm) var(--spacing-md);
        font-size: var(--font-size-sm);
        color: var(--color-text);
        text-decoration: none;
        display: block;
        text-align: left;
        background: none;
        border: none;
        cursor: pointer;
        width: 100%;

        &:hover {
          background-color: var(--color-hover);
        }

        &--logout {
          border-top: 1px solid var(--color-border);
          color: var(--color-danger);
        }
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
export class LayoutComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  
  // ViewChild para el menú desplegable
  @ViewChild('profileMenu') profileMenuElement!: ElementRef;
  
  userInitial = new BehaviorSubject<string>('U'); // Valor predeterminado mientras carga
  userEmail = new BehaviorSubject<string>(''); // Email completo para mostrar en el menú
  showProfileMenu = false; // Controla la visibilidad del menú desplegable

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
  
  ngOnInit(): void {
    // Obtener el usuario actual y extraer la inicial del correo
    this.authService.getCurrentUser().subscribe({
      next: (user) => {
        if (user && user.email) {
          const initial = user.email.charAt(0).toUpperCase();
          this.userInitial.next(initial);
          this.userEmail.next(user.email);
          console.log('Inicial obtenida del correo:', initial);
        } else {
          // Si no hay usuario o email, dejamos el valor por defecto 'U'
          console.log('No se pudo obtener el correo del usuario');
        }
      },
      error: (error) => {
        console.error('Error al obtener el usuario:', error);
        // En caso de error, dejamos el valor por defecto 'U'
      }
    });
  }
  
  // Método para mostrar/ocultar el menú de perfil
  toggleProfileMenu(): void {
    this.showProfileMenu = !this.showProfileMenu;
  }
  
  // Cerrar el menú al hacer clic fuera de él
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.profileMenuElement && !this.profileMenuElement.nativeElement.contains(event.target)) {
      this.showProfileMenu = false;
    }
  }
  
  // Método para cerrar sesión
  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        console.log('Sesión cerrada correctamente');
        this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error('Error al cerrar sesión:', error);
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
