import { Route } from '@angular/router';
import { VisitorsComponent } from './visitors/visitors';
// Se mantienen solo las rutas reales; componentes de prueba/debug eliminados

export const visitorsRoutes: Route[] = [
  {
    path: '',
    component: VisitorsComponent,
    title: 'Visitantes'
  }
];