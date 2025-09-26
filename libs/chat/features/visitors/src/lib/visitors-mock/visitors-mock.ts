import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'lib-visitors-mock',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="visitors-mock-container">
      <h1>🧪 Visitors Mock - Prueba de Rutas</h1>
      
      <div class="test-status">
        <h2>✅ Estado de Pruebas</h2>
        <ul>
          <li>✅ Componente se renderiza correctamente</li>
          <li>✅ Rutas Angular funcionando</li>
          <li>✅ Navegación desde sidebar operativa</li>
          <li>✅ Lazy loading funcionando</li>
        </ul>
      </div>

      <div class="mock-data">
        <h2>👥 Visitantes Mock</h2>
        
        <div class="stats-cards">
          <div class="stat-card">
            <span class="stat-number">42</span>
            <span class="stat-label">Total Visitantes</span>
          </div>
          <div class="stat-card">
            <span class="stat-number">18</span>
            <span class="stat-label">En Línea</span>
          </div>
          <div class="stat-card">
            <span class="stat-number">5</span>
            <span class="stat-label">Con Chat Activo</span>
          </div>
          <div class="stat-card">
            <span class="stat-number">3</span>
            <span class="stat-label">En Cola</span>
          </div>
        </div>

        <div class="visitors-list">
          <h3>Lista de Visitantes de Prueba:</h3>
          
          <div class="visitor-item" *ngFor="let visitor of mockVisitors">
            <div class="visitor-avatar">{{ visitor.avatar }}</div>
            <div class="visitor-info">
              <div class="visitor-name">{{ visitor.name }}</div>
              <div class="visitor-email">{{ visitor.email }}</div>
            </div>
            <div class="visitor-status" [class]="'status-' + visitor.status">
              {{ visitor.status }}
            </div>
            <div class="visitor-actions">
              <button class="btn-chat" (click)="startChat(visitor)">💬 Iniciar Chat</button>
            </div>
          </div>
        </div>
      </div>

      <div class="debug-info">
        <h2>🐛 Información de Debug</h2>
        <p><strong>Ruta actual:</strong> {{ currentRoute }}</p>
        <p><strong>Timestamp:</strong> {{ timestamp }}</p>
        <p><strong>Componente:</strong> VisitorsMockComponent</p>
        
        <div class="navigation-test">
          <h3>Prueba de Navegación:</h3>
          <p>Si puedes ver esta página, significa que:</p>
          <ul>
            <li>✅ Las rutas están configuradas correctamente</li>
            <li>✅ El lazy loading funciona</li>
            <li>✅ La navegación desde el sidebar es exitosa</li>
          </ul>
          
          <p><em>Ahora puedes comparar con el componente real de visitantes para identificar el problema.</em></p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .visitors-mock-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }

    h1 {
      color: #2563eb;
      font-size: 24px;
      margin-bottom: 20px;
    }

    h2 {
      color: #374151;
      font-size: 18px;
      margin: 20px 0 10px 0;
    }

    h3 {
      color: #4b5563;
      font-size: 16px;
      margin: 15px 0 10px 0;
    }

    .test-status {
      background: #dcfce7;
      border: 1px solid #16a34a;
      border-radius: 8px;
      padding: 15px;
      margin-bottom: 20px;
    }

    .test-status ul {
      margin: 10px 0 0 20px;
    }

    .test-status li {
      color: #16a34a;
      margin: 5px 0;
    }

    .mock-data {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
    }

    .stats-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 15px;
      margin-bottom: 25px;
    }

    .stat-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 15px;
      text-align: center;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .stat-number {
      display: block;
      font-size: 24px;
      font-weight: bold;
      color: #2563eb;
    }

    .stat-label {
      display: block;
      font-size: 12px;
      color: #6b7280;
      margin-top: 4px;
    }

    .visitors-list {
      margin-top: 20px;
    }

    .visitor-item {
      display: flex;
      align-items: center;
      padding: 12px;
      margin: 8px 0;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    }

    .visitor-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      margin-right: 12px;
    }

    .visitor-info {
      flex: 1;
    }

    .visitor-name {
      font-weight: 500;
      color: #374151;
    }

    .visitor-email {
      font-size: 14px;
      color: #6b7280;
    }

    .visitor-status {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
      margin-right: 12px;
    }

    .status-online {
      background: #dcfce7;
      color: #16a34a;
    }

    .status-idle {
      background: #fef3c7;
      color: #d97706;
    }

    .status-offline {
      background: #f3f4f6;
      color: #6b7280;
    }

    .btn-chat {
      background: #2563eb;
      color: white;
      border: none;
      padding: 6px 12px;
      border-radius: 4px;
      font-size: 12px;
      cursor: pointer;
      transition: background 0.2s;
    }

    .btn-chat:hover {
      background: #1d4ed8;
    }

    .debug-info {
      background: #fef2f2;
      border: 1px solid #f87171;
      border-radius: 8px;
      padding: 15px;
    }

    .debug-info p {
      margin: 8px 0;
      color: #374151;
    }

    .debug-info strong {
      color: #dc2626;
    }

    .navigation-test {
      margin-top: 15px;
      padding: 15px;
      background: #fff7ed;
      border-radius: 6px;
    }

    .navigation-test ul {
      margin: 10px 0 0 20px;
    }

    .navigation-test li {
      color: #ea580c;
      margin: 3px 0;
    }

    .navigation-test em {
      color: #7c2d12;
      font-style: italic;
    }
  `]
})
export class VisitorsMockComponent {
  currentRoute = window.location.pathname + window.location.search;
  timestamp = new Date().toLocaleString();

  mockVisitors = [
    {
      id: '1',
      name: 'Ana García Test',
      email: 'ana@test.com',
      avatar: '👩',
      status: 'online'
    },
    {
      id: '2',  
      name: 'Carlos López Test',
      email: 'carlos@test.com',
      avatar: '👨',
      status: 'idle'
    },
    {
      id: '3',
      name: 'María Rodríguez Test',
      email: 'maria@test.com',
      avatar: '👱‍♀️',
      status: 'online'
    },
    {
      id: '4',
      name: 'Juan Martín Test',
      email: 'juan@test.com', 
      avatar: '🧑',
      status: 'offline'
    }
  ];

  startChat(visitor: { id: string; name: string; email: string; avatar: string; status: string }) {
    alert(`💬 Iniciando chat con ${visitor.name}\n\nEsto es una prueba mock. En el componente real, aquí se abriría el modal para crear el chat.`);
  }
}