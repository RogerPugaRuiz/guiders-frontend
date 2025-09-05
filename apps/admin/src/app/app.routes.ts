import { Route } from '@angular/router';

export const appRoutes: Route[] = [
	{
		path: 'login',
		loadChildren: () => import('@guiders-frontend/auth/features/login').then(m => m.loginRoutes),
		title: 'Login',
	},
	{
		path: 'dashboard',
		loadChildren: () =>
			import('@guiders-frontend/analytics/features/admin-dashboard').then(m => m.adminDashboardRoutes),
		title: 'Admin Dashboard',
		canActivate: [
			() => import('@guiders-frontend/auth/features/login').then(m => m.authGuard),
		],
	},
	{
		path: '',
		pathMatch: 'full',
		redirectTo: 'dashboard',
	}
];
