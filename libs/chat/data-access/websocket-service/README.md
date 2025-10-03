# WebSocket Service - Guiders Frontend

Servicio Angular 20 para comunicación en tiempo real usando Socket.IO.

## 📋 Características

- ✅ Conexión/desconexión automática con Socket.IO
- ✅ Gestión de salas de chat (join/leave)
- ✅ Recepción de mensajes en tiempo real
- ✅ Notificaciones de cambios de estado
- ✅ Reconexión automática
- ✅ Signals de Angular para estado reactivo
- ✅ RxJS Observables para streams de eventos
- ✅ Type-safe con TypeScript
- ✅ Autenticación con JWT tokens
- ✅ Auto-cleanup con DestroyRef

## 🚀 Uso Básico

### 1. El servicio ya está integrado en ChatService

El `ChatService` ya inicializa y gestiona automáticamente la conexión WebSocket:

```typescript
import { inject } from '@angular/core';
import { ChatService } from '@guiders-frontend/chat-service';

export class MyComponent {
  private readonly chatService = inject(ChatService);

  ngOnInit() {
    // El WebSocket ya está conectado automáticamente
    // Solo necesitas seleccionar un chat
    this.chatService.selectChat('chat-id-123');
    
    // Los mensajes llegarán automáticamente via WebSocket
    this.chatService.messages$.subscribe(messages => {
      console.log('Mensajes actualizados:', messages);
    });
  }
}
```

### 2. Uso directo del WebSocketService (avanzado)

Si necesitas acceso directo al servicio WebSocket:

```typescript
import { inject } from '@angular/core';
import { WebSocketService } from '@guiders-frontend/chat/data-access/websocket-service';

export class MyComponent {
  private readonly webSocket = inject(WebSocketService);

  ngOnInit() {
    // Conectar manualmente
    this.webSocket.connect({
      authToken: 'tu-jwt-token',
      autoConnect: true
    });

    // Escuchar estado de conexión (Signal)
    effect(() => {
      if (this.webSocket.isConnected()) {
        console.log('✅ WebSocket conectado');
      }
    });

    // Suscribirse a mensajes
    this.webSocket.messageReceived$.subscribe(message => {
      if (message) {
        console.log('📨 Nuevo mensaje:', message);
      }
    });

    // Unirse a una sala
    this.webSocket.joinRoom('chat-id-123');
  }

  ngOnDestroy() {
    // Auto-cleanup, pero puedes desconectar manualmente
    this.webSocket.disconnect();
  }
}
```

## 📡 API del Servicio

### Signals (Estado Reactivo)

```typescript
// Estado de conexión
readonly isConnected: Signal<boolean>
readonly isConnecting: Signal<boolean>
readonly connectionError: Signal<string | null>

// Salas activas
readonly currentRooms: Signal<Set<string>>
```

### Observables (Streams de Eventos)

```typescript
// Mensajes recibidos
readonly messageReceived$: Observable<Message | null>

// Cambios de estado del chat
readonly chatStatus$: Observable<ChatStatusUpdate | null>

// Estado de conexión
readonly connectionState$: Observable<'connected' | 'disconnected' | 'connecting'>
```

### Métodos Principales

```typescript
// Conectar/Desconectar
connect(config?: WebSocketConfig): void
disconnect(): void

// Gestión de Salas
joinRoom(chatId: string): void
leaveRoom(chatId: string): void

// Propiedades
get connected(): boolean
get socketId(): string | undefined
```

### Métodos Avanzados

```typescript
// Emitir eventos personalizados
emit(eventName: string, data: unknown): void

// Escuchar eventos personalizados
on(eventName: string, callback: (...args: unknown[]) => void): void
off(eventName: string, callback?: (...args: unknown[]) => void): void
```

## Configuración

### Variables de Entorno

El servicio requiere configuración de environment con las URLs correctas:

```typescript
// libs/shared/types/src/lib/environment.interface.ts
export interface Environment {
  production: boolean;
  auth: { ... };
  api: {
    baseUrl: string;    // URL para HTTP REST API
    wsUrl?: string;     // URL para WebSocket (opcional)
  };
}
```

**Importante**: La URL de WebSocket debe apuntar a la **raíz del servidor**, no al path `/api`:

```typescript
// ✅ Correcto
export const environment = {
  api: {
    baseUrl: 'http://localhost:3000/api',  // HTTP con /api
    wsUrl: 'http://localhost:3000'          // WebSocket sin /api
  }
};

// ❌ Incorrecto (causa "Invalid namespace")
export const environment = {
  api: {
    baseUrl: 'http://localhost:3000/api',
    wsUrl: 'http://localhost:3000/api'  // ❌ No agregar /api aquí
  }
};
```

