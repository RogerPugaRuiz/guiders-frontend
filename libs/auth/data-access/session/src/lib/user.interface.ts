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

/**
 * Perfil completo del usuario obtenido desde /api/user/auth/me
 * Incluye información adicional como avatar, nombre, y keycloakId
 */
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  roles: string[];
  companyId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string;
  keycloakId: string;
  avatarUrl?: string;
}