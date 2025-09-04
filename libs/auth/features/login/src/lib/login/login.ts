import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { LoginForm } from '@guiders-frontend/auth/ui/login-form';
import { OidcService, OidcConfigService } from '@guiders-frontend/auth/services/oidc';

interface LoginCredentials {
  email: string;
  password: string;
}

@Component({
  selector: 'lib-login',
  imports: [LoginForm],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login implements OnInit, OnDestroy {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private oidcService = inject(OidcService);
  private oidcConfigService = inject(OidcConfigService);

  // Component state
  readonly isLoading = signal(false);
  readonly error = signal<string>('');
  readonly useOidc = signal(true); // Default to OIDC, fallback to form if not configured

  // Check if OIDC is configured
  readonly isOidcConfigured = computed(() => !!this.oidcConfigService.getConfig());

  private subscription = new Subscription();

  ngOnInit() {
    // Subscribe to auth state changes
    this.subscription.add(
      this.oidcService.authState$.subscribe(state => {
        this.isLoading.set(state.isLoading);
        
        if (state.error) {
          this.error.set(state.error);
        }
        
        if (state.isAuthenticated) {
          // Redirect to intended destination or home
          const returnUrl = sessionStorage.getItem('oidc_return_url') || '/';
          sessionStorage.removeItem('oidc_return_url');
          this.router.navigateByUrl(returnUrl);
        }
      })
    );

    // Check for authentication errors in URL params
    this.route.queryParams.subscribe(params => {
      if (params['error']) {
        this.error.set('Authentication failed. Please try again.');
      }
    });

    // Initialize OIDC if configured
    this.initializeOidcIfConfigured();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  /**
   * Handle OIDC login button click
   */
  async onOidcLogin() {
    if (!this.isOidcConfigured()) {
      this.error.set('OIDC is not configured');
      return;
    }

    try {
      this.error.set('');
      await this.oidcService.startAuthentication();
    } catch (error) {
      console.error('OIDC login error:', error);
      this.error.set('Failed to start authentication. Please try again.');
    }
  }

  /**
   * Handle form-based login (fallback)
   */
  async onFormLogin(credentials: LoginCredentials) {
    this.isLoading.set(true);
    this.error.set('');

    try {
      // This is a placeholder for traditional form-based authentication
      // In a real application, you would call your authentication API here
      console.log('Form login credentials:', credentials);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demo purposes, just store a simple token
      localStorage.setItem('access-token', 'demo-token');
      
      // Navigate to intended destination
      const returnUrl = sessionStorage.getItem('oidc_return_url') || '/';
      sessionStorage.removeItem('oidc_return_url');
      this.router.navigateByUrl(returnUrl);
      
    } catch (error) {
      console.error('Form login error:', error);
      this.error.set('Login failed. Please check your credentials.');
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Handle forgot password
   */
  onForgotPassword() {
    // Navigate to forgot password page or show modal
    console.log('Forgot password clicked');
  }

  /**
   * Handle sign up
   */
  onSignUp() {
    // Navigate to registration page
    console.log('Sign up clicked');
  }

  /**
   * Toggle between OIDC and form login
   */
  toggleLoginMethod() {
    this.useOidc.set(!this.useOidc());
    this.error.set('');
  }

  /**
   * Initialize OIDC if configuration is available
   */
  private async initializeOidcIfConfigured() {
    const config = this.oidcConfigService.getConfig();
    if (config) {
      try {
        await this.oidcService.initialize(config);
      } catch (error) {
        console.error('OIDC initialization error:', error);
        this.useOidc.set(false); // Fallback to form login
      }
    } else {
      this.useOidc.set(false); // No OIDC config, use form login
    }
  }
}
