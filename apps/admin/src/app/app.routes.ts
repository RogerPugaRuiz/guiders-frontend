import { Route } from '@angular/router';

export const appRoutes: Route[] = [
	{
		path: 'login',
		loadChildren: () => import('@guiders-frontend/auth/features/login').then(m => m.loginRoutes),
		title: 'Iniciar Sesión'
	},
	{
		path: 'inbox',
		loadChildren: () => import('@guiders-frontend/chat/features/inbox').then(m => m.inboxRoutes),
		title: 'Chat Inbox',
	}
];
