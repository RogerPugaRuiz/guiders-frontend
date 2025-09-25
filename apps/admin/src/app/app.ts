import { Component, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Sidebar, SidebarItem, SidebarConfig } from '@guiders-frontend/sidebar';

@Component({
  imports: [RouterModule, Sidebar],
  selector: 'admin-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected title = 'admin';

  // Configuración del sidebar para admin
  readonly sidebarConfig = signal<SidebarConfig>({
    collapsed: false,
    showToggle: true,
    theme: 'light',
    width: '280px',
    collapsedWidth: '64px'
  });

  // Items de navegación específicos para admin
  readonly sidebarItems = signal<SidebarItem[]>([
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: '📊',
      route: '/dashboard'
    },
    {
      id: 'inbox',
      label: 'Chat Inbox',
      icon: '<svg width="28px" height="28px" stroke-width="1.8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="#000000"><path d="M10 12L14 12" stroke="#000000" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path><path d="M3 3L21 3" stroke="#000000" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path><path d="M21 7V20.4C21 20.7314 20.7314 21 20.4 21H3.6C3.26863 21 3 20.7314 3 20.4V7" stroke="#000000" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path></svg>',
      route: '/inbox'
    },
    {
      id: 'users',
      label: 'Usuarios',
      icon: '👥',
      children: [
        {
          id: 'users-list',
          label: 'Lista de Usuarios',
          icon: '📋',
          route: '/users'
        },
        {
          id: 'users-create',
          label: 'Crear Usuario',
          icon: '➕',
          route: '/users/create'
        }
      ]
    },
    {
      id: 'analytics',
      label: 'Analíticas',
      icon: '📈',
      route: '/analytics'
    },
    {
      id: 'settings',
      label: 'Configuración',
      icon: '⚙️',
      children: [
        {
          id: 'settings-general',
          label: 'General',
          icon: '🔧',
          route: '/settings/general'
        },
        {
          id: 'settings-security',
          label: 'Seguridad',
          icon: '🔒',
          route: '/settings/security'
        }
      ]
    }
  ]);

  onSidebarItemClick(item: SidebarItem): void {
    console.log('Admin sidebar item clicked:', item);
  }

  onSidebarToggle(collapsed: boolean): void {
    this.sidebarConfig.update(config => ({
      ...config,
      collapsed
    }));
  }
}
