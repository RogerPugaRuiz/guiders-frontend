import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { OidcService } from '@guiders-frontend/auth/services/oidc';

@Component({
  selector: 'lib-oidc-callback',
  template: `
    <div class="callback-container">
      <div class="callback-content">
        @if (isLoading()) {
          <div class="loading-state">
            <div class="spinner"></div>
            <h2>Completing sign in...</h2>
            <p>Please wait while we process your authentication.</p>
          </div>
        } @else if (error()) {
          <div class="error-state">
            <div class="error-icon">⚠️</div>
            <h2>Authentication Error</h2>
            <p>{{ error() }}</p>
            <button type="button" class="retry-btn" (click)="goToLogin()">
              Try Again
            </button>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .callback-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 2rem;
    }

    .callback-content {
      background: white;
      border-radius: 12px;
      padding: 3rem 2rem;
      text-align: center;
      max-width: 400px;
      width: 100%;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
    }

    .loading-state {
      h2 {
        color: #333;
        margin: 1rem 0 0.5rem 0;
        font-size: 1.5rem;
      }

      p {
        color: #666;
        margin: 0;
        font-size: 0.95rem;
      }
    }

    .error-state {
      .error-icon {
        font-size: 3rem;
        margin-bottom: 1rem;
      }

      h2 {
        color: #e74c3c;
        margin: 0 0 1rem 0;
        font-size: 1.5rem;
      }

      p {
        color: #666;
        margin: 0 0 2rem 0;
        font-size: 0.95rem;
      }

      .retry-btn {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 8px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;

        &:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
        }
      }
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #f3f3f3;
      border-top: 3px solid #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem auto;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `]
})
export class OidcCallback implements OnInit {
  private router = inject(Router);
  private oidcService = inject(OidcService);

  readonly isLoading = signal(true);
  readonly error = signal('');

  async ngOnInit() {
    try {
      await this.oidcService.handleCallback();
      // Redirect will be handled by the OIDC service
    } catch (error) {
      console.error('Callback handling error:', error);
      this.error.set('Authentication failed. Please try again.');
      this.isLoading.set(false);
    }
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}