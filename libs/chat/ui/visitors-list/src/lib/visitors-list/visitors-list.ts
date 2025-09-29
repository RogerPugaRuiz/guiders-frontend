import { Component, input, output, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  Visitor, 
  VisitorFilters, 
  VisitorSort,
  CreateChatWithVisitorRequest 
} from '@guiders-frontend/shared/types';
import { ButtonPrimaryComponent } from '@guiders-frontend/button-primary';
import { ButtonTertiaryComponent } from '@guiders-frontend/button-tertiary';

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
  imports: [CommonModule, ButtonPrimaryComponent, ButtonTertiaryComponent],
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

  // Internal state
  readonly searchQuery = signal<string>('');
  readonly currentFilters = signal<VisitorFilters>({});
  readonly currentSort = signal<VisitorSort>({ field: 'lastVisit', direction: 'desc' });
  readonly internalSelectedIds = signal<Set<string>>(new Set());
  readonly showDropdown = signal<string | null>(null);

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
    
    const request: CreateChatWithVisitorRequest = {
      visitorId: visitor.id,
      visitorInfo: {
        name: visitor.name,
        email: visitor.email,
        phone: visitor.phone
      },
      metadata: {
        source: 'proactive_chat',
        priority: 'MEDIUM'
      }
    };
    
    this.createChat.emit(request);
  }

  onViewDetails(visitor: Visitor): void {
    // Emit an event for viewing visitor details
    // This could navigate to a detail page or open a modal
    console.log('View details for visitor:', visitor.id);
  }

  onViewChat(visitor: Visitor, event: Event): void {
    event.stopPropagation();
    console.log('View chat for visitor:', visitor.id);
    // Navigate to active chat or emit event
  }

  onViewHistory(visitor: Visitor): void {
    console.log('View history for visitor:', visitor.id);
    // Open history modal or navigate to history page
  }

  onAddTag(visitor: Visitor): void {
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

  onRemoveVisitor(visitor: Visitor): void {
    console.log('Remove visitor:', visitor.id);
    this.closeDropdown();
    // Implement visitor removal logic
  }

  toggleDropdown(visitorId: string, event: Event): void {
    event.stopPropagation();
    this.showDropdown.set(this.showDropdown() === visitorId ? null : visitorId);
  }

  closeDropdown(): void {
    this.showDropdown.set(null);
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
