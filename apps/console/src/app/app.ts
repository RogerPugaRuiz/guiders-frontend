import { Component, signal, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Sidebar, SidebarItem, SidebarConfig } from '@guiders-frontend/sidebar';
import { UserService } from '@guiders-frontend/auth/data-access/session';

@Component({
  imports: [RouterModule, Sidebar],
  selector: 'console-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);
  
  protected title = 'console';

  // Usuario actual desde el servicio
  readonly currentUser = this.userService.currentUser;

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
      icon: 'message-square',
      route: '/inbox'
    },
    {
      id: 'visitors',
      label: 'Visitantes',
      icon: 'users',
      children: [
        {
          id: 'visitors-all',
          label: 'Todos',
          icon: 'users',
          route: '/visitors?filter=all'
        },
        {
          id: 'visitors-mine',
          label: 'Míos',
          icon: 'user',
          route: '/visitors?filter=mine'
        },
        {
          id: 'visitors-unassigned',
          label: 'No asignados',
          icon: 'circle',
          route: '/visitors?filter=unassigned'
        },

      ]
    },
    {
      id: 'contacts',
      label: 'Contactos',
      icon: 'bookmark',
      children: [
        {
          id: 'contacts-mine',
          label: 'Mis contactos',
          icon: 'user',
          route: '/contacts?view=mine'
        },
        {
          id: 'contacts-recent',
          label: 'Recientes',
          icon: 'clock',
          route: '/contacts?view=recent'
        },
        {
          id: 'contacts-search',
          label: 'Buscar',
          icon: 'search',
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

  onLogout(): void {
    console.log('Cerrando sesión...');
    // Limpiar el usuario actual
    this.userService.clearUser();
    // Redirigir al login
    this.router.navigate(['/login']);
  }

  onConfigureAccount(): void {
    console.log('Configurar cuenta...');
    // TODO: Navegar a la página de configuración cuando esté implementada
    this.router.navigate(['/settings']);
  }
}
