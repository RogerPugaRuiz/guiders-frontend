import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

import { AuthService } from '../../../../core/services/auth.service';
import { 
  LoginCredentials,
  AuthenticationError, 
  ValidationError 
} from '@libs/feature/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  showPassword = false;

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  get email() { return this.loginForm.get('email'); }
  get password() { return this.loginForm.get('password'); }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const credentials: LoginCredentials = {
      email: this.email?.value,
      password: this.password?.value
    };

    this.authService.login(credentials)
      .subscribe({
        next: (response) => {
          console.log('Login exitoso:', response.user.email);
          this.router.navigate(['/dashboard']);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error en login:', error);
          
          if (error instanceof ValidationError) {
            this.setFieldError(error.field, error.message);
          } else if (error instanceof AuthenticationError) {
            this.errorMessage = error.message;
          } else {
            this.errorMessage = error.message || 'Error al iniciar sesión. Por favor, inténtalo de nuevo.';
          }
          this.isLoading = false;
        }
      });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  getFieldErrorMessage(fieldName: string): string {
    const field = this.loginForm.get(fieldName);
    
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return fieldName === 'email' ? 'El email es requerido' : 'La contraseña es requerida';
      }
      if (field.errors['email']) {
        return 'El formato del email no es válido';
      }
      if (field.errors['minlength']) {
        return 'La contraseña debe tener al menos 6 caracteres';
      }
      if (field.errors['serverError']) {
        return field.errors['serverError'];
      }
    }
    
    return '';
  }

  hasFieldError(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field?.errors && field.touched);
  }

  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }

  private setFieldError(fieldName: string, message: string): void {
    const field = this.loginForm.get(fieldName);
    if (field) {
      field.setErrors({ serverError: message });
    }
  }
}
