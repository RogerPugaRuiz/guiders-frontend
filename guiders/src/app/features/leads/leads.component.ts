import { Component } from '@angular/core';

@Component({
  selector: 'app-leads',
  standalone: true,
  template: `
    <div class="leads">
      <div class="gh-page-header">
        <div>
          <h1 class="gh-page-header__title">Gestión de Leads</h1>
          <p class="gh-page-header__description">Gestiona y organiza tus contactos potenciales.</p>
        </div>
        <div class="gh-page-header__actions">
          <button class="gh-button">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor" style="margin-right: 4px">
              <path d="M3 9.5a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Zm1.5-5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM11 5.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM8 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"></path>
            </svg>
            Exportar
          </button>
          <button class="gh-button gh-button--primary">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor" style="margin-right: 4px">
              <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm7-3.25v2.25h2.25a.75.75 0 0 1 0 1.5H8.5v2.25a.75.75 0 0 1-1.5 0V8.5H4.75a.75.75 0 0 1 0-1.5H7V4.75a.75.75 0 0 1 1.5 0Z"></path>
            </svg>
            Añadir Lead
          </button>
        </div>
      </div>
      
      <div class="gh-card">
        <div class="gh-card__header">
          <h3 class="gh-card__title">Todos los leads</h3>
          <div class="gh-filter-controls">
            <div class="gh-filter">
              <label class="gh-filter__label">Estado:</label>
              <select class="gh-input gh-input--sm">
                <option>Todos</option>
                <option>Nuevo</option>
                <option>En seguimiento</option>
                <option>Convertido</option>
                <option>Cerrado</option>
              </select>
            </div>
            
            <div class="gh-filter">
              <label class="gh-filter__label">Fuente:</label>
              <select class="gh-input gh-input--sm">
                <option>Todas</option>
                <option>Chat</option>
                <option>Formulario</option>
                <option>Llamada</option>
                <option>Email</option>
              </select>
            </div>
            
            <div class="gh-filter">
              <label class="gh-filter__label">Fecha:</label>
              <select class="gh-input gh-input--sm">
                <option>Cualquier fecha</option>
                <option>Hoy</option>
                <option>Esta semana</option>
                <option>Este mes</option>
                <option>Último trimestre</option>
              </select>
            </div>
          </div>
        </div>
        
        <div class="gh-table-container">
          <table class="gh-table">
            <thead>
              <tr>
                <th>
                  <input type="checkbox" class="gh-checkbox">
                </th>
                <th>Nombre</th>
                <th>Email</th>
                <th>Teléfono</th>
                <th>Fuente</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <input type="checkbox" class="gh-checkbox">
                </td>
                <td>María Rodríguez</td>
                <td>{{"maria@ejemplo.com"}}</td>
                <td>+34 612 345 678</td>
                <td>
                  <span class="gh-label gh-label--blue">Chat</span>
                </td>
                <td>24/05/2025</td>
                <td>
                  <span class="gh-label gh-label--green">Nuevo</span>
                </td>
                <td>
                  <div class="gh-action-buttons">
                    <button class="gh-icon-button" title="Editar">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
                        <path d="M11.013 1.427a1.75 1.75 0 0 1 2.474 0l1.086 1.086a1.75 1.75 0 0 1 0 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 0 1-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61Zm.176 4.823L9.75 4.81l-6.286 6.287a.253.253 0 0 0-.064.108l-.558 1.953 1.953-.558a.253.253 0 0 0 .108-.064Zm1.238-3.763a.25.25 0 0 0-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 0 0 0-.354Z"></path>
                      </svg>
                    </button>
                    <button class="gh-icon-button" title="Llamar">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
                        <path d="M3.654 1.328a.678.678 0 0 0-1.015-.063L1.605 2.3c-.483.484-.661 1.169-.45 1.77a17.568 17.568 0 0 0 4.168 6.608 17.569 17.569 0 0 0 6.608 4.168c.601.211 1.286.033 1.77-.45l1.034-1.034a.678.678 0 0 0-.063-1.015l-2.307-1.794a.678.678 0 0 0-.58-.122l-2.19.547a1.745 1.745 0 0 1-1.657-.459L5.482 8.062a1.745 1.745 0 0 1-.46-1.657l.548-2.19a.678.678 0 0 0-.122-.58L3.654 1.328zM1.884.511a1.745 1.745 0 0 1 2.612.163L6.29 2.98c.329.423.445.974.315 1.494l-.547 2.19a.678.678 0 0 0 .178.643l2.457 2.457a.678.678 0 0 0 .644.178l2.189-.547a1.745 1.745 0 0 1 1.494.315l2.306 1.794c.829.645.905 1.87.163 2.611l-1.034 1.034c-.74.74-1.846 1.065-2.877.702a18.634 18.634 0 0 1-7.01-4.42 18.634 18.634 0 0 1-4.42-7.009c-.362-1.03-.037-2.137.703-2.877L1.885.511z"></path>
                      </svg>
                    </button>
                    <button class="gh-icon-button" title="Email">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
                        <path d="M1.75 2h12.5c.966 0 1.75.784 1.75 1.75v8.5A1.75 1.75 0 0 1 14.25 14H1.75A1.75 1.75 0 0 1 0 12.25v-8.5C0 2.784.784 2 1.75 2ZM1.5 12.251c0 .138.112.25.25.25h12.5a.25.25 0 0 0 .25-.25V5.809L8.38 9.397a.75.75 0 0 1-.76 0L1.5 5.809v6.442Zm13-8.181v-.32a.25.25 0 0 0-.25-.25H1.75a.25.25 0 0 0-.25.25v.32L8 7.88Z"></path>
                      </svg>
                    </button>
                    <button class="gh-icon-button" title="Más acciones">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
                        <path d="M3.75 2a1.75 1.75 0 1 0 0 3.5 1.75 1.75 0 0 0 0-3.5ZM8 2a1.75 1.75 0 1 0 0 3.5A1.75 1.75 0 0 0 8 2Zm4.25 0a1.75 1.75 0 1 0 0 3.5 1.75 1.75 0 0 0 0-3.5ZM3.75 6.5a1.75 1.75 0 1 0 0 3.5 1.75 1.75 0 0 0 0-3.5ZM8 6.5a1.75 1.75 0 1 0 0 3.5A1.75 1.75 0 0 0 8 6.5Zm4.25 0a1.75 1.75 0 1 0 0 3.5 1.75 1.75 0 0 0 0-3.5ZM3.75 11a1.75 1.75 0 1 0 0 3.5 1.75 1.75 0 0 0 0-3.5ZM8 11a1.75 1.75 0 1 0 0 3.5A1.75 1.75 0 0 0 8 11Zm4.25 0a1.75 1.75 0 1 0 0 3.5 1.75 1.75 0 0 0 0-3.5Z"></path>
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
              <tr>
                <td>
                  <input type="checkbox" class="gh-checkbox">
                </td>
                <td>Juan González</td>
                <td>{{"juan@ejemplo.com"}}</td>
                <td>+34 623 456 789</td>
                <td>
                  <span class="gh-label gh-label--purple">Formulario</span>
                </td>
                <td>22/05/2025</td>
              <td>
                <span class="leads__status leads__status--inprogress">En seguimiento</span>
              </td>
              <td class="leads__actions-cell">
                <button class="leads__icon-btn">📝</button>
                <button class="leads__icon-btn">📞</button>
                <button class="leads__icon-btn">✉️</button>
                <button class="leads__icon-btn">⋮</button>
              </td>
            </tr>
            <tr>
              <td>
                <input type="checkbox">
              </td>
              <td>Ana López</td>
              <td>{{"ana@ejemplo.com"}}</td>
              <td>+34 634 567 890</td>
              <td>
                <span class="leads__tag leads__tag--chat">Chat</span>
              </td>
              <td>20/05/2025</td>
              <td>
                <span class="leads__status leads__status--converted">Convertido</span>
              </td>
              <td class="leads__actions-cell">
                <button class="leads__icon-btn">📝</button>
                <button class="leads__icon-btn">📞</button>
                <button class="leads__icon-btn">✉️</button>
                <button class="leads__icon-btn">⋮</button>
              </td>
            </tr>
            <tr>
              <td>
                <input type="checkbox">
              </td>
              <td>Carlos Martínez</td>
              <td>{{"carlos@ejemplo.com"}}</td>
              <td>+34 645 678 901</td>
              <td>
                <span class="leads__tag leads__tag--email">Email</span>
              </td>
              <td>19/05/2025</td>
              <td>
                <span class="leads__status leads__status--closed">Cerrado</span>
              </td>
              <td class="leads__actions-cell">
                <button class="leads__icon-btn">📝</button>
                <button class="leads__icon-btn">📞</button>
                <button class="leads__icon-btn">✉️</button>
                <button class="leads__icon-btn">⋮</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div class="leads__pagination">
        <button class="leads__page-btn">&laquo;</button>
        <button class="leads__page-btn leads__page-btn--active">1</button>
        <button class="leads__page-btn">2</button>
        <button class="leads__page-btn">3</button>
        <button class="leads__page-btn">&raquo;</button>
      </div>
    </div>
  `,
  styles: [`
    .leads {
      &__header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin: 20px 0;
        flex-wrap: wrap;
        gap: 20px;
      }

      &__filters {
        display: flex;
        gap: 15px;
        flex-wrap: wrap;
      }

      &__filter {
        display: flex;
        flex-direction: column;
        
        label {
          margin-bottom: 5px;
          font-size: 0.85rem;
          color: #5a738e;
        }
        
        select {
          padding: 8px 12px;
          border-radius: 4px;
          border: 1px solid #ddd;
          outline: none;
          min-width: 140px;
          
          &:focus {
            border-color: #1abb9c;
          }
        }
      }

      &__actions {
        display: flex;
        gap: 10px;
      }

      &__action-btn {
        padding: 8px 15px;
        border-radius: 4px;
        border: 1px solid #ddd;
        background-color: #fff;
        cursor: pointer;
        
        &--primary {
          background-color: #1abb9c;
          color: white;
          border: none;
          
          &:hover {
            background-color: color-mix(in srgb, #1abb9c, #000 10%);
          }
        }
        
        &:hover:not(&--primary) {
          background-color: #f5f7fa;
        }
      }

      &__table-container {
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
        overflow: hidden;
      }

      &__table {
        width: 100%;
        border-collapse: collapse;
        
        th, td {
          padding: 15px;
          text-align: left;
          border-bottom: 1px solid #eaeaea;
        }
        
        th {
          background-color: #f5f7fa;
          color: #5a738e;
          font-weight: 600;
        }
        
        input[type="checkbox"] {
          cursor: pointer;
        }
      }

      &__tag {
        display: inline-block;
        padding: 3px 8px;
        border-radius: 20px;
        font-size: 0.75rem;
        
        &--chat {
          background-color: #e3f2fd;
          color: #1565c0;
        }
        
        &--form {
          background-color: #e8f5e9;
          color: #2e7d32;
        }
        
        &--email {
          background-color: #fff3e0;
          color: #e65100;
        }
        
        &--call {
          background-color: #f3e5f5;
          color: #6a1b9a;
        }
      }

      &__status {
        display: inline-block;
        padding: 3px 8px;
        border-radius: 20px;
        font-size: 0.75rem;
        
        &--new {
          background-color: #e3f2fd;
          color: #1565c0;
        }
        
        &--inprogress {
          background-color: #fff3e0;
          color: #e65100;
        }
        
        &--converted {
          background-color: #e8f5e9;
          color: #2e7d32;
        }
        
        &--closed {
          background-color: #f5f5f5;
          color: #616161;
        }
      }

      &__actions-cell {
        white-space: nowrap;
      }

      &__icon-btn {
        background: none;
        border: none;
        cursor: pointer;
        font-size: 1rem;
        padding: 5px;
        opacity: 0.7;
        
        &:hover {
          opacity: 1;
        }
      }

      &__pagination {
        display: flex;
        justify-content: center;
        margin-top: 20px;
        gap: 5px;
      }

      &__page-btn {
        width: 35px;
        height: 35px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px solid #ddd;
        background-color: white;
        cursor: pointer;
        
        &--active {
          background-color: #1abb9c;
          color: white;
          border-color: #1abb9c;
        }
        
        &:hover:not(&--active) {
          background-color: #f5f7fa;
        }
      }
    }
  `]
})
export class LeadsComponent {
}
