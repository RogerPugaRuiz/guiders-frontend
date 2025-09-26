import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';
import { IconName } from '../icon/icon.types';

/**
 * Ejemplo de uso del componente Icon
 * Demuestra todos los casos de uso y configuraciones posibles
 */
@Component({
  selector: 'guiders-icon-examples',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="icon-examples">
      <h1>Sistema de Iconografía Guiders</h1>
      
      <!-- === TAMAÑOS === -->
      <section>
        <h2>Tamaños Disponibles</h2>
        <div class="size-grid">
          <div class="size-item">
            <guiders-icon name="search" size="xs" />
            <span>XS (12px)</span>
          </div>
          <div class="size-item">
            <guiders-icon name="search" size="sm" />
            <span>SM (16px)</span>
          </div>
          <div class="size-item">
            <guiders-icon name="search" size="md" />
            <span>MD (20px)</span>
          </div>
          <div class="size-item">
            <guiders-icon name="search" size="lg" />
            <span>LG (24px)</span>
          </div>
          <div class="size-item">
            <guiders-icon name="search" size="xl" />
            <span>XL (32px)</span>
          </div>
          <div class="size-item">
            <guiders-icon name="search" size="2xl" />
            <span>2XL (48px)</span>
          </div>
        </div>
      </section>

      <!-- === COLORES SEMÁNTICOS === -->
      <section>
        <h2>Colores Semánticos</h2>
        <div class="color-grid">
          <div class="color-item">
            <guiders-icon name="check-circle" class="guiders-icon--success" size="lg" />
            <span>Success</span>
          </div>
          <div class="color-item">
            <guiders-icon name="alert-triangle" class="guiders-icon--warning" size="lg" />
            <span>Warning</span>
          </div>
          <div class="color-item">
            <guiders-icon name="x-circle" class="guiders-icon--danger" size="lg" />
            <span>Danger</span>
          </div>
          <div class="color-item">
            <guiders-icon name="info" class="guiders-icon--info" size="lg" />
            <span>Info</span>
          </div>
          <div class="color-item">
            <guiders-icon name="user" class="guiders-icon--primary" size="lg" />
            <span>Primary</span>
          </div>
          <div class="color-item">
            <guiders-icon name="settings" class="guiders-icon--secondary" size="lg" />
            <span>Secondary</span>
          </div>
        </div>
      </section>

      <!-- === CATEGORÍAS DE ICONOS === -->
      <section>
        <h2>Navegación</h2>
        <div class="icon-category">
          <guiders-icon 
            *ngFor="let icon of navigationIcons" 
            [name]="icon" 
            size="lg"
            [config]="{ ariaLabel: getIconLabel(icon) }" />
        </div>
      </section>

      <section>
        <h2>Acciones</h2>
        <div class="icon-category">
          <guiders-icon 
            *ngFor="let icon of actionIcons" 
            [name]="icon" 
            size="lg"
            [config]="{ ariaLabel: getIconLabel(icon) }" />
        </div>
      </section>

      <section>
        <h2>Estado</h2>
        <div class="icon-category">
          <guiders-icon 
            *ngFor="let icon of statusIcons" 
            [name]="icon" 
            size="lg"
            [config]="{ ariaLabel: getIconLabel(icon) }" />
        </div>
      </section>

      <section>
        <h2>Comunicación</h2>
        <div class="icon-category">
          <guiders-icon 
            *ngFor="let icon of communicationIcons" 
            [name]="icon" 
            size="lg"
            [config]="{ ariaLabel: getIconLabel(icon) }" />
        </div>
      </section>

      <!-- === ESTADOS INTERACTIVOS === -->
      <section>
        <h2>Estados Interactivos</h2>
        <div class="interactive-examples">
          <button class="icon-button" type="button">
            <guiders-icon 
              name="settings" 
              class="guiders-icon--interactive"
              [config]="{ ariaLabel: 'Abrir configuración' }" />
            Configuración
          </button>
          
          <button class="icon-button" type="button">
            <guiders-icon 
              name="download" 
              class="guiders-icon--interactive"
              [config]="{ ariaLabel: 'Descargar archivo' }" />
            Descargar
          </button>
          
          <button class="icon-button loading" type="button" disabled>
            <guiders-icon 
              name="loading" 
              class="guiders-icon--loading"
              [config]="{ ariaLabel: 'Cargando...' }" />
            Cargando...
          </button>
        </div>
      </section>

      <!-- === ACCESIBILIDAD === -->
      <section>
        <h2>Ejemplos de Accesibilidad</h2>
        <div class="accessibility-examples">
          <div class="example">
            <h3>Icono con significado semántico</h3>
            <guiders-icon 
              name="check-circle" 
              class="guiders-icon--success"
              [config]="{ ariaLabel: 'Formulario enviado correctamente' }" />
            <code>ariaLabel: 'Formulario enviado correctamente'</code>
          </div>
          
          <div class="example">
            <h3>Icono decorativo</h3>
            <div class="decorative-example">
              <guiders-icon 
                name="star" 
                [config]="{ decorative: true }" />
              <span>Producto destacado</span>
            </div>
            <code>decorative: true (aria-hidden="true")</code>
          </div>
          
          <div class="example">
            <h3>Rol personalizado</h3>
            <guiders-icon 
              name="alert-triangle" 
              class="guiders-icon--warning"
              [config]="{ 
                ariaLabel: 'Error en el formulario',
                role: 'alert'
              }" />
            <code>role: 'alert'</code>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .icon-examples {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }

    .size-grid,
    .color-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 1rem;
      margin: 1rem 0;
    }

    .size-item,
    .color-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      padding: 1rem;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
    }

    .icon-category {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      margin: 1rem 0;
      padding: 1rem;
      background: #f9fafb;
      border-radius: 8px;
    }

    .interactive-examples {
      display: flex;
      gap: 1rem;
      margin: 1rem 0;
    }

    .icon-button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      background: #fff;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .icon-button:hover:not(:disabled) {
      background: #f3f4f6;
      border-color: #9ca3af;
    }

    .icon-button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .accessibility-examples {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      margin: 1rem 0;
    }

    .example {
      padding: 1rem;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
    }

    .decorative-example {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin: 0.5rem 0;
    }

    code {
      display: block;
      margin-top: 0.5rem;
      padding: 0.25rem 0.5rem;
      background: #f3f4f6;
      border-radius: 4px;
      font-size: 0.875rem;
      color: #374151;
    }

    section {
      margin-bottom: 3rem;
    }

    h1, h2, h3 {
      color: #111827;
    }

    h1 {
      margin-bottom: 2rem;
      text-align: center;
    }

    h2 {
      margin-bottom: 1rem;
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 0.5rem;
    }
  `]
})
export class IconExamplesComponent {
  navigationIcons: IconName[] = [
    'arrow-left', 'arrow-right', 'chevron-up', 'chevron-down', 
    'menu', 'close', 'home'
  ];

  actionIcons: IconName[] = [
    'plus', 'minus', 'edit', 'trash', 'save', 'search', 
    'filter', 'refresh', 'download', 'upload', 'copy'
  ];

  statusIcons: IconName[] = [
    'check', 'check-circle', 'x-circle', 'alert-triangle', 
    'info', 'help-circle', 'loading', 'eye', 'eye-off'
  ];

  communicationIcons: IconName[] = [
    'message-circle', 'message-square', 'mail', 'phone', 
    'bell', 'bell-off'
  ];

  getIconLabel(iconName: IconName): string {
    const labels: Record<string, string> = {
      'arrow-left': 'Flecha izquierda',
      'arrow-right': 'Flecha derecha',
      'chevron-up': 'Chevron arriba',
      'chevron-down': 'Chevron abajo',
      'menu': 'Menú',
      'close': 'Cerrar',
      'home': 'Inicio',
      'plus': 'Agregar',
      'minus': 'Quitar',
      'edit': 'Editar',
      'trash': 'Eliminar',
      'save': 'Guardar',
      'search': 'Buscar',
      'filter': 'Filtrar',
      'refresh': 'Actualizar',
      'download': 'Descargar',
      'upload': 'Subir',
      'copy': 'Copiar',
      'check': 'Verificado',
      'check-circle': 'Completado',
      'x-circle': 'Error',
      'alert-triangle': 'Advertencia',
      'info': 'Información',
      'help-circle': 'Ayuda',
      'loading': 'Cargando',
      'eye': 'Ver',
      'eye-off': 'Ocultar',
      'message-circle': 'Mensaje',
      'message-square': 'Chat',
      'mail': 'Email',
      'phone': 'Teléfono',
      'bell': 'Notificación',
      'bell-off': 'Sin notificaciones'
    };

    return labels[iconName] || iconName;
  }
}