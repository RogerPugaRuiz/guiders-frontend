import { Component, input, output, signal } from '@angular/core';
import { QuickFilter, SavedFilter } from '@guiders-frontend/shared/types';
import { Badge } from '@guiders-frontend/badge';

@Component({
  selector: 'guiders-visitors-quick-filters',
  imports: [Badge],
  templateUrl: './visitors-quick-filters.html',
  styleUrl: './visitors-quick-filters.scss',
})
export class VisitorsQuickFilters {
  /** Lista de filtros rápidos disponibles */
  filters = input.required<QuickFilter[]>();

  /** ID del filtro activo */
  activeFilterId = input<string | null>(null);

  /** Indica si está cargando los filtros */
  loading = input<boolean>(false);

  /** Lista de filtros guardados por el usuario */
  savedFilters = input<SavedFilter[]>([]);

  /** ID del filtro guardado activo */
  selectedSavedFilterId = input<string | null>(null);

  /** Emite cuando se selecciona un filtro */
  filterSelect = output<string>();

  /** Emite cuando se selecciona un filtro guardado */
  savedFilterSelect = output<SavedFilter>();

  /** Emite cuando se elimina un filtro guardado */
  savedFilterDelete = output<string>();

  /** Estado del modal de confirmación */
  showDeleteConfirm = signal(false);
  pendingDeleteFilter = signal<SavedFilter | null>(null);

  onFilterClick(filterId: string): void {
    this.filterSelect.emit(filterId);
  }

  isActive(filterId: string): boolean {
    return this.activeFilterId() === filterId;
  }

  onSavedFilterClick(filter: SavedFilter): void {
    this.savedFilterSelect.emit(filter);
  }

  onSavedFilterDeleteClick(event: Event, filter: SavedFilter): void {
    event.stopPropagation();
    this.pendingDeleteFilter.set(filter);
    this.showDeleteConfirm.set(true);
  }

  onConfirmDelete(): void {
    const filter = this.pendingDeleteFilter();
    if (filter) {
      this.savedFilterDelete.emit(filter.id);
    }
    this.closeDeleteConfirm();
  }

  onCancelDelete(): void {
    this.closeDeleteConfirm();
  }

  private closeDeleteConfirm(): void {
    this.showDeleteConfirm.set(false);
    this.pendingDeleteFilter.set(null);
  }

  isSavedFilterActive(filterId: string): boolean {
    return this.selectedSavedFilterId() === filterId;
  }
}
