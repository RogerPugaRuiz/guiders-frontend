import { Component, input, output, signal, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  VisitorSearchFilters,
  VisitorLifecycleFilter,
  VisitorConnectionStatusFilter,
  VisitorSearchSort
} from '@guiders-frontend/shared/types';

@Component({
  selector: 'guiders-visitors-advanced-filters',
  imports: [FormsModule],
  templateUrl: './visitors-advanced-filters.html',
  styleUrl: './visitors-advanced-filters.scss',
})
export class VisitorsAdvancedFilters {
  /** Si el panel está abierto */
  isOpen = input<boolean>(false);

  /** Filtros actuales para inicializar el formulario */
  currentFilters = input<VisitorSearchFilters>({});

  /** Ordenamiento actual */
  currentSort = input<VisitorSearchSort | undefined>();

  /** Emite cuando se aplican los filtros */
  apply = output<{ filters: VisitorSearchFilters; sort?: VisitorSearchSort }>();

  /** Emite cuando se cierra el panel */
  closePanel = output<void>();

  /** Emite cuando se quiere guardar el filtro */
  saveFilter = output<{ filters: VisitorSearchFilters; sort?: VisitorSearchSort }>();

  // Estado interno del formulario
  lifecycle = signal<Record<VisitorLifecycleFilter, boolean>>({
    ANON: false,
    ENGAGED: false,
    LEAD: false,
    CONVERTED: false
  });

  connectionStatus = signal<Record<VisitorConnectionStatusFilter, boolean>>({
    online: false,
    away: false,
    chatting: false,
    offline: false
  });

  hasAcceptedPrivacyPolicy = signal<boolean | undefined>(undefined);
  hasPendingChats = signal<boolean | undefined>(undefined);
  hasActiveSessions = signal<boolean | undefined>(undefined);
  isInternal = signal<boolean | undefined>(undefined);
  currentUrlContains = signal<string>('');
  createdFrom = signal<string>('');
  createdTo = signal<string>('');
  lastActivityFrom = signal<string>('');
  lastActivityTo = signal<string>('');
  ipAddress = signal<string>('');

  // Ordenamiento
  sortField = signal<string>('lastActivity');
  sortDirection = signal<'ASC' | 'DESC'>('DESC');

  // Opciones para los selectores
  lifecycleOptions: { value: VisitorLifecycleFilter; label: string }[] = [
    { value: 'ANON', label: 'Anónimo' },
    { value: 'ENGAGED', label: 'Interesado' },
    { value: 'LEAD', label: 'Lead' },
    { value: 'CONVERTED', label: 'Convertido' }
  ];

  connectionStatusOptions: { value: VisitorConnectionStatusFilter; label: string }[] = [
    { value: 'online', label: 'En línea' },
    { value: 'away', label: 'Ausente' },
    { value: 'chatting', label: 'Chateando' },
    { value: 'offline', label: 'Desconectado' }
  ];

  sortFieldOptions = [
    { value: 'lastActivity', label: 'Última actividad' },
    { value: 'createdAt', label: 'Fecha de creación' },
    { value: 'updatedAt', label: 'Última actualización' },
    { value: 'lifecycle', label: 'Ciclo de vida' },
    { value: 'connectionStatus', label: 'Estado de conexión' }
  ];

  constructor() {
    // Inicializar formulario cuando cambian los filtros actuales
    effect(() => {
      const filters = this.currentFilters();
      this.initializeFromFilters(filters);
    });

    effect(() => {
      const sort = this.currentSort();
      if (sort) {
        this.sortField.set(sort.field);
        this.sortDirection.set(sort.direction);
      }
    });
  }

  private initializeFromFilters(filters: VisitorSearchFilters): void {
    // Reset lifecycle
    const lifecycleState: Record<VisitorLifecycleFilter, boolean> = {
      ANON: false, ENGAGED: false, LEAD: false, CONVERTED: false
    };
    filters.lifecycle?.forEach(l => lifecycleState[l] = true);
    this.lifecycle.set(lifecycleState);

    // Reset connection status
    const statusState: Record<VisitorConnectionStatusFilter, boolean> = {
      online: false, away: false, chatting: false, offline: false
    };
    filters.connectionStatus?.forEach(s => statusState[s] = true);
    this.connectionStatus.set(statusState);

    // Other fields
    this.hasAcceptedPrivacyPolicy.set(filters.hasAcceptedPrivacyPolicy);
    this.hasPendingChats.set(filters.hasPendingChats);
    this.hasActiveSessions.set(filters.hasActiveSessions);
    this.isInternal.set(filters.isInternal);
    this.currentUrlContains.set(filters.currentUrlContains || '');
    this.createdFrom.set(filters.createdFrom?.split('T')[0] || '');
    this.createdTo.set(filters.createdTo?.split('T')[0] || '');
    this.lastActivityFrom.set(filters.lastActivityFrom?.split('T')[0] || '');
    this.lastActivityTo.set(filters.lastActivityTo?.split('T')[0] || '');
  }

