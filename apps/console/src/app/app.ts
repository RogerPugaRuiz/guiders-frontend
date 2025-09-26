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
        },
        {
          id: 'visitors',
          label: 'Lista',
          icon: '�',
          route: '/visitors'
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
