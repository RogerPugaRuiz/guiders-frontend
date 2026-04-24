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
  production: true,
  auth: {
    authority: 'https://auth.guiders.es/realms/guiders',
    clientId: 'console',
    scope: 'openid profile email',
    secureRoutes: ['https://guiders.es/api']
  },
  api: {
    baseUrl: 'https://guiders.es/api',
    wsUrl: 'https://guiders.es' // WebSocket de producción (sin /api)
  },
  adminUrl: 'https://admin.guiders.es',
  version: (typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0'),
};
