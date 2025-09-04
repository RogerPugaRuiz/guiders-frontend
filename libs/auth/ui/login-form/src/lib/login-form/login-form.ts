import { ChangeDetectionStrategy, Component, signal, computed, output, input } from '@angular/core';
import { FormBuilder, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { inject } from '@angular/core';

interface LoginCredentials {
  email: string;
  password: string;
}

@Component({
  selector: 'guiders-login-form',
  imports: [ReactiveFormsModule],
  templateUrl: './login-form.html',
  styleUrl: './login-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginForm {
  private fb = inject(FormBuilder);

  // Signal inputs
  readonly disabled = input<boolean>(false);
  readonly showRememberMe = input<boolean>(true);

  // Output events using new output() API
  readonly loginSubmit = output<LoginCredentials>();
  readonly forgotPassword = output<void>();

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

  setError(message: string): void {
    this.errorMessage.set(message);
    this.isLoading.set(false);
  }

  setLoading(loading: boolean): void {
    this.isLoading.set(loading);
  }
}
