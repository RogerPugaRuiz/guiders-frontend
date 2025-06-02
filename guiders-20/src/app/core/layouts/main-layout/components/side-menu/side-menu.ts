import { Component, computed, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface MenuItem {
  id: string;
  label: string;
  route: string;
  icon: string;
  isActive?: boolean;
}

/**
 * Componente de menú lateral modernizado para Angular 20
 * Usando signals y control flow @for
 */
@Component({
  selector: 'app-side-menu',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <aside class="gh-sidebar">
      <div class="gh-sidebar__section">
        <div class="gh-sidebar__header">
          <span class="gh-sidebar__section-title">{{ sectionTitle() }}</span>
        </div>

        <nav class="gh-sidebar__nav">
          <ul class="gh-sidebar__list">
            @for (item of menuItems(); track item.id) {
              <li class="gh-sidebar__item">
                <a 
                  [routerLink]="item.route" 
                  routerLinkActive="gh-sidebar__link--active" 
                  class="gh-sidebar__link"
                  [attr.aria-label]="item.label"
                >
                  <div class="gh-sidebar__icon" [innerHTML]="item.icon"></div>
                  <span class="gh-sidebar__link-text">{{ item.label }}</span>
                </a>
              </li>
            }
          </ul>
        </nav>
      </div>
    </aside>
  `,
  styles: [`
    .gh-sidebar {
      display: flex;
      flex-direction: column;
      gap: 2rem;
      background-color: var(--color-sidebar-bg);
      font-size: var(--font-size-sm);
      height: 100%;
      width: 240px;
      border-right: 1px solid var(--color-border);
    }

    .gh-sidebar__section {
      margin-bottom: var(--spacing-xl);
      padding-top: var(--spacing-md);
    }

    .gh-sidebar__header {
      padding: var(--spacing-md) var(--spacing-lg);
    }

    .gh-sidebar__section-title {
      font-size: var(--font-size-xs);
      font-weight: 600;
      color: var(--color-text-light);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .gh-sidebar__nav {
      margin-top: var(--spacing-sm);
    }

    .gh-sidebar__list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .gh-sidebar__item {
      margin: 1px 0;
    }

    .gh-sidebar__link {
      display: flex;
      align-items: center;
      padding: var(--spacing-sm) var(--spacing-lg);
      text-decoration: none;
      border-radius: 6px;
      margin: 0 var(--spacing-sm);
      transition: all 0.2s;
      font-weight: 500;
      color: var(--color-text);

      &:hover {
        background-color: var(--color-hover);
        text-decoration: none;
      }

      &--active {
        color: var(--color-primary);
        background-color: var(--color-hover);
      }
    }

    .gh-sidebar__icon {
      margin-right: var(--spacing-md);
      width: 16px;
      height: 16px;
      color: currentColor;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .gh-sidebar__link-text {
      margin-left: var(--spacing-sm);
      opacity: 0.9;
    }

    /* Responsive design */
    @media (max-width: 768px) {
      .gh-sidebar {
        width: 100%;
        height: auto;
      }
    }
  `]
})
export class SideMenuComponent {
  // Signal para el título de la sección
  sectionTitle = signal('Menú principal');

  // Signal para los elementos del menú
  private menuItemsData = signal<MenuItem[]>([
    {
      id: 'dashboard',
      label: 'Dashboard',
      route: '/dashboard',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect width="7" height="9" x="3" y="3" rx="1" />
        <rect width="7" height="5" x="14" y="3" rx="1" />
        <rect width="7" height="9" x="14" y="12" rx="1" />
        <rect width="7" height="5" x="3" y="16" rx="1" />
      </svg>`
    },
    {
      id: 'chat',
      label: 'Chat en Tiempo Real',
      route: '/chat',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
        <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
      </svg>`
    },
    {
      id: 'tracking',
      label: 'Seguimiento',
      route: '/tracking',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
        <circle cx="12" cy="12" r="3" />
      </svg>`
    },
    {
      id: 'leads',
      label: 'Gestión de Leads',
      route: '/leads',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>`
    },
    {
      id: 'analytics',
      label: 'Análisis',
      route: '/analytics',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" x2="18" y1="20" y2="10" />
        <line x1="12" x2="12" y1="20" y2="4" />
        <line x1="6" x2="6" y1="20" y2="14" />
      </svg>`
    },
    {
      id: 'settings',
      label: 'Configuración',
      route: '/settings',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 7h-9" />
        <path d="M14 17H5" />
        <circle cx="17" cy="17" r="3" />
        <circle cx="7" cy="7" r="3" />
      </svg>`
    }
  ]);

  // Signal computado para los elementos del menú (permite filtrado o procesamiento adicional)
  menuItems = computed(() => this.menuItemsData());

  // Signal computado para contar elementos del menú
  menuItemsCount = computed(() => this.menuItems().length);

  /**
   * Actualiza el título de la sección
   * @param title Nuevo título
   */
  updateSectionTitle(title: string): void {
    this.sectionTitle.set(title);
  }

  /**
   * Añade un nuevo elemento al menú
   * @param item Elemento del menú a añadir
   */
  addMenuItem(item: MenuItem): void {
    this.menuItemsData.update(items => [...items, item]);
  }

  /**
   * Elimina un elemento del menú por su ID
   * @param id ID del elemento a eliminar
   */
  removeMenuItem(id: string): void {
    this.menuItemsData.update(items => items.filter(item => item.id !== id));
  }

  /**
   * Actualiza un elemento del menú
   * @param id ID del elemento a actualizar
   * @param updates Actualizaciones parciales del elemento
   */
  updateMenuItem(id: string, updates: Partial<MenuItem>): void {
    this.menuItemsData.update(items => 
      items.map(item => 
        item.id === id ? { ...item, ...updates } : item
      )
    );
  }
}
