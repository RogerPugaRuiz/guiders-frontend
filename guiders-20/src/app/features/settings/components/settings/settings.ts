import { Component } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';

@Component({
	selector: 'app-settings',
	standalone: true,
	imports: [RouterModule, RouterOutlet],
	template: `
	<div class="settings">
		<div class="gh-page-header">
		<div>
			<h1 class="gh-page-header__title">Configuración</h1>
			<p class="gh-page-header__description">Personaliza tu experiencia en Guiders</p>
		</div>
		</div>
		
		<div class="settings__container">
		<div class="settings__sidebar">
			<ul class="settings__menu">
			<li class="settings__menu-item">
				<a routerLink="/settings/profile" routerLinkActive="settings__menu-link--active" class="settings__menu-link">
				<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user-icon lucide-user"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
				<span class="settings__menu-text">Perfil</span>
				</a>
			</li>
			<li class="settings__menu-item">
				<a routerLink="/settings/account" routerLinkActive="settings__menu-link--active" class="settings__menu-link">
				<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-wrench-icon lucide-wrench"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
				<span class="settings__menu-text">Cuenta</span>
				</a>
			</li>
			<li class="settings__menu-item">
				<a routerLink="/settings/notifications" routerLinkActive="settings__menu-link--active" class="settings__menu-link">
				<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bell-icon lucide-bell"><path d="M10.268 21a2 2 0 0 0 3.464 0"/><path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"/></svg>
				<span class="settings__menu-text">Notificaciones</span>
				</a>
			</li>
			<li class="settings__menu-item">
				<a routerLink="/settings/appearance" routerLinkActive="settings__menu-link--active" class="settings__menu-link">
				<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-palette-icon lucide-palette"><path d="M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z"/><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/></svg>
				<span class="settings__menu-text">Aspecto</span>
				</a>
			</li>
			<li class="settings__menu-item">
				<a routerLink="/settings/privacy" routerLinkActive="settings__menu-link--active" class="settings__menu-link">
				<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shield-icon lucide-shield"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>
				<span class="settings__menu-text">Privacidad</span>
				</a>
			</li>
			</ul>
		</div>
		<div class="settings__content">
			<router-outlet></router-outlet>
		</div>
		</div>
	</div>
	`,
	styles: [`
	.settings {
		height: 100%;
		overflow: hidden;
		
		&__menu-text {
			margin-left: var(--spacing-md);
		}

		&__container {
		display: flex;
		margin-top: var(--spacing-xl);
		height: calc(100% - 120px);
		gap: var(--spacing-xl);
		overflow: hidden;
		}

		&__sidebar {
		flex: 0 0 220px;
		border-right: 1px solid var(--color-border);
		padding-right: var(--spacing-lg);
		overflow-y: auto;
		}

		&__content {
		flex: 1;
		overflow-y: auto;
		height: 100%;
		}

		&__menu {
		list-style: none;
		padding: 0;
		margin: 0;
		}

		&__menu-item {
		margin-bottom: var(--spacing-md);
		}

		&__menu-link {
		display: flex;
		align-items: center;
		padding: var(--spacing-md);
		color: var(--color-text);
		text-decoration: none;
		border-radius: 6px;
		transition: all 0.2s;
		font-weight: 500;

		&:hover {
			background-color: var(--color-hover);
			color: var(--color-primary);
			text-decoration: none;
		}

		&--active {
			background-color: var(--color-hover);
			color: var(--color-primary);
			font-weight: 600;
		}
		}

		&__menu-icon {
		margin-right: var(--spacing-md);
		opacity: 0.8;
		width: 16px;
		height: 16px;
		}
	}
	`]
})
export class Settings {
}
