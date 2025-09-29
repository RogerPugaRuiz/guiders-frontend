export interface UserSession {
  exp: number;
  iat: number;
}

export interface User {
  sub: string;
  email: string;
  roles: string[];
  app: string;
  companyId?: string; // ID de la empresa del usuario
  tenantId?: string;  // ID del tenant para multi-tenancy
  session: UserSession;
}