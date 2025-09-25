import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'lib-visitors',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './visitors.html',
  styleUrls: ['./visitors.css'],
})
export class VisitorsComponent {
  selectedFilter = 'unassigned';

  filters = [
    { id: 'unassigned', label: 'Sin Asignar', count: 12 },
    { id: 'mine', label: 'Mis Visitantes', count: 8 },
    { id: 'all', label: 'Todos los Visitantes', count: 45 },
    { id: 'queue', label: 'En Cola', count: 5 }
  ];

  selectFilter(filterId: string) {
    this.selectedFilter = filterId;
    // TODO: Implementar lógica de filtrado con ChatService
  }
}
