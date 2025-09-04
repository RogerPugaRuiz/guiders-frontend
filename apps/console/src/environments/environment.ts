import { OidcConfig } from '@guiders-frontend/auth/services/oidc';

export const environment = {
  production: false,
  oidc: {
    // Example configuration for Auth0
    // Uncomment and configure for your OIDC provider
    /* 
    issuer: 'https://your-tenant.auth0.com',
    clientId: 'your-client-id',
    redirectUri: `${window.location.origin}/login/callback`,
    postLogoutRedirectUri: `${window.location.origin}/login`,
    scope: 'openid profile email',
    additionalParams: {
      audience: 'https://your-api-identifier'
    }
    */
  } as Partial<OidcConfig>
};