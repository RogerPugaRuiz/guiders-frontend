import { Route } from '@angular/router';

export const appRoutes: Route[] = [
	{
		path: 'inbox',
		loadChildren: () => import('@guiders-frontend/chat/features/inbox').then(m => m.inboxRoutes),
		title: 'Chat Inbox',
	}
];
