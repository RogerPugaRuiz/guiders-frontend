import { Route } from '@angular/router';
import { LeadsShell } from './leads-shell/leads-shell';
import { LeadsList } from './leads-list/leads-list';
import { SyncRecords } from './sync-records/sync-records';

export const leadsRoutes: Route[] = [
  {
    path: '',
    component: LeadsShell,
    children: [
      { path: '', redirectTo: 'list', pathMatch: 'full' },
      { path: 'list', component: LeadsList },
      { path: 'sync-records', component: SyncRecords },
    ],
  },
];
