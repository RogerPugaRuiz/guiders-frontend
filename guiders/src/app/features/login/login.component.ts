import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  username: string = '';
  password: string = '';
  errorMessage: string = '';

  onSubmit(): void {
    // Aquí se implementará la lógica de autenticación
    if (this.username && this.password) {
      // Por ahora, simularemos la autenticación
      console.log('Intento de inicio de sesión:', this.username, this.password);
      this.errorMessage = '';
      // Aquí conectarías con un servicio de autenticación
    } else {
      this.errorMessage = 'Por favor, completa todos los campos';
    }
  }
}
