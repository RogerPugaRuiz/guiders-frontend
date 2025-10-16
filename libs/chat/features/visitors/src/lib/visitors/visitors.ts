import { Component, OnInit, OnDestroy, inject, signal, computed, effect, untracked, ElementRef, ChangeDetectorRef, ViewChild } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { catchError, of, finalize, switchMap } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { USE_MOCK_DATA } from '@guiders-frontend/shared/config';
import { ChatWidgetService } from '@guiders-frontend/chat/data-access/chat-widget-service';

// Importar componentes UI y servicios
import { VisitorsListComponent } from '@guiders-frontend/visitors-list';
import { CreateChatModal, CreateChatModalConfig } from '@guiders-frontend/create-chat-modal';
import { PendingChatsModal } from '@guiders-frontend/pending-chats-modal';
import { BentoKpiComponent } from '@guiders-frontend/bento-kpi';
import { PaginationComponent } from '@guiders-frontend/pagination';
import { VisitorsDataService } from '@guiders-frontend/visitors-data-service';
import { SessionService } from '@guiders-frontend/auth/data-access/session';
import {
  Visitor,
  VisitorFilters,
  VisitorSort,
  CreateChatWithVisitorRequest,
  VisitorState,
  GetVisitorsResponse,
  VisitorStats
} from '@guiders-frontend/shared/types';
import { getMockVisitorsResponse, getMockVisitorStats } from './visitors-mock-data';

// Tipo parcial para respuestas de asignación de chat
// El backend puede devolver distintas formas; declaramos los campos que nos interesan
type AssignChatResponse = {
  success?: boolean;
  assignedAt?: string;
  id?: string;
  status?: string;
  assignedCommercialId?: string;
  [key: string]: unknown;
};

@Component({
  selector: 'lib-visitors',
  standalone: true,
  imports: [
    CommonModule,
    VisitorsListComponent,
    CreateChatModal,
    PendingChatsModal,
    BentoKpiComponent,
    PaginationComponent
  ],
  templateUrl: './visitors.html',
  styleUrls: ['./visitors.scss'],
})
export class VisitorsComponent implements OnInit, OnDestroy {
  private readonly visitorsService = inject(VisitorsDataService);
  private readonly sessionService = inject(SessionService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly elementRef = inject(ElementRef);
  private readonly document = inject(DOCUMENT);
  private readonly useMockData = inject(USE_MOCK_DATA);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly snackBar = inject(MatSnackBar);
  private readonly chatWidgetService = inject(ChatWidgetService);

  // Referencia al componente hijo de la lista de visitantes
  @ViewChild(VisitorsListComponent) visitorsListComponent?: VisitorsListComponent;

  // Variable para guardar la posición del scroll
  private savedScrollPosition = 0;

  // ID del tenant (empresa) resuelto dinámicamente
  readonly tenantId = signal<string | null>(null);

  // Flag para indicar cuando se está refrescando (sin loader)
  readonly isRefreshing = signal<boolean>(false);

  // Opciones de intervalo de auto-refresh (en milisegundos)
  readonly autoRefreshOptions = [
    { label: 'Desactivado', value: 0 },
    { label: '10 segundos', value: 10000 },
    { label: '30 segundos', value: 30000 },
    { label: '1 minuto', value: 60000 },
    { label: '5 minutos', value: 300000 }
  ];

  // Intervalo de auto-refresh seleccionado
  readonly autoRefreshInterval = signal<number>(30000); // Default: 30 segundos

  // Estado reactivo del componente
  readonly state = signal<VisitorState>({
    visitors: [],
    selectedVisitor: null,
    filters: {
      includeOffline: true,
      hasActiveChat: false
    },
    sort: { field: 'lastVisit', direction: 'desc' },
    pagination: { 
      limit: 10, 
      offset: 0,
      totalCount: 0,
      currentPage: 1
    },
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

  // Pending chats modal state
  readonly showPendingChatsModal = signal<boolean>(false);
  readonly pendingChatsModalData = signal<{visitor: Visitor, pendingChatIds: string[]} | null>(null);

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
  private optimisticUpdateInProgress = false; // Flag para pausar auto-refresh

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
          
          // No usar fallback con método deprecated - manejar error directamente
          this.updateState({ error: 'No se pudieron obtener los sitios de la empresa.' });
          return of(null);
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
        const hostname = this.document.location.hostname;
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

        // Configurar auto-refresh inicial
        this.setupAutoRefresh();
      });
  }

