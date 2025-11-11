# Commercial Presence Service

Servicio de presencia en tiempo real para comerciales, con heartbeat automático, reconexión automática y logging detallado.

## Instalación

```typescript
import { CommercialPresenceService } from '@guiders-frontend/commercial-presence';
```

## Uso Básico

```typescript
import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommercialPresenceService } from '@guiders-frontend/commercial-presence';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  template: `
    <div>Estado: {{ (presenceService.connectionStatus$ | async) }}</div>
  `
})
export class DashboardComponent implements OnInit, OnDestroy {
  readonly presenceService = inject(CommercialPresenceService);

  ngOnInit() {
    // Conectar al cargar
    this.presenceService.connect().subscribe({
      next: (info) => console.log('✅ Conectado:', info),
      error: (err) => console.error('❌ Error:', err)
    });
  }

  ngOnDestroy() {
    // Desconectar al destruir
    this.presenceService.disconnect().subscribe();
  }
}
```

## Características

### ✅ Conexión y Heartbeat Automático
- Heartbeat cada 60 segundos
- Reconexión automática si falla
- Desconexión automática al cerrar pestaña

### 📊 Logging Detallado
Todos los logs están agrupados y formateados para facilitar el debugging:

```
[CommercialPresenceService] 🔌 CONNECT - 2025-01-15T10:30:00.000Z
  📤 Request:
    endpoint: "http://localhost:3000/api/v2/commercials/connect"
    method: "POST"
    commercialId: "123e4567-e89b-12d3-a456-426614174000"
    hasAuthToken: true
  ✅ CONECTADO EXITOSAMENTE
    🆔 Commercial ID: 123e4567-e89b-12d3-a456-426614174000
    🟢 Estado: CONNECTED
    ⏱️ Intervalo de heartbeat: 60s

[CommercialPresenceService] 💓 HEARTBEAT #1 - 2025-01-15T10:31:00.000Z
  📤 Request:
    timeSinceLastHeartbeat: "60s"
    timeSinceConnection: "60s"
  ✅ Heartbeat #1 exitoso - Estado: CONNECTED | Próximo en 60s
```

### 🔍 Debugging

```typescript
// Obtener información de debug
const debugInfo = presenceService.getDebugInfo();
console.log('Heartbeats:', debugInfo.heartbeatCount);
console.log('Duración sesión:', debugInfo.sessionDuration);

// Imprimir resumen completo en consola
presenceService.printDebugInfo();
```

**Output de `printDebugInfo()`:**
```
[CommercialPresenceService] 📊 DEBUG INFO
═════════════════════════════════════════════
🔌 ESTADO DE CONEXIÓN
  Conectado: ✅
  Estado: CONNECTED
  Commercial ID: 123e4567-e89b-12d3-a456-426614174000
═════════════════════════════════════════════
⏱️ TIMING
  Inicio de sesión: 2025-01-15T10:30:00.000Z
  Último heartbeat: 2025-01-15T10:31:00.000Z
  Duración de sesión: 60s (1min)
  Tiempo desde último heartbeat: 0s
═════════════════════════════════════════════
📊 MÉTRICAS
  Total de heartbeats: 1
  Intentos de reconexión: 0
  Intervalo de heartbeat: 60s
  Heartbeat activo: ✅
═════════════════════════════════════════════
```

## API Principal

### Métodos

- `connect(id?, name?)` - Conectar comercial
- `disconnect()` - Desconectar comercial
- `sendHeartbeat(metadata?)` - Enviar heartbeat manual
- `updateStatus(status)` - Cambiar estado (CONNECTED/BUSY/OFFLINE)
- `getStatus(id?)` - Consultar estado desde servidor
- `getCurrentStatus()` - Obtener estado local (síncrono)
- `getDebugInfo()` - Obtener métricas y estado completo (síncrono)
- `printDebugInfo()` - Imprimir resumen en consola

### Observables

- `isConnected$` - Estado de conexión
- `connectionStatus$` - Estado actual (CONNECTED/BUSY/OFFLINE)
- `lastActivity$` - Última actividad registrada
- `error$` - Últimos errores

## Logs y Emojis

| Emoji | Operación | Descripción |
|-------|-----------|-------------|
| 🔌 | CONNECT | Conexión inicial del comercial |
| 💓 | HEARTBEAT | Envío de heartbeat (cada 60s) |
| 👋 | DISCONNECT | Desconexión del comercial |
| 🔄 | UPDATE STATUS | Cambio de estado |
| 🔄 | RECONEXIÓN | Intento de reconexión automática |
| 📡 | BEFOREUNLOAD | Desconexión al cerrar pestaña |
| 📊 | DEBUG INFO | Información de debugging |

## Verificar que está funcionando

1. **Abrir DevTools Console**
2. **Buscar logs con el filtro:** `CommercialPresenceService`
3. **Verificar:**
   - ✅ Log de CONNECT al cargar la aplicación
   - ✅ Log de HEARTBEAT cada 60 segundos
   - ✅ Respuestas exitosas del servidor

### Ejemplo de logs esperados:

```javascript
// 1. Al cargar la aplicación
[CommercialPresenceService] 🔌 CONNECT - 2025-01-15T10:30:00.000Z
✅ CONECTADO EXITOSAMENTE
💓 Iniciando heartbeat (cada 60s)

// 2. Cada minuto
[CommercialPresenceService] 💓 HEARTBEAT #1 - 2025-01-15T10:31:00.000Z
✅ Heartbeat #1 exitoso - Estado: CONNECTED | Próximo en 60s

// 3. Al cerrar la aplicación
[CommercialPresenceService] 👋 DISCONNECT - 2025-01-15T10:35:00.000Z
✅ DESCONECTADO EXITOSAMENTE
  ⏱️ Duración de sesión: 300s (5min)
  💓 Total de heartbeats: 5
```

## Troubleshooting

### No veo logs de CONNECT
- ✅ Verificar que el servicio está siendo inyectado
- ✅ Verificar que se llama a `connect()` en `ngOnInit`
- ✅ Revisar errores en consola

### No veo logs de HEARTBEAT
- ✅ Esperar 60 segundos después del CONNECT
- ✅ Verificar que no hay errores de autenticación
- ✅ Usar `printDebugInfo()` para ver el estado

### Los heartbeats fallan
- ✅ Verificar conectividad a internet
- ✅ Verificar que el token no ha expirado
- ✅ Revisar logs de RECONEXIÓN automática

## Documentación Completa

Ver [USAGE.md](./USAGE.md) para:
- 7 ejemplos completos de uso
- Integración con guards y APP_INITIALIZER
- Componentes de monitoreo
- Manejo de errores
- Best practices

## Tests

```bash
nx test commercial-presence
nx lint commercial-presence
```

## Guía de Integración Backend

Ver la guía proporcionada para:
- Endpoints de la API
- Formato de requests/responses
- Manejo de estados
- Timeouts y reconexiones
