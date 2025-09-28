import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { catchError, of, finalize } from 'rxjs';

import { VisitorsDataService } from '@guiders-frontend/visitors-data-service';
import {
  Visitor,
  GetVisitorsResponse,
  VisitorStats
} from '@guiders-frontend/shared/types';

@Component({
  selector: 'lib-visitors-fixed',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['./visitors-fixed.scss'],
  template: `
    <div class="visitors-container">
      <h1>👥 Visitantes - Versión Funcional</h1>
      
      <!-- Filtros -->
      <div class="filters-section">
        <div class="filter-tabs">
          <button 
            *ngFor="let preset of filterPresets()" 
            [class.active]="selectedFilterId() === preset.id"
            (click)="onFilterPresetChange(preset.id)"
            class="filter-tab">
            {{ preset.icon }} {{ preset.label }}
            <span class="count">({{ preset.count }})</span>
          </button>
        </div>
      </div>

      <!-- Búsqueda -->
      <div class="search-section">
        <input 
          type="text" 
          placeholder="Buscar visitantes..."
          [(ngModel)]="searchQuery"
          (input)="onSearchChange($event)"
          class="search-input">
      </div>

      <!-- Estadísticas -->
      <div *ngIf="stats()" class="stats-section">
        <div class="stat-card">
          <span class="stat-number">{{ stats()?.totalVisitors || 0 }}</span>
          <span class="stat-label">Total</span>
        </div>
        <div class="stat-card">
          <span class="stat-number">{{ stats()?.onlineVisitors || 0 }}</span>
          <span class="stat-label">En línea</span>
        </div>
        <div class="stat-card">
          <span class="stat-number">{{ stats()?.newVisitors || 0 }}</span>
          <span class="stat-label">Nuevos</span>
        </div>
      </div>

      <!-- Estados -->
      <div *ngIf="loading()" class="loading-section">
        <p>⏳ Cargando visitantes...</p>
      </div>

      <div *ngIf="error()" class="error-section">
        <p>❌ Error: {{ error() }}</p>
        <button (click)="loadVisitors()" class="retry-btn">🔄 Reintentar</button>
      </div>

      <!-- Lista de visitantes -->
      <div *ngIf="!loading() && !error() && filteredVisitors().length > 0" class="visitors-section">
        <h2>Visitantes Encontrados ({{ filteredVisitors().length }})</h2>
        
        <div class="visitors-grid">
          <div *ngFor="let visitor of filteredVisitors()" class="visitor-card" 
               (click)="onVisitorClick(visitor)" 
               (keyup.enter)="onVisitorClick(visitor)"
               tabindex="0"
               role="button">
            <div class="visitor-header">
              <div class="visitor-avatar">{{ getVisitorInitials(visitor) }}</div>
              <div class="visitor-info">
                <div class="visitor-name">{{ visitor.name || 'Visitante Anónimo' }}</div>
                <div class="visitor-email">{{ visitor.email || 'Sin email' }}</div>
              </div>
              <div class="visitor-status" [class]="'status-' + visitor.status">
                {{ getStatusLabel(visitor.status) }}
              </div>
            </div>
            
            <div class="visitor-details">
              <div class="detail-item">
                <span class="detail-label">País:</span>
                <span class="detail-value">{{ visitor.country || 'N/A' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Sesiones:</span>
                <span class="detail-value">{{ visitor.totalSessions || 0 }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Chat Activo:</span>
                <span class="detail-value">{{ visitor.hasActiveChat ? 'Sí' : 'No' }}</span>
              </div>
            </div>

            <div class="visitor-actions">
              <button 
                *ngIf="!visitor.hasActiveChat" 
                (click)="startChat(visitor); $event.stopPropagation()"
                class="action-btn primary">
                💬 Iniciar Chat
              </button>
              <button 
                (click)="viewDetails(visitor); $event.stopPropagation()"
                class="action-btn secondary">
                👁️ Ver Detalles
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Estado vacío -->
      <div *ngIf="!loading() && !error() && filteredVisitors().length === 0" class="empty-section">
        <p>🔍 No hay visitantes que coincidan con los criterios de búsqueda</p>
        <button (click)="clearFilters()" class="clear-btn">🗑️ Limpiar filtros</button>
      </div>
    </div>
  `
})
export class VisitorsFixedComponent implements OnInit {
  private readonly visitorsService = inject(VisitorsDataService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  // Estado simplificado
  readonly visitors = signal<Visitor[]>([]);
  readonly stats = signal<VisitorStats | null>(null);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly selectedFilterId = signal<string>('unassigned');

  searchQuery = '';

  // Filtros predefinidos
  readonly filterPresets = signal([
    {
      id: 'unassigned',
      label: 'Sin Asignar',
      icon: '⚪',
      filters: { hasActiveChat: false },
      count: 0
    },
    {
      id: 'mine',
      label: 'Míos',
      icon: '👤',
      filters: { hasActiveChat: true },
      count: 0
    },
    {
      id: 'all',
      label: 'Todos',
      icon: '📊',
      filters: {},
      count: 0
    },
    {
      id: 'queue',
      label: 'En Cola',
      icon: '⏳',
      filters: { hasActiveChat: false, status: ['online'] },
      count: 0
    }
  ]);

  // Computed values
  readonly filteredVisitors = computed(() => {
    let filtered = this.visitors();
    const currentFilter = this.filterPresets().find(f => f.id === this.selectedFilterId());

    if (currentFilter) {
      const filters = currentFilter.filters;
      
      if (filters.hasActiveChat !== undefined) {
        filtered = filtered.filter(v => v.hasActiveChat === filters.hasActiveChat);
      }
      
      if (filters.status) {
        filtered = filtered.filter(v => filters.status?.includes(v.status) ?? false);
      }
    }

    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(v =>
        v.name?.toLowerCase().includes(query) ||
        v.email?.toLowerCase().includes(query) ||
        v.country?.toLowerCase().includes(query)
      );
    }

    return filtered;
  });

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['filter']) {
        this.onFilterPresetChange(params['filter']);
      } else {
        this.loadVisitors();
        this.loadStats();
      }
    });
  }

  onFilterPresetChange(filterId: string): void {
    this.selectedFilterId.set(filterId);
    this.loadVisitors();
    
    // Actualizar URL
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { filter: filterId },
      queryParamsHandling: 'merge'
    });
  }

  onSearchChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchQuery = target?.value || '';
  }

  loadVisitors(): void {
    this.loading.set(true);
    this.error.set(null);

    const siteId = '550e8400-e29b-41d4-a716-446655440000'; // UUID de prueba

    this.visitorsService.getVisitors(siteId, { limit: 50, offset: 0 })
      .pipe(
        catchError((error: Error) => {
          console.error('Error loading visitors:', error);
          this.error.set(error.message || 'Error al cargar visitantes');
          return of({ visitors: [], total: 0, hasMore: false });
        }),
        finalize(() => this.loading.set(false))
      )
      .subscribe((response: GetVisitorsResponse) => {
        this.visitors.set(response.visitors);
        this.updateFilterCounts();
      });
  }

  private loadStats(): void {
    const siteId = '550e8400-e29b-41d4-a716-446655440000'; // UUID de prueba
    this.visitorsService.getVisitorStats(siteId)
      .pipe(
        catchError(() => of(null))
      )
      .subscribe((stats: VisitorStats | null) => {
        if (stats) {
          this.stats.set(stats);
        }
      });
  }

  private updateFilterCounts(): void {
    const visitors = this.visitors();
    const presets = this.filterPresets().map(preset => ({
      ...preset,
      count: this.getFilterCount(visitors, preset.filters)
    }));
    this.filterPresets.set(presets);
  }

  private getFilterCount(visitors: Visitor[], filters: {hasActiveChat?: boolean; status?: string[]}): number {
    let filtered = visitors;
    
    if (filters.hasActiveChat !== undefined) {
      filtered = filtered.filter(v => v.hasActiveChat === filters.hasActiveChat);
    }
    
    if (filters.status) {
      filtered = filtered.filter(v => filters.status?.includes(v.status) ?? false);
    }
    
    return filtered.length;
  }

  onVisitorClick(visitor: Visitor): void {
    console.log('Visitor clicked:', visitor);
  }

  startChat(visitor: Visitor): void {
    console.log('Starting chat with:', visitor);
    alert(`Iniciando chat con ${visitor.name || 'visitante anónimo'}`);
  }

  viewDetails(visitor: Visitor): void {
    console.log('Viewing details for:', visitor);
    alert(`Viendo detalles de ${visitor.name || 'visitante anónimo'}`);
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.onFilterPresetChange('all');
  }

  getVisitorInitials(visitor: Visitor): string {
    if (visitor.name) {
      return visitor.name
        .split(' ')
        .map(word => word[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
    }
    return '??';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'online': 'En línea',
      'idle': 'Inactivo',
      'offline': 'Desconectado'
    };
    return labels[status] || status;
  }
}