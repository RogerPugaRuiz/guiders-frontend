import { Route } from '@angular/router';
import { authGuard } from '@guiders-frontend/auth/features/login';

export const appRoutes: Route[] = [
	{
		path: 'inbox',
		loadChildren: () => import('@guiders-frontend/chat/features/inbox').then(m => m.inboxRoutes),
		title: 'Chat Inbox',
		canActivate: [
			authGuard
		],
	}, 
	{
		path: '',
		pathMatch: 'full',
		redirectTo: 'inbox',
	}
];
