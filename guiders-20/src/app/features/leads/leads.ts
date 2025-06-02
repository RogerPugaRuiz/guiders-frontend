import { Component } from '@angular/core';

/**
 * Componente Leads para gestión de prospectos y clientes potenciales
 */
@Component({
  selector: 'app-leads',
  imports: [],
  template: `
    <div class="leads-container">
      <header class="leads-header">
        <div class="header-content">
          <h1>Gestión de Leads</h1>
          <p>Administra tus prospectos y oportunidades de venta</p>
        </div>
        <button class="add-lead-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 8v8"/>
            <path d="M8 12h8"/>
          </svg>
          Nuevo Lead
        </button>
      </header>

      <div class="leads-stats">
        <div class="stat-card">
          <h3>Total Leads</h3>
          <span class="stat-value">47</span>
        </div>
        <div class="stat-card">
          <h3>Nuevos hoy</h3>
          <span class="stat-value">8</span>
        </div>
        <div class="stat-card">
          <h3>Cualificados</h3>
          <span class="stat-value">23</span>
        </div>
        <div class="stat-card">
          <h3>Convertidos</h3>
          <span class="stat-value">12</span>
        </div>
      </div>

      <div class="leads-filters">
        <input type="text" placeholder="Buscar leads..." class="search-input">
        <select class="filter-select">
          <option>Todos los estados</option>
          <option>Nuevo</option>
          <option>Contactado</option>
          <option>Cualificado</option>
          <option>Propuesta</option>
          <option>Convertido</option>
        </select>
        <select class="filter-select">
          <option>Todas las fuentes</option>
          <option>Website</option>
          <option>Chat</option>
          <option>Email</option>
          <option>Referido</option>
        </select>
      </div>

      <div class="leads-table">
        <div class="table-header">
          <span class="col-name">Nombre</span>
          <span class="col-company">Empresa</span>
          <span class="col-source">Fuente</span>
          <span class="col-status">Estado</span>
          <span class="col-value">Valor</span>
          <span class="col-actions">Acciones</span>
        </div>

        <div class="table-row">
          <div class="col-name">
            <div class="lead-info">
              <div class="lead-avatar">AM</div>
              <div>
                <div class="lead-name">Ana Martínez</div>
                <div class="lead-email">ana.martinez&#64;empresa.com</div>
              </div>
            </div>
          </div>
          <div class="col-company">Tech Solutions S.A.</div>
          <div class="col-source">
            <span class="source-badge source-website">Website</span>
          </div>
          <div class="col-status">
            <span class="status-badge status-qualified">Cualificado</span>
          </div>
          <div class="col-value">€15,000</div>
          <div class="col-actions">
            <button class="action-btn-sm">Editar</button>
            <button class="action-btn-sm">Ver</button>
          </div>
        </div>

        <div class="table-row">
          <div class="col-name">
            <div class="lead-info">
              <div class="lead-avatar">LP</div>
              <div>
                <div class="lead-name">Luis Pérez</div>
                <div class="lead-email">l.perez&#64;startup.io</div>
              </div>
            </div>
          </div>
          <div class="col-company">Startup Innovation</div>
          <div class="col-source">
            <span class="source-badge source-chat">Chat</span>
          </div>
          <div class="col-status">
            <span class="status-badge status-new">Nuevo</span>
          </div>
          <div class="col-value">€8,500</div>
          <div class="col-actions">
            <button class="action-btn-sm">Editar</button>
            <button class="action-btn-sm">Ver</button>
          </div>
        </div>

        <div class="table-row">
          <div class="col-name">
            <div class="lead-info">
              <div class="lead-avatar">SF</div>
              <div>
                <div class="lead-name">Sara Fernández</div>
                <div class="lead-email">sara&#64;consulting.com</div>
              </div>
            </div>
          </div>
          <div class="col-company">Business Consulting</div>
          <div class="col-source">
            <span class="source-badge source-email">Email</span>
          </div>
          <div class="col-status">
            <span class="status-badge status-proposal">Propuesta</span>
          </div>
          <div class="col-value">€25,000</div>
          <div class="col-actions">
            <button class="action-btn-sm">Editar</button>
            <button class="action-btn-sm">Ver</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .leads-container {
      padding: 2rem;
      max-width: 1400px;
    }

    .leads-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 2rem;
    }

    .header-content h1 {
      margin: 0;
      font-size: 2rem;
      font-weight: 600;
      color: var(--text-primary, #1a1a1a);
    }

    .header-content p {
      margin: 0.5rem 0 0 0;
      color: var(--text-secondary, #666);
    }

    .add-lead-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      background: var(--accent-primary, #0ea5e9);
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s ease;
    }

    .add-lead-btn:hover {
      background: var(--accent-dark, #0284c7);
    }

    .leads-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      background: var(--surface-primary, #ffffff);
      border: 1px solid var(--border-color, #e5e7eb);
      border-radius: 12px;
      padding: 1.5rem;
      text-align: center;
    }

    .stat-card h3 {
      margin: 0;
      font-size: 0.875rem;
      color: var(--text-secondary, #666);
      font-weight: 500;
    }

    .stat-value {
      display: block;
      font-size: 2rem;
      font-weight: 600;
      color: var(--text-primary, #1a1a1a);
      margin-top: 0.5rem;
    }

    .leads-filters {
      display: flex;
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .search-input {
      flex: 1;
      padding: 0.75rem 1rem;
      border: 1px solid var(--border-color, #e5e7eb);
      border-radius: 8px;
      font-size: 0.875rem;
    }

    .filter-select {
      padding: 0.75rem 1rem;
      border: 1px solid var(--border-color, #e5e7eb);
      border-radius: 8px;
      background: var(--surface-primary, #ffffff);
      font-size: 0.875rem;
    }

    .leads-table {
      background: var(--surface-primary, #ffffff);
      border: 1px solid var(--border-color, #e5e7eb);
      border-radius: 12px;
      overflow: hidden;
    }

    .table-header {
      display: grid;
      grid-template-columns: 2fr 1.5fr 1fr 1fr 1fr 1fr;
      gap: 1rem;
      padding: 1rem 1.5rem;
      background: var(--surface-secondary, #f8fafc);
      font-weight: 500;
      font-size: 0.875rem;
      color: var(--text-secondary, #666);
    }

    .table-row {
      display: grid;
      grid-template-columns: 2fr 1.5fr 1fr 1fr 1fr 1fr;
      gap: 1rem;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid var(--border-light, #f3f4f6);
      align-items: center;
    }

    .table-row:last-child {
      border-bottom: none;
    }

    .lead-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .lead-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: var(--accent-primary, #0ea5e9);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 500;
      font-size: 0.75rem;
    }

    .lead-name {
      font-weight: 500;
      color: var(--text-primary, #1a1a1a);
    }

    .lead-email {
      font-size: 0.75rem;
      color: var(--text-tertiary, #999);
    }

    .source-badge, .status-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .source-website {
      background: var(--info-light, #e0f2fe);
      color: var(--info-primary, #0284c7);
    }

    .source-chat {
      background: var(--success-light, #dcfce7);
      color: var(--success-primary, #16a34a);
    }

    .source-email {
      background: var(--warning-light, #fef3c7);
      color: var(--warning-primary, #d97706);
    }

    .status-new {
      background: var(--accent-light, #f0f9ff);
      color: var(--accent-primary, #0ea5e9);
    }

    .status-qualified {
      background: var(--success-light, #dcfce7);
      color: var(--success-primary, #16a34a);
    }

    .status-proposal {
      background: var(--warning-light, #fef3c7);
      color: var(--warning-primary, #d97706);
    }

    .action-btn-sm {
      padding: 0.25rem 0.75rem;
      background: transparent;
      border: 1px solid var(--border-color, #e5e7eb);
      border-radius: 4px;
      font-size: 0.75rem;
      cursor: pointer;
      margin-right: 0.5rem;
    }

    .action-btn-sm:hover {
      background: var(--surface-secondary, #f8fafc);
    }

    @media (max-width: 1024px) {
      .leads-container {
        padding: 1rem;
      }

      .leads-header {
        flex-direction: column;
        gap: 1rem;
      }

      .leads-filters {
        flex-direction: column;
      }

      .table-header,
      .table-row {
        grid-template-columns: 1fr;
        gap: 0.5rem;
      }

      .col-name::before { content: "Nombre: "; font-weight: 500; }
      .col-company::before { content: "Empresa: "; font-weight: 500; }
      .col-source::before { content: "Fuente: "; font-weight: 500; }
      .col-status::before { content: "Estado: "; font-weight: 500; }
      .col-value::before { content: "Valor: "; font-weight: 500; }
    }
  `]
})
export class Leads {}
