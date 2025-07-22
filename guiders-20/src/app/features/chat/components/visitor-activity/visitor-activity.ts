import { Component, signal, computed, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, httpResource } from '@angular/common/http';
import { environment } from 'src/environments/environment';

/**
 * Interface para la respuesta de la API del visitante
 */
export interface VisitorData {
  id: string;
  name: string;
  email: string | null;
  tel: string | null;
  tags: string[];
  notes: string[];
  currentPage: string;
  connectionTime: number;
}

/**
 * Componente para mostrar la actividad del visitante usando httpResource
 */
@Component({
  selector: 'app-visitor-activity',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="tracking-info-panel show">
      <div class="tracking-info-header">
        <h4>Actividad del Visitante</h4>
        <button class="gh-button gh-button--action close" (click)="onClose()">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
            <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734L9.06 8l3.22 3.22a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L8 9.06l-3.22 3.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z">
            </path>
          </svg>
        </button>
      </div>
      
      <div class="tracking-info-content">
        @defer (when visitorResource.value()) {
          @if (visitorResource.value(); as visitor) {
            <!-- Información básica del visitante -->
            <div class="tracking-info-item editable-item">
              <strong>Nombre:</strong>
              @if (isEditingName()) {
                <div class="edit-field">
                  <input 
                    id="nameInput"
                    type="text" 
                    class="edit-input"
                    [(ngModel)]="editingName"
                    (keyup.enter)="saveField('name')"
                    (keyup.escape)="cancelEdit()">
                  <button 
                    class="edit-confirm-btn"
                    (click)="saveField('name')"
                    [disabled]="isSaving()">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
                      <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z">
                      </path>
                    </svg>
                  </button>
                </div>
              } @else {
                <div class="display-field" (click)="startEdit('name', visitor.name)">
                  <span>{{ visitor.name || 'Visitante anónimo' }}</span>
                  <button class="edit-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
                      <path d="M11.013 1.427a1.75 1.75 0 0 1 2.474 0l1.086 1.086a1.75 1.75 0 0 1 0 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 0 1-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61Zm.176 4.823L9.75 4.81l-6.286 6.287a.253.253 0 0 0-.064.108l-.558 1.953 1.953-.558a.253.253 0 0 0 .108-.064Zm1.238-3.763a.25.25 0 0 0-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 0 0 0-.354Z">
                      </path>
                    </svg>
                  </button>
                </div>
              }
            </div>
            
            <div class="tracking-info-item editable-item">
              <strong>Email:</strong>
              @if (isEditingEmail()) {
                <div class="edit-field">
                  <input 
                    id="emailInput"
                    type="email" 
                    class="edit-input"
                    [(ngModel)]="editingEmail"
                    (keyup.enter)="saveField('email')"
                    (keyup.escape)="cancelEdit()"
                    placeholder="ejemplo@correo.com">
                  <button 
                    class="edit-confirm-btn"
                    (click)="saveField('email')"
                    [disabled]="isSaving()">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
                      <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z">
                      </path>
                    </svg>
                  </button>
                </div>
              } @else {
                <div class="display-field" (click)="startEdit('email', visitor.email)">
                  <span>{{ visitor.email || 'Sin email' }}</span>
                  <button class="edit-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
                      <path d="M11.013 1.427a1.75 1.75 0 0 1 2.474 0l1.086 1.086a1.75 1.75 0 0 1 0 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 0 1-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61Zm.176 4.823L9.75 4.81l-6.286 6.287a.253.253 0 0 0-.064.108l-.558 1.953 1.953-.558a.253.253 0 0 0 .108-.064Zm1.238-3.763a.25.25 0 0 0-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 0 0 0-.354Z">
                      </path>
                    </svg>
                  </button>
                </div>
              }
            </div>
            
            <div class="tracking-info-item editable-item">
              <strong>Teléfono:</strong>
              @if (isEditingTel()) {
                <div class="edit-field">
                  <input 
                    id="telInput"
                    type="tel" 
                    class="edit-input"
                    [(ngModel)]="editingTel"
                    (keyup.enter)="saveField('tel')"
                    (keyup.escape)="cancelEdit()"
                    placeholder="+34 123 456 789">
                  <button 
                    class="edit-confirm-btn"
                    (click)="saveField('tel')"
                    [disabled]="isSaving()">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
                      <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z">
                      </path>
                    </svg>
                  </button>
                </div>
              } @else {
                <div class="display-field" (click)="startEdit('tel', visitor.tel)">
                  <span>{{ visitor.tel || 'Sin teléfono' }}</span>
                  <button class="edit-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
                      <path d="M11.013 1.427a1.75 1.75 0 0 1 2.474 0l1.086 1.086a1.75 1.75 0 0 1 0 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 0 1-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61Zm.176 4.823L9.75 4.81l-6.286 6.287a.253.253 0 0 0-.064.108l-.558 1.953 1.953-.558a.253.253 0 0 0 .108-.064Zm1.238-3.763a.25.25 0 0 0-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 0 0 0-.354Z">
                      </path>
                    </svg>
                  </button>
                </div>
              }
            </div>
            
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
            @if (visitor.notes && visitor.notes.length > 0) {
              <div class="tracking-info-item">
                <strong>Notas:</strong>
                <ul class="visitor-notes-list">
                  @for (note of visitor.notes; track note) {
                    <li>{{ note }}</li>
                  }
                </ul>
              </div>
            }

            <!-- Actividad de navegación -->
            <div class="tracking-info-item">
              <strong>Página actual:</strong>
              <span>{{ visitor.currentPage || 'No disponible' }}</span>
            </div>
            <div class="tracking-info-item">
              <strong>Tiempo de conexión:</strong>
              <span>{{ formatConnectionTime(visitor.connectionTime) }}</span>
            </div>
          }
        } @loading (after 100ms; minimum 1000ms) {
          <div class="loading-state">
            <p>Cargando información del visitante...</p>
          </div>
        } @error {
          <div class="error-state">
            <p>Error al cargar información del visitante</p>
            <button 
              class="gh-button gh-button--accent retry-button" 
              (click)="retryLoad()">
              Reintentar
            </button>
          </div>
        }
      </div>
    </div>
  `,
  styleUrl: './visitor-activity.scss'
})
export class VisitorActivityComponent {
  private http = inject(HttpClient);

  // Input para el ID del visitante
  visitorId = input.required<string>();

  // Output event para cerrar el panel
  closeRequested = output<void>();

  // Estados de edición
  private editingField = signal<string | null>(null);
  private saving = signal(false);
  
  // Valores temporales para edición
  editingName = signal('');
  editingEmail = signal('');
  editingTel = signal('');

  // Computed signals para estados de edición
  isEditingName = computed(() => this.editingField() === 'name');
  isEditingEmail = computed(() => this.editingField() === 'email');
  isEditingTel = computed(() => this.editingField() === 'tel');
  isSaving = computed(() => this.saving());

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

  /**
   * Inicia la edición de un campo
   */
  startEdit(field: string, currentValue: string | null): void {
    this.editingField.set(field);
    
    switch (field) {
      case 'name':
        this.editingName.set(currentValue || '');
        break;
      case 'email':
        this.editingEmail.set(currentValue || '');
        break;
      case 'tel':
        this.editingTel.set(currentValue || '');
        break;
    }
    
    // Focus en el input después de un tick
    setTimeout(() => {
      const input = document.getElementById(`${field}Input`) as HTMLInputElement;
      if (input) {
        input.focus();
        input.select();
      }
    }, 0);
  }

  /**
   * Guarda un campo editado
   */
  async saveField(field: string): Promise<void> {
    if (this.saving()) return;
    
    this.saving.set(true);
    
    try {
      const visitorId = this.visitorId();
      let value: string;
      
      switch (field) {
        case 'name':
          value = this.editingName().trim();
          break;
        case 'email':
          value = this.editingEmail().trim();
          break;
        case 'tel':
          value = this.editingTel().trim();
          break;
        default:
          return;
      }

      // Validación básica
      if (field === 'email' && value && !this.isValidEmail(value)) {
        alert('Por favor, introduce un email válido');
        return;
      }

      console.log(`💾 [VisitorActivity] Guardando ${field}:`, value);
      
      // Preparar el payload - el campo debe tener el mismo nombre que en la URL
      const updatePayload = {
        [field]: value || null
      };

      // Hacer la petición PUT al endpoint específico del campo
      const endpoint = `${environment.apiUrl}/visitor/${visitorId}/${field}`;
      await this.http.put(endpoint, updatePayload).toPromise();

      console.log(`✅ [VisitorActivity] ${field} actualizado correctamente`);
      
      // Recargar los datos del visitante
      this.visitorResource.reload();
      
      // Salir del modo edición
      this.editingField.set(null);
      
    } catch (error) {
      console.error(`❌ [VisitorActivity] Error al actualizar ${field}:`, error);
      alert(`Error al actualizar ${field}. Por favor, inténtalo de nuevo.`);
    } finally {
      this.saving.set(false);
    }
  }

  /**
   * Cancela la edición de un campo
   */
  cancelEdit(): void {
    this.editingField.set(null);
  }

  /**
   * Valida si un email tiene formato correcto
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Formatea el tiempo de conexión desde milisegundos a un formato legible
   */
  formatConnectionTime(milliseconds: number): string {
    if (!milliseconds || milliseconds < 0) {
      return '0 segundos';
    }

    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      const remainingMinutes = minutes % 60;
      const remainingSeconds = seconds % 60;
      return `${hours}h ${remainingMinutes}m ${remainingSeconds}s`;
    } else if (minutes > 0) {
      const remainingSeconds = seconds % 60;
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${seconds}s`;
    }
  }
}
