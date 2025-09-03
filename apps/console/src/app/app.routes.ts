import { Routes } from '@angular/router';

export const appRoutes: Routes = [
	{
		path: 'login',
		loadComponent: () => import('@guiders-frontend/auth/login').then(m => m.Login),
		title: 'Iniciar Sesión'
	}
];
