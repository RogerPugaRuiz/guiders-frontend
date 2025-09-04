import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { LoginForm } from '@guiders-frontend/auth/ui/login-form';

@Component({
  selector: 'lib-login',
  imports: [LoginForm],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private router = inject(Router);
}
