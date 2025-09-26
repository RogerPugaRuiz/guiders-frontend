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
  `,
  styles: [`
    .visitors-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .filters-section {
      margin-bottom: 20px;
    }

    .filter-tabs {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }

    .filter-tab {
      background: #f3f4f6;
      border: 1px solid #d1d5db;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .filter-tab:hover {
      background: #e5e7eb;
    }

    .filter-tab.active {
      background: #2563eb;
      color: white;
      border-color: #2563eb;
    }

    .count {
      font-size: 12px;
      opacity: 0.7;
    }

    .search-section {
      margin-bottom: 20px;
    }

    .search-input {
      width: 100%;
      padding: 12px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 16px;
    }

    .stats-section {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 15px;
      margin-bottom: 20px;
    }

    .stat-card {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 15px;
      text-align: center;
    }

    .stat-number {
      display: block;
      font-size: 24px;
      font-weight: bold;
      color: #2563eb;
    }

    .stat-label {
      font-size: 12px;
      color: #6b7280;
    }

    .loading-section, .error-section, .empty-section {
      text-align: center;
      padding: 40px;
      background: #f9fafb;
      border-radius: 6px;
      margin: 20px 0;
    }

    .error-section {
      background: #fef2f2;
      color: #991b1b;
    }

    .retry-btn, .clear-btn {
      background: #2563eb;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      margin-top: 10px;
    }

    .visitors-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 20px;
    }

    .visitor-card {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 16px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .visitor-card:hover {
      border-color: #2563eb;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .visitor-header {
      display: flex;
      align-items: center;
      margin-bottom: 12px;
    }

    .visitor-avatar {
      width: 40px;
      height: 40px;
      background: #2563eb;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      margin-right: 12px;
    }

    .visitor-info {
      flex: 1;
    }

    .visitor-name {
      font-weight: 500;
      margin-bottom: 2px;
    }

    .visitor-email {
      font-size: 14px;
      color: #6b7280;
    }

    .visitor-status {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
    }

    .status-online {
      background: #dcfce7;
      color: #166534;
    }

    .status-idle {
      background: #fef3c7;
      color: #92400e;
    }

    .status-offline {
      background: #f3f4f6;
      color: #374151;
    }

    .visitor-details {
      margin-bottom: 12px;
    }

    .detail-item {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
      font-size: 14px;
    }

    .detail-label {
      color: #6b7280;
    }

    .detail-value {
      font-weight: 500;
    }

    .visitor-actions {
      display: flex;
      gap: 8px;
    }

    .action-btn {
      flex: 1;
      padding: 8px 12px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      transition: background 0.2s;
    }

    .action-btn.primary {
      background: #2563eb;
      color: white;
    }

    .action-btn.primary:hover {
      background: #1d4ed8;
    }

    .action-btn.secondary {
      background: #f3f4f6;
      color: #374151;
    }

    .action-btn.secondary:hover {
      background: #e5e7eb;
    }
  `]
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