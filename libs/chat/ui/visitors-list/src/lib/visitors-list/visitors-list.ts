import { Component, input, output, computed, signal, HostListener, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ChatWidgetService } from '@guiders-frontend/chat/data-access/chat-widget-service';
import { 
  Visitor, 
  VisitorFilters, 
  VisitorSort,
  CreateChatWithVisitorRequest 
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
  private readonly snackBar = inject(MatSnackBar);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly chatWidgetService = inject(ChatWidgetService);

  // Internal state
  readonly searchQuery = signal<string>('');
  readonly currentFilters = signal<VisitorFilters>({});
  readonly currentSort = signal<VisitorSort>({ field: 'lastVisit', direction: 'desc' });
  readonly internalSelectedIds = signal<Set<string>>(new Set());
  readonly showDropdown = signal<string | null>(null);
  // Track visitors with pending operations (for optimistic UI)
  readonly processingVisitorIds = signal<Set<string>>(new Set());

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
    { field: 'totalChats', label: 'Total de chats' }
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
    
    console.log('[VisitorsList] Abriendo widget para crear chat con visitante:', visitor.id);
    
    // Solo abrir el widget de chat, NO emitir evento (para evitar que se abra el modal)
    this.chatWidgetService.openWidget(visitor);
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
    
    // Si el visitante tiene un chat activo, abrir el widget con ese chat
    // Nota: Necesitarías obtener el chatId del visitante si está disponible
    // Por ahora, simplemente abrimos el widget con el visitante
    this.chatWidgetService.openWidget(visitor);
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
      this.snackBar.open('No hay chats pendientes para este visitante', 'Cerrar', { duration: 3000 });
      // this.closeDropdown();
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

}
