import { Route } from '@angular/router';
import { authGuard } from '@guiders-frontend/auth/features/login';

export const appRoutes: Route[] = [
  {
    path: 'login',
    loadChildren: () => import('@guiders-frontend/auth/features/login').then(m => m.loginRoutes),
    title: 'Sign In',
  },
  {
    path: 'inbox',
    loadChildren: () => import('@guiders-frontend/chat/features/inbox').then(m => m.inboxRoutes),
    title: 'Chat Inbox',
    canActivate: [authGuard]
  },
  {
    path: '',
    redirectTo: '/inbox',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: '/login'
  }
];
