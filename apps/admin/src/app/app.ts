import { Component, signal, inject, computed } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Sidebar, SidebarItem, SidebarConfig } from '@guiders-frontend/sidebar';
import {
  UserService,
  UserProfile,
  ENVIRONMENT_TOKEN,
} from '@guiders-frontend/auth/data-access/session';
import {
  ProfileModalComponent,
  AvatarUpdateRequest,
} from '@guiders-frontend/profile-modal';
import { ProfileService } from '@guiders-frontend/profile-service';
import { RedirectConfirm } from '@guiders-frontend/redirect-confirm';

@Component({
  imports: [RouterModule, Sidebar, ProfileModalComponent, RedirectConfirm],
  selector: 'admin-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);
  private readonly profileService = inject(ProfileService);
  private readonly environment = inject(ENVIRONMENT_TOKEN);

  protected title = 'admin';

  readonly currentUser = this.userService.currentUser;

  // App Switcher - solo visible para admins
  readonly isAdmin = computed(
    () => this.currentUser()?.roles?.includes('admin') ?? false
  );
  readonly consoleUrl = this.environment.consoleUrl ?? '';

  readonly isProfileModalOpen = signal<boolean>(false);
  readonly isUploadingAvatar = signal<boolean>(false);
  readonly userProfile = signal<UserProfile | null>(null);

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
    console.log('Abrir modal de configuracion de perfil...');

    this.profileService.getUserProfile().subscribe({
      next: (profile: UserProfile) => {
        console.log('Perfil del usuario cargado:', profile);
        this.userProfile.set(profile);
        this.isProfileModalOpen.set(true);
      },
      error: (error: Error) => {
        console.error('Error al cargar perfil del usuario:', error);
      },
    });
  }

  onProfileModalClose(): void {
    this.isProfileModalOpen.set(false);
    this.userProfile.set(null);
  }

  onAvatarUpdate(request: AvatarUpdateRequest): void {
    console.log('Actualizando avatar...', request);
    this.isUploadingAvatar.set(true);

    this.profileService.uploadAvatar(request.userId, request.file).subscribe({
      next: (response: { avatarUrl: string; message: string }) => {
        console.log('Avatar actualizado exitosamente:', response);

        const currentProfile = this.userProfile();
        if (currentProfile) {
          this.userProfile.set({
            ...currentProfile,
            avatarUrl: response.avatarUrl,
          });
        }

        this.profileService.getUserProfile().subscribe({
          next: (profile: UserProfile) => {
            console.log('Perfil actualizado despues de cambio de avatar');
            this.userProfile.set(profile);
          },
          error: (error: Error) => {
            console.error('Error al actualizar perfil:', error);
          },
        });

        this.isUploadingAvatar.set(false);
        this.isProfileModalOpen.set(false);
      },
      error: (error: Error) => {
        console.error('Error al actualizar avatar:', error);
        this.isUploadingAvatar.set(false);
      },
    });
  }
}
