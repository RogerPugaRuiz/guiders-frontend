import { Component } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  template: `
    <div class="dashboard">
      <div class="gh-page-header">
        <div>
          <h1 class="gh-page-header__title">Dashboard</h1>
          <p class="gh-page-header__description">Bienvenido al panel de control de Guiders.</p>
        </div>
        <div class="gh-page-header__actions">
          <button class="gh-button">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor" style="margin-right: 4px">
              <path d="M1.75 1h12.5c.966 0 1.75.784 1.75 1.75v9.5A1.75 1.75 0 0 1 14.25 14H8.061l-2.574 2.573A1.458 1.458 0 0 1 3 15.543V14H1.75A1.75 1.75 0 0 1 0 12.25v-9.5C0 1.784.784 1 1.75 1ZM1.5 2.75v9.5c0 .138.112.25.25.25h2a.75.75 0 0 1 .75.75v2.19l2.72-2.72a.749.749 0 0 1 .53-.22h6.5a.25.25 0 0 0 .25-.25v-9.5a.25.25 0 0 0-.25-.25H1.75a.25.25 0 0 0-.25.25Z"></path>
            </svg>
            Enviar feedback
          </button>
          <button class="gh-button gh-button--primary">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor" style="margin-right: 4px">
              <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm7-3.25v2.25h2.25a.75.75 0 0 1 0 1.5H8.5v2.25a.75.75 0 0 1-1.5 0V8.5H4.75a.75.75 0 0 1 0-1.5H7V4.75a.75.75 0 0 1 1.5 0Z"></path>
            </svg>
            Nuevo informe
          </button>
        </div>
      </div>
      
      <div class="gh-stats-grid">
        <div class="gh-stats-card">
          <div class="gh-stats-card__header">
            <h3 class="gh-stats-card__title">Visitantes Activos</h3>
            <span class="gh-stats-card__badge gh-stats-card__badge--up">+15%</span>
          </div>
          <p class="gh-stats-card__value">12</p>
          <div class="gh-stats-card__footer">
            <span class="gh-stats-card__caption">Comparado con ayer</span>
          </div>
        </div>
        
        <div class="gh-stats-card">
          <div class="gh-stats-card__header">
            <h3 class="gh-stats-card__title">Chats Activos</h3>
            <span class="gh-stats-card__badge gh-stats-card__badge--neutral">0%</span>
          </div>
          <p class="gh-stats-card__value">3</p>
          <div class="gh-stats-card__footer">
            <span class="gh-stats-card__caption">Comparado con ayer</span>
          </div>
        </div>
        
        <div class="gh-stats-card">
          <div class="gh-stats-card__header">
            <h3 class="gh-stats-card__title">Leads Generados Hoy</h3>
            <span class="gh-stats-card__badge gh-stats-card__badge--up">+5%</span>
          </div>
          <p class="gh-stats-card__value">8</p>
          <div class="gh-stats-card__footer">
            <span class="gh-stats-card__caption">Comparado con ayer</span>
          </div>
        </div>
        
        <div class="gh-stats-card">
          <div class="gh-stats-card__header">
            <h3 class="gh-stats-card__title">Tasa de Conversión</h3>
            <span class="gh-stats-card__badge gh-stats-card__badge--down">-0.8%</span>
          </div>
          <p class="gh-stats-card__value">5.2%</p>
          <div class="gh-stats-card__footer">
            <span class="gh-stats-card__caption">Comparado con ayer</span>
          </div>
        </div>
      </div>
      
      <div class="gh-dashboard-content">
        <div class="gh-card gh-activity-feed">
          <div class="gh-card__header">
            <h3 class="gh-card__title">Actividad reciente</h3>
            <button class="gh-button gh-button--sm">Ver todo</button>
          </div>
          
          <div class="gh-activity-list">
            <div class="gh-activity-item">
              <div class="gh-avatar gh-avatar--sm gh-activity-icon">MR</div>
              <div class="gh-activity-details">
                <div class="gh-activity-message">
                  <strong>María Rodríguez</strong> ha iniciado una conversación
                </div>
                <div class="gh-activity-meta">
                  Hace 10 minutos · <a href="#">Ver conversación</a>
                </div>
              </div>
            </div>
            
            <div class="gh-activity-item">
              <div class="gh-avatar gh-avatar--sm gh-activity-icon">JG</div>
              <div class="gh-activity-details">
                <div class="gh-activity-message">
                  <strong>Juan González</strong> se ha convertido en lead
                </div>
                <div class="gh-activity-meta">
                  Hace 25 minutos · <a href="#">Ver perfil</a>
                </div>
              </div>
            </div>
            
            <div class="gh-activity-item">
              <div class="gh-avatar gh-avatar--sm gh-activity-icon">AL</div>
              <div class="gh-activity-details">
                <div class="gh-activity-message">
                  <strong>Ana López</strong> ha finalizado la conversación
                </div>
                <div class="gh-activity-meta">
                  Hace 45 minutos · <a href="#">Ver historial</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard {
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
        
        &__header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-sm);
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
        }
        
        &__footer {
          margin-top: var(--spacing-md);
        }
        
        &__caption {
          font-size: var(--font-size-xs);
          color: var(--color-text-light);
        }
      }
      
      .gh-dashboard-content {
        display: grid;
        grid-template-columns: 2fr 1fr;
        gap: var(--spacing-lg);
        
        @media (max-width: 768px) {
          grid-template-columns: 1fr;
        }
      }
      
      .gh-activity-feed {
        .gh-activity-list {
          padding: 0 var(--spacing-lg);
        }
        
        .gh-activity-item {
          display: flex;
          padding: var(--spacing-sm) 0;
          border-bottom: 1px solid var(--color-border);
          
          &:last-child {
            border-bottom: none;
          }
        }
        
        .gh-activity-icon {
          margin-right: var(--spacing-md);
          flex-shrink: 0;
        }
        
        .gh-activity-details {
          flex: 1;
        }
        
        .gh-activity-message {
          font-size: var(--font-size-sm);
          margin-bottom: 2px;
        }
        
        .gh-activity-meta {
          font-size: var(--font-size-xs);
          color: var(--color-text-light);
          
          a {
            color: var(--color-primary);
            text-decoration: none;
            
            &:hover {
              text-decoration: underline;
            }
          }
        }
      }
      
      .gh-button {
        &--sm {
          padding: 3px 12px;
          font-size: var(--font-size-xs);
        }
      }
    }
  `]
})
export class DashboardComponent {
}