  ngOnDestroy(): void {
    if (this.refreshIntervalId) {
      clearInterval(this.refreshIntervalId);
      this.refreshIntervalId = undefined;
    }
  }

  // Método para configurar el auto-refresh
  private setupAutoRefresh(): void {
    const interval = this.autoRefreshInterval();

    // Limpiar intervalo existente si hay uno
    if (this.refreshIntervalId) {
      clearInterval(this.refreshIntervalId);
      this.refreshIntervalId = undefined;
    }

    // Si el intervalo es 0, no configurar auto-refresh
    if (interval === 0) {
      return;
    }

    // Configurar nuevo intervalo
    this.refreshIntervalId = window.setInterval(() => {
      this.refreshVisitors();
    }, interval);
  }

  // Método público para cambiar el intervalo de auto-refresh
  onAutoRefreshIntervalChange(interval: number): void {
    this.autoRefreshInterval.set(interval);
    this.setupAutoRefresh();
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

    // Guardar la posición del scroll antes de cargar
    this.saveScrollPosition();

    this.updateState({ loading: true, error: null });

    const currentState = this.state();

    // Decidir si usar mock o servicio real basado en el token
    if (this.useMockData) {
      // USAR MOCK
      setTimeout(() => {
        const mockResponse = getMockVisitorsResponse(
          currentState.pagination.limit,
          currentState.pagination.offset || 0
        );

        this.updateState({
          visitors: mockResponse.visitors,
          error: null,
          pagination: {
            ...currentState.pagination,
            totalCount: mockResponse.total
          },
          loading: false
        });

        // Restaurar la posición del scroll después de cargar
        this.restoreScrollPosition();
      }, 500); // Simular latencia de red
    } else {
      // USAR SERVICIO REAL
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
          finalize(() => {
            this.updateState({ loading: false });
            // Restaurar la posición del scroll después de cargar
            this.restoreScrollPosition();
          })
        )
        .subscribe((response: GetVisitorsResponse) => {
          this.updateState({
            visitors: response.visitors,
            error: null,
            pagination: {
              ...currentState.pagination,
              totalCount: response.total
            }
          });
        });
    }
  }

  private loadStats(): void {
    const tenantId = this.tenantId();
    if (!tenantId) return;
    
    // Decidir si usar mock o servicio real basado en el token
    if (this.useMockData) {
      // USAR MOCK
      setTimeout(() => {
        const mockStats = getMockVisitorStats();
        this.updateState({ stats: mockStats });
      }, 300); // Simular latencia de red
    } else {
      // USAR SERVICIO REAL
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
  }

  private refreshVisitors(): void {
    // NO refrescar si hay una actualización optimista en progreso
    if (this.optimisticUpdateInProgress) {
      console.log('⏸️ Auto-refresh pausado - actualización optimista en progreso');
      return;
    }

    if (this.state().loading) return;

    // Usar el método silencioso que ya tiene la animación del botón
    this.refreshVisitorsSilently();
  }

  // Método para refrescar visitantes SIN activar loading (para operaciones silenciosas)
  refreshVisitorsSilently(): void {
    const tenantId = this.tenantId();
    if (!tenantId) return;

    // Activar flag de refreshing para feedback visual
    this.isRefreshing.set(true);

    // Guardar la posición del scroll antes de refrescar
    this.saveScrollPosition();

    const currentState = this.state();

    // Decidir si usar mock o servicio real basado en el token
    if (this.useMockData) {
      // USAR MOCK
      setTimeout(() => {
        const mockResponse = getMockVisitorsResponse(
          currentState.pagination.limit,
          currentState.pagination.offset || 0
        );

        this.updateState({
          visitors: mockResponse.visitors,
          pagination: {
            ...currentState.pagination,
            totalCount: mockResponse.total
          }
        });

        // Restaurar la posición del scroll después de actualizar
        this.restoreScrollPosition();

        // Desactivar flag de refreshing
        this.isRefreshing.set(false);
      }, 300); // Breve delay para mostrar la animación
    } else {
      // USAR SERVICIO REAL
      const queryParams = {
        limit: currentState.pagination.limit,
        offset: currentState.pagination.offset || 0,
        includeOffline: this.currentFilter().filters.includeOffline,
        search: currentState.searchQuery || undefined
      };

      this.visitorsService.getVisitors(tenantId, queryParams)
        .pipe(
          catchError(() => of({ visitors: [], total: 0, hasMore: false })),
          finalize(() => {
            // Desactivar flag de refreshing
            this.isRefreshing.set(false);
          })
        )
        .subscribe((response: GetVisitorsResponse) => {
          this.updateState({
            visitors: response.visitors,
            pagination: {
              ...currentState.pagination,
              totalCount: response.total
            }
          });
          // Restaurar la posición del scroll después de actualizar
          this.restoreScrollPosition();
        });
    }
  }

  // Métodos auxiliares para mantener la posición del scroll
  private saveScrollPosition(): void {
    // Buscar el contenedor con scroll (ya no es :host, es .visitors-panel__list-container)
    const scrollContainer = this.elementRef.nativeElement.querySelector('.visitors-panel__list-container') as HTMLElement;
    if (scrollContainer) {
      this.savedScrollPosition = scrollContainer.scrollTop;
    }
  }

  private restoreScrollPosition(): void {
    // Buscar el contenedor con scroll (ya no es :host, es .visitors-panel__list-container)
    const scrollContainer = this.elementRef.nativeElement.querySelector('.visitors-panel__list-container') as HTMLElement;
    if (scrollContainer) {
      // Usar setTimeout para asegurar que el DOM se haya actualizado
      setTimeout(() => {
        scrollContainer.scrollTop = this.savedScrollPosition;
      }, 0);
    }
  }

  private updateState(updates: Partial<VisitorState>): void {
    this.state.update(current => ({ ...current, ...updates }));
    // CRÍTICO: Forzar detección de cambios con OnPush
    // Esto garantiza que la UI se actualice cuando cambia el estado
    this.cdr.markForCheck();
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

  onCreateChat(_request: CreateChatWithVisitorRequest): void {
    // Ya no es necesario abrir el modal - el widget maneja la creación del chat
    // El evento se emite desde visitors-list pero no hacemos nada aquí
    console.log('[Visitors] Evento createChat recibido (ignorado - widget maneja la creación)');
  }

  openCreateChatModal(visitor: Visitor): void {
    this.selectedVisitorForChat.set(visitor);
    this.showCreateChatModal.set(true);
  }

  onModalCreateChat(request: CreateChatWithVisitorRequest): void {
    // NO activar loading aquí - operación silenciosa en segundo plano

    this.visitorsService.createChatWithVisitor(request)
      .pipe(
        catchError((error: Error) => {
          console.error('Error creating chat:', error);
          this.updateState({ 
            error: 'Error al crear el chat. Inténtalo de nuevo.'
          });
          return of(null);
        })
      )
      .subscribe((response: { chatId: string } | null) => {
        if (response) {
          console.log('Chat created successfully:', response.chatId);
          
          // Cerrar el modal
          this.closeCreateChatModal();
          
          // Navegar al chat creado
          // this.router.navigate(['/chat', response.chatId]);
          
          // Refrescar la lista de visitantes SIN loading
          this.refreshVisitorsSilently();
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

  // Métodos de paginación
  onPageChange(page: number): void {
    const currentState = this.state();
    const offset = (page - 1) * currentState.pagination.limit;
    
    this.updateState({
      pagination: {
        ...currentState.pagination,
        currentPage: page,
        offset
      }
    });
    
    this.loadVisitors();
  }

  onPageSizeChange(pageSize: number): void {
    // Al cambiar el tamaño de página, volver a la primera página
    this.updateState({
      pagination: {
        limit: pageSize,
        offset: 0,
        currentPage: 1,
        totalCount: this.state().pagination.totalCount
      }
    });
    
    this.loadVisitors();
  }

  firstPage(): void {
    this.onPageChange(1);
  }

  previousPage(): void {
    const currentPage = this.state().pagination.currentPage || 1;
    if (currentPage > 1) {
      this.onPageChange(currentPage - 1);
    }
  }

  nextPage(): void {
    const currentState = this.state();
    const currentPage = currentState.pagination.currentPage || 1;
    const totalPages = Math.ceil((currentState.pagination.totalCount || 0) / currentState.pagination.limit);
    
    if (currentPage < totalPages) {
      this.onPageChange(currentPage + 1);
    }
  }

  lastPage(): void {
    const currentState = this.state();
    const totalPages = Math.ceil((currentState.pagination.totalCount || 0) / currentState.pagination.limit);
    this.onPageChange(totalPages);
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

  // Pending chats modal methods
  onViewPendingChats(data: {visitor: Visitor, pendingChatIds: string[]}): void {
    this.pendingChatsModalData.set(data);
    this.showPendingChatsModal.set(true);
  }

  onTakePendingChatAutomatically(data: {visitor: Visitor, chatId: string}): void {
    console.log('📥 Tomando chat automáticamente:', data.chatId, 'para visitante:', data.visitor.id);

    // 🔑 Pausar auto-refresh durante actualización optimista
    this.optimisticUpdateInProgress = true;
    console.log('⏸️ Auto-refresh pausado durante actualización optimista');

    // 🔑 PASO 1: ACTUALIZACIÓN OPTIMISTA INMEDIATA (antes de HTTP)
    // Guardar estado original para poder revertir si falla
    const originalVisitors = this.state().visitors;
    
    // Crear nuevo array con el chat eliminado INMEDIATAMENTE
    const optimisticVisitors = originalVisitors.map(visitor => {
      if (visitor.id === data.visitor.id) {
        const updatedPendingChats = (visitor.pendingChatIds || []).filter(
          chatId => chatId !== data.chatId
        );
        
        console.log('✂️ Eliminando chat de pendientes:', data.chatId);
        console.log('📋 pendingChatIds antes:', visitor.pendingChatIds);
        console.log('📋 pendingChatIds después:', updatedPendingChats);
        
        // ⚠️ NO incrementar totalChats porque el chat pendiente ya estaba incluido en el total
        return {
          ...visitor,
          pendingChatIds: updatedPendingChats
          // totalChats se mantiene igual (el chat pendiente ya estaba contado)
        };
      }
      return visitor;
    });

    // Actualizar el estado INMEDIATAMENTE (UI se actualiza aquí)
    this.updateState({ visitors: optimisticVisitors });
    
    // Forzar detección de cambios para que el botón desaparezca YA
    this.cdr.detectChanges();
    
    console.log('✅ UI actualizada optimistamente - botón debería desaparecer');

    // 🔑 PASO 2: Hacer petición HTTP (en segundo plano)
    this.sessionService.ensureSession$().pipe(
      switchMap(user => {
        if (!user?.sub) {
          throw new Error('No se pudo obtener el ID del usuario actual');
        }
        console.log('🌐 Enviando petición HTTP para asignar chat');
        return this.visitorsService.assignChatToCommercial(data.chatId, user.sub);
      }),
      catchError((error: Error) => {
        console.error('❌ Error al tomar el chat:', error);
        
        // Mostrar SnackBar de error
        this.snackBar.open(
          '❌ Error al tomar el chat. Inténtalo de nuevo.',
          'Cerrar',
          {
            duration: 5000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: 'snackbar-error'
          }
        );
        
        // 🔑 REVERTIR actualización optimista
        console.log('⏮️ Revirtiendo actualización optimista');
        this.updateState({ visitors: originalVisitors });
        this.cdr.detectChanges();
        
        // Reactivar auto-refresh después de 5 segundos
        setTimeout(() => {
          this.optimisticUpdateInProgress = false;
          console.log('▶️ Auto-refresh reactivado después de error');
        }, 5000);
        
        // Limpiar estado de procesamiento
        this.visitorsListComponent?.markAsCompleted(data.visitor.id);
        
        this.updateState({
          error: 'Error al tomar el chat. Inténtalo de nuevo.'
        });
        return of(null);
      })
  ).subscribe((response: AssignChatResponse | null) => {
      // El backend puede devolver distintos esquemas: { success: true } o el propio objeto de chat
      const isAssigned = !!response && (
        response.success === true ||
        response.status === 'ASSIGNED' ||
        !!response.assignedCommercialId ||
        (!!response.id && response.status && response.status === 'ASSIGNED')
      );

      if (isAssigned) {
        console.log('✅ Chat asignado exitosamente en servidor:', response);

        // Mostrar SnackBar de éxito
        const visitorName = data.visitor.name || 'Visitante anónimo';
        this.snackBar.open(
          `✅ Chat con ${visitorName} tomado exitosamente`,
          'Cerrar',
          {
            duration: 4000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: 'snackbar-success'
          }
        );

        // 🎯 Abrir el widget de chat con el chat asignado
        console.log('🚀 Abriendo widget de chat para el chat:', data.chatId);
        this.chatWidgetService.openWithChat(data.chatId, data.visitor);

        // Reactivar auto-refresh después de 5 segundos (dar tiempo al backend para actualizar)
        setTimeout(() => {
          this.optimisticUpdateInProgress = false;
          console.log('▶️ Auto-refresh reactivado - backend debería estar actualizado');
        }, 5000);

        // La UI ya está actualizada, solo limpiamos el estado de procesamiento
        this.visitorsListComponent?.markAsCompleted(data.visitor.id);
      } else if (response === null) {
        // Error ya manejado en catchError
        console.log('⚠️ No se pudo confirmar la asignación (response null)');
      } else {
        // Respuesta diferente, interpretada como rechazo
        console.log('⚠️ Servidor rechazó la asignación - response:', response);

        // Mostrar SnackBar de advertencia
        this.snackBar.open(
          '⚠️ El servidor rechazó la asignación del chat',
          'Cerrar',
          {
            duration: 5000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: 'snackbar-warning'
          }
        );

        // Revertir
        this.updateState({ visitors: originalVisitors });
        this.cdr.detectChanges();
        this.visitorsListComponent?.markAsCompleted(data.visitor.id);

        // Reactivar auto-refresh inmediatamente (no hubo cambio real)
        this.optimisticUpdateInProgress = false;
        console.log('▶️ Auto-refresh reactivado (operación rechazada)');
      }
    });
  }

  closePendingChatsModal(): void {
    this.showPendingChatsModal.set(false);
    this.pendingChatsModalData.set(null);
  }

  // Método para limpiar el estado de procesamiento cuando una operación termina
  onOperationCompleted(visitorId: string): void {
    console.log('Operation completed for visitor:', visitorId);
    this.visitorsListComponent?.markAsCompleted(visitorId);
  }

  onTakePendingChat(chatId: string): void {
    console.log('Taking pending chat:', chatId);

    // NO activar loading - operación silenciosa
    // this.updateState({ loading: true });

    // Primero obtener el usuario actual de la sesión
    this.sessionService.ensureSession$().pipe(
      switchMap(user => {
        if (!user?.sub) {
          throw new Error('No se pudo obtener el ID del usuario actual');
        }

        console.log('Assigning chat', chatId, 'to user', user.sub);

        // Usar el método del servicio para asignar el chat al comercial actual
        return this.visitorsService.assignChatToCommercial(chatId, user.sub);
      }),
      catchError((error: Error) => {
        console.error('Error al tomar el chat:', error);
        this.updateState({
          error: 'Error al tomar el chat. Inténtalo de nuevo.'
        });
        return of(null);
      })
    ).subscribe((response: { success: boolean; assignedAt: string } | null) => {
      if (response?.success) {
        console.log('Chat asignado exitosamente:', response);

        // Cerrar el modal
        this.closePendingChatsModal();

        // Mostrar mensaje de éxito (opcional)
        // this.updateState({ successMessage: 'Chat asignado exitosamente' });

        // Refrescar la lista de visitantes SIN loading
        this.refreshVisitorsSilently();

        // Opcionalmente, navegar al chat asignado
        // this.router.navigate(['/chat', chatId]);
      }
    });
  }

  onTransferPendingChat(data: {chatId: string, targetUserId: string}): void {
    console.log('Transferring pending chat:', data.chatId, 'to user:', data.targetUserId);

    // NO activar loading - operación silenciosa
    // this.updateState({ loading: true });

    this.visitorsService.assignChatToCommercial(data.chatId, data.targetUserId)
      .pipe(
        catchError((error: Error) => {
          console.error('Error al transferir el chat:', error);
          this.updateState({
            error: 'Error al transferir el chat. Inténtalo de nuevo.'
          });
          return of(null);
        })
      )
      .subscribe((response: { success: boolean; assignedAt: string } | null) => {
        if (response?.success) {
          console.log('Chat transferido exitosamente:', response);

          // Cerrar el modal
          this.closePendingChatsModal();

          // Refrescar la lista de visitantes SIN loading
          this.refreshVisitorsSilently();
        }
      });
  }
}
