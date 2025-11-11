# CommercialPresenceService - Guía de Uso

Este servicio gestiona la presencia de comerciales en tiempo real, incluyendo conexión, heartbeat automático y desconexión.

## Importación

```typescript
import { CommercialPresenceService } from '@guiders-frontend/commercial-presence';
```

## Casos de Uso

### 1. Conectar al Iniciar Sesión (App Initializer)

Conectar automáticamente cuando la aplicación se inicia y el usuario está autenticado:

```typescript
// app.config.ts
import { ApplicationConfig, APP_INITIALIZER } from '@angular/core';
import { CommercialPresenceService } from '@guiders-frontend/commercial-presence';
import { SessionService } from '@guiders-frontend/auth/data-access/session';

export function initializeCommercialPresence(
  presenceService: CommercialPresenceService,
  sessionService: SessionService
) {
  return () => {
    if (sessionService.isAuthenticated()) {
      return presenceService.connect().toPromise();
    }
    return Promise.resolve();
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    // ... otros providers
    {
      provide: APP_INITIALIZER,
      useFactory: initializeCommercialPresence,
      deps: [CommercialPresenceService, SessionService],
      multi: true
    }
  ]
};
```

### 2. Conectar en un Componente (Dashboard)

```typescript
// commercial-dashboard.component.ts
import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommercialPresenceService } from '@guiders-frontend/commercial-presence';

@Component({
  selector: 'app-commercial-dashboard',
  standalone: true,
  template: `
    <div>
      <h1>Dashboard Comercial</h1>
      <div class="status">
        Estado: {{ (presenceService.connectionStatus$ | async) || 'OFFLINE' }}
      </div>
      <button (click)="toggleStatus()">
        Cambiar a {{ currentStatus === 'CONNECTED' ? 'BUSY' : 'CONNECTED' }}
      </button>
    </div>
  `
})
export class CommercialDashboardComponent implements OnInit, OnDestroy {
  readonly presenceService = inject(CommercialPresenceService);
  currentStatus: 'CONNECTED' | 'BUSY' = 'CONNECTED';

  ngOnInit() {
    // Conectar al comercial cuando el dashboard se carga
    this.presenceService.connect().subscribe({
      next: (commercial) => {
        console.log('✅ Comercial conectado:', commercial);
      },
      error: (error) => {
        console.error('❌ Error al conectar:', error);
      }
    });
  }

  ngOnDestroy() {
    // Desconectar cuando el componente se destruye
    this.presenceService.disconnect().subscribe();
  }

  toggleStatus() {
    const newStatus = this.currentStatus === 'CONNECTED' ? 'BUSY' : 'CONNECTED';
    this.presenceService.updateStatus(newStatus).subscribe({
      next: () => {
        this.currentStatus = newStatus;
        console.log('✅ Estado actualizado:', newStatus);
      },
      error: (error) => {
        console.error('❌ Error al actualizar estado:', error);
      }
    });
  }
}
```

### 3. Uso con Guard (Proteger Rutas)

```typescript
// commercial-presence.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { CommercialPresenceService } from '@guiders-frontend/commercial-presence';

export const commercialPresenceGuard: CanActivateFn = () => {
  const presenceService = inject(CommercialPresenceService);
  const router = inject(Router);

  // Conectar antes de permitir acceso a la ruta
  return presenceService.connect().pipe(
    map(() => true),
    catchError((error) => {
      console.error('❌ Error al conectar comercial:', error);
      router.navigate(['/login']);
      return of(false);
    })
  );
};

// Uso en rutas
export const routes: Route[] = [
  {
    path: 'dashboard',
    component: CommercialDashboardComponent,
    canActivate: [authGuard, commercialPresenceGuard]
  }
];
```

### 4. Monitorear Estado de Conexión

```typescript
// connection-status.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CommercialPresenceService } from '@guiders-frontend/commercial-presence';

@Component({
  selector: 'app-connection-status',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="status-indicator" [class.connected]="isConnected$ | async">
      <span class="status-dot"></span>
      <span>{{ (connectionStatus$ | async) || 'OFFLINE' }}</span>
      <span class="last-activity" *ngIf="lastActivity$ | async as lastActivity">
        Última actividad: {{ lastActivity | date:'HH:mm:ss' }}
      </span>
    </div>
  `,
  styles: [`
    .status-indicator {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: var(--color-surface);
      border-radius: 8px;
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--color-error);
      transition: background 0.3s;
    }

    .connected .status-dot {
      background: var(--color-success);
    }

    .last-activity {
      font-size: 12px;
      color: var(--color-text-secondary);
    }
  `]
})
export class ConnectionStatusComponent {
  private readonly presenceService = inject(CommercialPresenceService);

