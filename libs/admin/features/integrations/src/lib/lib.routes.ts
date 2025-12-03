import { Route } from '@angular/router';
import { Integrations } from './integrations/integrations';
import { ApiKeys } from './api-keys/api-keys';
import { Sites } from './sites/sites';

export const integrationsRoutes: Route[] = [
  {
    path: '',
    component: Integrations,
    children: [
      { path: '', redirectTo: 'api-keys', pathMatch: 'full' },
      { path: 'api-keys', component: ApiKeys },
      { path: 'sites', component: Sites }
    ]
  },
];
