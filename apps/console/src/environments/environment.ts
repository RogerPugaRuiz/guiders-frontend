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
    wsUrl?: string; // URL específica para WebSocket (opcional)
  };
  adminUrl: string;
  version?: string;
}

// Allow E2E (or any local dev override) to redirect API calls to a different
// backend port without modifying this file. Set VITE_API_BASE_URL in the
// environment (e.g. playwright.config.ts webServer.env) to override.
//
// Default is a relative path so the Vite dev-server proxy forwards /api to
// the backend (localhost:3000). This avoids cross-origin cookie issues with
// the BFF PKCE flow in local development.
const apiBaseUrl: string =
  (import.meta as unknown as { env?: { VITE_API_BASE_URL?: string } }).env
    ?.VITE_API_BASE_URL ?? '/api';

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
    // WebSocket must be an absolute ws:// URL. When apiBaseUrl is relative ('/api')
    // we fall back to the known local backend origin so the WS connection works.
    wsUrl: apiBaseUrl.startsWith('/')
      ? 'http://localhost:3000'
      : apiBaseUrl.replace('/api', ''),
  },
  adminUrl: 'http://localhost:4201',
  version: '0.0.0-local',
};
