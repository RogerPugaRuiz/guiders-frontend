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
  };
  consoleUrl: string;
  version?: string;
}

export const environment: Environment = {
  production: false,
  auth: {
    authority: 'https://auth.guiders.es/realms/guiders',
    clientId: 'admin',
    scope: 'openid profile email',
    secureRoutes: ['https://guiders.es/api']
  },
  api: {
    baseUrl: 'https://guiders.es/api'
  },
  consoleUrl: 'https://console.guiders.es',
  version: '0.0.0-local',
};
