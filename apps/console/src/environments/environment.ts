interface Environment {
  production: boolean;
  auth: {
    authority: string;
    clientId: string;
    scope: string;
    secureRoutes: string[];
  };
  api: {
    baseUrl: string;
    bffOrigin: string; // Absolute origin for BFF auth navigation (login/callback)
    wsUrl?: string;
  };
  adminUrl: string;
  version?: string;
}

// Allow E2E (or any local dev override) to redirect API calls to a different
// backend port without modifying this file. Set VITE_API_BASE_URL in the
// environment (e.g. playwright.config.ts webServer.env) to override.
//
// We use a relative path so the Vite dev-server proxy forwards /api/* to the
// backend (localhost:3000), keeping cookies on the same origin as the frontend.
// BFF auth redirects (login/callback) go directly to the backend origin so the
// browser exits the Angular SPA and the OAuth PKCE flow works correctly.
const apiBaseUrl: string =
  (import.meta as unknown as { env?: { VITE_API_BASE_URL?: string } }).env
    ?.VITE_API_BASE_URL ?? '/api';

// Absolute BFF base URL used only for auth navigation (login/callback).
// Includes the /api prefix so redirects exit the SPA and hit the backend directly.
const bffOrigin: string =
  (import.meta as unknown as { env?: { VITE_BFF_ORIGIN?: string } }).env
    ?.VITE_BFF_ORIGIN ?? 'http://localhost:3000/api';

export const environment: Environment = {
  production: false,
  auth: {
    authority: 'http://localhost:8080/realms/guiders',
    clientId: 'console',
    scope: 'openid profile email',
    secureRoutes: [apiBaseUrl]
  },
  api: {
    baseUrl: apiBaseUrl,
    bffOrigin,
    wsUrl: apiBaseUrl.startsWith('/')
      ? 'http://localhost:3000'
      : apiBaseUrl.replace('/api', ''),
  },
  adminUrl: 'http://localhost:4201',
  version: '0.0.0-local',
};
