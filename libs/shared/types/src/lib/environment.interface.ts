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
  version?: string; // App version displayed in the sidebar footer
  /**
   * Story 4.2 — Epic 4: Embed mode tenant identifier.
   *
   * When this is set, the app loads branding config for this companyId
   * at startup via BrandingService. Used in embed mode (per-tenant
   * build) where the company is known at build time.
   *
   * For standalone mode, this is undefined (admin user can switch tenants).
   */
  embedCompanyId?: string;
}
