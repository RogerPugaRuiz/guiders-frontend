import { Component, signal, inject, computed } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Sidebar, SidebarItem, SidebarConfig } from '@guiders-frontend/sidebar';
import { UserService, UserProfile, ENVIRONMENT_TOKEN } from '@guiders-frontend/auth/data-access/session';
import { ChatWidgetComponent } from '@guiders-frontend/chat/ui/chat-widget';
import { UnreadMessagesService } from '@guiders-frontend/unread-messages-service';
import { ProfileModal, AvatarUpdateRequest } from '@guiders-frontend/profile-modal';
import { ProfileService } from '@guiders-frontend/profile-service';

@Component({
  imports: [RouterModule, Sidebar, ChatWidgetComponent, ProfileModal],
  selector: 'console-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);
  private readonly unreadMessagesService = inject(UnreadMessagesService);
  private readonly profileService = inject(ProfileService);
  private readonly environment = inject(ENVIRONMENT_TOKEN);

  protected title = 'console';

  // Usuario actual desde el servicio
  readonly currentUser = this.userService.currentUser;

  // App Switcher - solo visible para admins
  readonly isAdmin = computed(() =>
    this.currentUser()?.roles?.includes('admin') ?? false
  );
  readonly adminUrl = this.environment.adminUrl ?? '';

  // Estado del modal de perfil
  readonly isProfileModalOpen = signal<boolean>(false);
  readonly isUploadingAvatar = signal<boolean>(false);
  readonly userProfile = signal<UserProfile | null>(null);

  // Configuración del sidebar para console
  readonly sidebarConfig = signal<SidebarConfig>({
    collapsed: false,
    showToggle: true,
    theme: 'dark',
    width: '280px',
    collapsedWidth: '64px'
  });

  // Items de navegación específicos para console (usuario final)
  // Computed para actualizar el badge dinámicamente
  readonly sidebarItems = computed<SidebarItem[]>(() => {
    const totalUnread = this.unreadMessagesService.totalUnreadCount();

    return [
      {
        id: 'inbox',
        label: 'Bandeja de Entrada',
        icon: 'inbox',
        route: '/inbox',
        // Agregar badge solo si hay mensajes no leídos
        ...(totalUnread > 0 && {
          badge: {
            text: totalUnread > 99 ? '99+' : totalUnread.toString(),
            variant: 'danger' as const
          }
        })
      },
      {
        id: 'visitors',
        label: 'Visitantes',
        icon: 'users',
        route: '/visitors'
      },
      // {
      //   id: 'contacts',
      //   label: 'Contactos',
      //   icon: 'bookmark',
      //   children: [
      //     {
      //       id: 'contacts-mine',
      //       label: 'Mis contactos',
      //       icon: 'user',
      //       route: '/contacts?view=mine'
      //     },
      //     {
      //       id: 'contacts-recent',
      //       label: 'Recientes',
      //       icon: 'clock',
      //       route: '/contacts?view=recent'
      //     },
      //     {
      //       id: 'contacts-search',
      //       label: 'Buscar',
      //       icon: 'search',
      //       route: '/contacts?view=search'
      //     }
      //   ]
      // }
    ];
  });

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
    console.log('Abrir modal de configuración de perfil...');

    // Cargar el perfil completo antes de abrir el modal
    this.profileService.getUserProfile().subscribe({
      next: (profile: UserProfile) => {
        console.log('Perfil del usuario cargado:', profile);
        this.userProfile.set(profile);
        this.isProfileModalOpen.set(true);
      },
      error: (error: Error) => {
        console.error('Error al cargar perfil del usuario:', error);
      }
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

        // Actualizar el userProfile con la nueva URL del avatar
        const currentProfile = this.userProfile();
        if (currentProfile) {
          this.userProfile.set({
            ...currentProfile,
            avatarUrl: response.avatarUrl
          });
        }

        // Recargar el perfil completo para asegurar sincronización
        this.profileService.getUserProfile().subscribe({
          next: (profile: UserProfile) => {
            console.log('Perfil actualizado después de cambio de avatar');
            this.userProfile.set(profile);
          },
          error: (error: Error) => {
            console.error('Error al actualizar perfil:', error);
          }
        });

        // Cerrar el modal
        this.isUploadingAvatar.set(false);
        this.isProfileModalOpen.set(false);
      },
      error: (error: Error) => {
        console.error('Error al actualizar avatar:', error);
        this.isUploadingAvatar.set(false);
      }
    });
  }
}
