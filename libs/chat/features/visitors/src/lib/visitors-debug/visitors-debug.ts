import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { VisitorsDataService } from '@guiders-frontend/visitors-data-service';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'lib-visitors-debug',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="visitors-debug">
      <h1>🔧 Visitantes Debug - Sin Dependencias UI</h1>
      
      <div class="status-panel">
        <div class="status-item">
          <strong>Estado:</strong> {{ currentStatus }}
        </div>
        <div class="status-item">
          <strong>Filtro:</strong> {{ currentFilter }}
        </div>
        <div class="status-item">
          <strong>Query Params:</strong> {{ queryParamsDebug }}
        </div>
        <div class="status-item">
          <strong>Servicio cargado:</strong> {{ serviceStatus }}
        </div>
      </div>

      <div class="actions-panel">
        <h3>Pruebas de Filtro</h3>
        <button 
          *ngFor="let filter of testFilters" 
          (click)="testFilter(filter.id)"
          [class.active]="currentFilter === filter.id"
          class="test-btn">
          {{ filter.icon }} {{ filter.label }}
        </button>
      </div>

      <div class="results-panel">
        <h3>Resultados del Servicio</h3>
        
        <div *ngIf="loading" class="loading-state">
          ⏳ Cargando datos del servicio...
        </div>

        <div *ngIf="error" class="error-state">
          ❌ Error: {{ error }}
          <br>
          <small>Esto indica que el servicio HTTP está fallando</small>
        </div>

        <div *ngIf="visitors.length > 0" class="success-state">
          ✅ Servicio funcionando - {{ visitors.length }} visitantes cargados
          
          <div class="visitor-list">
            <div *ngFor="let visitor of visitors" class="visitor-debug">
              <strong>{{ visitor.name || 'Sin nombre' }}</strong>
              <span>{{ visitor.status }}</span>
              <span>{{ visitor.email || 'Sin email' }}</span>
            </div>
          </div>
        </div>

        <div *ngIf="!loading && !error && visitors.length === 0" class="empty-state">
          ⚪ Sin visitantes (servicio responde vacío)
        </div>
      </div>

      <div class="debug-logs">
        <h3>Log de Debug</h3>
        <div class="log-container">
          <div *ngFor="let log of debugLogs" class="log-item">
            {{ log.timestamp }} - {{ log.message }}
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .visitors-debug {
      padding: 20px;
      font-family: system-ui, sans-serif;
      max-width: 1000px;
      margin: 0 auto;
    }

    .status-panel, .actions-panel, .results-panel, .debug-logs {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 15px;
      margin-bottom: 20px;
    }

    .status-item {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #e5e7eb;
    }

    .test-btn {
      background: #6b7280;
      color: white;
      border: none;
      padding: 8px 16px;
      margin: 5px;
      border-radius: 4px;
      cursor: pointer;
    }

    .test-btn:hover {
      background: #4b5563;
    }

    .test-btn.active {
      background: #2563eb;
    }

    .loading-state {
      background: #fef3c7;
      padding: 15px;
      border-radius: 4px;
      text-align: center;
    }

    .error-state {
      background: #fecaca;
      padding: 15px;
      border-radius: 4px;
      color: #991b1b;
    }

    .success-state {
      background: #dcfce7;
      padding: 15px;
      border-radius: 4px;
      color: #166534;
    }

    .empty-state {
      background: #f3f4f6;
      padding: 15px;
      border-radius: 4px;
      text-align: center;
    }

    .visitor-debug {
      display: flex;
      justify-content: space-between;
      padding: 8px;
      margin: 4px 0;
      background: white;
      border-radius: 4px;
      border: 1px solid #d1d5db;
    }

    .log-container {
      max-height: 200px;
      overflow-y: auto;
      background: white;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      padding: 10px;
    }

    .log-item {
      font-family: monospace;
      font-size: 12px;
      padding: 2px 0;
      border-bottom: 1px solid #f3f4f6;
    }

    h1, h3 {
      color: #374151;
      margin-bottom: 15px;
    }
  `]
})
export class VisitorsDebugComponent implements OnInit {
  private readonly visitorsService = inject(VisitorsDataService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  // Estado simple
  currentStatus = 'Inicializando...';
  currentFilter = 'unassigned';
  queryParamsDebug = '';
  serviceStatus = 'Verificando...';
  loading = false;
  error = '';
  visitors: Array<{id: string; name?: string; email?: string; status: string}> = [];
  debugLogs: Array<{timestamp: string, message: string}> = [];

  testFilters = [
    { id: 'unassigned', label: 'No asignados', icon: '⚪' },
    { id: 'mine', label: 'Míos', icon: '👤' },
    { id: 'all', label: 'Todos', icon: '📊' },
    { id: 'queue', label: 'En cola', icon: '⏳' }
  ];

  ngOnInit(): void {
    this.addLog('Componente inicializado');
    
    // Verificar si el servicio está disponible
    try {
      if (this.visitorsService) {
        this.serviceStatus = 'Disponible ✅';
        this.addLog('Servicio VisitorsDataService cargado correctamente');
      } else {
        this.serviceStatus = 'No disponible ❌';
        this.addLog('ERROR: Servicio VisitorsDataService no disponible');
      }
    } catch (err) {
      this.serviceStatus = 'Error al cargar ❌';
      this.addLog('ERROR al verificar servicio: ' + err);
    }

    // Escuchar query parameters
    this.route.queryParams.subscribe(params => {
      this.queryParamsDebug = JSON.stringify(params);
      this.addLog('Query params recibidos: ' + this.queryParamsDebug);
      
      if (params['filter']) {
        this.currentFilter = params['filter'];
        this.addLog('Filtro establecido: ' + this.currentFilter);
        this.loadVisitorsData();
      } else {
        this.addLog('Sin filtro en query params, usando default');
        this.currentFilter = 'unassigned';
        this.loadVisitorsData();
      }
    });

    this.currentStatus = 'Listo para pruebas';
  }

  testFilter(filterId: string): void {
    this.addLog(`Probando filtro: ${filterId}`);
    this.currentFilter = filterId;
    
    // Navegar con el filtro
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { filter: filterId },
      queryParamsHandling: 'merge'
    }).then(success => {
      this.addLog(`Navegación ${success ? 'exitosa' : 'fallida'} para filtro: ${filterId}`);
    });
  }

  loadVisitorsData(): void {
    this.addLog('Iniciando carga de datos del servicio...');
    this.loading = true;
    this.error = '';
    this.visitors = [];

    try {
      const siteId = '550e8400-e29b-41d4-a716-446655440000'; // UUID de prueba
      this.addLog(`Llamando a getVisitors con siteId: ${siteId}`);
      
      this.visitorsService.getVisitors(siteId, { limit: 10, offset: 0 })
        .pipe(
          catchError((err) => {
            this.addLog(`Error en servicio: ${err.message || err}`);
            this.error = err.message || 'Error desconocido en el servicio';
            this.loading = false;
            return of({ visitors: [], total: 0, hasMore: false });
          })
        )
        .subscribe({
          next: (response) => {
            this.addLog(`Respuesta del servicio recibida: ${response.visitors.length} visitantes`);
            this.visitors = response.visitors;
            this.loading = false;
            
            if (response.visitors.length === 0) {
              this.addLog('Servicio respondió con array vacío');
            } else {
              this.addLog('Datos cargados exitosamente');
            }
          },
          error: (err) => {
            this.addLog(`Error en suscripción: ${err.message || err}`);
            this.error = 'Error en la suscripción: ' + (err.message || err);
            this.loading = false;
          }
        });
        
    } catch (err) {
      this.addLog(`Error al llamar servicio: ${err}`);
      this.error = 'Error al llamar al servicio: ' + err;
      this.loading = false;
    }
  }

  private addLog(message: string): void {
    const timestamp = new Date().toLocaleTimeString();
    this.debugLogs.unshift({ timestamp, message });
    console.log(`[VisitorsDebug] ${timestamp} - ${message}`);
    
    // Mantener solo los últimos 20 logs
    if (this.debugLogs.length > 20) {
      this.debugLogs = this.debugLogs.slice(0, 20);
    }
  }
}