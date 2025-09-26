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
      icon: '📥',
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
