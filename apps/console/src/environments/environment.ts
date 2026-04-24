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

declare const __APP_VERSION__: string;

export const environment: Environment = {
  production: false,
  auth: {
    authority: 'http://localhost:8080/realms/guiders',
    clientId: 'console',
    scope: 'openid profile email',
    secureRoutes: ['http://localhost:3000/api']
  },
  api: {
    baseUrl: 'http://localhost:3000/api',
    wsUrl: 'http://localhost:3000' // URL específica para WebSocket (sin /api)
  },
  adminUrl: 'http://localhost:4201',
  version: (typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0'),
};
