import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
  APP_INITIALIZER,
  inject
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { appRoutes } from './app.routes';
import { OidcService, OidcConfigService } from '@guiders-frontend/auth/services/oidc';
import { environment } from '../environments/environment';

/**
 * Initialize OIDC if configuration is provided
 */
function initializeOidcFactory(): () => Promise<void> {
  return async () => {
    const oidcConfigService = inject(OidcConfigService);
    const oidcService = inject(OidcService);

    // Set OIDC configuration if provided
    if (environment.oidc && Object.keys(environment.oidc).length > 0) {
      try {
        // Validate that we have at least the required fields
        const config = environment.oidc;
        if (config.issuer && config.clientId && config.redirectUri) {
          oidcConfigService.setConfig(config as any);
          console.log('OIDC configuration set successfully');
        } else {
          console.warn('OIDC configuration incomplete - falling back to form login');
        }
      } catch (error) {
        console.error('OIDC configuration error:', error);
      }
    } else {
      console.info('No OIDC configuration provided - using form-based login');
    }
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(appRoutes),
    provideHttpClient(withInterceptorsFromDi()),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeOidcFactory,
      multi: true
    }
  ],
};
