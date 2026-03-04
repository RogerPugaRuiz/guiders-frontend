import { Route } from '@angular/router';
import { Integrations } from './integrations/integrations';
import { ApiKeys } from './api-keys/api-keys';
import { Sites } from './sites/sites';
import { LeadCarsConfigComponent } from './leadcars-config/leadcars-config';
import { SyncRecords } from './sync-records/sync-records';
import { LeadsList } from './leads-list/leads-list';

export const integrationsRoutes: Route[] = [
  {
    path: '',
    component: Integrations,
    children: [
      { path: '', redirectTo: 'api-keys', pathMatch: 'full' },
      { path: 'api-keys', component: ApiKeys },
      { path: 'sites', component: Sites },
      { path: 'leadcars', component: LeadCarsConfigComponent },
      { path: 'leads', component: LeadsList },
      { path: 'sync-records', component: SyncRecords },
    ],
  },
];