  toggleLifecycle(value: VisitorLifecycleFilter): void {
    const current = this.lifecycle();
    this.lifecycle.set({ ...current, [value]: !current[value] });
  }

  toggleConnectionStatus(value: VisitorConnectionStatusFilter): void {
    const current = this.connectionStatus();
    this.connectionStatus.set({ ...current, [value]: !current[value] });
  }

  setPrivacyPolicy(value: boolean | undefined): void {
    this.hasAcceptedPrivacyPolicy.set(value);
  }

  setHasPendingChats(value: boolean | undefined): void {
    this.hasPendingChats.set(value);
  }

  setActiveSessions(value: boolean | undefined): void {
    this.hasActiveSessions.set(value);
  }

  setIsInternal(value: boolean | undefined): void {
    this.isInternal.set(value);
  }

  onApply(): void {
    const result = this.buildFiltersAndSort();
    this.apply.emit(result);
  }

  onClear(): void {
    this.lifecycle.set({ ANON: false, ENGAGED: false, LEAD: false, CONVERTED: false });
    this.connectionStatus.set({ online: false, away: false, chatting: false, offline: false });
    this.hasAcceptedPrivacyPolicy.set(undefined);
    this.hasPendingChats.set(undefined);
    this.hasActiveSessions.set(undefined);
    this.isInternal.set(undefined);
    this.currentUrlContains.set('');
    this.ipAddress.set('');
    this.createdFrom.set('');
    this.createdTo.set('');
    this.lastActivityFrom.set('');
    this.lastActivityTo.set('');
    this.sortField.set('lastActivity');
    this.sortDirection.set('DESC');
  }

  onSave(): void {
    const result = this.buildFiltersAndSort();
    this.saveFilter.emit(result);
  }

  onClose(): void {
    this.closePanel.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('advanced-filters__backdrop')) {
      this.onClose();
    }
  }

  private buildFiltersAndSort(): { filters: VisitorSearchFilters; sort?: VisitorSearchSort } {
    const filters: VisitorSearchFilters = {};

    // Lifecycle
    const selectedLifecycle = Object.entries(this.lifecycle())
      .filter(([, v]) => v)
      .map(([k]) => k as VisitorLifecycleFilter);
    if (selectedLifecycle.length > 0) {
      filters.lifecycle = selectedLifecycle;
    }

    // Connection status
    const selectedStatus = Object.entries(this.connectionStatus())
      .filter(([, v]) => v)
      .map(([k]) => k as VisitorConnectionStatusFilter);
    if (selectedStatus.length > 0) {
      filters.connectionStatus = selectedStatus;
    }

    // Boolean fields
    if (this.hasAcceptedPrivacyPolicy() !== undefined) {
      filters.hasAcceptedPrivacyPolicy = this.hasAcceptedPrivacyPolicy();
    }
    if (this.hasPendingChats() !== undefined) {
      filters.hasPendingChats = this.hasPendingChats();
    }
    if (this.hasActiveSessions() !== undefined) {
      filters.hasActiveSessions = this.hasActiveSessions();
    }
    if (this.isInternal() !== undefined) {
      filters.isInternal = this.isInternal();
    }

    // Text fields
    if (this.currentUrlContains()) {
      filters.currentUrlContains = this.currentUrlContains();
    }
    if (this.ipAddress()) {
      filters.ipAddress = this.ipAddress();
    }

    // Date fields
    if (this.createdFrom()) {
      filters.createdFrom = new Date(this.createdFrom()).toISOString();
    }
    if (this.createdTo()) {
      filters.createdTo = new Date(this.createdTo()).toISOString();
    }
    if (this.lastActivityFrom()) {
      filters.lastActivityFrom = new Date(this.lastActivityFrom()).toISOString();
    }
    if (this.lastActivityTo()) {
      filters.lastActivityTo = new Date(this.lastActivityTo()).toISOString();
    }

    // Sort
    const sort: VisitorSearchSort = {
      field: this.sortField() as VisitorSearchSort['field'],
      direction: this.sortDirection()
    };

    return { filters, sort };
  }
}
