import { Route } from '@angular/router';
import { adminGuard } from '@guiders-frontend/redirect-confirm';

export const appRoutes: Route[] = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    loadChildren: () => import('@guiders-frontend/dashboard').then(m => m.dashboardRoutes),
    canActivate: [adminGuard]
  },
  {
    path: 'users',
    loadChildren: () => import('@guiders-frontend/users').then(m => m.usersRoutes),
    canActivate: [adminGuard]
  },
  {
    path: 'integrations',
    loadChildren: () => import('@guiders-frontend/integrations').then(m => m.integrationsRoutes),
    canActivate: [adminGuard]
  },
  {
    path: 'ai',
    loadChildren: () => import('@guiders-frontend/ai-config').then(m => m.aiConfigRoutes),
    canActivate: [adminGuard]
  },
  {
    path: 'login',
    loadChildren: () => import('@guiders-frontend/auth/features/login').then(m => m.loginRoutes)
  }
];
