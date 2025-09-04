import { Route } from '@angular/router';

export const appRoutes: Route[] = [
	{
		path: 'inbox',
		loadChildren: () => import('@guiders-frontend/chat/features/inbox').then(m => m.inboxRoutes),
		canActivate: [
			() => import('@guiders-frontend/auth/features/login').then(m => m.authGuard),
		],
		title: 'Chat Inbox',
	}, 
	{
		path: 'login',
		loadChildren: () => import('@guiders-frontend/auth/features/login').then(m => m.loginRoutes),
		title: 'Login',
	},
	{
		path: '',
		pathMatch: 'full',
		redirectTo: 'inbox',
	}
];
