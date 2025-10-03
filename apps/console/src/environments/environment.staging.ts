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
  production: false, // staging no es producción completa
  auth: {
    authority: 'https://auth.guiders.es/realms/guiders', // Usar auth de producción para staging
    clientId: 'console',
    scope: 'openid profile email',
    secureRoutes: ['https://guiders.es/api'] // API de staging
  },
  api: {
    baseUrl: 'https://guiders.es/api', // API de staging
    wsUrl: 'https://guiders.es' // WebSocket de staging (sin /api)
  }
};
