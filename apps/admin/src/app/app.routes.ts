import { Route } from '@angular/router';
import { authGuard } from '@guiders-frontend/auth/login';

export const appRoutes: Route[] = [
	{
		path: 'login',
		loadComponent: () => import('@guiders-frontend/auth/login').then(m => m.Login),
		title: 'Iniciar Sesión'
	},
	{
		path: 'inbox',
		loadChildren: () => import('@guiders-frontend/inbox').then(m => m.inboxRoutes),
		title: 'Chat Inbox',
		canActivate: [authGuard]
	},
	{
		path: '',
		redirectTo: '/inbox',
		pathMatch: 'full'
	}
];
