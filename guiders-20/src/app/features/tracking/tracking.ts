import { Component } from '@angular/core';

/**
 * Componente Tracking para seguimiento de conversaciones y clientes
 */
@Component({
  selector: 'app-tracking',
  imports: [],
  template: `
    <div class="tracking-container">
      <header class="tracking-header">
        <h1>Seguimiento</h1>
        <p>Monitorea el progreso de tus conversaciones y clientes</p>
      </header>

      <div class="tracking-filters">
        <select class="filter-select">
          <option>Todos los estados</option>
          <option>En progreso</option>
          <option>Pendiente</option>
          <option>Completado</option>
        </select>
        <select class="filter-select">
          <option>Últimos 7 días</option>
          <option>Últimos 30 días</option>
          <option>Últimos 90 días</option>
        </select>
      </div>

      <div class="tracking-list">
        <div class="tracking-item">
          <div class="tracking-info">
            <div class="tracking-avatar">
              <span>JD</span>
            </div>
            <div class="tracking-details">
              <h3>Juan Pérez</h3>
              <p>Interesado en plan premium</p>
              <span class="tracking-time">Última actividad: hace 2 horas</span>
            </div>
          </div>
          <div class="tracking-status">
            <span class="status-badge status-active">En progreso</span>
            <button class="action-btn">Ver detalles</button>
          </div>
        </div>

        <div class="tracking-item">
          <div class="tracking-info">
            <div class="tracking-avatar">
              <span>MG</span>
            </div>
            <div class="tracking-details">
              <h3>María González</h3>
              <p>Consulta sobre precios</p>
              <span class="tracking-time">Última actividad: hace 1 día</span>
            </div>
          </div>
          <div class="tracking-status">
            <span class="status-badge status-pending">Pendiente</span>
            <button class="action-btn">Ver detalles</button>
          </div>
        </div>

        <div class="tracking-item">
          <div class="tracking-info">
            <div class="tracking-avatar">
              <span>CR</span>
            </div>
            <div class="tracking-details">
              <h3>Carlos Rodríguez</h3>
              <p>Demo completada</p>
              <span class="tracking-time">Última actividad: hace 3 días</span>
            </div>
          </div>
          <div class="tracking-status">
            <span class="status-badge status-completed">Completado</span>
            <button class="action-btn">Ver detalles</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .tracking-container {
      padding: 2rem;
      max-width: 1200px;
    }

    .tracking-header {
      margin-bottom: 2rem;
    }

    .tracking-header h1 {
      margin: 0;
      font-size: 2rem;
      font-weight: 600;
      color: var(--text-primary, #1a1a1a);
    }

    .tracking-header p {
      margin: 0.5rem 0 0 0;
      color: var(--text-secondary, #666);
    }

    .tracking-filters {
      display: flex;
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .filter-select {
      padding: 0.5rem 1rem;
      border: 1px solid var(--border-color, #e5e7eb);
      border-radius: 8px;
      background: var(--surface-primary, #ffffff);
      color: var(--text-primary, #1a1a1a);
      font-size: 0.875rem;
    }

    .tracking-list {
      background: var(--surface-primary, #ffffff);
      border: 1px solid var(--border-color, #e5e7eb);
      border-radius: 12px;
      overflow: hidden;
    }

    .tracking-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      border-bottom: 1px solid var(--border-light, #f3f4f6);
    }

    .tracking-item:last-child {
      border-bottom: none;
    }

    .tracking-info {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .tracking-avatar {
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

    .tracking-details h3 {
      margin: 0;
      font-size: 1rem;
      font-weight: 500;
      color: var(--text-primary, #1a1a1a);
    }

    .tracking-details p {
      margin: 0.25rem 0;
      font-size: 0.875rem;
      color: var(--text-secondary, #666);
    }

    .tracking-time {
      font-size: 0.75rem;
      color: var(--text-tertiary, #999);
    }

    .tracking-status {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .status-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .status-active {
      background: var(--success-light, #dcfce7);
      color: var(--success-primary, #16a34a);
    }

    .status-pending {
      background: var(--warning-light, #fef3c7);
      color: var(--warning-primary, #d97706);
    }

    .status-completed {
      background: var(--info-light, #e0f2fe);
      color: var(--info-primary, #0284c7);
    }

    .action-btn {
      padding: 0.5rem 1rem;
      background: var(--accent-primary, #0ea5e9);
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 0.875rem;
      cursor: pointer;
      transition: background 0.2s ease;
    }

    .action-btn:hover {
      background: var(--accent-dark, #0284c7);
    }

    @media (max-width: 768px) {
      .tracking-container {
        padding: 1rem;
      }

      .tracking-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }

      .tracking-status {
        width: 100%;
        justify-content: space-between;
      }

      .tracking-filters {
        flex-direction: column;
      }
    }
  `]
})
export class Tracking {}
