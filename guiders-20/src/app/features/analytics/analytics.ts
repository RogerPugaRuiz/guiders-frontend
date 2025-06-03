import { Component } from '@angular/core';

/**
 * Componente Analytics para mostrar estadísticas y análisis de rendimiento
 */
@Component({
  selector: 'app-analytics',
  imports: [],
  template: `
    <div class="analytics-container">
      <header class="analytics-header">
        <h1>Análisis de Rendimiento</h1>
        <p>Métricas detalladas y tendencias de tu negocio</p>
      </header>

      <div class="time-filter">
        <div class="filter-tabs">
          <button class="tab-btn active">7 días</button>
          <button class="tab-btn">30 días</button>
          <button class="tab-btn">90 días</button>
          <button class="tab-btn">12 meses</button>
        </div>
      </div>

      <div class="analytics-grid">
        <div class="analytics-card chart-card">
          <h3>Conversaciones por Día</h3>
          <div class="chart-placeholder">
            <div class="chart-bars">
              <div class="bar" style="height: 60%"></div>
              <div class="bar" style="height: 80%"></div>
              <div class="bar" style="height: 45%"></div>
              <div class="bar" style="height: 90%"></div>
              <div class="bar" style="height: 75%"></div>
              <div class="bar" style="height: 95%"></div>
              <div class="bar" style="height: 85%"></div>
            </div>
            <div class="chart-labels">
              <span>Lun</span>
              <span>Mar</span>
              <span>Mié</span>
              <span>Jue</span>
              <span>Vie</span>
              <span>Sáb</span>
              <span>Dom</span>
            </div>
          </div>
        </div>

        <div class="analytics-card">
          <h3>Tasa de Conversión</h3>
          <div class="metric-display">
            <span class="big-number">67.8%</span>
            <span class="trend positive">+5.2%</span>
          </div>
          <p class="metric-description">Vs. periodo anterior</p>
        </div>

        <div class="analytics-card">
          <h3>Tiempo Promedio de Respuesta</h3>
          <div class="metric-display">
            <span class="big-number">2.3 min</span>
            <span class="trend negative">+0.5 min</span>
          </div>
          <p class="metric-description">Vs. periodo anterior</p>
        </div>

        <div class="analytics-card">
          <h3>Satisfacción del Cliente</h3>
          <div class="metric-display">
            <span class="big-number">4.8/5</span>
            <span class="trend positive">+0.2</span>
          </div>
          <p class="metric-description">Basado en 142 valoraciones</p>
        </div>

        <div class="analytics-card chart-card">
          <h3>Fuentes de Leads</h3>
          <div class="pie-chart">
            <div class="pie-segment" data-percentage="45" style="--percentage: 45; --color: var(--accent-primary, #0ea5e9)"></div>
            <div class="pie-legend">
              <div class="legend-item">
                <span class="legend-color" style="background: var(--accent-primary, #0ea5e9)"></span>
                <span>Website (45%)</span>
              </div>
              <div class="legend-item">
                <span class="legend-color" style="background: var(--success-primary, #16a34a)"></span>
                <span>Chat (30%)</span>
              </div>
              <div class="legend-item">
                <span class="legend-color" style="background: var(--warning-primary, #d97706)"></span>
                <span>Email (15%)</span>
              </div>
              <div class="legend-item">
                <span class="legend-color" style="background: var(--info-primary, #0284c7)"></span>
                <span>Referidos (10%)</span>
              </div>
            </div>
          </div>
        </div>

        <div class="analytics-card">
          <h3>Ingresos del Mes</h3>
          <div class="metric-display">
            <span class="big-number">€45,280</span>
            <span class="trend positive">+12.5%</span>
          </div>
          <p class="metric-description">Objetivo: €50,000</p>
          <div class="progress-bar">
            <div class="progress-fill" style="width: 90.6%"></div>
          </div>
        </div>
      </div>

      <div class="top-performers">
        <h2>Mejores Agentes</h2>
        <div class="performers-list">
          <div class="performer-item">
            <div class="performer-info">
              <div class="performer-avatar">MR</div>
              <div>
                <div class="performer-name">María Rodríguez</div>
                <div class="performer-role">Agente Senior</div>
              </div>
            </div>
            <div class="performer-metrics">
              <span class="metric">45 conversaciones</span>
              <span class="metric">92% satisfacción</span>
              <span class="metric">1.8 min respuesta</span>
            </div>
          </div>

          <div class="performer-item">
            <div class="performer-info">
              <div class="performer-avatar">JL</div>
              <div>
                <div class="performer-name">José López</div>
                <div class="performer-role">Agente</div>
              </div>
            </div>
            <div class="performer-metrics">
              <span class="metric">38 conversaciones</span>
              <span class="metric">89% satisfacción</span>
              <span class="metric">2.1 min respuesta</span>
            </div>
          </div>

          <div class="performer-item">
            <div class="performer-info">
              <div class="performer-avatar">AG</div>
              <div>
                <div class="performer-name">Ana García</div>
                <div class="performer-role">Agente</div>
              </div>
            </div>
            <div class="performer-metrics">
              <span class="metric">42 conversaciones</span>
              <span class="metric">87% satisfacción</span>
              <span class="metric">2.3 min respuesta</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .analytics-container {
      padding: 2rem;
      max-width: 1400px;
    }

    .analytics-header {
      margin-bottom: 2rem;
    }

    .analytics-header h1 {
      margin: 0;
      font-size: 2rem;
      font-weight: 600;
      color: var(--text-primary, #1a1a1a);
    }

    .analytics-header p {
      margin: 0.5rem 0 0 0;
      color: var(--text-secondary, #666);
    }

    .time-filter {
      margin-bottom: 2rem;
    }

    .filter-tabs {
      display: flex;
      gap: 0.5rem;
    }

    .tab-btn {
      padding: 0.5rem 1rem;
      border: 1px solid var(--border-color, #e5e7eb);
      background: var(--surface-primary, #ffffff);
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.875rem;
      transition: all 0.2s ease;
    }

    .tab-btn.active {
      background: var(--accent-primary, #0ea5e9);
      color: white;
      border-color: var(--accent-primary, #0ea5e9);
    }

    .analytics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .analytics-card {
      background: var(--surface-primary, #ffffff);
      border: 1px solid var(--border-color, #e5e7eb);
      border-radius: 12px;
      padding: 1.5rem;
    }

    .analytics-card h3 {
      margin: 0 0 1rem 0;
      font-size: 1rem;
      font-weight: 500;
      color: var(--text-primary, #1a1a1a);
    }

    .chart-card {
      grid-column: span 2;
    }

    .chart-placeholder {
      height: 200px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .chart-bars {
      display: flex;
      align-items: end;
      gap: 0.5rem;
      height: 160px;
    }

    .bar {
      flex: 1;
      background: var(--accent-primary, #0ea5e9);
      border-radius: 4px 4px 0 0;
      min-height: 20px;
      opacity: 0.8;
    }

    .chart-labels {
      display: flex;
      justify-content: space-between;
      font-size: 0.75rem;
      color: var(--text-tertiary, #999);
      margin-top: 0.5rem;
    }

    .metric-display {
      display: flex;
      align-items: baseline;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
    }

    .big-number {
      font-size: 2rem;
      font-weight: 600;
      color: var(--text-primary, #1a1a1a);
    }

    .trend {
      font-size: 0.875rem;
      font-weight: 500;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
    }

    .trend.positive {
      background: var(--success-light, #dcfce7);
      color: var(--success-primary, #16a34a);
    }

    .trend.negative {
      background: var(--error-light, #fee2e2);
      color: var(--error-primary, #dc2626);
    }

    .metric-description {
      margin: 0;
      font-size: 0.875rem;
      color: var(--text-secondary, #666);
    }

    .pie-chart {
      display: flex;
      align-items: center;
      gap: 2rem;
    }

    .pie-legend {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
    }

    .legend-color {
      width: 12px;
      height: 12px;
      border-radius: 50%;
    }

    .progress-bar {
      width: 100%;
      height: 8px;
      background: var(--border-light, #f3f4f6);
      border-radius: 4px;
      overflow: hidden;
      margin-top: 1rem;
    }

    .progress-fill {
      height: 100%;
      background: var(--success-primary, #16a34a);
      transition: width 0.3s ease;
    }

    .top-performers {
      background: var(--surface-primary, #ffffff);
      border: 1px solid var(--border-color, #e5e7eb);
      border-radius: 12px;
      padding: 1.5rem;
    }

    .top-performers h2 {
      margin: 0 0 1.5rem 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--text-primary, #1a1a1a);
    }

    .performers-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .performer-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      background: var(--surface-secondary, #f8fafc);
      border-radius: 8px;
    }

    .performer-info {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .performer-avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: var(--accent-primary, #0ea5e9);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 500;
      font-size: 0.875rem;
    }

    .performer-name {
      font-weight: 500;
      color: var(--text-primary, #1a1a1a);
    }

    .performer-role {
      font-size: 0.875rem;
      color: var(--text-secondary, #666);
    }

    .performer-metrics {
      display: flex;
      gap: 1.5rem;
    }

    .performer-metrics .metric {
      font-size: 0.875rem;
      color: var(--text-secondary, #666);
    }

    @media (max-width: 1024px) {
      .analytics-container {
        padding: 1rem;
      }

      .analytics-grid {
        grid-template-columns: 1fr;
      }

      .chart-card {
        grid-column: span 1;
      }

      .performer-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }

      .performer-metrics {
        flex-direction: column;
        gap: 0.5rem;
      }
    }

    @media (max-width: 768px) {
      .filter-tabs {
        flex-direction: column;
      }

      .pie-chart {
        flex-direction: column;
        text-align: center;
      }
    }
  `]
})
export class Analytics {}
