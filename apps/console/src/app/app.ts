import { Component, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Sidebar, SidebarItem, SidebarConfig } from '@guiders-frontend/sidebar';

@Component({
  imports: [RouterModule, Sidebar],
  selector: 'console-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected title = 'console';

  // Configuración del sidebar para console
  readonly sidebarConfig = signal<SidebarConfig>({
    collapsed: false,
    showToggle: true,
    theme: 'dark',
    width: '280px',
    collapsedWidth: '64px'
  });

  // Items de navegación específicos para console (usuario final)
  readonly sidebarItems = signal<SidebarItem[]>([
    {
      id: 'inbox',
      label: 'Bandeja de Entrada',
      icon: '📥',
      route: '/inbox'
    },
    {
      id: 'chats',
      label: 'Chats',
      icon: '💬',
      children: [
        {
          id: 'chats-active',
          label: 'Chats Activos',
          icon: '🟢',
          route: '/chats/active'
        },
        {
          id: 'chats-archived',
          label: 'Archivados',
          icon: '📁',
          route: '/chats/archived'
        }
      ]
    },
    {
      id: 'contacts',
      label: 'Contactos',
      icon: '👥',
      route: '/contacts'
    },
    {
      id: 'profile',
      label: 'Mi Perfil',
      icon: '👤',
      route: '/profile'
    },
    {
      id: 'help',
      label: 'Ayuda',
      icon: '❓',
      children: [
        {
          id: 'help-faq',
          label: 'Preguntas Frecuentes',
          icon: '📚',
          route: '/help/faq'
        },
        {
          id: 'help-support',
          label: 'Soporte',
          icon: '🆘',
          route: '/help/support'
        }
      ]
    }
  ]);

  onSidebarItemClick(item: SidebarItem): void {
    console.log('Console sidebar item clicked:', item);
  }

  onSidebarToggle(collapsed: boolean): void {
    this.sidebarConfig.update(config => ({
      ...config,
      collapsed
    }));
  }
}
