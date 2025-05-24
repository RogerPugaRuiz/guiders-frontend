import { Routes } from '@angular/router';
import { LayoutComponent } from './core/layout/layout.component';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/login/login.component').then(c => c.LoginComponent),
    title: 'Iniciar Sesión - Guiders'
  },
  {
    path: '',
    component: LayoutComponent,
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(c => c.DashboardComponent),
        title: 'Dashboard - Guiders'
      },
      {
        path: 'chat',
        loadComponent: () => import('./features/chat/chat.component').then(c => c.ChatComponent),
        title: 'Chat en Tiempo Real - Guiders'
      },
      {
        path: 'tracking',
        loadComponent: () => import('./features/tracking/tracking.component').then(c => c.TrackingComponent),
        title: 'Seguimiento de Acciones - Guiders'
      },
      {
        path: 'leads',
        loadComponent: () => import('./features/leads/leads.component').then(c => c.LeadsComponent),
        title: 'Gestión de Leads - Guiders'
      },
      {
        path: 'analytics',
        loadComponent: () => import('./features/analytics/analytics.component').then(c => c.AnalyticsComponent),
        title: 'Análisis de Interacciones - Guiders'
      },
      {
        path: 'settings',
        loadComponent: () => import('./features/settings/settings.component').then(c => c.SettingsComponent),
        title: 'Configuración - Guiders',
        children: [
          {
            path: '',
            redirectTo: 'profile',
            pathMatch: 'full'
          },
          {
            path: 'profile',
            loadComponent: () => import('./features/settings/settings-placeholder/settings-placeholder.component').then(c => c.SettingsPlaceholderComponent),
            title: 'Perfil - Configuración - Guiders'
          },
          {
            path: 'account',
            loadComponent: () => import('./features/settings/settings-placeholder/settings-placeholder.component').then(c => c.SettingsPlaceholderComponent),
            title: 'Cuenta - Configuración - Guiders'
          },
          {
            path: 'notifications',
            loadComponent: () => import('./features/settings/settings-placeholder/settings-placeholder.component').then(c => c.SettingsPlaceholderComponent),
            title: 'Notificaciones - Configuración - Guiders'
          },
          {
            path: 'appearance',
            loadComponent: () => import('./features/settings/appearance-settings/appearance-settings.component').then(c => c.AppearanceSettingsComponent),
            title: 'Aspecto - Configuración - Guiders'
          },
          {
            path: 'privacy',
            loadComponent: () => import('./features/settings/settings-placeholder/settings-placeholder.component').then(c => c.SettingsPlaceholderComponent),
            title: 'Privacidad - Configuración - Guiders'
          }
        ]
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
