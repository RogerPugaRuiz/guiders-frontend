# Estructura del Payload WebSocket - Event Interface

## Interface Event Implementado

La implementación ahora utiliza la estructura estándar de `Event` para todos los eventos WebSocket:

```typescript
export interface Event {
  type?: string;
  data: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  timestamp: number;
}
```

## Ejemplo de Payload Enviado

Cuando se envía un mensaje usando `commercial:send-message`, el payload tiene la siguiente estructura:

```typescript
{
  "type": "commercial:send-message",
  "data": {
    "id": "msg-1733515200000-abc123",
    "message": "Hola, necesito información sobre los tours",
    "timestamp": 1733515200000,
    "chatId": "chat-12345"
  },
  "metadata": {
    "clientId": "socket-client-id-xyz",
    "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)...",
    "origin": "http://localhost:4200"
  },
  "timestamp": 1733515200000
}
```

## Campos del Payload

### Nivel Superior (Event)
- **`type`**: Nombre del evento (`"commercial:send-message"`)
- **`data`**: Datos específicos del mensaje de chat
- **`metadata`**: Información adicional del cliente
- **`timestamp`**: Marca de tiempo de cuando se creó el evento

### Data (Mensaje de Chat)
- **`id`**: ID único del mensaje generado por el cliente
- **`message`**: Contenido del mensaje del usuario
- **`timestamp`**: Marca de tiempo del mensaje (mismo que el timestamp del evento)
- **`chatId`**: ID del chat al que pertenece el mensaje

### Metadata (Información del Cliente)
- **`clientId`**: ID del socket cliente (proporcionado por Socket.IO)
- **`userAgent`**: User agent del navegador del cliente
- **`origin`**: Origen de la aplicación (URL base)

## Ventajas de esta Estructura

1. **Consistencia**: Todos los eventos WebSocket siguen la misma estructura
2. **Metadata adicional**: Información contextual útil para debugging y analytics
3. **Tipado fuerte**: TypeScript garantiza la estructura correcta
4. **Extensibilidad**: Fácil agregar nuevos campos en `metadata` sin afectar `data`

## Implementación en el Código

### WebSocketService.emitEvent()
```typescript
emitEvent(eventName: string, data?: Record<string, unknown>): void {
  const eventPayload: Event = {
    type: eventName,
    data: data || {},
    metadata: {
      clientId: this.socket.id || 'unknown',
      userAgent: isPlatformBrowser(this.platformId) ? navigator.userAgent : 'server',
      origin: isPlatformBrowser(this.platformId) ? window.location.origin : 'server'
    },
    timestamp: Date.now()
  };
  
  this.socket.emit(eventName, eventPayload);
}
```

### ChatComponent.sendMessage()
```typescript
this.webSocketService.emitEvent('commercial:send-message', {
  id: messageId,
  message,
  timestamp,
  chatId: chat.id
});
```

## Backend - Estructura Esperada

El backend debe manejar el evento con esta estructura:

```javascript
socket.on('commercial:send-message', (eventData) => {
  const { type, data, metadata, timestamp } = eventData;
  const { id, message, chatId } = data;
  
  console.log('Evento recibido:', type);
  console.log('Datos del mensaje:', data);
  console.log('Metadata del cliente:', metadata);
  
  // Procesar el mensaje...
  
  // Responder con éxito:
  socket.emit('commercial:message-sent', {
    type: 'commercial:message-sent',
    data: { success: true, messageId: id },
    metadata: { processedAt: Date.now() },
    timestamp: Date.now()
  });
});
```

---

**✅ Implementación completada con estructura Event estándar**
