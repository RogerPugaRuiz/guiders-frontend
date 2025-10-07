import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'lib-navigation-test',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="test-container">
      <h1>🔍 Prueba de Navegación y Rutas</h1>
      
      <div class="status-section">
        <h2>✅ Estado Actual</h2>
        <div class="info-grid">
          <div class="info-item">
            <strong>URL Actual:</strong> {{ currentUrl }}
          </div>
          <div class="info-item">
            <strong>Ruta:</strong> {{ currentRoute }}
          </div>
          <div class="info-item">
            <strong>Query Params:</strong> {{ queryParams }}
          </div>
          <div class="info-item">
            <strong>Timestamp:</strong> {{ timestamp }}
          </div>
        </div>
      </div>

      <div class="test-navigation">
        <h2>🧭 Pruebas de Navegación</h2>
        <p>Utiliza estos botones para probar la navegación entre diferentes vistas:</p>
        
        <div class="nav-buttons">
          <button class="nav-btn primary" (click)="navigateTo('/visitors')">
            👥 Visitantes (Real)
          </button>
          
          <button class="nav-btn secondary" (click)="navigateTo('/visitors-test')">
            🧪 Visitantes (Mock)
          </button>
          
          <button class="nav-btn" (click)="navigateTo('/visitors?filter=unassigned')">
            ⚪ No asignados
          </button>
          
          <button class="nav-btn" (click)="navigateTo('/visitors?filter=queue')">
            ⏳ En cola
          </button>
          
          <button class="nav-btn" (click)="navigateTo('/inbox')">
            📥 Inbox
          </button>
        </div>
      </div>

      <div class="results-section">
        <h2>📊 Resultados de Prueba</h2>
        
        <div class="test-result success">
          <h3>✅ Elementos que funcionan:</h3>
          <ul>
            <li>Lazy loading de rutas</li>
            <li>Componente standalone</li>
            <li>Angular Router</li>
            <li>Navegación programática</li>
          </ul>
        </div>

        <div class="instructions">
          <h3>📝 Instrucciones de Prueba:</h3>
          <ol>
            <li><strong>Paso 1:</strong> Verifica que esta página se carga correctamente</li>
            <li><strong>Paso 2:</strong> Prueba el botón "Visitantes (Mock)" - debería mostrar datos de prueba</li>
            <li><strong>Paso 3:</strong> Prueba el botón "Visitantes (Real)" - aquí está el problema si hay uno</li>
            <li><strong>Paso 4:</strong> Compara las diferencias entre ambas versiones</li>
            <li><strong>Paso 5:</strong> Revisa la consola del navegador para errores</li>
          </ol>
        </div>

        <div class="diagnostics">
          <h3>🔧 Diagnóstico:</h3>
          <p>Si el "Visitantes (Mock)" funciona pero el "Visitantes (Real)" no:</p>
          <ul>
            <li>El problema está en el <strong>componente principal</strong> o <strong>servicios HTTP</strong></li>
            <li>Las rutas y la navegación funcionan correctamente</li>
            <li>Revisar: servicios, llamadas HTTP, manejo de errores</li>
          </ul>
          
          <p>Si ninguna de las dos versiones funciona:</p>
          <ul>
            <li>El problema está en la <strong>configuración de rutas</strong></li>
            <li>Revisar: lazy loading, exports, imports</li>
          </ul>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .test-container {
      padding: 20px;
      max-width: 1000px;
      margin: 0 auto;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
    }

    h1 {
      color: #1f2937;
      margin-bottom: 30px;
      text-align: center;
    }

    h2 {
      color: #374151;
      margin: 25px 0 15px 0;
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 5px;
    }

    h3 {
      color: #4b5563;
      margin: 15px 0 10px 0;
    }

    .status-section, .test-navigation, .results-section {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 25px;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 15px;
      margin-top: 15px;
    }

    .info-item {
      background: white;
      padding: 12px;
      border-radius: 6px;
      border: 1px solid #d1d5db;
    }

    .info-item strong {
      color: #374151;
      display: block;
      margin-bottom: 4px;
    }

    .nav-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-top: 15px;
    }

    .nav-btn {
      background: #6b7280;
      color: white;
      border: none;
      padding: 12px 20px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.2s ease;
      min-width: 150px;
    }

    .nav-btn:hover {
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }

    .nav-btn.primary {
      background: #2563eb;
    }

    .nav-btn.primary:hover {
      background: #1d4ed8;
    }

    .nav-btn.secondary {
      background: #059669;
    }

    .nav-btn.secondary:hover {
      background: #047857;
    }

    .test-result {
      padding: 15px;
      border-radius: 6px;
      margin: 15px 0;
    }

    .test-result.success {
      background: #ecfdf5;
      border: 1px solid #10b981;
    }

    .test-result h3 {
      color: #047857;
      margin-top: 0;
    }

    .instructions, .diagnostics {
      background: #fef3c7;
      border: 1px solid #f59e0b;
      border-radius: 6px;
      padding: 15px;
      margin: 15px 0;
    }

    .instructions h3, .diagnostics h3 {
      color: #92400e;
      margin-top: 0;
    }

    ul, ol {
      margin: 10px 0;
      padding-left: 20px;
    }

    li {
      margin: 5px 0;
      line-height: 1.5;
    }

    strong {
      font-weight: 600;
    }

    p {
      line-height: 1.6;
      color: #374151;
    }
  `]
})
export class NavigationTestComponent {
  private readonly router = inject(Router);
  
  currentUrl = '';
  currentRoute = '';
  queryParams = '';
  timestamp = '';

  constructor() {
    this.updateCurrentInfo();
  }

  navigateTo(route: string) {
    console.log(`🧭 Navegando a: ${route}`);
    this.router.navigateByUrl(route).then(success => {
      console.log(`✅ Navegación ${success ? 'exitosa' : 'fallida'} a: ${route}`);
      setTimeout(() => this.updateCurrentInfo(), 100);
    });
  }

  private updateCurrentInfo() {
    this.currentUrl = window.location.href;
    this.currentRoute = window.location.pathname;
    this.queryParams = window.location.search || '(ninguno)';
    this.timestamp = new Date().toLocaleString();
  }
}