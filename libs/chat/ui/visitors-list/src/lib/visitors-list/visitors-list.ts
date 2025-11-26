import { Component, input, output, computed, signal, HostListener, inject, ChangeDetectorRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatWidgetService } from '@guiders-frontend/chat/data-access/chat-widget-service';
import { ChatService } from '@guiders-frontend/chat-service';
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
  imports: [CommonModule],
  templateUrl: './visitors-list.html',
  styleUrls: ['./visitors-list.scss']
})
export class VisitorsListComponent {
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

  // Services
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly chatWidgetService = inject(ChatWidgetService);
  private readonly chatService = inject(ChatService);

  // Internal state
  readonly searchQuery = signal<string>('');
  readonly currentFilters = signal<VisitorFilters>({});
  readonly currentSort = signal<VisitorSort>({ field: 'firstVisit', direction: 'desc' }); // Cambiar a firstVisit (createdAt) por defecto
  readonly internalSelectedIds = signal<Set<string>>(new Set());
  readonly showDropdown = signal<string | null>(null);
  // Track visitors with pending operations (for optimistic UI)
  readonly processingVisitorIds = signal<Set<string>>(new Set());

  constructor() {
    // Sync external sort with internal sort
    effect(() => {
      const external = this.externalSort();
      if (external) {
        // Map API sort fields to table sort fields
        const fieldMap: Record<string, VisitorSort['field']> = {
          'lastActivity': 'lastVisit',
          'createdAt': 'firstVisit',
          'updatedAt': 'lastVisit',
          'lifecycle': 'lifecycle',
          'connectionStatus': 'status'
        };

        const mappedField = fieldMap[external.field] || 'lastVisit';
        const mappedDirection = external.direction.toLowerCase() as 'asc' | 'desc';

        this.currentSort.set({
          field: mappedField,
          direction: mappedDirection
        });
      }
    }, { allowSignalWrites: true });
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

    console.log('[VisitorsList] Verificando chats existentes para visitante:', visitor.id);

    // Verificar primero si el visitante tiene chats asignados al comercial actual
    this.chatService.getVisitorMyChats(visitor.id).subscribe({
      next: (response: { chats: Chat[]; total: number; totalVisitorChats: number; hasMore: boolean; nextCursor?: string | null }) => {
        console.log('[VisitorsList] Respuesta de chats del visitante:', response);

        // Si no hay chats asignados y el visitante no tiene chats en total, crear uno nuevo
        if (response.totalVisitorChats === 0 && response.chats.length === 0) {
          console.log('[VisitorsList] No hay chats existentes, abriendo widget para crear nuevo chat');
          this.chatWidgetService.openWidget(visitor);
        }
        // Si hay chats asignados al comercial actual, abrir el primer chat
        else if (response.chats.length > 0) {
          const firstChat = response.chats[0];
          console.log('[VisitorsList] Chat existente encontrado, abriendo chat:', firstChat.chatId);
          this.chatWidgetService.openWithChat(firstChat.chatId, visitor);
        }
        // Si el visitante tiene chats pero ninguno asignado a este comercial
        else {
          console.log('[VisitorsList] El visitante tiene chats pero ninguno asignado al comercial actual');
        }
      },
      error: (error: unknown) => {
        console.error('[VisitorsList] Error al verificar chats del visitante:', error);
      }
    });
  }

  onViewDetails(visitor: Visitor, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    // Emit an event for viewing visitor details
    // This could navigate to a detail page or open a modal
    console.log('View details for visitor:', visitor.id);
  }

  onViewChat(visitor: Visitor, event: Event): void {
    event.stopPropagation();
    console.log('[VisitorsList] Abriendo widget para ver chat activo del visitante:', visitor.id);

    // Obtener el chat asignado al comercial actual para este visitante
    this.chatService.getVisitorMyChats(visitor.id).subscribe({
      next: (response: { chats: Chat[]; total: number; totalVisitorChats: number; hasMore: boolean; nextCursor?: string | null }) => {
        if (response.chats.length > 0) {
          const firstChat = response.chats[0];
          console.log('[VisitorsList] Abriendo chat existente:', firstChat.chatId);
          this.chatWidgetService.openWithChat(firstChat.chatId, visitor);
        } else {
          console.log('[VisitorsList] No se encontró chat asignado, abriendo widget para crear uno');
          this.chatWidgetService.openWidget(visitor);
        }
      },
      error: (error: unknown) => {
        console.error('[VisitorsList] Error al obtener chat del visitante:', error);
      }
    });
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
    // Create a mock event for compatibility
    const mockEvent = new Event('click');
    this.onCreateChat(visitor, mockEvent);
  }

  onViewChatFromButton(visitor: Visitor): void {
    // Create a mock event for compatibility
    const mockEvent = new Event('click');
    this.onViewChat(visitor, mockEvent);
  }

  onViewPendingChats(visitor: Visitor, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    
    // Verificar si ya está en proceso
    if (this.isProcessing(visitor.id)) {
      console.log('Operation already in progress for visitor:', visitor.id);
      return;
    }
    
    const pendingChatIds = visitor.pendingChatIds || [];

    if (pendingChatIds.length === 0) {
      console.log('[VisitorsList] No hay chats pendientes para este visitante');
      return;
    }

    // Tomar automáticamente el primer chat pendiente
    const firstChatId = pendingChatIds[0];
    
    console.log('Taking first pending chat automatically:', firstChatId, 'for visitor:', visitor.id);
    
    // Marcar como en proceso INMEDIATAMENTE (programación optimista)
    this.markAsProcessing(visitor.id);
    
    this.closeDropdown();

    // Emitir evento para que el componente padre maneje la asignación del chat
    // El padre (visitors.ts) mostrará el SnackBar de éxito/error cuando complete la operación
    this.takePendingChat.emit({
      visitor,
      chatId: firstChatId
    });
  }

  // Helper methods for optimistic UI
  markAsProcessing(visitorId: string): void {
    const processing = new Set(this.processingVisitorIds());
    processing.add(visitorId);
    this.processingVisitorIds.set(processing);
    // Forzar detección de cambios INMEDIATA (síncrona) para deshabilitar el botón
    this.cdr.detectChanges();
  }

  markAsCompleted(visitorId: string): void {
    const processing = new Set(this.processingVisitorIds());
    processing.delete(visitorId);
    this.processingVisitorIds.set(processing);
    // Usar detectChanges() para actualización inmediata de la UI
    this.cdr.detectChanges();
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
      // Parse URL to get pathname
      let pathname = url;

      // Remove protocol and domain if present
      if (url.includes('://')) {
        const urlObj = new URL(url);
        pathname = urlObj.pathname;
      } else if (url.startsWith('/')) {
        pathname = url;
      } else {
        // Just a domain without path
        return ['raíz'];
      }

      // Remove query params and hash
      pathname = pathname.split('?')[0].split('#')[0];

      // Handle root path
      if (pathname === '/' || pathname === '') {
        return ['raíz'];
      }

      // Split into segments and filter empty
      const segments = pathname.split('/').filter(s => s.length > 0);

      if (segments.length === 0) {
        return ['raíz'];
      }

      // Truncate long segments (like UUIDs)
      const truncateSegment = (segment: string): string => {
        if (segment.length > 12) {
          return segment.slice(0, 8) + '...';
        }
        return segment;
      };

      // Return max 3 segments
      if (segments.length <= 3) {
        return segments.map(truncateSegment);
      }

      // More than 3: show first, ..., last
      return [
        truncateSegment(segments[0]),
        '...',
        truncateSegment(segments[segments.length - 1])
      ];
    } catch {
      return ['raíz'];
    }
  }

}
