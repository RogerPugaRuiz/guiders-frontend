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
}

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
  }
};
