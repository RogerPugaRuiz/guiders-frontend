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
      icon: 'dashboard',
      route: '/dashboard'
    },
    {
      id: 'inbox',
      label: 'Chat Inbox',
      icon: 'message-square',
      route: '/inbox'
    },
    {
      id: 'users',
      label: 'Usuarios',
      icon: 'users',
      children: [
        {
          id: 'users-list',
          label: 'Lista de Usuarios',
          icon: 'file-text',
          route: '/users'
        },
        {
          id: 'users-create',
          label: 'Crear Usuario',
          icon: 'plus',
          route: '/users/create'
        }
      ]
    },
    {
      id: 'analytics',
      label: 'Analíticas',
      icon: 'trending-up',
      route: '/analytics'
    },
    {
      id: 'settings',
      label: 'Configuración',
      icon: 'settings',
      children: [
        {
          id: 'settings-general',
          label: 'General',
          icon: 'settings',
          route: '/settings/general'
        },
        {
          id: 'settings-security',
          label: 'Seguridad',
          icon: 'lock',
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