**Prioridad de URLs**:
1. `config.url` - URL pasada manualmente en `connect(config)`
2. `environment.api.wsUrl` - URL específica para WebSocket
3. `environment.api.baseUrl` sin `/api` - Fallback automático

### Opciones de Configuración

```typescript
interface WebSocketConfig {
  url?: string;              // Default: environment.api.baseUrl
  path?: string;             // Default: '/socket.io/'
  authToken?: string | null; // JWT token para autenticación
  autoConnect?: boolean;     // Default: true
}
```

### Ejemplo Completo

```typescript
this.webSocket.connect({
  url: 'http://localhost:3000',
  path: '/socket.io/',
  authToken: localStorage.getItem('access-token'),
  autoConnect: true
});
```

## 📨 Eventos del Servidor

### message:new

Recibir mensajes nuevos:

```typescript
interface Message {
  messageId: string;
  chatId: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'audio' | 'video';
  senderId: string;
  senderName: string;
  sentAt: string;
  isInternal?: boolean;
  attachment?: {
    url: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
  };
}

// Escuchar
this.webSocket.messageReceived$.subscribe(message => {
  console.log('Nuevo mensaje:', message);
});
```

### chat:status

Recibir cambios de estado:

```typescript
interface ChatStatusUpdate {
  chatId: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  timestamp: string;
}

// Escuchar
this.webSocket.chatStatus$.subscribe(status => {
  console.log('Estado actualizado:', status);
});
```

## 🏗️ Arquitectura

### Flujo de Datos

```
1. Usuario selecciona chat
   ↓
2. ChatService.selectChat(chatId)
   ↓
3. WebSocket.joinRoom(chatId)
   ↓
4. Usuario envía mensaje via HTTP
   ↓
5. Backend procesa y emite evento WebSocket
   ↓
6. WebSocket recibe 'message:new'
   ↓
7. ChatService actualiza estado
   ↓
8. UI se actualiza automáticamente (Signals/RxJS)
```

### Reconexión Automática

El servicio maneja reconexiones automáticamente:

- **Delay inicial**: 1 segundo
- **Delay máximo**: 5 segundos
- **Intentos**: 5 intentos antes de fallar
- **Rejoin automático**: Vuelve a unirse a salas activas

## 🧪 Testing

### Probar Conexión

```typescript
// En DevTools Console
const socket = io('http://localhost:3000', {
  path: '/socket.io/',
  transports: ['websocket'],
  withCredentials: true,
});

socket.on('connect', () => console.log('✅ Conectado:', socket.id));
socket.on('disconnect', () => console.log('❌ Desconectado'));

socket.emit('chat:join', { chatId: 'test-123' });
socket.on('message:new', (msg) => console.log('📨', msg));
```

### Probar con cURL

```bash
# Enviar mensaje (genera evento WebSocket)
curl -X POST http://localhost:3000/api/v2/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer tu_jwt_token" \
  -d '{
    "chatId": "test-123",
    "content": "Hola desde curl",
    "type": "text"
  }'
```

## 🐛 Troubleshooting

### No recibo mensajes

1. Verificar que estás unido a la sala:
   ```typescript
   console.log('Salas activas:', this.webSocket.currentRooms());
   ```

2. Verificar conexión:
   ```typescript
   console.log('Conectado:', this.webSocket.connected);
   ```

3. Verificar eventos en DevTools Network → WS tab

### Error de CORS

Asegúrate de que el backend tenga CORS configurado para tu dominio y `withCredentials: true`.

### Desconexiones frecuentes

Revisa:
- Token JWT válido
- Cookies de sesión no expiradas
- Red estable
- Logs del backend para errores de autenticación

## 📚 Referencias

- **Socket.IO Client**: https://socket.io/docs/v4/client-api/
- **Angular Signals**: https://angular.dev/guide/signals
- **RxJS Interop**: https://angular.dev/guide/rxjs-interop
- **Backend Documentation**: `guiders-backend/docs/websocket-real-time-chat.md`

## 🔐 Autenticación

El servicio soporta autenticación con JWT tokens:

```typescript
// Token se pasa automáticamente desde ChatService
this.webSocket.connect({
  authToken: localStorage.getItem('access-token')
});
```

El token se envía en el handshake:
- Como `auth.token` en la conexión Socket.IO
- El backend lo valida y permite/rechaza la conexión

## 🎯 Próximos Pasos

- [ ] Typing indicators (usuario escribiendo)
- [ ] Read receipts (mensajes leídos)
- [ ] Presence indicators (usuario online/offline)
- [ ] File upload progress via WebSocket
- [ ] Metrics y monitoring (latencia, reconexiones, etc.)

---

**Estado**: ✅ **IMPLEMENTADO Y FUNCIONAL**

Última actualización: 3 de octubre de 2025