  readonly isConnected$ = this.presenceService.isConnected$;
  readonly connectionStatus$ = this.presenceService.connectionStatus$;
  readonly lastActivity$ = this.presenceService.lastActivity$;
}
```

### 5. Enviar Heartbeat Manual con Metadata

```typescript
// chat-view.component.ts
import { Component, inject, OnInit } from '@angular/core';
import { CommercialPresenceService } from '@guiders-frontend/commercial-presence';

@Component({
  selector: 'app-chat-view',
  standalone: true,
  template: `
    <div>
      <!-- Tu UI de chat aquí -->
    </div>
  `
})
export class ChatViewComponent implements OnInit {
  private readonly presenceService = inject(CommercialPresenceService);
  private activeChats = 0;

  ngOnInit() {
    // Informar al servidor sobre la actividad específica
    this.presenceService.sendHeartbeat({
      action: 'viewing_chats',
      activeChats: this.activeChats
    }).subscribe();
  }

  onChatOpened() {
    this.activeChats++;

    // Actualizar metadata cuando cambia el número de chats
    this.presenceService.sendHeartbeat({
      action: 'managing_chats',
      activeChats: this.activeChats
    }).subscribe();
  }
}
```

### 6. Manejo de Errores

```typescript
// error-handling.component.ts
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CommercialPresenceService } from '@guiders-frontend/commercial-presence';

