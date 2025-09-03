import { Route } from '@angular/router';
import { authGuard } from '@guiders-frontend/auth/login';
import { Inbox } from './inbox/inbox';

export const inboxRoutes: Route[] = [
  { 
    path: '', 
    component: Inbox,
    canActivate: [authGuard]
  }
];
