import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoaderComponent } from '../../shared/components/loader/loader.component';
import { LoaderService } from '../../core/services/loader.service';

@Component({
  selector: 'app-loader-demo',
  standalone: true,
  imports: [CommonModule, LoaderComponent],
  template: `
    <div class="loader-demo-container">
      <h2>Demostración del Sistema de Loading Guiders</h2>
      
      <!-- Botones de control -->
      <div class="demo-controls">
        <button (click)="showMainLoader()" class="demo-btn primary">
          Mostrar Loader Principal
        </button>
        
        <button (click)="hideMainLoader()" class="demo-btn secondary">
          Ocultar Loader Principal
        </button>
        
        <button (click)="showOverlayLoader()" class="demo-btn">
          Mostrar Loader Overlay
        </button>
        
        <button (click)="simulateDataLoad()" class="demo-btn success">
          Simular Carga de Datos
        </button>
        
        <button (click)="testProgressLoader()" class="demo-btn warning">
          Loader con Progreso
        </button>
      </div>

      <!-- Loader de overlay para operaciones específicas -->
      <app-loader 
        [isVisible]="showOverlay"
        [mainText]="overlayText"
        [subText]="overlaySubText"
        [showProgress]="showProgress"
        [progressValue]="progressValue"
        [transparent]="false"
        [primaryColor]="'#667eea'"
        [secondaryColor]="'#764ba2'">
      </app-loader>

      <!-- Loader transparente para operaciones menores -->
      <app-loader 
        [isVisible]="showTransparentLoader"
        [mainText]="'Guardando cambios...'"
        [transparent]="true"
        [primaryColor]="'#10b981'"
        [secondaryColor]="'#059669'">
      </app-loader>

      <!-- Contenido de ejemplo -->
      <div class="demo-content">
        <div class="card">
          <h3>Estado del Loader</h3>
          <p><strong>Loader Principal:</strong> {{ isMainLoading$ | async ? 'Activo' : 'Inactivo' }}</p>
          <p><strong>Loader Overlay:</strong> {{ showOverlay ? 'Visible' : 'Oculto' }}</p>
          <p><strong>Progreso:</strong> {{ progressValue }}%</p>
        </div>

        <div class="card">
          <h3>Personalización de Textos</h3>
          <div class="input-group">
            <label>Texto Principal:</label>
            <input 
              type="text" 
              [(ngModel)]="customMainText" 
              placeholder="Ingresa texto personalizado">
          </div>
          <div class="input-group">
            <label>Subtexto:</label>
            <input 
              type="text" 
              [(ngModel)]="customSubText" 
              placeholder="Ingresa subtexto">
          </div>
          <button (click)="updateLoaderTexts()" class="demo-btn">
            Actualizar Textos
          </button>
        </div>

        <div class="card">
          <h3>Ejemplos de Uso</h3>
          <div class="code-example">
            <h4>Servicio de Loading:</h4>
            <pre><code>{{ serviceExample }}</code></pre>
          </div>
          
          <div class="code-example">
            <h4>Componente de Loading:</h4>
            <pre><code>{{ componentExample }}</code></pre>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .loader-demo-container {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .demo-controls {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      margin-bottom: 2rem;
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .demo-btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .demo-btn.primary {
      background: #667eea;
      color: white;
    }

    .demo-btn.secondary {
      background: #6c757d;
      color: white;
    }

    .demo-btn.success {
      background: #10b981;
      color: white;
    }

    .demo-btn.warning {
      background: #f59e0b;
      color: white;
    }

    .demo-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .demo-content {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 1.5rem;
    }

    .card {
      background: white;
      padding: 1.5rem;
      border-radius: 12px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      border: 1px solid #e5e7eb;
    }

    .card h3 {
      margin-bottom: 1rem;
      color: #374151;
    }

    .input-group {
      margin-bottom: 1rem;
    }

    .input-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 600;
      color: #4b5563;
    }

    .input-group input {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 0.875rem;
    }

    .code-example {
      margin-bottom: 1.5rem;
    }

    .code-example h4 {
      margin-bottom: 0.5rem;
      color: #4b5563;
      font-size: 0.875rem;
    }

    .code-example pre {
      background: #1f2937;
      color: #e5e7eb;
      padding: 1rem;
      border-radius: 6px;
      overflow-x: auto;
      font-size: 0.75rem;
      line-height: 1.5;
    }

    @media (max-width: 768px) {
      .loader-demo-container {
        padding: 1rem;
      }
      
      .demo-controls {
        flex-direction: column;
      }
      
      .demo-content {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class LoaderDemoComponent {
  showOverlay = false;
  showTransparentLoader = false;
  showProgress = false;
  progressValue = 0;
  
  overlayText = 'Cargando datos...';
  overlaySubText = 'Esto puede tomar unos segundos';
  
  customMainText = '';
  customSubText = '';

  // Estado del loader principal
  isMainLoading$ = this.loaderService.isLoading$;

  // Ejemplos de código para mostrar
  serviceExample = `// Uso del LoaderService
constructor(private loaderService: LoaderService) {}

// Mostrar loader
this.loaderService.showLoader();

// Ocultar loader
this.loaderService.hideLoader();

// Actualizar textos
this.loaderService.updateLoaderText(
  'Procesando...', 
  'Por favor espera'
);

// Observar estado
this.loaderService.isLoading$.subscribe(loading => {
  console.log('Loading:', loading);
});`;

  componentExample = `<!-- Uso del LoaderComponent -->
<app-loader 
  [isVisible]="isLoading"
  [mainText]="'Cargando datos...'"
  [subText]="'Preparando información'"
  [showProgress]="true"
  [progressValue]="progressPercent"
  [primaryColor]="'#667eea'"
  [transparent]="false">
</app-loader>`;

  constructor(private loaderService: LoaderService) {}

  showMainLoader(): void {
    this.loaderService.showLoader();
  }

  hideMainLoader(): void {
    this.loaderService.hideLoader();
  }

  showOverlayLoader(): void {
    this.showOverlay = true;
    this.overlayText = 'Cargando información...';
    this.overlaySubText = 'Conectando con el servidor';
    
    // Ocultar automáticamente después de 3 segundos
    setTimeout(() => {
      this.showOverlay = false;
    }, 3000);
  }

  simulateDataLoad(): void {
    this.showTransparentLoader = true;
    
    // Simular operación async
    setTimeout(() => {
      this.showTransparentLoader = false;
    }, 2000);
  }

  testProgressLoader(): void {
    this.showOverlay = true;
    this.showProgress = true;
    this.progressValue = 0;
    this.overlayText = 'Procesando archivos...';
    this.overlaySubText = 'No cierres esta ventana';

    // Simular progreso
    const interval = setInterval(() => {
      this.progressValue += 10;
      
      if (this.progressValue >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          this.showOverlay = false;
          this.showProgress = false;
          this.progressValue = 0;
        }, 500);
      }
    }, 200);
  }

  updateLoaderTexts(): void {
    if (this.customMainText) {
      this.loaderService.updateLoaderText(
        this.customMainText,
        this.customSubText || undefined
      );
    }
  }
}
