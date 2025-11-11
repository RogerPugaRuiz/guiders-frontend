export interface UserSession {
  exp: number;
  iat: number;
}

export interface User {
  sub: string;
  email: string;
  roles: string[];
  companyId: string; // ID de la empresa del usuario (requerido)
  app: string;
  session: UserSession;
}