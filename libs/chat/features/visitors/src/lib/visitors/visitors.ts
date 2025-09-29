import { Component, OnInit, OnDestroy, inject, signal, computed, effect, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { catchError, of, finalize, switchMap } from 'rxjs';

// Importar componentes UI y servicios
import { VisitorsListComponent } from '@guiders-frontend/visitors-list';
import { CreateChatModal, CreateChatModalConfig } from '@guiders-frontend/create-chat-modal';
import { BentoKpiComponent } from '@guiders-frontend/bento-kpi';
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
    CreateChatModal,
    BentoKpiComponent
  ],
  templateUrl: './visitors.html',
  styleUrls: ['./visitors.scss'],
})
export class VisitorsComponent implements OnInit, OnDestroy {
  private readonly visitorsService = inject(VisitorsDataService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  // ID del tenant (empresa) resuelto dinámicamente
  readonly tenantId = signal<string | null>(null);

  // Estado reactivo del componente
  readonly state = signal<VisitorState>({
    visitors: [],
    selectedVisitor: null,
    filters: {
      includeOffline: true,
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
      filters: { hasActiveChat: false, includeOffline: true } as VisitorFilters,
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
      filters: { hasActiveChat: true, includeOffline: true } as VisitorFilters,
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

    if (filters.includeOffline === false) {
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

    // Obtener sitios de la empresa usando el endpoint correcto /api/companies/{companyId}/sites
    this.visitorsService.getCompanySites()
      .pipe(
        catchError((error: Error) => {
          console.error('Error obteniendo sitios de la empresa:', error);
          
          // Fallback: intentar con el método original si falla
          console.log('[Visitors] Intentando método fallback...');
          const hostname = window.location.hostname;
          return this.visitorsService.resolveSite(hostname).pipe(
            switchMap(resolveResponse => {
              // Convertir respuesta de resolveSite al formato esperado
              return of({
                sites: [{
                  siteId: resolveResponse.siteId,
                  tenantId: resolveResponse.tenantId,
                  siteName: resolveResponse.siteName,
                  domain: hostname,
                  isActive: true
                }],
                companyId: '',
                companyName: resolveResponse.companyName,
                totalSites: 1
              });
            }),
            catchError((fallbackError: Error) => {
              console.error('Error en fallback:', fallbackError);
              this.updateState({ error: 'No se pudieron obtener los sitios de la empresa.' });
              return of(null);
            })
          );
        })
      )
      .subscribe((response: {
        sites: Array<{
          siteId: string;
          tenantId: string;
          siteName: string;
          domain: string;
          isActive: boolean;
        }>;
        companyId: string;
        companyName: string;
        totalSites: number;
      } | null) => {
        if (!response) {
          return; // Error ya manejado en catchError
        }

        // La respuesta viene de getCompanySites() que tiene el formato { sites: [], companyId: "", ... }
        if (!response.sites || !response.sites.length) {
          this.updateState({ error: 'No se encontraron sitios activos para esta empresa.' });
          return;
        }

        // Buscar el sitio que coincida con el hostname actual o usar el primero activo
        const hostname = window.location.hostname;
        let selectedSite = response.sites.find(site => 
          site.domain.toLowerCase() === hostname.toLowerCase() || 
          site.domain.toLowerCase().includes(hostname.toLowerCase())
        );

        // Si no se encuentra coincidencia por dominio, usar el primer sitio activo
        if (!selectedSite) {
          selectedSite = response.sites.find(site => site.isActive);
        }

        if (!selectedSite) {
          this.updateState({ error: 'No se encontró un sitio activo disponible.' });
          return;
        }

        console.log(`[Visitors] Usando tenant: ${selectedSite.siteName} (${selectedSite.tenantId}) de la empresa: ${response.companyName}`);
        this.tenantId.set(selectedSite.tenantId);

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

    if (filters.includeOffline === false) {
      filtered = filtered.filter(v => v.status !== 'offline');
    }

    return filtered.length;
  }

  // Métodos para cargar datos
  loadVisitors(): void {
    // Aún no hay tenantId resuelto
    const tenantId = this.tenantId();
    if (!tenantId) {
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

    this.visitorsService.getVisitors(tenantId, queryParams)
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
    const tenantId = this.tenantId();
    if (!tenantId) return;
    this.visitorsService.getVisitorStats(tenantId)
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
    const tenantId = this.tenantId();
    if (!tenantId) return;
    const currentState = this.state();
    
    const queryParams = {
      limit: currentState.pagination.limit,
      offset: currentState.pagination.offset || 0,
      includeOffline: this.currentFilter().filters.includeOffline,
      search: currentState.searchQuery || undefined
    };

    this.visitorsService.getVisitors(tenantId, queryParams)
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
