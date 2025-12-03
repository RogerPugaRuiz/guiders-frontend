export interface Environment {
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
  consoleUrl?: string; // URL de la app console para redirecciones (solo admin)
  adminUrl?: string; // URL de la app admin para redirecciones (solo console)
}
