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
                <svg class="settings__menu-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
                  <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" fill="currentColor"></path>
                  <path d="M12 14C7.58172 14 4 17.5817 4 22H20C20 17.5817 16.4183 14 12 14Z" fill="currentColor"></path>
                </svg>
                Perfil
              </a>
            </li>
            <li class="settings__menu-item">
              <a routerLink="/settings/account" routerLinkActive="settings__menu-link--active" class="settings__menu-link">
                <svg class="settings__menu-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
                  <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill="currentColor"></path>
                  <path fill-rule="evenodd" clip-rule="evenodd" d="M12 6C12.5523 6 13 6.44772 13 7V12C13 12.5523 12.5523 13 12 13C11.4477 13 11 12.5523 11 12V7C11 6.44772 11.4477 6 12 6Z" fill="white"></path>
                  <path d="M13 16C13 16.5523 12.5523 17 12 17C11.4477 17 11 16.5523 11 16C11 15.4477 11.4477 15 12 15C12.5523 15 13 15.4477 13 16Z" fill="white"></path>
                </svg>
                Cuenta
              </a>
            </li>
            <li class="settings__menu-item">
              <a routerLink="/settings/notifications" routerLinkActive="settings__menu-link--active" class="settings__menu-link">
                <svg class="settings__menu-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
                  <path d="M12 22C13.1046 22 14 21.1046 14 20H10C10 21.1046 10.8954 22 12 22Z" fill="currentColor"></path>
                  <path d="M19 17H5V19H19V17Z" fill="currentColor"></path>
                  <path d="M19 11C19 7.13401 15.866 4 12 4C8.13401 4 5 7.13401 5 11V17H19V11Z" fill="currentColor"></path>
                </svg>
                Notificaciones
              </a>
            </li>
            <li class="settings__menu-item">
              <a routerLink="/settings/appearance" routerLinkActive="settings__menu-link--active" class="settings__menu-link">
                <svg class="settings__menu-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
                  <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM8 6C9.1 6 10 6.9 10 8C10 9.1 9.1 10 8 10C6.9 10 6 9.1 6 8C6 6.9 6.9 6 8 6ZM18 14C18 16.97 15.37 19.33 12 19.33C8.63 19.33 6 16.97 6 14V13H18V14Z" fill="currentColor"></path>
                </svg>
                Aspecto
              </a>
            </li>
            <li class="settings__menu-item">
              <a routerLink="/settings/privacy" routerLinkActive="settings__menu-link--active" class="settings__menu-link">
                <svg class="settings__menu-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
                  <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1Z" fill="currentColor"></path>
                </svg>
                Privacidad
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

      &__container {
        display: flex;
        margin-top: var(--spacing-xl);
        height: calc(100% - 120px);
        gap: var(--spacing-xl);
      }

      &__sidebar {
        flex: 0 0 220px;
        border-right: 1px solid var(--color-border);
        padding-right: var(--spacing-lg);
      }

      &__content {
        flex: 1;
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
export class SettingsComponent {
}
