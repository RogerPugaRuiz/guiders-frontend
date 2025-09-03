import { Route } from '@angular/router';

export const appRoutes: Route[] = [
	{
		path: 'login',
		loadChildren: () => import('@guiders-frontend/auth/login').then(m => m.loginRoutes),
		title: 'Iniciar Sesión'
	},
	{
		path: 'inbox',
		loadChildren: () => import('@guiders-frontend/inbox').then(m => m.inboxRoutes),
		title: 'Chat Inbox',
	},
];
