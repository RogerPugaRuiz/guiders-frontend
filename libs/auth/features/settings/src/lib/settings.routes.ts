import { Route } from '@angular/router';
import { SettingsLayoutComponent } from './components/settings-layout';

export const settingsRoutes: Route[] = [
  {
    path: '',
    component: SettingsLayoutComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'profile' },
      {
        path: 'profile',
        loadComponent: () => import('./sections/profile-settings').then(m => m.ProfileSettingsComponent),
        title: 'Perfil · Configuración',
      },
      {
        path: 'notifications',
        loadComponent: () => import('./sections/notifications-settings').then(m => m.NotificationsSettingsComponent),
        title: 'Notificaciones · Configuración',
      },
      {
        path: 'appearance',
        loadComponent: () => import('./sections/appearance-settings').then(m => m.AppearanceSettingsComponent),
        title: 'Apariencia · Configuración',
      },
      {
        path: 'chat',
        loadComponent: () => import('./sections/chat-settings').then(m => m.ChatSettingsComponent),
        title: 'Chat · Configuración',
      },
      {
        path: 'privacy',
        loadComponent: () => import('./sections/privacy-settings').then(m => m.PrivacySettingsComponent),
        title: 'Privacidad · Configuración',
      },
    ],
  },
];
