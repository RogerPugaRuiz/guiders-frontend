import { Route } from '@angular/router';
import { Login } from './login/login';
import { OidcCallback } from './callback/oidc-callback';

export const loginRoutes: Route[] = [
  { 
    path: '', 
    component: Login 
  },
  { 
    path: 'callback', 
    component: OidcCallback 
  }
];
