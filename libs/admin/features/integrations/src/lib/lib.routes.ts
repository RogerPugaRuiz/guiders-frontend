import { Route } from '@angular/router';
import { Integrations } from './integrations/integrations';
import { ApiKeys } from './api-keys/api-keys';
import { Sites } from './sites/sites';
import { CrmConfig } from './crm-config/crm-config';
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
      { path: 'crm', component: CrmConfig },
      { path: 'leads', component: LeadsList },
      { path: 'sync-records', component: SyncRecords },
    ],
  },
];
