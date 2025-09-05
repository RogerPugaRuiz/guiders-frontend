import { Route } from '@angular/router';

export const appRoutes: Route[] = [
	{
		path: 'login',
		loadChildren: () => import('@guiders-frontend/auth/features/login').then(m => m.loginRoutes),
		title: 'Login',
	},
];
