# OIDC (OpenID Connect) over OAuth 2.1 Implementation

This library provides a complete implementation of OpenID Connect (OIDC) built on OAuth 2.1 for Angular applications using modern Angular features like signals and standalone components.

## 🚀 Features

- **OAuth 2.1 Compliance**: Authorization Code Flow with PKCE (Proof Key for Code Exchange)
- **OIDC Support**: ID Tokens, UserInfo endpoint, Discovery Document
- **Modern Angular**: Signals, standalone components, functional guards
- **Security First**: JWT validation, secure token storage, automatic refresh
- **Provider Agnostic**: Works with Auth0, Azure AD, Google, Keycloak, Okta, and more
- **Fallback Support**: Graceful fallback to form-based authentication
- **TypeScript**: Fully typed interfaces and services

## 📦 Architecture

```
libs/auth/services/oidc/
├── interfaces/          # TypeScript interfaces
│   └── oidc.interface.ts
├── services/           # Core OIDC services
│   ├── oidc.service.ts
│   └── oidc-config.service.ts
└── utils/              # Utility services
    ├── pkce.service.ts
    └── jwt.service.ts
```

## 🔧 Quick Start

### 1. Environment Setup

```typescript
// apps/your-app/src/environments/environment.ts
export const environment = {
  production: false,
  oidc: {
    issuer: 'https://your-provider.com',
    clientId: 'your-client-id',
    redirectUri: `${window.location.origin}/login/callback`,
    scope: 'openid profile email'
  }
};
```

### 2. App Configuration

```typescript
// apps/your-app/src/app/app.config.ts
import { ApplicationConfig, APP_INITIALIZER, inject } from '@angular/core';
import { OidcConfigService } from '@guiders-frontend/auth/services/oidc';
import { environment } from '../environments/environment';

function initializeOidcFactory(): () => Promise<void> {
  return async () => {
    const oidcConfigService = inject(OidcConfigService);
    if (environment.oidc) {
      oidcConfigService.setConfig(environment.oidc as any);
    }
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeOidcFactory,
      multi: true
    }
  ],
};
```

### 3. Usage

```typescript
import { Component, inject } from '@angular/core';
import { OidcService } from '@guiders-frontend/auth/services/oidc';

@Component({
  template: `
    @if (oidcService.isAuthenticated()) {
      <p>Welcome, {{ oidcService.user()?.name }}!</p>
      <button (click)="logout()">Sign Out</button>
    } @else {
      <button (click)="login()">Sign In</button>
    }
  `
})
export class UserComponent {
  oidcService = inject(OidcService);

  async login() {
    await this.oidcService.startAuthentication();
  }

  async logout() {
    await this.oidcService.logout();
  }
}
```

## 🏭 Provider Examples

### Auth0
```typescript
const config = OidcConfigService.createAuth0Config(
  'your-tenant.auth0.com',
  'client-id',
  `${window.location.origin}/login/callback`
);
```

### Azure AD
```typescript
const config = OidcConfigService.createAzureAdConfig(
  'tenant-id',
  'client-id', 
  `${window.location.origin}/login/callback`
);
```

### Google
```typescript
const config = OidcConfigService.createGoogleConfig(
  'client-id.googleusercontent.com',
  `${window.location.origin}/login/callback`
);
```

## 🔐 Security Features

- **OAuth 2.1 with PKCE**: RFC 7636 implementation with SHA256
- **JWT Validation**: Issuer, audience, expiration, nonce verification
- **Secure Storage**: localStorage with automatic cleanup
- **Token Refresh**: Automatic token renewal
- **CSRF Protection**: State parameter validation

## 🧪 Testing

```bash
# Run all tests
npx nx test oidc

# Run specific test
npx nx test oidc --testNamePattern="PkceService"
```

## 📚 Documentation

See the full documentation in the repository for:
- Complete configuration examples
- All supported OIDC providers
- Advanced security features
- Migration guides
- Troubleshooting

## 🤝 Contributing

1. Follow existing code patterns
2. Add tests for new functionality
3. Update documentation
4. Test with multiple OIDC providers