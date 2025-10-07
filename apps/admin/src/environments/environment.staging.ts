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
}

export const environment: Environment = {
  production: false, // staging no es producción completa
  auth: {
    authority: 'https://auth.guiders.es/realms/guiders',
    clientId: 'admin',
    scope: 'openid profile email',
    secureRoutes: ['https://guiders.es/api']
  },
  api: {
    baseUrl: 'https://guiders.es/api'
  }
};
