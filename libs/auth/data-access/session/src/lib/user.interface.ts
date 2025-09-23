export interface UserSession {
  exp: number;
  iat: number;
}

export interface User {
  sub: string;
  email: string;
  roles: string[];
  app: string;
  session: UserSession;
}