@Component({
  selector: 'app-error-handling',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="error-banner" *ngIf="error$ | async as error">
      <span>⚠️ {{ error }}</span>
      <button (click)="retry()">Reintentar</button>
    </div>
  `
})
export class ErrorHandlingComponent implements OnInit {
  private readonly presenceService = inject(CommercialPresenceService);
  readonly error$ = this.presenceService.error$;

  ngOnInit() {
    // Suscribirse a errores para logging o analytics
    this.error$.subscribe(error => {
      if (error) {
        console.error('[Presence Error]:', error);
        // Enviar a servicio de analytics/logging
      }
    });
  }

  retry() {
    this.presenceService.connect().subscribe({
      next: () => console.log('✅ Reconexión exitosa'),
      error: (err) => console.error('❌ Error al reconectar:', err)
    });
  }
}
```

### 7. Consultar Estado Manualmente

```typescript
// status-checker.component.ts
import { Component, inject } from '@angular/core';
import { CommercialPresenceService } from '@guiders-frontend/commercial-presence';

@Component({
  selector: 'app-status-checker',
  standalone: true,
  template: `
    <button (click)="checkStatus()">Verificar Estado</button>
    <div *ngIf="statusInfo">
      <p>Conectado: {{ statusInfo.isConnected }}</p>
      <p>Estado: {{ statusInfo.status }}</p>
      <p>Última actividad: {{ statusInfo.lastActivity | date:'medium' }}</p>
    </div>
  `
})
export class StatusCheckerComponent {
  private readonly presenceService = inject(CommercialPresenceService);
  statusInfo: ReturnType<typeof this.presenceService.getCurrentStatus> | null = null;

  checkStatus() {
    // Obtener estado síncrono (sin llamada HTTP)
    this.statusInfo = this.presenceService.getCurrentStatus();

    // O hacer llamada al servidor para verificar
    this.presenceService.getStatus().subscribe({
      next: (commercial) => {
        console.log('✅ Estado del servidor:', commercial);
      },
      error: (err) => {
        console.error('❌ Error al obtener estado:', err);
      }
    });
  }
}
```

## API del Servicio

### Métodos Principales

#### `connect(commercialId?: string, commercialName?: string): Observable<CommercialInfo>`
Conecta al comercial e inicia el heartbeat automático.
- Si no se proporcionan parámetros, usa el usuario actual del `UserService`
- Retorna información del comercial conectado
- Inicia heartbeat automático cada 60 segundos

#### `disconnect(): Observable<void>`
Desconecta al comercial y detiene el heartbeat.
- Se llama automáticamente al cerrar la pestaña/navegador
- Debe llamarse al hacer logout

#### `sendHeartbeat(metadata?: CommercialMetadata): Observable<CommercialInfo>`
Envía heartbeat manual (normalmente se hace automáticamente).
- Útil para enviar metadata adicional
- No es necesario llamarlo manualmente en la mayoría de casos

#### `updateStatus(status: ConnectionStatus): Observable<CommercialInfo>`
Cambia el estado de conexión del comercial.
- Estados: `'CONNECTED'`, `'BUSY'`, `'OFFLINE'`

#### `getStatus(commercialId?: string): Observable<CommercialInfo>`
Consulta el estado actual del servidor.
- Si no se proporciona ID, usa el comercial actual

#### `getCurrentStatus(): { isConnected: boolean; status: ConnectionStatus; lastActivity: Date | null }`
Obtiene el estado local (síncrono, sin llamada HTTP).

#### `getDebugInfo(): DebugInfo`
Obtiene métricas completas y estado de debug (síncrono).
- Información de conexión (ID, nombre, estado)
- Timing (inicio de sesión, último heartbeat, duración)
- Métricas (contador de heartbeats, reconexiones)
- Configuración (URLs, tokens)

#### `printDebugInfo(): void`
Imprime en consola un resumen formateado con toda la información de debug.
- Útil para debugging rápido
- Muestra estado completo del servicio

### Observables

- `isConnected$: Observable<boolean>` - Estado de conexión
- `connectionStatus$: Observable<ConnectionStatus>` - Estado actual
- `lastActivity$: Observable<Date | null>` - Última actividad registrada
- `error$: Observable<string | null>` - Últimos errores

## Comportamiento Automático

1. **Heartbeat**: Se envía cada 60 segundos automáticamente
2. **Reconexión**: Si el heartbeat falla, intenta reconectar después de 5 segundos
3. **Desconexión**: Al cerrar pestaña, usa `navigator.sendBeacon` para garantizar la desconexión
4. **Token expirado**: Si el token expira, emite un error y detiene el heartbeat

## Integración con AuthGuard

```typescript
// Asegurar desconexión al hacer logout
export const logoutGuard: CanDeactivateFn<unknown> = () => {
  const presenceService = inject(CommercialPresenceService);

  return presenceService.disconnect().pipe(
    map(() => true),
    catchError(() => of(true)) // Permitir logout incluso si falla la desconexión
  );
};
```

## Debugging y Monitoreo

### 8. Logs Detallados en Consola

El servicio incluye logs detallados de todas las operaciones para facilitar el debugging:

```typescript
// Los logs se muestran automáticamente en la consola del navegador

// Ejemplo de log de CONNECT:
// [CommercialPresenceService] 🔌 CONNECT - 2025-01-15T10:30:00.000Z
//   📤 Request: {
//     endpoint: "http://localhost:3000/api/v2/commercials/connect"
//     method: "POST"
//     commercialId: "123e4567-e89b-12d3-a456-426614174000"
//     commercialName: "juan@example.com"
//     metadata: { browser: "Chrome/120.0", timezone: "America/Mexico_City" }
//     hasAuthToken: true
//   }
// ✅ CONECTADO EXITOSAMENTE
//   🆔 Commercial ID: 123e4567-e89b-12d3-a456-426614174000
//   👤 Nombre: juan@example.com
//   🟢 Estado: CONNECTED
//   ⏰ Última actividad: 2025-01-15T10:30:00.000Z
//   🕐 Hora de conexión: 2025-01-15T10:30:00.000Z
//   ⏱️ Intervalo de heartbeat: 60s

// Ejemplo de log de HEARTBEAT:
// [CommercialPresenceService] 💓 HEARTBEAT #1 - 2025-01-15T10:31:00.000Z
//   📤 Request: {
//     endpoint: "http://localhost:3000/api/v2/commercials/heartbeat"
//     method: "PUT"
//     commercialId: "123e4567-e89b-12d3-a456-426614174000"
//     lastActivity: "2025-01-15T10:31:00.000Z"
//     metadata: { browser: "Chrome/120.0", timezone: "America/Mexico_City" }
//     timeSinceLastHeartbeat: "60s"
//     timeSinceConnection: "60s"
//     hasAuthToken: true
//   }
// ✅ Heartbeat #1 exitoso - Estado: CONNECTED | Activo: true | Próximo en 60s
```

### 9. Método de Debug

Usa `printDebugInfo()` para obtener un resumen completo del estado:

```typescript
// debug-panel.component.ts
import { Component, inject } from '@angular/core';
import { CommercialPresenceService } from '@guiders-frontend/commercial-presence';

@Component({
  selector: 'app-debug-panel',
  standalone: true,
  template: `
    <button (click)="showDebug()">Mostrar Estado de Presencia</button>
  `
})
export class DebugPanelComponent {
  private readonly presenceService = inject(CommercialPresenceService);

  showDebug() {
    // Imprime en consola un resumen formateado
    this.presenceService.printDebugInfo();

    // O obtén los datos para mostrarlos en la UI
    const debugInfo = this.presenceService.getDebugInfo();
    console.log('Heartbeats enviados:', debugInfo.heartbeatCount);
    console.log('Tiempo desde último heartbeat:', debugInfo.timeSinceLastHeartbeat);
    console.log('Duración de sesión:', debugInfo.sessionDuration);
  }
}
```

### 10. Monitoreo en Producción

Para monitoreo en producción, puedes capturar los logs y enviarlos a tu servicio de analytics:

```typescript
// monitoring.service.ts
import { Injectable, inject } from '@angular/core';
import { CommercialPresenceService } from '@guiders-frontend/commercial-presence';
import { interval } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class MonitoringService {
  private readonly presenceService = inject(CommercialPresenceService);

  startMonitoring() {
    // Cada 5 minutos, enviar métricas a analytics
    interval(300000).subscribe(() => {
      const debugInfo = this.presenceService.getDebugInfo();

      if (debugInfo.isConnected) {
        // Enviar a tu servicio de analytics
        this.sendToAnalytics({
          commercialId: debugInfo.commercialId,
          sessionDuration: debugInfo.sessionDuration,
          heartbeatCount: debugInfo.heartbeatCount,
          reconnectAttempts: debugInfo.reconnectAttempts,
          timeSinceLastHeartbeat: debugInfo.timeSinceLastHeartbeat
        });
      }
    });
  }

  private sendToAnalytics(data: any) {
    // Implementar envío a tu servicio de analytics
    console.log('📊 Métricas de presencia:', data);
  }
}
```

### Estructura de Logs

Todos los logs siguen este formato:

```
[CommercialPresenceService] {EMOJI} {OPERACIÓN} - {TIMESTAMP}
  📤 Request: { ... }  // Información de la petición HTTP
  📥 Response: { ... } // Información de la respuesta HTTP
  ✅ / ❌ Resultado    // Estado final de la operación
```

**Emojis utilizados:**
- 🔌 `CONNECT` - Conexión inicial
- 💓 `HEARTBEAT` - Envío de heartbeat
- 👋 `DISCONNECT` - Desconexión
- 🔄 `UPDATE STATUS` - Cambio de estado
- 🔄 `RECONEXIÓN` - Intento de reconexión
- 📡 `BEFOREUNLOAD` - Cierre de pestaña
- 📊 `DEBUG INFO` - Información de debug
- ❌ Error
- ✅ Éxito
- ⚠️ Advertencia

## Mejores Prácticas

1. ✅ Conectar en el `APP_INITIALIZER` o guard de ruta
2. ✅ Desconectar en `ngOnDestroy` o al hacer logout
3. ✅ No llamar `sendHeartbeat()` manualmente (se hace automáticamente)
4. ✅ Usar `updateStatus()` cuando el comercial está ocupado
5. ✅ Monitorear `error$` para logging y analytics
6. ✅ Usar `printDebugInfo()` para debugging durante desarrollo
7. ✅ Capturar métricas con `getDebugInfo()` para monitoreo en producción
8. ❌ No crear múltiples instancias del servicio (usa `providedIn: 'root'`)
9. ❌ No olvidar desconectar al cerrar sesión
10. ❌ No deshabilitar los logs en desarrollo (son útiles para debugging)

## Troubleshooting

### El comercial no aparece como conectado
- Verificar que `connect()` se haya llamado exitosamente
- Revisar que el token de autenticación sea válido
- Verificar logs del navegador para errores HTTP

### Heartbeat falla constantemente
- Verificar conectividad a internet
- Revisar que el backend esté disponible en `${API_URL}/v2/commercials/heartbeat`
- Verificar que el token no haya expirado

### El comercial no se desconecta al cerrar pestaña
- Esto es normal si el navegador bloquea `sendBeacon`
- El backend debe tener timeout de 5 minutos para marcar offline automáticamente

## Ejemplo Completo

Ver el archivo de ejemplo en:
`apps/console/src/app/examples/commercial-presence-example.component.ts`
