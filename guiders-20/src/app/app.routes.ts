import { Routes } from '@angular/router';

export const routes: Routes = [
	{
		path: 'login',
		loadComponent: () => import('./features/auth/components/login/login').then(m => m.Login)
	},
	{
		path: '',
		loadComponent: () => import('./core/layouts/main-layout/main-layout').then(m => m.MainLayout),
		children: [
			{
				path: 'dashboard',
				loadComponent: () => import('./features/dashboard/dashboard').then(m => m.Dashboard)
			},
			{
				path: 'chat',
				loadComponent: () => import('./features/chat/components/chat/chat').then(m => m.ChatComponent)
			},
			{
				path: 'tracking',
				loadComponent: () => import('./features/tracking/tracking').then(m => m.Tracking)
			},
			{
				path: 'leads',
				loadComponent: () => import('./features/leads/leads').then(m => m.Leads)
			},
			{
				path: 'analytics',
				loadComponent: () => import('./features/analytics/analytics').then(m => m.Analytics)
			},
			{
				path: 'settings',
				loadComponent: () => import('./features/settings/settings').then(m => m.SettingsComponent),
				children: [
					{
						path: '',
						redirectTo: 'profile',
						pathMatch: 'full'
					},
					{
						path: 'profile',
						loadComponent: () => import('./features/settings/components/settings-placeholder/settings-placeholder.component').then(c => c.SettingsPlaceholderComponent)
					},
					{
						path: 'account',
						loadComponent: () => import('./features/settings/components/settings-placeholder/settings-placeholder.component').then(c => c.SettingsPlaceholderComponent)
					},
					{
						path: 'notifications',
						loadComponent: () => import('./features/settings/components/settings-placeholder/settings-placeholder.component').then(c => c.SettingsPlaceholderComponent)
					},
					{
						path: 'appearance',
						loadComponent: () => import('./features/settings/components/appearance-settings/appearance-settings.component').then(c => c.AppearanceSettingsComponent)
					},
					{
						path: 'privacy',
						loadComponent: () => import('./features/settings/components/settings-placeholder/settings-placeholder.component').then(c => c.SettingsPlaceholderComponent)
					}
				]
			},
			{ path: '', redirectTo: '/dashboard', pathMatch: 'full' }
		]
	},
	{ path: '**', redirectTo: '/dashboard' }
];
