import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'lib-contacts',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './contacts.html',
  styleUrls: ['./contacts.css'],
})
export class ContactsComponent {
  selectedView = 'mine';

  views = [
    { id: 'mine', label: 'Mis Contactos', icon: '👤' },
    { id: 'recent', label: 'Recientes', icon: '🕒' },
    { id: 'search', label: 'Búsqueda Avanzada', icon: '🔍' }
  ];

  selectView(viewId: string) {
    this.selectedView = viewId;
    // TODO: Implementar lógica de vistas con ContactService
  }
}
