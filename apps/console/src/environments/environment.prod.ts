import { OidcConfig } from '@guiders-frontend/auth/services/oidc';

export const environment = {
  production: true,
  oidc: {
    // Production OIDC configuration
    // Configure these values for your production OIDC provider
    /* 
    issuer: 'https://your-tenant.auth0.com',
    clientId: 'your-production-client-id',
    redirectUri: `${window.location.origin}/login/callback`,
    postLogoutRedirectUri: `${window.location.origin}/login`,
    scope: 'openid profile email',
    additionalParams: {
      audience: 'https://your-api-identifier'
    }
    */
  } as Partial<OidcConfig>
};