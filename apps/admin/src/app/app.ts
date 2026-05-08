import { Component, signal, inject, computed } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Sidebar, SidebarItem, SidebarConfig } from '@guiders-frontend/sidebar';
import {
  UserService,
  ENVIRONMENT_TOKEN,
} from '@guiders-frontend/auth/data-access/session';
import { RedirectConfirm } from '@guiders-frontend/redirect-confirm';

@Component({
  imports: [RouterModule, Sidebar, RedirectConfirm],
  selector: 'admin-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);
  private readonly environment = inject(ENVIRONMENT_TOKEN);

  protected title = 'admin';

  readonly currentUser = this.userService.currentUser;

  // App Switcher - solo visible para admins
  readonly isAdmin = computed(
    () => this.currentUser()?.roles?.includes('admin') ?? false
  );
  readonly consoleUrl = this.environment.consoleUrl ?? '';

  readonly sidebarConfig = signal<SidebarConfig>({
    collapsed: false,
    showToggle: true,
    theme: 'dark',
    width: '280px',
    collapsedWidth: '64px',
  });

  readonly sidebarItems = signal<SidebarItem[]>([
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: 'bar-chart',
      route: '/dashboard',
    },
    {
      id: 'users',
      label: 'Usuarios',
      icon: 'users',
      route: '/users',
    },
    {
      id: 'integrations',
      label: 'Integraciones',
      icon: 'lock',
      route: '/integrations',
      children: [
        {
          id: 'api-keys',
          label: 'API Keys',
          icon: 'lock',
          route: '/integrations/api-keys',
        },
        {
          id: 'sites',
          label: 'Sitios',
          icon: 'globe',
          route: '/integrations/sites',
        },
      ],
    },
    {
      id: 'leads',
      label: 'Leads',
      icon: 'users',
      route: '/leads',
      children: [
        {
          id: 'leads-list',
          label: 'Lista de Leads',
          icon: 'users',
          route: '/leads/list',
        },
        {
          id: 'sync-records',
          label: 'Sincronizaciones',
          icon: 'activity',
          route: '/leads/sync-records',
        },
      ],
    },
    {
      id: 'ai',
      label: 'Configuracion IA',
      icon: 'activity',
      route: '/ai',
    },
    {
      id: 'branding',
      label: 'Marca Blanca',
      icon: 'layers',
      route: '/branding',
    },
  ]);

  onSidebarItemClick(item: SidebarItem): void {
    console.log('Admin sidebar item clicked:', item);
  }

  onSidebarToggle(collapsed: boolean): void {
    this.sidebarConfig.update((config) => ({
      ...config,
      collapsed,
    }));
  }

  onLogout(): void {
    console.log('Cerrando sesion...');
    this.userService.clearUser();
    this.router.navigate(['/login']);
  }

  onConfigureAccount(): void {
    this.router.navigate(['/settings/profile']);
  }
}
