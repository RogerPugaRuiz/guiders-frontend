import { Route } from '@angular/router';
import { VisitorsComponent } from './visitors/visitors';

export const visitorsRoutes: Route[] = [
  {
    path: '',
    component: VisitorsComponent,
    title: 'Visitantes'
  }
];