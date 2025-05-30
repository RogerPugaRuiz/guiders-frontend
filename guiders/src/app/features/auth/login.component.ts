import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';

import { AuthService } from '../../core/services/auth.service';
import { StorageService } from '../../core/services/storage.service';
import { 
  LoginCredentials,
  AuthenticationError, 
  ValidationError 
} from '@libs/feature/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private storageService = inject(StorageService);

  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  showPassword = false;
  rememberMe = false;

  constructor() {
    // Recuperar el email guardado si existe
    const savedEmail = this.storageService.getItem('guiders_remembered_email') as string | null;
    
    this.loginForm = this.fb.group({
      email: [savedEmail || '', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
    
    // Si había un email guardado, activar el checkbox de recordar
    this.rememberMe = !!savedEmail;
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

    // Guardar o eliminar el email según el estado del checkbox
    if (this.rememberMe && this.email?.value) {
      this.storageService.setItem('guiders_remembered_email', this.email.value);
    } else {
      // console.log(`Removing item from localStorage: guiders_remembered_email - this is a test log [1]`);
      this.storageService.removeItem('guiders_remembered_email');
    }

    this.authService.login(credentials)
      .subscribe({
        next: (response: any) => {
          console.log('Login exitoso:', response.user?.email || response.session?.user?.email || 'Usuario autenticado');
          this.router.navigate(['/dashboard']);
          this.isLoading = false;
        },
        error: (error: any) => {
          console.error('Error en login:', error);
          
          if (error instanceof ValidationError) {
            this.setFieldError(error.field, error.message);
          } else if (error instanceof AuthenticationError) {
            this.errorMessage = error.message;
          } else {
            this.errorMessage = 'No pudimos iniciar tu sesión. ¿Podrías intentarlo de nuevo?';
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
        return fieldName === 'email' ? 'No olvides escribir tu email' : 'Tu contraseña es necesaria para continuar';
      }
      if (field.errors['email']) {
        return 'Ese email no parece válido. ¿Podrías revisarlo?';
      }
      if (field.errors['minlength']) {
        return 'Tu contraseña necesita al menos 6 caracteres para ser segura';
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
