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
  production: false,
  auth: {
    authority: 'https://auth.guiders.es/realms/guiders',
    clientId: 'console',
    scope: 'openid profile email',
    secureRoutes: ['http://localhost:3000/api']
  },
  api: {
    baseUrl: 'http://localhost:3000/api'
  }
};
