import { Route } from '@angular/router';
import { authGuard } from '@guiders-frontend/auth/features/login';

export const appRoutes: Route[] = [
	{
		path: 'dashboard',
		loadChildren: () =>
			import('@guiders-frontend/analytics/features/admin-dashboard').then(m => m.adminDashboardRoutes),
		title: 'Admin Dashboard',
		canActivate: [
			authGuard
		],
	},
	{
		path: '',
		pathMatch: 'full',
		redirectTo: 'dashboard',
	}
];
