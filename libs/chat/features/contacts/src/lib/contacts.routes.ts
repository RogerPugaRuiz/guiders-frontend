import { Route } from '@angular/router';
import { ContactsComponent } from './contacts/contacts';

export const contactsRoutes: Route[] = [
  {
    path: '',
    component: ContactsComponent,
    title: 'Contactos'
  }
];