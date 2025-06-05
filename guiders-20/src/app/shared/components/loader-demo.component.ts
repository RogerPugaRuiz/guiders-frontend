import { Component, signal } from '@angular/core';
import { LoaderComponent } from '../../core/components/loader';

@Component({
  selector: 'app-loader-demo',
  standalone: true,
  imports: [LoaderComponent],
  template: `
    <div class="demo-container">
      <h1>Loader Component Demo</h1>
      
      <div class="demo-section">
        <h2>Variante Circle (por defecto)</h2>
        <app-loader 
          message="Cargando datos..." 
          variant="circle" 
          [fullscreen]="false" />
      </div>

      <div class="demo-section">
        <h2>Variante Dots</h2>
        <app-loader 
          message="Procesando solicitud..." 
          variant="dots" 
          [fullscreen]="false" />
      </div>

      <div class="demo-section">
        <h2>Variante Pulse</h2>
        <app-loader 
          message="Conectando..." 
          variant="pulse" 
          [fullscreen]="false" />
      </div>

      <div class="demo-section">
        <h2>Fullscreen (click para probar)</h2>
        <button (click)="toggleFullscreen()" class="demo-button">
          {{ showFullscreen() ? 'Ocultar' : 'Mostrar' }} Loader Fullscreen
        </button>
      </div>

      @if (showFullscreen()) {
        <app-loader 
          message="Cargando aplicación..." 
          variant="pulse" 
          [fullscreen]="true" />
      }
    </div>
  `,
  styles: [`
    .demo-container {
      padding: 2rem;
      max-width: 800px;
      margin: 0 auto;
    }

    .demo-section {
      margin: 2rem 0;
      padding: 1rem;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      background: #f9fafb;
    }

    .demo-section h2 {
      margin-top: 0;
      color: #374151;
      font-size: 1.25rem;
    }

    .demo-button {
      background: #4f46e5;
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 500;
      transition: background 0.2s;
    }

    .demo-button:hover {
      background: #4338ca;
    }

    h1 {
      text-align: center;
      color: #111827;
      margin-bottom: 2rem;
    }
  `]
})
export class LoaderDemoComponent {
  showFullscreen = signal(false);

  toggleFullscreen() {
    this.showFullscreen.update(value => !value);
    
    // Auto-hide after 3 seconds if showing
    if (this.showFullscreen()) {
      setTimeout(() => {
        this.showFullscreen.set(false);
      }, 3000);
    }
  }
}
