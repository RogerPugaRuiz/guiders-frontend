import { Component } from '@angular/core';
import { LoaderComponent } from './core/components/loader/loader.component';

@Component({
  selector: 'app-loader-demo',
  standalone: true,
  imports: [LoaderComponent],
  template: `
    <div class="demo-container">
      <h1>🎯 Loader Demo - Fase Doble</h1>
      <p>Aquí puedes ver el nuevo loader con transición automática entre círculos y píldoras:</p>
      
      <div class="demo-section">
        <h3>🔄 Loader con Transición Automática</h3>
        <p class="description">
          Este loader inicia con <strong>círculos azules</strong> que rotan y cambian de color.
          Después de 3 segundos, para la rotación y se ejecuta una <strong>animación de expansión</strong> 
          que transforma los círculos en <strong>píldoras rosas</strong>.
        </p>
        <div class="loader-container">
          <app-loader 
            message="Observa la transición..." 
            [fullscreen]="false" />
        </div>
      </div>
      
      <div class="demo-section">
        <h3>⚡ Características del Loader</h3>
        <ul class="features-list">
          <li><strong>Fase 1:</strong> Círculos giratorios con cambio de colores (azul → violeta → rosa → cian)</li>
          <li><strong>Transición:</strong> Animación de expansión con efecto scale y cambio de forma</li>
          <li><strong>Fase 2:</strong> Píldoras estáticas con efecto glow pulsante</li>
          <li><strong>Ciclo automático:</strong> El loader alterna entre las dos fases cada 3 segundos</li>
          <li><strong>Responsive:</strong> Se adapta automáticamente a diferentes tamaños de pantalla</li>
          <li><strong>Accesible:</strong> Respeta las preferencias de movimiento reducido</li>
        </ul>
      </div>
      
      <div class="demo-section">
        <h3>🎨 Loader sin mensaje</h3>
        <div class="loader-container">
          <app-loader 
            message="" 
            [fullscreen]="false" />
        </div>
      </div>
      
      <div class="demo-section">
        <h3>📱 Vista previa del loader de pantalla completa</h3>
        <button (click)="showFullscreenLoader()" class="demo-button">
          Mostrar Loader Pantalla Completa
        </button>
        <p class="small-text">Se ocultará automáticamente después de 6 segundos para ver ambas fases</p>
      </div>
    </div>
    
    @if (showFullscreen) {
      <app-loader 
        message="Cargando aplicación..." 
        [fullscreen]="true" />
    }
  `,
  styles: [`
    .demo-container {
      padding: 2rem;
      max-width: 900px;
      margin: 0 auto;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    
    .demo-section {
      margin: 2rem 0;
      padding: 2rem;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      background: linear-gradient(135deg, #f9fafb 0%, #ffffff 100%);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    
    .demo-section h3 {
      margin-top: 0;
      color: #1f2937;
      font-size: 1.25rem;
      font-weight: 600;
    }
    
    .description {
      color: #4b5563;
      line-height: 1.6;
      margin-bottom: 1.5rem;
    }
    
    .features-list {
      color: #374151;
      line-height: 1.6;
      padding-left: 1.2rem;
    }
    
    .features-list li {
      margin-bottom: 0.5rem;
    }
    
    .features-list strong {
      color: #1f2937;
    }
    
    .loader-container {
      display: flex;
      justify-content: center;
      padding: 2rem;
      background: rgba(243, 244, 246, 0.5);
      border-radius: 8px;
      min-height: 120px;
      align-items: center;
    }
    
    .demo-button {
      background: linear-gradient(45deg, #3b82f6, #ec4899);
      color: white;
      border: none;
      padding: 0.875rem 2rem;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      font-size: 1rem;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    
    .demo-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
    }
    
    .demo-button:active {
      transform: translateY(0);
    }
    
    .small-text {
      font-size: 0.875rem;
      color: #6b7280;
      margin-top: 0.5rem;
      font-style: italic;
    }
    
    h1 {
      text-align: center;
      color: #1f2937;
      margin-bottom: 1rem;
      font-size: 2rem;
      font-weight: 700;
      background: linear-gradient(45deg, #3b82f6, #ec4899);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    p {
      text-align: center;
      color: #6b7280;
      margin-bottom: 2rem;
      line-height: 1.6;
    }
    
    @media (max-width: 768px) {
      .demo-container {
        padding: 1rem;
      }
      
      .demo-section {
        padding: 1.5rem;
      }
      
      h1 {
        font-size: 1.5rem;
      }
    }
  `]
})
export class LoaderDemoComponent {
  showFullscreen = false;
  
  showFullscreenLoader() {
    this.showFullscreen = true;
    
    // Ocultar después de 6 segundos para ver ambas fases
    setTimeout(() => {
      this.showFullscreen = false;
    }, 6000);
  }
}
