import { Component, OnInit, OnDestroy, inject, signal, computed, effect, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { catchError, of, finalize } from 'rxjs';

// Importar componentes UI y servicios
import { VisitorsListComponent } from '@guiders-frontend/visitors-list';
import { CreateChatModal, CreateChatModalConfig } from '@guiders-frontend/create-chat-modal';
import { VisitorsDataService } from '@guiders-frontend/visitors-data-service';
import {
  Visitor,
  VisitorFilters,
  VisitorSort,
  CreateChatWithVisitorRequest,
  VisitorState,
  GetVisitorsResponse,
  VisitorStats
} from '@guiders-frontend/shared/types';

@Component({
  selector: 'lib-visitors',
  standalone: true,
  imports: [
    CommonModule, 
    VisitorsListComponent, 
    CreateChatModal
  ],
  templateUrl: './visitors.html',
  styleUrls: ['./visitors.scss'],
})
export class VisitorsComponent implements OnInit, OnDestroy {
  private readonly visitorsService = inject(VisitorsDataService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  // Contexto del sitio resuelto dinámicamente
  readonly siteId = signal<string | null>(null);

  // Estado reactivo del componente
  readonly state = signal<VisitorState>({
    visitors: [],
    selectedVisitor: null,
    filters: {
      includeOffline: false,
      hasActiveChat: false
    },
    sort: { field: 'lastVisit', direction: 'desc' },
    pagination: { limit: 50, offset: 0 },
    loading: false,
    error: null,
    stats: null,
    searchQuery: ''
  });

  // Filtros predefinidos para diferentes vistas
  readonly filterPresets = signal([
    {
      id: 'unassigned',
      label: 'Sin Asignar',
      icon: '👥',
      description: 'Visitantes sin chat activo',
      filters: { hasActiveChat: false, includeOffline: false } as VisitorFilters,
      count: 0
    },
    {
      id: 'online',
      label: 'En Línea',
      icon: '🟢',
      description: 'Visitantes conectados actualmente',
      filters: { status: ['online'], includeOffline: false } as VisitorFilters,
      count: 0
    },
    {
      id: 'active-chats',
      label: 'Con Chat Activo',
      icon: '💬',
      description: 'Visitantes con conversación en curso',
      filters: { hasActiveChat: true } as VisitorFilters,
      count: 0
    },
    {
      id: 'leads',
      label: 'Leads',
      icon: '📧',
      description: 'Visitantes que han proporcionado información',
      filters: { lifecycle: ['LEAD', 'CONVERTED'] } as VisitorFilters,
      count: 0
    },
    {
      id: 'mine',
      label: 'Mis Visitantes',
      icon: '👤',
      description: 'Visitantes asignados a mi usuario',
      filters: { hasActiveChat: true, includeOffline: false } as VisitorFilters,
      count: 0
    },
    {
      id: 'queue',
      label: 'En Cola',
      icon: '⏳',
      description: 'Visitantes esperando atención prioritaria',
      filters: { hasActiveChat: false, status: ['online'], includeOffline: false } as VisitorFilters,
      count: 0
    },
    {
      id: 'all',
      label: 'Todos',
      icon: '📊',
      description: 'Todos los visitantes del sitio',
      filters: { includeOffline: true } as VisitorFilters,
      count: 0
    }
  ]);

  readonly selectedFilterId = signal<string>('unassigned');

  // Modal state
  readonly showCreateChatModal = signal<boolean>(false);
  readonly selectedVisitorForChat = signal<Visitor | null>(null);

  // Modal configuration
  readonly modalConfig = signal<CreateChatModalConfig>({
    departments: [
      { id: 'sales', name: 'Ventas' },
      { id: 'support', name: 'Soporte Técnico' },
      { id: 'marketing', name: 'Marketing' },
      { id: 'general', name: 'Atención General' }
    ],
    priorities: [
      { id: 'LOW', name: 'Baja', color: '#6b7280' },
      { id: 'MEDIUM', name: 'Media', color: '#f59e0b' },
      { id: 'HIGH', name: 'Alta', color: '#ef4444' },
      { id: 'URGENT', name: 'Urgente', color: '#dc2626' }
    ],
    defaultDepartment: 'sales',
    defaultPriority: 'MEDIUM',
    requireMessage: true,
    maxMessageLength: 500
  });

  // Computed values
  readonly currentFilter = computed(() => {
    const filterId = this.selectedFilterId();
    return this.filterPresets().find(f => f.id === filterId) || this.filterPresets()[0];
  });

  readonly filteredVisitors = computed(() => {
    const state = this.state();
    const currentFilter = this.currentFilter();
    
    let visitors = state.visitors;
    const filters = { ...currentFilter.filters, ...state.filters };

    // Aplicar filtros
    if (filters.status?.length) {
      visitors = visitors.filter(v => filters.status?.includes(v.status) ?? false);
    }

    if (filters.lifecycle?.length) {
      visitors = visitors.filter(v => filters.lifecycle?.includes(v.lifecycle) ?? false);
    }

    if (filters.hasActiveChat !== undefined) {
      visitors = visitors.filter(v => v.hasActiveChat === filters.hasActiveChat);
    }

    if (!filters.includeOffline) {
      visitors = visitors.filter(v => v.status !== 'offline');
    }

    if (state.searchQuery) {
      const query = state.searchQuery.toLowerCase();
      visitors = visitors.filter(v =>
        v.name?.toLowerCase().includes(query) ||
        v.email?.toLowerCase().includes(query) ||
        v.domain.toLowerCase().includes(query)
      );
    }

    return visitors;
  });

  readonly visitorStats = computed(() => {
    const visitors = this.state().visitors;
    const online = visitors.filter(v => v.status === 'online').length;
    const withChat = visitors.filter(v => v.hasActiveChat).length;
    const newVisitors = visitors.filter(v => v.isNewVisitor).length;

    return {
      total: visitors.length,
      online,
      withActiveChat: withChat,
      newVisitors,
      leads: visitors.filter(v => ['LEAD', 'CONVERTED'].includes(v.lifecycle)).length
    };
  });

  // Configuración para el componente de lista
  readonly listConfig = computed(() => ({
    showSearch: true,
    showFilters: true,
    showActions: true,
    allowMultiSelect: this.selectedFilterId() === 'unassigned',
    showStats: true,
    pageSize: this.state().pagination.limit
  }));

  constructor() {
    // Effect para actualizar contadores de filtros evitando ciclo reactivo
    effect(() => {
      const visitors = this.state().visitors; // dependencia rastreada
      untracked(() => {
        this.filterPresets.update((presets) => {
          const updated = presets.map(preset => ({
            ...preset,
            count: this.getFilterCount(visitors, preset.filters)
          }));

          // Solo actualizar si cambian los counts para no crear bucles innecesarios
          const changed = updated.some((p, i) => p.count !== presets[i].count);
          return changed ? updated : presets;
        });
      });
    });
  }

  private refreshIntervalId?: number;

  ngOnInit(): void {
    // Leer query parameters de la URL
    this.route.queryParams.subscribe(params => {
      if (params['filter']) {
        this.onFilterPresetChange(params['filter']);
      }
    });

    // Resolver siteId a partir del host y luego cargar datos
    const hostname = window.location.hostname;
    this.visitorsService.resolveSite(hostname)
      .pipe(
        catchError((error: Error) => {
          console.error('Error resolving site:', error);
          this.updateState({ error: 'No se pudo resolver el sitio para este host.' });
          return of(null);
        })
      )
      .subscribe((res) => {
        if (!res) return;
        this.siteId.set(res.siteId);
        this.loadVisitors();
        this.loadStats();

        // Actualizar datos cada 30 segundos (una vez resuelto el sitio)
        this.refreshIntervalId = window.setInterval(() => {
          this.refreshVisitors();
        }, 30000);
      });
  }

  ngOnDestroy(): void {
    if (this.refreshIntervalId) {
      clearInterval(this.refreshIntervalId);
      this.refreshIntervalId = undefined;
    }
  }

  private getFilterCount(visitors: Visitor[], filters: VisitorFilters): number {
    let filtered = visitors;

    if (filters.status?.length) {
      filtered = filtered.filter(v => filters.status?.includes(v.status) ?? false);
    }

    if (filters.lifecycle?.length) {
      filtered = filtered.filter(v => filters.lifecycle?.includes(v.lifecycle) ?? false);
    }

    if (filters.hasActiveChat !== undefined) {
      filtered = filtered.filter(v => v.hasActiveChat === filters.hasActiveChat);
    }

    if (!filters.includeOffline) {
      filtered = filtered.filter(v => v.status !== 'offline');
    }

    return filtered.length;
  }

  // Métodos para cargar datos
  loadVisitors(): void {
    // Aún no hay siteId resuelto
    const siteId = this.siteId();
    if (!siteId) {
      return;
    }
    this.updateState({ loading: true, error: null });

    const currentState = this.state();
    
    // Preparar parámetros de query según el formato del servicio
    const queryParams = {
      limit: currentState.pagination.limit,
      offset: currentState.pagination.offset || 0,
      includeOffline: this.currentFilter().filters.includeOffline,
      search: currentState.searchQuery || undefined
    };

    this.visitorsService.getVisitors(siteId, queryParams)
      .pipe(
        catchError((error: Error) => {
          console.error('Error loading visitors:', error);
          return of({ visitors: [], total: 0, hasMore: false });
        }),
        finalize(() => this.updateState({ loading: false }))
      )
      .subscribe((response: GetVisitorsResponse) => {
        this.updateState({
          visitors: response.visitors,
          error: null
        });
      });
  }

  private loadStats(): void {
    const siteId = this.siteId();
    if (!siteId) return;
    this.visitorsService.getVisitorStats(siteId)
      .pipe(
        catchError((error: Error) => {
          console.error('Error loading visitor stats:', error);
          return of(null);
        })
      )
      .subscribe((stats: VisitorStats | null) => {
        if (stats) {
          this.updateState({ stats });
        }
      });
  }

  private refreshVisitors(): void {
    if (this.state().loading) return;
    const siteId = this.siteId();
    if (!siteId) return;
    const currentState = this.state();
    
    const queryParams = {
      limit: currentState.pagination.limit,
      offset: currentState.pagination.offset || 0,
      includeOffline: this.currentFilter().filters.includeOffline,
      search: currentState.searchQuery || undefined
    };

    this.visitorsService.getVisitors(siteId, queryParams)
      .pipe(
        catchError(() => of({ visitors: [], total: 0, hasMore: false }))
      )
      .subscribe((response: GetVisitorsResponse) => {
        this.updateState({ visitors: response.visitors });
      });
  }

  private updateState(updates: Partial<VisitorState>): void {
    this.state.update(current => ({ ...current, ...updates }));
  }

  // Event handlers del UI
  onFilterPresetChange(filterId: string): void {
    this.selectedFilterId.set(filterId);
    this.loadVisitors();
  }

  onVisitorClick(visitor: Visitor): void {
    this.updateState({ selectedVisitor: visitor });
    // Navegar a vista de detalle del visitante (futuro)
    // this.router.navigate(['/visitors', visitor.id]);
  }

  onVisitorSelect(visitors: Visitor[]): void {
    console.log('Visitors selected:', visitors.length);
    // Manejar selección múltiple para acciones en lote
  }

  onCreateChat(request: CreateChatWithVisitorRequest): void {
    // Este método ahora maneja la solicitud desde la lista para abrir el modal
    // Buscar el visitante por ID en la request
    const visitor = this.state().visitors.find(v => v.id === request.visitorId);
    if (visitor) {
      this.openCreateChatModal(visitor);
    }
  }

  openCreateChatModal(visitor: Visitor): void {
    this.selectedVisitorForChat.set(visitor);
    this.showCreateChatModal.set(true);
  }

  onModalCreateChat(request: CreateChatWithVisitorRequest): void {
    this.updateState({ loading: true });

    this.visitorsService.createChatWithVisitor(request)
      .pipe(
        catchError((error: Error) => {
          console.error('Error creating chat:', error);
          this.updateState({ 
            error: 'Error al crear el chat. Inténtalo de nuevo.',
            loading: false
          });
          return of(null);
        }),
        finalize(() => this.updateState({ loading: false }))
      )
      .subscribe((response: { chatId: string } | null) => {
        if (response) {
          console.log('Chat created successfully:', response.chatId);
          
          // Cerrar el modal
          this.closeCreateChatModal();
          
          // Navegar al chat creado
          // this.router.navigate(['/chat', response.chatId]);
          
          // Refrescar la lista de visitantes
          this.refreshVisitors();
        }
      });
  }

  closeCreateChatModal(): void {
    this.showCreateChatModal.set(false);
    this.selectedVisitorForChat.set(null);
  }

  onSearchChange(query: string): void {
    this.updateState({ searchQuery: query });
  }

  onFilterChange(filters: VisitorFilters): void {
    this.updateState({ filters: { ...this.state().filters, ...filters } });
    this.loadVisitors();
  }

  onSortChange(sort: VisitorSort): void {
    this.updateState({ sort });
    this.loadVisitors();
  }

  // Métodos de utilidad
  getFilterIcon(filterId: string): string {
    const filter = this.filterPresets().find(f => f.id === filterId);
    return filter?.icon || '📊';
  }

  getFilterDescription(filterId: string): string {
    const filter = this.filterPresets().find(f => f.id === filterId);
    return filter?.description || '';
  }
}
