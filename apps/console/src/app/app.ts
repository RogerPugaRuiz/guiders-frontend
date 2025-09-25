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
      icon: '<svg width="28px" height="28px" stroke-width="1.8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="#000000"><path d="M10 12L14 12" stroke="#000000" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path><path d="M3 3L21 3" stroke="#000000" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path><path d="M21 7V20.4C21 20.7314 20.7314 21 20.4 21H3.6C3.26863 21 3 20.7314 3 20.4V7" stroke="#000000" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path></svg>',
      route: '/inbox'
    },
    {
      id: 'visitors',
      label: 'Visitantes',
      icon: '�',
      children: [
        {
          id: 'visitors-unassigned',
          label: 'No asignados',
          icon: '⚪',
          route: '/visitors?filter=unassigned'
        },
        {
          id: 'visitors-mine',
          label: 'Míos',
          icon: '�',
          route: '/visitors?filter=mine'
        },
        {
          id: 'visitors-all',
          label: 'Todos',
          icon: '�',
          route: '/visitors?filter=all'
        },
        {
          id: 'visitors-queue',
          label: 'En cola',
          icon: '⏳',
          route: '/visitors?filter=queue'
        }
      ]
    },
    {
      id: 'contacts',
      label: 'Contactos',
      icon: '📇',
      children: [
        {
          id: 'contacts-mine',
          label: 'Mis contactos',
          icon: '👤',
          route: '/contacts?view=mine'
        },
        {
          id: 'contacts-recent',
          label: 'Recientes',
          icon: '�',
          route: '/contacts?view=recent'
        },
        {
          id: 'contacts-search',
          label: 'Buscar',
          icon: '🔍',
          route: '/contacts?view=search'
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
