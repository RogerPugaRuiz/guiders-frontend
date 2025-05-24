import { Component } from '@angular/core';

@Component({
  selector: 'app-analytics',
  standalone: true,
  template: `
    <div class="analytics">
      <div class="gh-page-header">
        <div>
          <h1 class="gh-page-header__title">Análisis de Interacciones</h1>
          <p class="gh-page-header__description">Estadísticas y métricas detalladas sobre las interacciones con visitantes.</p>
        </div>
        <div class="gh-page-header__actions">
          <div class="gh-segmented-control">
            <button class="gh-segmented-control__item gh-segmented-control__item--active">Hoy</button>
            <button class="gh-segmented-control__item">Esta semana</button>
            <button class="gh-segmented-control__item">Este mes</button>
            <button class="gh-segmented-control__item">Último trimestre</button>
          </div>
        </div>
      </div>

      <div class="gh-subheader">
        <div class="gh-filter-group">
          <button class="gh-dropdown-button">
            <span>Filtros</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
              <path d="m4.427 7.427 3.396 3.396a.25.25 0 0 0 .354 0l3.396-3.396A.25.25 0 0 0 11.396 7H4.604a.25.25 0 0 0-.177.427Z"></path>
            </svg>
          </button>
          <button class="gh-dropdown-button">
            <span>Últimos 7 días</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
              <path d="m4.427 7.427 3.396 3.396a.25.25 0 0 0 .354 0l3.396-3.396A.25.25 0 0 0 11.396 7H4.604a.25.25 0 0 0-.177.427Z"></path>
            </svg>
          </button>
        </div>
        
        <div class="gh-action-group">
          <button class="gh-button">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor" style="margin-right: 4px">
              <path d="M2 1.75C2 .784 2.784 0 3.75 0h8.5C13.216 0 14 .784 14 1.75v12.5A1.75 1.75 0 0 1 12.25 16h-8.5A1.75 1.75 0 0 1 2 14.25ZM3.75 1.5a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25H7.5v-13Zm5 13h3.5a.25.25 0 0 0 .25-.25V1.75a.25.25 0 0 0-.25-.25H8.75Z"></path>
            </svg>
            Exportar
          </button>
          <button class="gh-button gh-button--primary">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor" style="margin-right: 4px">
              <path d="M7.999 2.049A8.5 8.5 0 0 0 .522 9.273a7 7 0 0 0-.07 1.54c.904.262 1.775.46 2.581.6a5.27 5.27 0 0 1 .642-1.115 5.25 5.25 0 0 1 4.793-2.016 5.25 5.25 0 0 1 3.248 1.282 5.269 5.269 0 0 1 1.115 1.375c.806-.141 1.677-.339 2.582-.601a7.096 7.096 0 0 0-.07-1.54 8.5 8.5 0 0 0-7.344-7.249ZM7.86 14.75a10.716 10.716 0 0 1-.145-.145 14.927 14.927 0 0 1-2.16-2.95 5.26 5.26 0 0 1-.566-2.99 5.242 5.242 0 0 1 9.866-2.286c.093.158.18.32.258.49a16.2 16.2 0 0 1 .897-.277c.152-.042.305-.082.46-.119a6.732 6.732 0 0 0-.348-.662 6.75 6.75 0 0 0-7.623-3.367 6.75 6.75 0 0 0-5.128 5.812 6.73 6.73 0 0 0 .053 1.921c.087.514.222 1.01.405 1.484.27.7.635 1.359 1.096 1.963a16.41 16.41 0 0 0 2.335 2.582 12.47 12.47 0 0 0 1.84 1.462 12.52 12.52 0 0 0 1.84-1.462 16.278 16.278 0 0 0 2.333-2.58 10.765 10.765 0 0 0 1.096-1.964c.074-.191.139-.383.197-.577a14.67 14.67 0 0 1-3.003.139 5.25 5.25 0 0 1-3.141 3.225 5.243 5.243 0 0 1-1.546.275 5.254 5.254 0 0 1-1.547-.275 5.247 5.247 0 0 1-.593-.237Zm1.881-6.74a2 2 0 1 0-4 0 2 2 0 0 0 4 0Z"></path>
            </svg>
            Compartir
          </button>
        </div>
      </div>
      
      <div class="gh-stats-grid">
        <div class="gh-stats-card">
          <div class="gh-stats-card__header">
            <h3 class="gh-stats-card__title">Total de Visitantes</h3>
            <span class="gh-stats-card__badge gh-stats-card__badge--up">+12%</span>
          </div>
          <p class="gh-stats-card__value">1,248</p>
          <div class="gh-stats-card__trend gh-stats-card__trend--up">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
              <path d="M1.5 14 8 7.5 12.5 12l4-4v3h1v-4.5H13v1h3l-3.5 3.5L8 7l-7 7Z"></path>
            </svg>
          </div>
        </div>
        
        <div class="gh-stats-card">
          <div class="gh-stats-card__header">
            <h3 class="gh-stats-card__title">Conversaciones</h3>
            <span class="gh-stats-card__badge gh-stats-card__badge--up">+8%</span>
          </div>
          <p class="gh-stats-card__value">328</p>
          <div class="gh-stats-card__trend gh-stats-card__trend--up">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
              <path d="M1.5 14 8 7.5 12.5 12l4-4v3h1v-4.5H13v1h3l-3.5 3.5L8 7l-7 7Z"></path>
            </svg>
          </div>
        </div>
        
        <div class="gh-stats-card">
          <div class="gh-stats-card__header">
            <h3 class="gh-stats-card__title">Tasa de Conversión</h3>
            <span class="gh-stats-card__badge gh-stats-card__badge--up">+0.7%</span>
          </div>
          <p class="gh-stats-card__value">5.8%</p>
          <div class="gh-stats-card__trend gh-stats-card__trend--up">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
              <path d="M1.5 14 8 7.5 12.5 12l4-4v3h1v-4.5H13v1h3l-3.5 3.5L8 7l-7 7Z"></path>
            </svg>
          </div>
        </div>
        
        <div class="gh-stats-card">
          <div class="gh-stats-card__header">
            <h3 class="gh-stats-card__title">Tiempo Medio de Conversación</h3>
            <span class="gh-stats-card__badge gh-stats-card__badge--down">-15s</span>
          </div>
          <p class="gh-stats-card__value">4m 35s</p>
          <div class="gh-stats-card__trend gh-stats-card__trend--down">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
              <path d="m14.5 2-3.5 3.5L6.5 1 0 7.5 1 8.5 6.5 3l4.5 4.5 4.5-4.5V6h1V1.5Z"></path>
            </svg>
          </div>
        </div>
      </div>
      
      <div class="gh-flex-row">
        <div class="gh-chart-container gh-card">
          <div class="gh-card__header">
            <h3 class="gh-card__title">Tendencia de Visitantes</h3>
            <div class="gh-segmented-control gh-segmented-control--sm">
              <button class="gh-segmented-control__item gh-segmented-control__item--active">Día</button>
              <button class="gh-segmented-control__item">Semana</button>
              <button class="gh-segmented-control__item">Mes</button>
            </div>
          </div>
          <div class="gh-chart">
            <div class="gh-chart-placeholder">
              <div class="gh-chart-bar" style="height: 30%;"></div>
              <div class="gh-chart-bar" style="height: 45%;"></div>
              <div class="gh-chart-bar" style="height: 60%;"></div>
              <div class="gh-chart-bar" style="height: 40%;"></div>
              <div class="gh-chart-bar" style="height: 55%;"></div>
              <div class="gh-chart-bar" style="height: 75%;"></div>
              <div class="gh-chart-bar" style="height: 65%;"></div>
            </div>
          </div>
        </div>
        
        <div class="gh-chart-container gh-card">
          <div class="gh-card__header">
            <h3 class="gh-card__title">Fuentes de Conversión</h3>
            <button class="gh-button gh-button--sm">Ver detalles</button>
          </div>
          <div class="gh-chart">
            <div class="gh-pie-chart">
              <div class="gh-pie-segment gh-pie-segment--1"></div>
              <div class="gh-pie-segment gh-pie-segment--2"></div>
              <div class="gh-pie-segment gh-pie-segment--3"></div>
              <div class="gh-pie-segment gh-pie-segment--4"></div>
            </div>
            <div class="gh-pie-legend">
              <div class="gh-pie-legend-item">
                <span class="gh-pie-color gh-pie-color--1"></span>
                <span>Chat (45%)</span>
              </div>
              <div class="gh-pie-legend-item">
                <span class="gh-pie-color gh-pie-color--2"></span>
                <span>Formulario (30%)</span>
              </div>
              <div class="gh-pie-legend-item">
                <span class="gh-pie-color gh-pie-color--3"></span>
                <span>Llamada (15%)</span>
              </div>
              <div class="gh-pie-legend-item">
                <span class="gh-pie-color gh-pie-color--4"></span>
                <span>Otros (10%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="gh-card gh-data-table-container">
        <div class="gh-card__header">
          <h3 class="gh-card__title">Páginas Más Visitadas</h3>
          <div class="gh-filter-group">
            <button class="gh-dropdown-button gh-dropdown-button--icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
                <path d="M3.5 12a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1Zm3-9a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1Zm-.5 4.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0Zm-6-2h9L9 3 6 7l-1.5 2H0ZM12 5l-3 5-3-3-2 3H1v1h3l2-3 3 3 3-6h3V5Z"></path>
              </svg>
            </button>
            <button class="gh-dropdown-button gh-dropdown-button--icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
                <path d="M7.75 2a.75.75 0 0 1 .75.75V7h4.25a.75.75 0 0 1 0 1.5H8.5v4.25a.75.75 0 0 1-1.5 0V8.5H2.75a.75.75 0 0 1 0-1.5H7V2.75A.75.75 0 0 1 7.75 2Z"></path>
              </svg>
            </button>
          </div>
        </div>
        
        <table class="gh-table">
          <thead>
            <tr>
              <th>Página</th>
              <th>Visitantes</th>
              <th>Tasa de Conversación</th>
              <th>Tiempo Medio</th>
              <th>Tasa de Rebote</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>/planes-servicios</td>
              <td>542</td>
              <td>8.2%</td>
              <td>3m 45s</td>
              <td>35%</td>
              <td>
                <button class="gh-button gh-button--sm">Ver</button>
              </td>
            </tr>
            <tr>
              <td>/inicio</td>
              <td>423</td>
              <td>4.5%</td>
              <td>2m 30s</td>
              <td>42%</td>
              <td>
                <button class="gh-button gh-button--sm">Ver</button>
              </td>
            </tr>
            <tr>
              <td>/contacto</td>
              <td>267</td>
              <td>12.3%</td>
              <td>4m 15s</td>
              <td>28%</td>
              <td>
                <button class="gh-button gh-button--sm">Ver</button>
              </td>
            </tr>
            <tr>
              <td>/blog/mejores-practicas</td>
              <td>198</td>
              <td>5.1%</td>
              <td>5m 20s</td>
              <td>25%</td>
              <td>
                <button class="gh-button gh-button--sm">Ver</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .analytics {
      .gh-page-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: var(--spacing-lg);
        padding-bottom: var(--spacing-lg);
        border-bottom: 1px solid var(--color-border);
        
        &__title {
          margin-top: 0;
          margin-bottom: var(--spacing-xs);
          font-size: var(--font-size-xl);
        }
        
        &__description {
          color: var(--color-text-light);
          margin-bottom: 0;
        }
        
        &__actions {
          display: flex;
          gap: var(--spacing-md);
        }
      }
      
      .gh-subheader {
        display: flex;
        justify-content: space-between;
        margin-bottom: var(--spacing-lg);
        flex-wrap: wrap;
        gap: var(--spacing-md);
      }
      
      .gh-segmented-control {
        display: inline-flex;
        border: 1px solid var(--color-border);
        border-radius: var(--border-radius);
        overflow: hidden;
        
        &__item {
          padding: 5px 12px;
          background: none;
          border: none;
          border-right: 1px solid var(--color-border);
          font-size: var(--font-size-sm);
          color: var(--color-text);
          cursor: pointer;
          
          &:last-child {
            border-right: none;
          }
          
          &:hover:not(&--active) {
            background-color: #f6f8fa;
          }
          
          &--active {
            background-color: #0969da;
            color: white;
          }
        }
        
        &--sm {
          .gh-segmented-control__item {
            padding: 3px 8px;
            font-size: var(--font-size-xs);
          }
        }
      }

      .gh-filter-group {
        display: flex;
        gap: var(--spacing-sm);
      }
      
      .gh-dropdown-button {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 5px 12px;
        background-color: var(--color-background-secondary);
        border: 1px solid var(--color-border);
        border-radius: var(--border-radius);
        font-size: var(--font-size-sm);
        color: var(--color-text);
        cursor: pointer;
        
        &:hover {
          background-color: #f6f8fa;
        }
        
        &--icon {
          padding: 5px 8px;
        }
      }
      
      .gh-action-group {
        display: flex;
        gap: var(--spacing-sm);
      }
      
      .gh-stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        gap: var(--spacing-lg);
        margin-bottom: var(--spacing-xl);
      }
      
      .gh-stats-card {
        background-color: var(--color-background-secondary);
        border: 1px solid var(--color-border);
        border-radius: var(--border-radius);
        padding: var(--spacing-lg);
        position: relative;
        overflow: hidden;
        
        &__header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-sm);
          position: relative;
          z-index: 2;
        }
        
        &__title {
          margin: 0;
          font-size: var(--font-size-sm);
          font-weight: 600;
          color: var(--color-text-light);
        }
        
        &__badge {
          padding: 2px 6px;
          border-radius: 10px;
          font-size: var(--font-size-xs);
          font-weight: 600;
          
          &--up {
            background-color: #dafbe1;
            color: #2da44e;
          }
          
          &--down {
            background-color: #ffebe9;
            color: #cf222e;
          }
          
          &--neutral {
            background-color: #f6f8fa;
            color: #57606a;
          }
        }
        
        &__value {
          font-size: 2rem;
          font-weight: 600;
          margin: var(--spacing-sm) 0;
          color: var(--color-text);
          position: relative;
          z-index: 2;
        }
        
        &__trend {
          position: absolute;
          bottom: -20px;
          right: -20px;
          width: 100px;
          height: 100px;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0.15;
          
          svg {
            width: 100%;
            height: 100%;
          }
          
          &--up {
            color: #2da44e;
          }
          
          &--down {
            color: #cf222e;
          }
        }
      }

      .gh-flex-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--spacing-lg);
        margin-bottom: var(--spacing-xl);
        
        @media (max-width: 992px) {
          grid-template-columns: 1fr;
        }
      }
      
      .gh-chart-container {
        background-color: var(--color-background-secondary);
        border-radius: var(--border-radius);
      }
      
      .gh-card {
        background-color: var(--color-background-secondary);
        border: 1px solid var(--color-border);
        border-radius: var(--border-radius);
        
        &__header {
          padding: var(--spacing-md) var(--spacing-lg);
          border-bottom: 1px solid var(--color-border);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        &__title {
          margin: 0;
          font-size: var(--font-size-lg);
          font-weight: 600;
        }
      }
      
      .gh-chart {
        height: 250px;
        width: 100%;
        padding: var(--spacing-lg);
      }
      
      .gh-chart-placeholder {
        display: flex;
        width: 100%;
        height: 100%;
        align-items: flex-end;
        justify-content: space-around;
        padding-bottom: 30px;
        position: relative;
        
        &::after {
          content: '';
          position: absolute;
          left: 0;
          bottom: 20px;
          width: 100%;
          height: 1px;
          background-color: var(--color-border);
        }
      }
      
      .gh-chart-bar {
        width: 8%;
        max-width: 30px;
        background: linear-gradient(to top, #0969da, #54aeff);
        border-radius: 3px 3px 0 0;
        position: relative;
        
        &::after {
          content: '';
          position: absolute;
          bottom: -20px;
          left: 50%;
          transform: translateX(-50%);
          width: 100%;
          text-align: center;
          font-size: 0.7rem;
          color: var(--color-text-light);
        }
        
        &:nth-child(1)::after { content: 'Lun'; }
        &:nth-child(2)::after { content: 'Mar'; }
        &:nth-child(3)::after { content: 'Mié'; }
        &:nth-child(4)::after { content: 'Jue'; }
        &:nth-child(5)::after { content: 'Vie'; }
        &:nth-child(6)::after { content: 'Sáb'; }
        &:nth-child(7)::after { content: 'Dom'; }
      }

      &__chart-placeholder {
        display: flex;
        width: 100%;
        height: 100%;
        align-items: flex-end;
        justify-content: space-around;
        padding-bottom: 30px;
      }

      &__chart-bar {
        width: 10%;
        max-width: 50px;
        background: linear-gradient(to top, #1abb9c, #74e8d1);
        border-radius: 3px 3px 0 0;
        position: relative;
        
        &::after {
          content: '';
          position: absolute;
          bottom: -20px;
          left: 50%;
          transform: translateX(-50%);
          width: 100%;
          text-align: center;
          font-size: 0.7rem;
          color: #777;
        }
        
        &:nth-child(1)::after { content: 'Lun'; }
        &:nth-child(2)::after { content: 'Mar'; }
        &:nth-child(3)::after { content: 'Mié'; }
        &:nth-child(4)::after { content: 'Jue'; }
        &:nth-child(5)::after { content: 'Vie'; }
        &:nth-child(6)::after { content: 'Sáb'; }
        &:nth-child(7)::after { content: 'Dom'; }
      }

      &__chart-placeholder-pie {
        width: 150px;
        height: 150px;
        margin: 0 auto;
        position: relative;
        border-radius: 50%;
        overflow: hidden;
      }

      &__pie-segment {
        position: absolute;
        width: 100%;
        height: 100%;
        
        &--1 {
          background-color: #1abb9c;
          clip-path: polygon(50% 0%, 100% 0%, 100% 100%, 50% 100%, 50% 50%);
          transform: rotate(45deg);
        }
        
        &--2 {
          background-color: #3498db;
          clip-path: polygon(50% 50%, 100% 50%, 100% 100%, 50% 100%);
          transform: rotate(180deg);
        }
        
        &--3 {
          background-color: #9b59b6;
          clip-path: polygon(25% 50%, 50% 50%, 50% 100%, 0% 100%, 0% 75%);
          transform: rotate(90deg);
        }
        
        &--4 {
          background-color: #f1c40f;
          clip-path: polygon(0% 0%, 25% 0%, 50% 25%, 50% 50%, 0% 25%);
        }
      }

      &__pie-legend {
        margin-top: 20px;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }

      &__pie-legend-item {
        display: flex;
        align-items: center;
        gap: 5px;
        font-size: 0.85rem;
      }

      &__pie-color {
        display: inline-block;
        width: 12px;
        height: 12px;
        border-radius: 2px;
        
        &--1 { background-color: #1abb9c; }
        &--2 { background-color: #3498db; }
        &--3 { background-color: #9b59b6; }
        &--4 { background-color: #f1c40f; }
      }

      &__table-container {
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
        overflow: hidden;
      }

      &__table-header {
        padding: 20px;
        border-bottom: 1px solid #eaeaea;
        
        h3 {
          margin: 0;
          color: #5a738e;
          font-size: 1.1rem;
        }
      }

      &__table {
        width: 100%;
        border-collapse: collapse;
        
        th, td {
          padding: 15px 20px;
          text-align: left;
        }
        
        th {
          background-color: #f5f7fa;
          color: #5a738e;
          font-weight: 600;
          border-bottom: 1px solid #eaeaea;
        }
        
        td {
          border-bottom: 1px solid #eaeaea;
        }
        
        tbody tr:hover {
          background-color: #f9f9f9;
        }
      }
    }
  `]
})
export class AnalyticsComponent {
}
