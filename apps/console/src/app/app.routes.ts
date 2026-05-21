import { Route } from '@angular/router';
import { authGuard } from '@guiders-frontend/auth/features/login';

export const appRoutes: Route[] = [
	{
		path: 'inbox',
		loadChildren: () => import('@guiders-frontend/chat/features/inbox').then(m => m.inboxRoutes),
		title: 'Bandeja de Entrada',
		canActivate: [authGuard],
	},
	{
		path: 'escalations',
		loadChildren: () => import('@guiders-frontend/escalations').then(m => m.routes),
		title: 'Escalaciones',
		canActivate: [authGuard],
	},
	{
		path: 'visitors',
		loadChildren: () => import('@guiders-frontend/visitors').then(m => m.visitorsRoutes),
		title: 'Visitantes',
		canActivate: [authGuard],
	},
	{
		path: 'contacts',
		loadChildren: () => import('@guiders-frontend/contacts').then(m => m.contactsRoutes),
		title: 'Contactos',
		canActivate: [authGuard],
	},
	{
		path: 'settings',
		loadChildren: () => import('@guiders-frontend/auth/features/settings').then(m => m.settingsRoutes),
		title: 'Configuración',
		canActivate: [authGuard],
	},
	{
		path: '',
		pathMatch: 'full',
		redirectTo: 'inbox',
	},
	{
		path: '**',
		redirectTo: 'inbox',
	}
];
