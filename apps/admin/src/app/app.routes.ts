import { Route } from '@angular/router';

export const appRoutes: Route[] = [
	{
		path: 'login',
		loadComponent: () => import('@guiders-frontend/auth/login').then(m => m.Login),
		title: 'Iniciar Sesión'
	}
];
