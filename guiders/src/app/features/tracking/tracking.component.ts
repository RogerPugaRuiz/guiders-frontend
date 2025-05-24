import { Component } from '@angular/core';

@Component({
  selector: 'app-tracking',
  standalone: true,
  template: `
    <div class="tracking">
      <div class="gh-page-header">
        <div>
          <h1 class="gh-page-header__title">Seguimiento de Acciones</h1>
          <p class="gh-page-header__description">Monitoriza el comportamiento y las acciones de los usuarios en tiempo real.</p>
        </div>
        <div class="gh-page-header__actions">
          <button class="gh-button">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor" style="margin-right: 4px">
              <path d="M2 12.5a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5Zm5.5-9a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5ZM8.5 3a.5.5 0 0 0-.5.5v7a.5.5 0 0 0 1 0v-7a.5.5 0 0 0-.5-.5Z"></path>
            </svg>
            Exportar datos
          </button>
          <button class="gh-button gh-button--primary">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor" style="margin-right: 4px">
              <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm7-3.25v2.25h2.25a.75.75 0 0 1 0 1.5H8.5v2.25a.75.75 0 0 1-1.5 0V8.5H4.75a.75.75 0 0 1 0-1.5H7V4.75a.75.75 0 0 1 1.5 0Z"></path>
            </svg>
            Nuevo informe
          </button>
        </div>
      </div>
      
      <div class="gh-card">
        <div class="gh-card__header">
          <h3 class="gh-card__title">Visitantes activos</h3>
          <div class="gh-filter-controls">
            <div class="gh-filter">
              <label class="gh-filter__label">Filtrar por página:</label>
              <select class="gh-input gh-input--sm">
                <option>Todas las páginas</option>
                <option>Página principal</option>
                <option>Planes y precios</option>
                <option>Contacto</option>
              </select>
            </div>
            
            <div class="gh-filter">
              <label class="gh-filter__label">Ordenar por:</label>
              <select class="gh-input gh-input--sm">
                <option>Tiempo en sitio (mayor)</option>
                <option>Tiempo en sitio (menor)</option>
                <option>Páginas visitadas</option>
                <option>Más reciente</option>
              </select>
            </div>
          </div>
        </div>
        
        <div class="gh-table-container">
          <table class="gh-table">
            <thead>
              <tr>
                <th>Visitante</th>
                <th>Página Actual</th>
                <th>Tiempo en Sitio</th>
                <th>Páginas Vistas</th>
                <th>Interacciones</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <div class="gh-user-info">
                    <div class="gh-avatar gh-avatar--sm">MR</div>
                    <div class="gh-user-details">
                      <p class="gh-user-name">María Rodríguez</p>
                      <p class="gh-user-meta">Madrid, España</p>
                    </div>
                  </div>
                </td>
                <td>Planes de Servicio</td>
                <td>8m 23s</td>
                <td>4</td>
                <td>
                  <div class="gh-badge-group">
                    <span class="gh-label gh-label--blue">3 clics</span>
                    <span class="gh-label gh-label--purple">65% scroll</span>
                  </div>
                </td>
                <td>
                  <button class="gh-button gh-button--sm gh-button--primary">Iniciar Chat</button>
                </td>
              </tr>
              <tr>
                <td>
                  <div class="gh-user-info">
                    <div class="gh-avatar gh-avatar--sm">JG</div>
                    <div class="gh-user-details">
                      <p class="gh-user-name">Juan González</p>
                      <p class="gh-user-meta">Barcelona, España</p>
                    </div>
                  </div>
                </td>
                <td>Página principal</td>
                <td>3m 45s</td>
                <td>2</td>
                <td>
                  <div class="gh-badge-group">
                    <span class="gh-label gh-label--blue">1 clic</span>
                    <span class="gh-label gh-label--purple">30% scroll</span>
                  </div>
                </td>
                <td>
                  <button class="gh-button gh-button--sm gh-button--primary">Iniciar Chat</button>
                </td>
              </tr>
              <tr>
                <td>
                  <div class="gh-user-info">
                    <div class="gh-avatar gh-avatar--sm">AL</div>
                    <div class="gh-user-details">
                      <p class="gh-user-name">Ana López</p>
                      <p class="gh-user-meta">Sevilla, España</p>
                    </div>
                  </div>
                </td>
              <td>Contacto</td>
              <td>12m 10s</td>
              <td>7</td>
              <td>
                <div class="gh-badge-group">
                  <span class="gh-label gh-label--blue">5 clics</span>
                  <span class="gh-label gh-label--purple">100% scroll</span>
                  <span class="gh-label gh-label--green">Form active</span>
                </div>
              </td>
              <td>
                <button class="gh-button gh-button--sm gh-button--primary">Iniciar Chat</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .tracking {
      width: 100%;
    }
    
    .gh-page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--spacing-xl);
      
      &__title {
        margin: 0;
        margin-bottom: var(--spacing-xs);
        font-size: var(--font-size-xl);
      }
      
      &__description {
        color: var(--color-text-light);
        margin: 0;
      }
      
      &__actions {
        display: flex;
        gap: var(--spacing-sm);
      }
    }
    
    .gh-filter-controls {
      display: flex;
      gap: var(--spacing-lg);
    }
    
    .gh-filter {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      
      &__label {
        font-size: var(--font-size-xs);
        color: var(--color-text-light);
      }
    }
    
    .gh-table-container {
      overflow: auto;
    }
    
    .gh-user-info {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
    }
    
    .gh-user-details {
      display: flex;
      flex-direction: column;
      
      .gh-user-name {
        font-weight: 600;
        margin: 0;
      }
      
      .gh-user-meta {
        font-size: var(--font-size-xs);
        color: var(--color-text-light);
        margin: 0;
      }
    }
    
    .gh-badge-group {
      display: flex;
      flex-wrap: wrap;
      gap: var(--spacing-xs);
    }
    
    .gh-visitor {
      &__icon {
        width: 35px;
        height: 35px;
        background-color: #1abb9c;
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 0.85rem;
      }

      &__name {
        margin: 0;
        font-weight: 500;
      }

      &__location {
        margin: 0;
        font-size: 0.8rem;
        color: #777;
      }

      &__interactions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }

      &__interaction {
        font-size: 0.75rem;
        padding: 3px 8px;
        border-radius: 10px;
        
        &--click {
          background-color: #e3f2fd;
        }
        
        &--scroll {
          background-color: #e8f5e9;
        }
        
        &--form {
          background-color: #fff3e0;
        }
      }

      &__action-btn {
        padding: 6px 12px;
        border-radius: 4px;
        border: none;
        cursor: pointer;
        font-size: 0.85rem;          &--chat {
          background-color: #1abb9c;
          color: white;
          
          &:hover {
            background-color: #17a589; /* Versión más oscura del color #1abb9c */
          }
        }
      }
    }
  
  `]
})
export class TrackingComponent {
}
