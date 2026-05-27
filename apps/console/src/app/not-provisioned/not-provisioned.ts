import { Component, inject } from '@angular/core';
import { ENVIRONMENT_TOKEN } from '@guiders-frontend/auth/data-access/session';

/**
 * Pantalla de error para usuarios autenticados en Keycloak pero no
 * provisionados en la BD del backend (403 user_not_provisioned).
 *
 * No redirige al login porque el login funciona correctamente — el problema
 * es de datos, no de autenticación. Redirigir al login causaría un bucle
 * infinito: OAuth completa → /me devuelve 403 → login de nuevo → loop.
 */
@Component({
  selector: 'console-not-provisioned',
  standalone: true,
  template: `
    <div class="not-provisioned">
      <div class="not-provisioned__card">
        <h1 class="not-provisioned__title">Cuenta no configurada</h1>
        <p class="not-provisioned__message">
          Tu cuenta de acceso existe pero no ha sido configurada en el sistema.
          Contacta con el administrador para que active tu cuenta.
        </p>
        <div class="not-provisioned__actions">
          <a [href]="logoutUrl" class="not-provisioned__btn">
            Cerrar sesión
          </a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .not-provisioned {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: #f5f5f5;
      font-family: sans-serif;
    }
    .not-provisioned__card {
      background: white;
      border-radius: 8px;
      padding: 40px;
      max-width: 480px;
      text-align: center;
      box-shadow: 0 2px 12px rgba(0,0,0,0.1);
    }
    .not-provisioned__title {
      font-size: 1.5rem;
      font-weight: 600;
      color: #1a1a1a;
      margin: 0 0 16px;
    }
    .not-provisioned__message {
      color: #555;
      line-height: 1.6;
      margin: 0 0 32px;
    }
    .not-provisioned__btn {
      display: inline-block;
      padding: 10px 24px;
      background: #e53e3e;
      color: white;
      border-radius: 6px;
      text-decoration: none;
      font-weight: 500;
    }
    .not-provisioned__btn:hover {
      background: #c53030;
    }
  `]
})
export class NotProvisionedComponent {
  private readonly environment = inject(ENVIRONMENT_TOKEN);
  readonly logoutUrl = `${this.environment.api.baseUrl}/bff/auth/logout/console`;
}
