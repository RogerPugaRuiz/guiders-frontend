import { ChangeDetectionStrategy, Component, inject, InjectionToken } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ToastHostComponent } from '@guiders-frontend/shared/ui/toast';

/** Route to navigate to when the user closes the settings page. Provide per-app. */
export const SETTINGS_CLOSE_ROUTE = new InjectionToken<string>('SETTINGS_CLOSE_ROUTE', {
  providedIn: 'root',
  factory: () => '/inbox', // sensible default for console
});

interface SettingsNavGroup {
  readonly label: string;
  readonly items: readonly SettingsNavItem[];
}

interface SettingsNavItem {
  readonly id: string;
  readonly label: string;
  readonly route: string;
}

@Component({
  selector: 'lib-settings-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, ToastHostComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './settings-layout.html',
  styleUrl: './settings-layout.scss',
})
export class SettingsLayoutComponent {
  private readonly router = inject(Router);
  private readonly closeRoute = inject(SETTINGS_CLOSE_ROUTE);

  readonly navGroups: readonly SettingsNavGroup[] = [
    {
      label: 'Cuenta',
      items: [
        { id: 'profile', label: 'Perfil', route: 'profile' },
        { id: 'notifications', label: 'Notificaciones', route: 'notifications' },
      ],
    },
    {
      label: 'Espacio de trabajo',
      items: [
        { id: 'appearance', label: 'Apariencia', route: 'appearance' },
        { id: 'chat', label: 'Chat', route: 'chat' },
      ],
    },
    {
      label: 'Seguridad',
      items: [
        { id: 'privacy', label: 'Privacidad', route: 'privacy' },
      ],
    },
  ];

  onNavClose(): void {
    this.router.navigate([this.closeRoute]);
  }
}

