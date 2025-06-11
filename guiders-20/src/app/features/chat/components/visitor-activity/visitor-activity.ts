import { Component, signal, computed, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, httpResource } from '@angular/common/http';
import { environment } from 'src/environments/environment';

/**
 * Interface para la respuesta de la API del visitante
 */
export interface VisitorData {
  id: string;
  name: string;
  email: string;
  phone: string;
  tags: string[];
  notes: string;
  currentPage: string;
  referrer?: string;
  timeOnPage?: string;
  visitedPages?: VisitedPage[];
  device?: string;
  location?: string;
}

export interface VisitedPage {
  title: string;
  time: string;
  url: string;
}

/**
 * Componente para mostrar la actividad del visitante usando httpResource
 */
@Component({
  selector: 'app-visitor-activity',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (visitorResource.value(); as visitor) {
      <div class="tracking-info-panel show">
        <div class="tracking-info-header">
          <h4>Actividad del Visitante</h4>
          <button class="gh-button gh-button--icon close-visitor-btn" (click)="onClose()">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
              <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734L9.06 8l3.22 3.22a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L8 9.06l-3.22 3.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z">
              </path>
            </svg>
          </button>
        </div>
        
        <div class="tracking-info-content">
          <!-- Información básica del visitante -->
          <div class="tracking-info-item">
            <strong>Nombre:</strong>
            <span>{{ visitor.name || 'Visitante anónimo' }}</span>
          </div>
          @if (visitor.email) {
            <div class="tracking-info-item">
              <strong>Email:</strong>
              <span>{{ visitor.email }}</span>
            </div>
          }
          @if (visitor.phone) {
            <div class="tracking-info-item">
              <strong>Teléfono:</strong>
              <span>{{ visitor.phone }}</span>
            </div>
          }
          @if (visitor.tags && visitor.tags.length > 0) {
            <div class="tracking-info-item">
              <strong>Tags:</strong>
              <div class="visitor-tags">
                @for (tag of visitor.tags; track tag) {
                  <span class="visitor-tag">{{ tag }}</span>
                }
              </div>
            </div>
          }
          @if (visitor.notes) {
            <div class="tracking-info-item">
              <strong>Notas:</strong>
              <span>{{ visitor.notes }}</span>
            </div>
          }

          <!-- Actividad de navegación -->
          <div class="tracking-info-item">
            <strong>Página actual:</strong>
            <span>{{ visitor.currentPage || 'No disponible' }}</span>
          </div>
          @if (visitor.referrer) {
            <div class="tracking-info-item">
              <strong>Referencia:</strong>
              <span>{{ visitor.referrer }}</span>
            </div>
          }
          @if (visitor.timeOnPage) {
            <div class="tracking-info-item">
              <strong>Tiempo en página:</strong>
              <span>{{ visitor.timeOnPage }}</span>
            </div>
          }
          
          @if (visitor.visitedPages && visitor.visitedPages.length > 0) {
            <div class="tracking-info-item">
              <strong>Páginas visitadas:</strong>
              <ul class="tracking-pages-list">
                @for (page of visitor.visitedPages; track page.url) {
                  <li>
                    <span class="page-title">{{ page.title }}</span>
                    <span class="page-time">{{ page.time }}</span>
                  </li>
                }
              </ul>
            </div>
          }

          <!-- Información técnica -->
          @if (visitor.device) {
            <div class="tracking-info-item">
              <strong>Dispositivo:</strong>
              <span>{{ visitor.device }}</span>
            </div>
          }
          @if (visitor.location) {
            <div class="tracking-info-item">
              <strong>Localización:</strong>
              <span>{{ visitor.location }}</span>
            </div>
          }
        </div>
      </div>
    } @else if (visitorResource.isLoading()) {
      <div class="tracking-info-panel show">
        <div class="tracking-info-header">
          <h4>Actividad del Visitante</h4>
          <button class="gh-button gh-button--icon close-visitor-btn" (click)="onClose()">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
              <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734L9.06 8l3.22 3.22a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L8 9.06l-3.22 3.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z">
              </path>
            </svg>
          </button>
        </div>
        <div class="tracking-info-content">
          <div class="loading-state">
            <p>Cargando información del visitante...</p>
          </div>
        </div>
      </div>
    } @else if (visitorResource.error()) {
      <div class="tracking-info-panel show">
        <div class="tracking-info-header">
          <h4>Actividad del Visitante</h4>
          <button class="gh-button gh-button--icon close-visitor-btn" (click)="onClose()">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
              <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734L9.06 8l3.22 3.22a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L8 9.06l-3.22 3.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z">
              </path>
            </svg>
          </button>
        </div>
        <div class="tracking-info-content">
          <div class="error-state">
            <p>Error al cargar información del visitante</p>
            <button 
              class="gh-button gh-button--accent retry-button" 
              (click)="retryLoad()">
              Reintentar
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styleUrl: './visitor-activity.scss'
})
export class VisitorActivityComponent {
  private http = inject(HttpClient);

  // Input para el ID del visitante
  visitorId = input.required<string>();

  // Output event para cerrar el panel
  closeRequested = output<void>();

  // httpResource para cargar datos del visitante
  visitorResource = httpResource<VisitorData>(() => {
    const id = this.visitorId();
    if (!id) return undefined;
    
    console.log('🔍 [VisitorActivity] Configurando httpResource para visitante:', id);
    return {
      url: `${environment.apiUrl}/visitor/${id}`,
      method: 'GET'
    };
  });

  /**
   * Emite evento para cerrar el panel
   */
  onClose(): void {
    this.closeRequested.emit();
  }

  /**
   * Reintenta cargar los datos del visitante
   */
  retryLoad(): void {
    console.log('🔄 [VisitorActivity] Reintentando carga de datos del visitante');
    this.visitorResource.reload();
  }
}
