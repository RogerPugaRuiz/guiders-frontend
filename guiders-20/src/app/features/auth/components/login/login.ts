import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

// Importamos los servicios reales
import { AuthService, StorageService } from '../../../../core/services';
import { 
  ValidationError,
  UnauthorizedError, 
  LoginCredentials
} from '../../models/auth.models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);
  private storageService = inject(StorageService);

  // Signals para estado reactivo
  isLoading = signal(false);
  errorMessage = signal('');
  showPassword = signal(false);
  rememberMe = signal(false);

  // Form group
  loginForm: FormGroup;

  constructor() {
    // Recuperar el email guardado si existe
    const savedEmail = this.storageService.getItem('guiders_remembered_email');
    
    this.loginForm = this.fb.group({
      email: [savedEmail || '', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
    
    // Si había un email guardado, activar el checkbox de recordar
    this.rememberMe.set(!!savedEmail);
  }

  get email() { return this.loginForm.get('email'); }
  get password() { return this.loginForm.get('password'); }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const credentials: LoginCredentials = {
      email: this.email?.value,
      password: this.password?.value
    };

    // Guardar o eliminar el email según el estado del checkbox
    if (this.rememberMe() && this.email?.value) {
      this.storageService.setItem('guiders_remembered_email', this.email.value);
    } else {
      this.storageService.removeItem('guiders_remembered_email');
    }

    this.authService.login(credentials).subscribe({
      next: (response: any) => {
        console.log('Login exitoso:', response.user?.email || response.session?.user?.email || 'Usuario autenticado');
        this.router.navigate(['/dashboard']);
        this.isLoading.set(false);
      },
      error: (error: any) => {
        console.error('Error en login:', error);
        
        if (error instanceof ValidationError) {
          this.setFieldError(error.field, error.message);
        } else if (error instanceof UnauthorizedError) {
          this.errorMessage.set(error.message);
        } else {
          this.errorMessage.set('No pudimos iniciar tu sesión. ¿Podrías intentarlo de nuevo?');
        }
        this.isLoading.set(false);
      }
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword.update(value => !value);
  }

  toggleRememberMe(): void {
    this.rememberMe.update(value => !value);
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
