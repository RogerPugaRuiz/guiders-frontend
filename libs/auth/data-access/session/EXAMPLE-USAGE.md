// Ejemplo de uso del UserService

import { Component, inject } from '@angular/core';
import { UserService } from '@guiders-frontend/auth/data-access/session';

@Component({
  selector: 'app-user-profile',
  template: `
    <div class="user-profile">
      @if (userService.isAuthenticated()) {
        <div class="user-info">
          <h3>Perfil de Usuario</h3>
          <p><strong>Email:</strong> {{ userService.currentUser()?.email }}</p>
          <p><strong>ID:</strong> {{ userService.currentUser()?.sub }}</p>
          <p><strong>App:</strong> {{ userService.currentUser()?.app }}</p>
          <p><strong>Roles:</strong> {{ userService.currentUser()?.roles?.join(', ') }}</p>
          
          @if (userService.isSessionExpired()) {
            <div class="warning">
              ⚠️ Tu sesión ha expirado. Por favor, inicia sesión nuevamente.
            </div>
          }
          
          @if (userService.hasRole('admin')) {
            <div class="admin-section">
              <h4>Panel de Administrador</h4>
              <!-- Contenido específico para administradores -->
            </div>
          }
        </div>
      } @else {
        <p>No hay usuario autenticado</p>
      }
    </div>
  `,
  styles: [`
    .user-profile {
      padding: 20px;
    }
    .warning {
      color: red;
      background: #ffebee;
      padding: 10px;
      border-radius: 4px;
      margin: 10px 0;
    }
    .admin-section {
      background: #e3f2fd;
      padding: 15px;
      border-radius: 4px;
      margin-top: 15px;
    }
  `]
})
export class UserProfileComponent {
  readonly userService = inject(UserService);

  constructor() {
    // Ejemplo de uso programático
    console.log('Usuario actual:', this.userService.currentUser());
    console.log('¿Está autenticado?', this.userService.isAuthenticated());
    console.log('¿Tiene rol admin?', this.userService.hasRole('admin'));
    console.log('¿Sesión expirada?', this.userService.isSessionExpired());
  }

  refreshUser() {
    this.userService.fetchUser().subscribe({
      next: (user) => {
        console.log('Usuario actualizado:', user);
      },
      error: (error) => {
        console.error('Error al actualizar usuario:', error);
      }
    });
  }

  logout() {
    this.userService.clearUser();
    // Aquí podrías redirigir al login
  }
}