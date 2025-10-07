import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'lib-visitors-simple',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="visitors-simple">
      <h1>👥 Visitantes - Versión Simplificada</h1>
      
      <div class="debug-section">
        <h2>🐛 Información de Debug</h2>
        <div class="debug-info">
          <p><strong>Ruta actual:</strong> {{ currentRoute }}</p>
          <p><strong>Query Parameters:</strong> {{ queryParams }}</p>
          <p><strong>Filtro seleccionado:</strong> {{ selectedFilter() }}</p>
          <p><strong>Estado de carga:</strong> {{ loading() ? 'Cargando...' : 'Completado' }}</p>
          <p><strong>Error:</strong> {{ error() || 'Ninguno' }}</p>
        </div>
      </div>

      <div class="filters-section">
        <h2>🎯 Filtros Disponibles</h2>
        <div class="filter-buttons">
          <button 
            *ngFor="let filter of availableFilters" 
            [class.active]="selectedFilter() === filter.id"
            (click)="setFilter(filter.id)"
            class="filter-btn">
            {{ filter.icon }} {{ filter.label }}
          </button>
        </div>
      </div>

      <div class="content-section">
        <div *ngIf="loading()" class="loading">
          <p>⏳ Cargando visitantes...</p>
        </div>

        <div *ngIf="error()" class="error">
          <p>❌ Error: {{ error() }}</p>
          <button (click)="retry()" class="retry-btn">🔄 Reintentar</button>
        </div>

        <div *ngIf="!loading() && !error()" class="success">
          <h2>✅ Componente funcionando correctamente</h2>
          <p>El filtro <strong>{{ getFilterName(selectedFilter()) }}</strong> se aplicó sin errores.</p>
          
          <div class="mock-visitors">
            <h3>Visitantes simulados para: {{ getFilterName(selectedFilter()) }}</h3>
            <div class="visitor-item" *ngFor="let visitor of getMockVisitors()">
              <span class="visitor-name">{{ visitor.name }}</span>
              <span class="visitor-status">{{ visitor.status }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="next-steps">
        <h2>📋 Próximos Pasos</h2>
        <p>Si esta versión funciona correctamente, el problema está en:</p>
        <ul>
          <li>🔄 Complejidad de los signals reactivos</li>
          <li>🌐 Llamadas HTTP a servicios</li>
          <li>⚙️ Lógica de manejo de estado compleja</li>
          <li>🎨 Dependencias de componentes UI</li>
        </ul>
      </div>
    </div>
  `,
  styles: [`
    .visitors-simple {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
      font-family: system-ui, -apple-system, sans-serif;
    }

    h1, h2, h3 {
      color: #374151;
      margin-bottom: 15px;
    }

    .debug-section, .filters-section, .content-section, .next-steps {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
    }

    .debug-info p {
      margin: 8px 0;
      font-family: monospace;
      background: white;
      padding: 8px;
      border-radius: 4px;
      border: 1px solid #d1d5db;
    }

    .filter-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 10px;
    }

    .filter-btn {
      background: #6b7280;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      transition: background 0.2s;
    }

    .filter-btn:hover {
      background: #4b5563;
    }

    .filter-btn.active {
      background: #2563eb;
    }

    .loading {
      text-align: center;
      padding: 40px;
      background: #fef3c7;
      border-radius: 6px;
    }

    .error {
      text-align: center;
      padding: 40px;
      background: #fecaca;
      border-radius: 6px;
    }

    .success {
      background: #dcfce7;
      border-radius: 6px;
      padding: 20px;
    }

    .retry-btn {
      background: #dc2626;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      margin-top: 10px;
    }

    .mock-visitors {
      margin-top: 20px;
    }

    .visitor-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px;
      margin: 8px 0;
      background: white;
      border: 1px solid #d1d5db;
      border-radius: 6px;
    }

    .visitor-name {
      font-weight: 500;
    }

    .visitor-status {
      font-size: 12px;
      padding: 4px 8px;
      background: #f3f4f6;
      border-radius: 4px;
    }

    ul {
      margin-left: 20px;
    }

    li {
      margin: 5px 0;
    }

    strong {
      color: #1f2937;
    }
  `]
})
export class VisitorsSimpleComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  // Estado simplificado con signals
  readonly selectedFilter = signal<string>('unassigned');
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  // Filtros disponibles
  readonly availableFilters = [
    { id: 'unassigned', label: 'No asignados', icon: '⚪' },
    { id: 'mine', label: 'Míos', icon: '👤' },
    { id: 'all', label: 'Todos', icon: '📊' },
    { id: 'queue', label: 'En cola', icon: '⏳' },
    { id: 'online', label: 'En línea', icon: '🟢' }
  ];

  currentRoute = '';
  queryParams = '';

  ngOnInit(): void {
    this.updateRouteInfo();
    
    // Escuchar cambios en query parameters
    this.route.queryParams.subscribe(params => {
      console.log('🎯 Query params recibidos:', params);
      
      if (params['filter']) {
        this.selectedFilter.set(params['filter']);
        console.log('✅ Filtro establecido:', params['filter']);
      }
      
      this.updateRouteInfo();
      this.loadData();
    });
  }

  setFilter(filterId: string): void {
    console.log('🎯 Cambiando filtro a:', filterId);
    this.selectedFilter.set(filterId);
    
    // Navegar con el nuevo filtro
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { filter: filterId },
      queryParamsHandling: 'merge'
    });
  }

  loadData(): void {
    console.log('📊 Cargando datos para filtro:', this.selectedFilter());
    
    this.loading.set(true);
    this.error.set(null);

    // Simular carga de datos
    setTimeout(() => {
      try {
        // Simular posibles errores
        if (this.selectedFilter() === 'error-test') {
          throw new Error('Error simulado para pruebas');
        }

        console.log('✅ Datos cargados exitosamente');
        this.loading.set(false);
      } catch (err) {
        console.error('❌ Error cargando datos:', err);
        this.error.set(err instanceof Error ? err.message : 'Error desconocido');
        this.loading.set(false);
      }
    }, 1000);
  }

  retry(): void {
    console.log('🔄 Reintentando carga de datos...');
    this.loadData();
  }

  getFilterName(filterId: string): string {
    const filter = this.availableFilters.find(f => f.id === filterId);
    return filter ? filter.label : filterId;
  }

  getMockVisitors() {
    const visitors = [
      { name: 'Ana García', status: 'online' },
      { name: 'Carlos López', status: 'idle' },
      { name: 'María Rodríguez', status: 'online' }
    ];

    // Filtrar según el filtro seleccionado
    switch (this.selectedFilter()) {
      case 'online':
        return visitors.filter(v => v.status === 'online');
      case 'mine':
        return visitors.slice(0, 1);
      case 'queue':
        return visitors.slice(1, 2);
      default:
        return visitors;
    }
  }

  private updateRouteInfo(): void {
    this.currentRoute = window.location.pathname;
    this.queryParams = window.location.search || '(ninguno)';
  }
}