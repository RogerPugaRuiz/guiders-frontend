import { Component } from '@angular/core';

/**
 * Componente Dashboard para mostrar métricas y resumen general
 */
@Component({
  selector: 'app-dashboard',
  imports: [],
  template: `
    <div class="dashboard-container">
      <header class="dashboard-header">
        <h1>Dashboard</h1>
        <p>Resumen general de la actividad</p>
      </header>
      
      <div class="dashboard-grid">
        <div class="metric-card">
          <div class="metric-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
              <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
            </svg>
          </div>
          <div class="metric-content">
            <h3>Conversaciones Activas</h3>
            <span class="metric-value">24</span>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <div class="metric-content">
            <h3>Nuevos Leads</h3>
            <span class="metric-value">12</span>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" x2="18" y1="20" y2="10" />
              <line x1="12" x2="12" y1="20" y2="4" />
              <line x1="6" x2="6" y1="20" y2="14" />
            </svg>
          </div>
          <div class="metric-content">
            <h3>Tasa de Conversión</h3>
            <span class="metric-value">67%</span>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v6" />
              <path d="M12 17v6" />
              <path d="m1 12 6 0" />
              <path d="m17 12 6 0" />
            </svg>
          </div>
          <div class="metric-content">
            <h3>Tiempo Promedio</h3>
            <span class="metric-value">8 min</span>
          </div>
        </div>
      </div>

      <div class="dashboard-content">
        <div class="recent-activity">
          <h2>Actividad Reciente</h2>
          <div class="activity-list">
            <div class="activity-item">
              <span class="activity-time">Hace 5 min</span>
              <span class="activity-description">Nueva conversación iniciada con cliente potencial</span>
            </div>
            <div class="activity-item">
              <span class="activity-time">Hace 15 min</span>
              <span class="activity-description">Lead convertido a oportunidad de venta</span>
            </div>
            <div class="activity-item">
              <span class="activity-time">Hace 32 min</span>
              <span class="activity-description">Seguimiento automático enviado</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 2rem;
      max-width: 1200px;
    }

    .dashboard-header {
      margin-bottom: 2rem;
    }

    .dashboard-header h1 {
      margin: 0;
      font-size: 2rem;
      font-weight: 600;
      color: var(--text-primary, #1a1a1a);
    }

    .dashboard-header p {
      margin: 0.5rem 0 0 0;
      color: var(--text-secondary, #666);
    }

    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .metric-card {
      background: var(--surface-primary, #ffffff);
      border: 1px solid var(--border-color, #e5e7eb);
      border-radius: 12px;
      padding: 1.5rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      transition: box-shadow 0.2s ease;
    }

    .metric-card:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .metric-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      background: var(--accent-light, #f0f9ff);
      border-radius: 8px;
      color: var(--accent-primary, #0ea5e9);
    }

    .metric-content h3 {
      margin: 0;
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text-secondary, #666);
    }

    .metric-value {
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--text-primary, #1a1a1a);
    }

    .dashboard-content {
      background: var(--surface-primary, #ffffff);
      border: 1px solid var(--border-color, #e5e7eb);
      border-radius: 12px;
      padding: 1.5rem;
    }

    .recent-activity h2 {
      margin: 0 0 1rem 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--text-primary, #1a1a1a);
    }

    .activity-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .activity-item {
      display: flex;
      gap: 1rem;
      padding: 0.75rem 0;
      border-bottom: 1px solid var(--border-light, #f3f4f6);
    }

    .activity-item:last-child {
      border-bottom: none;
    }

    .activity-time {
      font-size: 0.875rem;
      color: var(--text-tertiary, #999);
      min-width: 80px;
      flex-shrink: 0;
    }

    .activity-description {
      font-size: 0.875rem;
      color: var(--text-secondary, #666);
    }

    @media (max-width: 768px) {
      .dashboard-container {
        padding: 1rem;
      }

      .dashboard-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class Dashboard {}
