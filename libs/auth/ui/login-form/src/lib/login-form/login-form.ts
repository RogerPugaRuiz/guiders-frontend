import { ChangeDetectionStrategy, Component, signal, computed, output, input } from '@angular/core';
import { FormBuilder, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { inject } from '@angular/core';
import { Button } from '@guiders-frontend/button';
import { TextField } from '@guiders-frontend/text-field';

interface LoginCredentials {
  email: string;
  password: string;
}

@Component({
  selector: 'guiders-login-form',
  imports: [ReactiveFormsModule, Button, TextField],
  templateUrl: './login-form.html',
  styleUrl: './login-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginForm {
  private fb = inject(FormBuilder);

  // Signal inputs
  readonly disabled = input<boolean>(false);

  // Output events using new output() API
  readonly loginSubmit = output<LoginCredentials>();
  readonly forgotPassword = output<void>();
  readonly signUpClick = output<void>();

  // Signals for component state
  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string>('');

  // Reactive form with strict typing
  readonly loginForm = this.fb.group({
    email: new FormControl('', {
      validators: [Validators.required, Validators.email],
      nonNullable: true
    }),
    password: new FormControl('', {
      validators: [Validators.required, Validators.minLength(6)],
      nonNullable: true
    })
  });

  // Computed signals for form state
  readonly isFormValid = computed(() => this.loginForm.valid);
  readonly isSubmitDisabled = computed(() => 
    !this.isFormValid() || this.isLoading() || this.disabled()
  );

  // Computed signals for individual form controls
  readonly emailControl = computed(() => this.loginForm.controls.email);
  readonly passwordControl = computed(() => this.loginForm.controls.password);

  // Error message getters
  getEmailErrorMessage(): string {
    const control = this.emailControl();
    if (control.invalid && control.touched) {
      if (control.hasError('required')) {
        return 'El correo electrónico es requerido';
      }
      if (control.hasError('email')) {
        return 'Formato de correo electrónico inválido';
      }
    }
    return '';
  }

  getPasswordErrorMessage(): string {
    const control = this.passwordControl();
    if (control.invalid && control.touched) {
      if (control.hasError('required')) {
        return 'La contraseña es requerida';
      }
      if (control.hasError('minlength')) {
        return 'Mínimo 6 caracteres';
      }
    }
    return '';
  }

  onSubmit(): void {
    if (this.loginForm.valid && !this.isLoading()) {
      this.isLoading.set(true);
      this.errorMessage.set('');
      
      const formValue = this.loginForm.value;
      const credentials: LoginCredentials = {
        email: formValue.email || '',
        password: formValue.password || ''
      };
      
      this.loginSubmit.emit(credentials);
    }
  }

  onForgotPassword(): void {
    this.forgotPassword.emit();
  }

  onSignUp(): void {
    this.signUpClick.emit();
  }

  setError(message: string): void {
    this.errorMessage.set(message);
    this.isLoading.set(false);
  }

  setLoading(loading: boolean): void {
    this.isLoading.set(loading);
  }
}
