import { Component, input, output, computed, signal, HostListener, effect, ChangeDetectionStrategy, ViewChild, TemplateRef, AfterViewInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Badge } from '@guiders-frontend/badge';
import { DataTable, TableColumn, CellTemplateContext } from '@guiders-frontend/data-table';
import {
  Visitor,
  VisitorFilters,
  VisitorSort,
  CreateChatWithVisitorRequest,
  Chat,
  VisitorSearchSort
} from '@guiders-frontend/shared/types';

export interface VisitorListConfig {
  showSearch: boolean;
  showFilters: boolean;
  showActions: boolean;
  allowMultiSelect: boolean;
  showStats: boolean;
  pageSize: number;
}

@Component({
  selector: 'lib-visitors-list',
  standalone: true,
  imports: [CommonModule, Badge, DataTable],
  templateUrl: './visitors-list.html',
  styleUrls: ['./visitors-list.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VisitorsListComponent implements AfterViewInit {
  // Inputs
  readonly visitors = input<Visitor[]>([]);
  readonly loading = input<boolean>(false);
  readonly error = input<string | null>(null);
  readonly config = input<VisitorListConfig>({
    showSearch: true,
    showFilters: true,
    showActions: true,
    allowMultiSelect: false,
    showStats: true,
    pageSize: 20
  });
  readonly selectedVisitorIds = input<string[]>([]);
  readonly externalSort = input<VisitorSearchSort | null>(null);
  /** Set of visitor IDs that have unread messages (provided by container) */
  readonly unreadVisitorIds = input<Set<string>>(new Set());

  // Outputs
  readonly visitorClick = output<Visitor>();
  readonly visitorSelect = output<Visitor[]>();
  readonly createChat = output<CreateChatWithVisitorRequest>();
  readonly filterChange = output<VisitorFilters>();
  readonly sortChange = output<VisitorSort>();
  readonly searchChange = output<string>();
  readonly viewPendingChats = output<{visitor: Visitor, pendingChatIds: string[]}>();
  readonly takePendingChat = output<{visitor: Visitor, chatId: string}>();
  readonly operationCompleted = output<string>(); // Emite el visitorId cuando la operación termina
  /** Emitted when the user wants to open/create a chat for a visitor */
  readonly openChat = output<Visitor>();
  /** Emitted when the user wants to view an active chat for a visitor */
  readonly openWidget = output<Visitor>();
  /** Emitted when the user wants to view visitor details */
  readonly viewDetails = output<Visitor>();
  /** Emitted to register chat-visitor relationships for unread badges */
  readonly registerVisitorChatsEvent = output<Array<{ chatId: string; visitorId: string }>>();

  // Internal state
  readonly searchQuery = signal<string>('');
  readonly currentFilters = signal<VisitorFilters>({});
  readonly currentSort = signal<VisitorSort>({ field: 'firstVisit', direction: 'desc' }); // Cambiar a firstVisit (createdAt) por defecto
  readonly internalSelectedIds = signal<Set<string>>(new Set());
  readonly showDropdown = signal<string | null>(null);
  readonly dropdownPosition = signal<{ top: number; left: number }>({ top: 0, left: 0 });
  // Track visitors with pending operations (for optimistic UI)
  readonly processingVisitorIds = signal<Set<string>>(new Set());

  // Cell templates (resolved in ngAfterViewInit)
  @ViewChild('visitorTpl') visitorTpl!: TemplateRef<CellTemplateContext<Visitor>>;
  @ViewChild('statusTpl') statusTpl!: TemplateRef<CellTemplateContext<Visitor>>;
  @ViewChild('lifecycleTpl') lifecycleTpl!: TemplateRef<CellTemplateContext<Visitor>>;
  @ViewChild('createdTpl') createdTpl!: TemplateRef<CellTemplateContext<Visitor>>;
  @ViewChild('activityTpl') activityTpl!: TemplateRef<CellTemplateContext<Visitor>>;
  @ViewChild('actionsTpl') actionsTpl!: TemplateRef<CellTemplateContext<Visitor>>;

  cellTemplatesMap = new Map<string, TemplateRef<CellTemplateContext<Visitor>>>();

  private readonly cdr = inject(ChangeDetectorRef);

  /** Column definitions for guiders-data-table */
  readonly tableColumns: TableColumn<Visitor>[] = [
    { field: 'name', label: 'Visitante', sortable: true },
    { field: 'connectionStatus', label: 'Estado de conexión', sortable: true },
    { field: 'lifecycle', label: 'Etapa' },
    { field: 'firstVisit', label: 'Creado', sortable: true },
    { field: 'lastVisit', label: 'Actividad', sortable: true },
    { field: 'actions', label: 'Acciones', hideable: false, sortable: false },
  ];

  ngAfterViewInit(): void {
    this.cellTemplatesMap = new Map([
      ['name', this.visitorTpl],
      ['connectionStatus', this.statusTpl],
      ['lifecycle', this.lifecycleTpl],
      ['firstVisit', this.createdTpl],
      ['lastVisit', this.activityTpl],
      ['actions', this.actionsTpl],
    ]);
    // Notify Angular of the change since we're using OnPush
    this.cdr.markForCheck();
  }

  constructor() {
    // Sync external sort with internal sort
    effect(() => {
      const external = this.externalSort();
      if (external) {
        const fieldMap: Record<string, VisitorSort['field']> = {
          'lastActivity': 'lastVisit',
          'createdAt': 'firstVisit',
          'updatedAt': 'lastVisit',
          'lifecycle': 'lifecycle',
          'connectionStatus': 'status'
        };
        const mappedField = fieldMap[external.field] || 'lastVisit';
        const mappedDirection = external.direction.toLowerCase() as 'asc' | 'desc';
        this.currentSort.set({ field: mappedField, direction: mappedDirection });
      }
    }, { allowSignalWrites: true });

    // Emit chat-visitor relationships for unread badges (container handles registration)
    effect(() => {
      const visitors = this.visitors();
      const chatsToRegister: Array<{ chatId: string; visitorId: string }> = [];
      for (const visitor of visitors) {
        if (visitor.lastChatId) {
          chatsToRegister.push({ chatId: visitor.lastChatId, visitorId: visitor.id });
        }
        if (visitor.pendingChatIds?.length) {
          for (const chatId of visitor.pendingChatIds) {
            chatsToRegister.push({ chatId, visitorId: visitor.id });
          }
        }
      }
      if (chatsToRegister.length > 0) {
        this.registerVisitorChatsEvent.emit(chatsToRegister);
      }
    });
  }

  /**
   * Registra las relaciones chat-visitor en el servicio de mensajes no leídos
   * Esto permite que el badge rojo aparezca en los visitantes con mensajes no leídos
   */
  private registerVisitorChats(_visitors: Visitor[]): void {
    // Delegated to container via registerVisitorChatsEvent output
  }

  // Computed values
  readonly filteredVisitors = computed(() => {
    let filtered = this.visitors();
    const query = this.searchQuery().toLowerCase();
    
    if (query) {
      filtered = filtered.filter(visitor => 
        visitor.name?.toLowerCase().includes(query) ||
        visitor.email?.toLowerCase().includes(query) ||
        visitor.domain.toLowerCase().includes(query)
      );
    }

    return this.sortVisitors(filtered);
  });

  readonly selectedVisitors = computed(() => {
    const selectedIds = this.internalSelectedIds();
    return this.visitors().filter(visitor => selectedIds.has(visitor.id));
  });

  readonly stats = computed(() => {
    const visitors = this.visitors();
    const online = visitors.filter(v => v.status === 'online').length;
    const withActiveChat = visitors.filter(v => v.hasActiveChat).length;
    const newVisitors = visitors.filter(v => v.isNewVisitor).length;
    
    return {
      total: visitors.length,
      online,
      withActiveChat,
      newVisitors
    };
  });

  // Filter options
  readonly filterOptions = {
    status: [
      { value: 'online', label: 'En línea', icon: 'status-online' },
      { value: 'offline', label: 'Fuera de línea', icon: 'status-offline' },
      { value: 'idle', label: 'Inactivo', icon: 'status-idle' }
    ],
    lifecycle: [
      { value: 'ANON', label: 'Anónimo', icon: 'lifecycle-anon' },
      { value: 'ENGAGED', label: 'Interesado', icon: 'lifecycle-engaged' },
      { value: 'LEAD', label: 'Lead', icon: 'lifecycle-lead' },
      { value: 'CONVERTED', label: 'Convertido', icon: 'lifecycle-converted' }
    ]
  };

  readonly sortOptions = [
    { field: 'lastVisit', label: 'Última visita' },
    { field: 'firstVisit', label: 'Primera visita' },
    { field: 'name', label: 'Nombre' },
    { field: 'totalChats', label: 'Total de chats' },
    { field: 'status', label: 'Estado de conexión' }
  ] as const;

  onSearchChange(query: string): void {
    this.searchQuery.set(query);
    this.searchChange.emit(query);
  }

  onVisitorClick(visitor: Visitor): void {
    this.visitorClick.emit(visitor);
  }

  onVisitorSelect(visitor: Visitor, event: Event): void {
    event.stopPropagation();
    
    if (!this.config().allowMultiSelect) {
      return;
    }

    const selected = new Set(this.internalSelectedIds());
    
    if (selected.has(visitor.id)) {
      selected.delete(visitor.id);
    } else {
      selected.add(visitor.id);
    }
    
    this.internalSelectedIds.set(selected);
    this.visitorSelect.emit(this.selectedVisitors());
  }

  onCreateChat(visitor: Visitor, event: Event): void {
    event.stopPropagation();
    this.openChat.emit(visitor);
  }

  /**
   * Registra las relaciones chat-visitor cuando se obtienen los chats del comercial
   */
  private registerChatsForVisitor(_chats: Chat[], _visitorId: string): void {
    // Delegated to container via registerVisitorChatsEvent output
  }

  onViewDetails(visitor: Visitor, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.viewDetails.emit(visitor);
  }

  onViewChat(visitor: Visitor, event: Event): void {
    event.stopPropagation();
    this.openWidget.emit(visitor);
  }

  onViewHistory(visitor: Visitor, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    console.log('View history for visitor:', visitor.id);
    // Open history modal or navigate to history page
  }

  onAddTag(visitor: Visitor, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    console.log('Add tag to visitor:', visitor.id);
    // Open tag modal or inline editor
  }

  onCreateChatFromButton(visitor: Visitor): void {
    this.openChat.emit(visitor);
  }

  onViewChatFromButton(visitor: Visitor): void {
    this.openWidget.emit(visitor);
  }

  onViewPendingChats(visitor: Visitor, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    if (this.isProcessing(visitor.id)) {
      return;
    }

    const pendingChatIds = visitor.pendingChatIds || [];

    if (pendingChatIds.length === 0) {
      return;
    }

    this.closeDropdown();

    if (pendingChatIds.length > 1) {
      // Emit all pending chat ids — container decides how to open them
      this.viewPendingChats.emit({ visitor, pendingChatIds });
    } else {
      this.takeSinglePendingChat(visitor, pendingChatIds[0]);
    }
  }

  /**
   * Toma un único chat pendiente (comportamiento original)
   */
  private takeSinglePendingChat(visitor: Visitor, chatId: string): void {
    console.log('Taking single pending chat:', chatId, 'for visitor:', visitor.id);

    // Marcar como en proceso INMEDIATAMENTE (programación optimista)
    this.markAsProcessing(visitor.id);

    // Emitir evento para que el componente padre maneje la asignación del chat
    // El padre (visitors.ts) mostrará el SnackBar de éxito/error cuando complete la operación
    this.takePendingChat.emit({
      visitor,
      chatId
    });
  }

  // Helper methods for optimistic UI
  markAsProcessing(visitorId: string): void {
    const processing = new Set(this.processingVisitorIds());
    processing.add(visitorId);
    this.processingVisitorIds.set(processing);
  }

  markAsCompleted(visitorId: string): void {
    const processing = new Set(this.processingVisitorIds());
    processing.delete(visitorId);
    this.processingVisitorIds.set(processing);
  }

  isProcessing(visitorId: string): boolean {
    return this.processingVisitorIds().has(visitorId);
  }


  // Método para agregar chats pendientes de prueba a los visitantes (solo para demostración)
  addTestPendingChats(): void {
    // Este método sería llamado en desarrollo para agregar datos de prueba
    // En la implementación real, los pendingChatIds vendrían del backend
    const visitors = this.visitors();
    if (visitors.length > 0) {
      // Agregar chats pendientes a los primeros visitantes para prueba
      visitors[0].pendingChatIds = ['chat-001', 'chat-002'];
      if (visitors[1]) {
        visitors[1].pendingChatIds = ['chat-003'];
      }
      if (visitors[2]) {
        visitors[2].pendingChatIds = ['chat-004', 'chat-005', 'chat-006'];
      }
    }
  }

  onRemoveVisitor(visitor: Visitor): void {
    console.log('Remove visitor:', visitor.id);
    this.closeDropdown();
    // Implement visitor removal logic
  }

  toggleDropdown(visitorId: string, event: Event): void {
    event.stopPropagation();
    event.preventDefault();

    const isCurrentlyOpen = this.showDropdown() === visitorId;

    if (isCurrentlyOpen) {
      this.showDropdown.set(null);
    } else {
      // Calcular posición del dropdown
      const button = event.target as HTMLElement;
      const rect = button.getBoundingClientRect();
      this.dropdownPosition.set({
        top: rect.bottom + 4,
        left: rect.right - 160 // 160 es el min-width del dropdown
      });
      this.showDropdown.set(visitorId);
    }
  }

  closeDropdown(): void {
    this.showDropdown.set(null);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    // Cerrar dropdown cuando se hace click fuera de él
    const target = event.target as HTMLElement;
    const dropdown = target.closest('.dropdown-actions');
    
    // Si el click no fue en el dropdown o su trigger, cerrar
    if (!dropdown && this.showDropdown()) {
      this.closeDropdown();
    }
  }

  onCreateChatFromCard(request: CreateChatWithVisitorRequest): void {
    this.createChat.emit(request);
  }

  onVisitorClickFromCard(visitor: Visitor): void {
    this.visitorClick.emit(visitor);
  }

  handleVisitorSelect(event: { visitor: Visitor; selected: boolean }): void {
    const selected = new Set(this.internalSelectedIds());
    
    if (event.selected) {
      selected.add(event.visitor.id);
    } else {
      selected.delete(event.visitor.id);
    }
    
    this.internalSelectedIds.set(selected);
    this.visitorSelect.emit(this.selectedVisitors());
  }

  onBulkCreateChats(): void {
    const selectedVisitors = this.selectedVisitors();
    // TODO: Implement bulk chat creation logic
    console.log('Creating chats for', selectedVisitors.length, 'visitors');
  }

  onBulkAssignTags(): void {
    const selectedVisitors = this.selectedVisitors();
    // TODO: Implement bulk tag assignment logic
    console.log('Assigning tags to', selectedVisitors.length, 'visitors');
  }

  onDeselectAll(): void {
    this.internalSelectedIds.set(new Set());
    this.visitorSelect.emit([]);
  }

  onFilterChange(filterType: keyof VisitorFilters, values: string[]): void {
    const newFilters = { ...this.currentFilters() };
    
    switch (filterType) {
      case 'status':
        newFilters.status = values as ('online' | 'offline' | 'idle')[];
        break;
      case 'lifecycle':
        newFilters.lifecycle = values as ('ANON' | 'ENGAGED' | 'LEAD' | 'CONVERTED')[];
        break;
    }
    
    this.currentFilters.set(newFilters);
    this.filterChange.emit(newFilters);
  }

  onSortChange(field: string, direction: 'asc' | 'desc'): void {
    const newSort: VisitorSort = { 
      field: field as VisitorSort['field'], 
      direction 
    };
    this.currentSort.set(newSort);
    this.sortChange.emit(newSort);
  }

  toggleSort(field: string): void {
    const currentSort = this.currentSort();
    const sortField = field as VisitorSort['field'];
    
    let newDirection: 'asc' | 'desc' = 'desc';
    
    // Si ya estamos ordenando por este campo, alternar la dirección
    if (currentSort.field === sortField) {
      newDirection = currentSort.direction === 'asc' ? 'desc' : 'asc';
    }
    // Si es un nuevo campo, usar dirección por defecto según el tipo
    else {
      // Para fechas, descendente por defecto (más recientes primero)
      // Para nombre, ascendente por defecto (A-Z)
      newDirection = sortField === 'name' ? 'asc' : 'desc';
    }
    
    this.onSortChange(sortField, newDirection);
  }

  private sortVisitors(visitors: Visitor[]): Visitor[] {
    const sort = this.currentSort();

    return [...visitors].sort((a, b) => {
      let aValue: string | number | Date;
      let bValue: string | number | Date;

      switch (sort.field) {
        case 'lastVisit':
          aValue = a.lastVisit;
          bValue = b.lastVisit;
          break;
        case 'firstVisit':
          aValue = a.firstVisit;
          bValue = b.firstVisit;
          break;
        case 'name':
          aValue = a.name || '';
          bValue = b.name || '';
          break;
        case 'totalChats':
          aValue = a.totalChats;
          bValue = b.totalChats;
          break;
        case 'status': {
          // Convertir status a valores numéricos para ordenar correctamente
          // online = 2, idle = 1, offline = 0
          // desc: online primero (2 > 1 > 0)
          // asc: offline primero (0 > 1 > 2)
          const statusToNumber = (status: string): number => {
            switch (status) {
              case 'online': return 2;
              case 'idle': return 1;
              case 'offline': return 0;
              default: return -1;
            }
          };
          aValue = statusToNumber(a.status);
          bValue = statusToNumber(b.status);
          break;
        }
        default:
          return 0;
      }

      if (aValue < bValue) {
        return sort.direction === 'asc' ? -1 : 1;
      } else if (aValue > bValue) {
        return sort.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  getVisitorStatusIcon(visitor: Visitor): string {
    switch (visitor.status) {
      case 'online': return 'status-online';
      case 'offline': return 'status-offline'; 
      case 'idle': return 'status-idle';
      default: return 'status-offline';
    }
  }

  getLifecycleIcon(lifecycle: string): string {
    switch (lifecycle) {
      case 'ANON': return 'lifecycle-anon';
      case 'ENGAGED': return 'lifecycle-engaged';
      case 'LEAD': return 'lifecycle-lead';
      case 'CONVERTED': return 'lifecycle-converted';
      default: return 'lifecycle-anon';
    }
  }

  formatLastVisit(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins}m`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;

    return new Date(date).toLocaleDateString();
  }

  formatCreatedAt(date: Date): { date: string; time: string } {
    if (!date) return { date: '-', time: '' };
    const d = new Date(date);
    return {
      date: d.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }),
      time: d.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      })
    };
  }

  getInitials(name: string): string {
    if (!name) return '?';
    const names = name.trim().split(' ');
    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase();
    }
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'online': return 'En línea';
      case 'offline': return 'Desconectado'; 
      case 'idle': return 'Inactivo';
      default: return status;
    }
  }

  isSelected(visitorId: string): boolean {
    return this.internalSelectedIds().has(visitorId);
  }

  formatDuration(milliseconds: number | undefined): string {
    if (!milliseconds || milliseconds === 0) return '-';

    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      const remainingHours = hours % 24;
      return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
    }
    if (hours > 0) {
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
    }
    if (minutes > 0) {
      return `${minutes}m`;
    }
    return `${seconds}s`;
  }

  truncateUrl(url: string | undefined, maxLength: number = 40): string {
    if (!url) return '-';

    // Remove protocol for cleaner display
    let cleanUrl = url.replace(/^https?:\/\//, '');

    if (cleanUrl.length <= maxLength) {
      return cleanUrl;
    }

    // Keep start and end, add ellipsis in middle
    const startLength = Math.floor(maxLength * 0.6);
    const endLength = maxLength - startLength - 3; // 3 for "..."

    return `${cleanUrl.slice(0, startLength)}...${cleanUrl.slice(-endLength)}`;
  }

  getUrlSegmentTags(url: string | undefined): string[] {
    if (!url) return ['raíz'];

    try {
      // Parse URL to get all parts
      let domain = '';
      let pathname = url;
      let queryParams = '';

      // Extract domain, pathname and query params
      if (url.includes('://')) {
        const urlObj = new URL(url);
        domain = urlObj.host; // e.g., 'example.com'
        pathname = urlObj.pathname;
        queryParams = urlObj.search; // Includes '?' prefix
      } else if (url.startsWith('/')) {
        const [path, query] = url.split('?');
        pathname = path;
        queryParams = query ? `?${query}` : '';
      } else {
        // Just a domain without protocol
        return [url];
      }

      // Remove hash but keep query params
      pathname = pathname.split('#')[0];

      // Start with domain if available
      const allSegments: string[] = domain ? [domain] : [];

      // Handle root path
      if (pathname === '/' || pathname === '') {
        // If there are query params but no path, show them
        if (queryParams) {
          allSegments.push(queryParams);
        }
        return allSegments.length > 0 ? allSegments : ['raíz'];
      }

      // Split into segments and filter empty
      const pathSegments = pathname.split('/').filter(s => s.length > 0);

      // Truncate long segments (like UUIDs)
      const truncateSegment = (segment: string): string => {
        if (segment.length > 12) {
          return segment.slice(0, 8) + '...';
        }
        return segment;
      };

      // Add path segments with truncation
      allSegments.push(...pathSegments.map(truncateSegment));

      // Add query params as last segment if present
      if (queryParams) {
        allSegments.push(queryParams);
      }

      return allSegments.length > 0 ? allSegments : ['raíz'];
    } catch {
      return ['raíz'];
    }
  }

  /**
   * Handle breadcrumb segment click - opens URL up to that segment in a new tab
   */
  onBreadcrumbSegmentClick(event: Event, segmentIndex: number, url: string | undefined): void {
    event.stopPropagation();

    if (!url) return;

    try {
      // Parse URL to reconstruct path up to clicked segment
      let protocol = 'https';
      let domain = '';
      let pathname = url;
      let queryParams = '';

      // Extract all parts
      if (url.includes('://')) {
        const urlObj = new URL(url);
        protocol = urlObj.protocol.replace(':', '');
        domain = urlObj.host;
        pathname = urlObj.pathname;
        queryParams = urlObj.search;
      } else if (url.startsWith('/')) {
        const [path, query] = url.split('?');
        pathname = path;
        queryParams = query ? `?${query}` : '';
        // No domain available, can't open URL
        return;
      } else {
        return;
      }

      // Get displayed segments
      const displayedSegments = this.getUrlSegmentTags(url);
      const clickedSegment = displayedSegments[segmentIndex];

      // Check if clicked on query params
      const isQueryParamSegment = clickedSegment?.startsWith('?');

      let reconstructedUrl: string;

      if (segmentIndex === 0) {
        // Clicked on domain - open just the domain
        reconstructedUrl = `${protocol}://${domain}`;
      } else if (isQueryParamSegment) {
        // Clicked on query params - include full path + params
        reconstructedUrl = `${protocol}://${domain}${pathname}${queryParams}`;
      } else {
        // Regular path segment
        // Index 0 is domain, so path segments start at index 1
        const pathSegments = pathname.split('/').filter(s => s.length > 0);
        // Calculate how many path segments to include (subtract 1 for domain)
        const pathSegmentsToInclude = pathSegments.slice(0, segmentIndex);

        if (pathSegmentsToInclude.length === 0) {
          reconstructedUrl = `${protocol}://${domain}`;
        } else {
          reconstructedUrl = `${protocol}://${domain}/${pathSegmentsToInclude.join('/')}`;
        }
      }

      // Open in new tab
      window.open(reconstructedUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Failed to open URL:', error);
    }
  }

  /**
   * Verifica si un visitante tiene mensajes no leídos en sus chats asignados
   */
  hasUnreadMessages(visitorId: string): boolean {
    return this.unreadVisitorIds().has(visitorId);
  }

}
