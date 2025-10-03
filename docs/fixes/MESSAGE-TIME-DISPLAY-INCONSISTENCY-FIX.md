# Fix: Inconsistencia en Visualización de Hora de Mensajes

**Fecha**: 3 de octubre de 2025  
**Issue**: Los mensajes cargados por HTTP no muestran hora, pero los recibidos por WebSocket sí  
**Status**: ✅ Resuelto

## Problema

Había una inconsistencia en cómo se mostraban los mensajes según su origen:

- **Mensajes cargados por HTTP**: No se veía la hora
- **Mensajes recibidos por WebSocket**: Sí se veía la hora

### Síntomas

```
📨 Mensaje por HTTP:
[10:30] Usuario: Hola             ❌ No se mostraba la hora

📨 Mensaje por WebSocket:
[10:32] Usuario: ¿Cómo estás?    ✅ Sí se mostraba la hora
```

## Causa Raíz

### Diferencia en el Procesamiento de Datos

**Mensajes HTTP** (API REST):
1. Backend envía: `sentAt: "2025-10-03T10:30:00.000Z"` (string ISO)
2. Frontend recibe → pasa por `transformMessageFromApi()`
3. Se convierte: `sentAt: new Date("2025-10-03T10:30:00.000Z")` ✅
4. Componente puede formatear la fecha correctamente

**Mensajes WebSocket** (antes del fix):
1. Backend envía: `sentAt: "2025-10-03T10:32:00.000Z"` (string ISO)
2. Frontend recibe → **NO pasa por transformación** ❌
3. Se guarda: `sentAt: "2025-10-03T10:32:00.000Z"` (string)
4. Componente intenta formatear → falla o no muestra nada

### Código Problemático

```typescript
// Antes (incorrecto)
this.webSocket.messageReceived$
  .pipe(filter((message): message is Message => message !== null))
  .subscribe(message => {
    console.log('[ChatService] Mensaje recibido via WebSocket:', message);
    this.addMessageToState(message.chatId, message); // ❌ Sin normalizar
  });
```

El problema era que los mensajes del WebSocket se agregaban directamente al estado sin normalizar el campo `sentAt` de string a Date.

## Solución Implementada

### 1. Nueva Interfaz para Mensajes WebSocket

**Archivo**: `libs/chat/data-access/chat-service/src/lib/chat.service.ts`

Agregamos una interfaz que permite `sentAt` como string o Date:

```typescript
// Tipo para mensajes del WebSocket (pueden venir con sentAt como string o Date)
interface WebSocketMessage {
  messageId: string;
  chatId: string;
  senderId: string;
  senderType: 'VISITOR' | 'COMMERCIAL' | 'SYSTEM';
  content: string;
  type: 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM';
  sentAt: string | Date;  // ← Acepta ambos tipos
  status: 'SENT' | 'DELIVERED' | 'READ';
  replyTo?: string;
  edited?: boolean;
  editedAt?: string | Date;  // ← Acepta ambos tipos
  metadata?: Record<string, unknown>;
}
```

### 2. Método de Normalización

Creamos un método que convierte strings de fecha a objetos Date:

```typescript
/**
 * Normalizar mensaje para asegurar tipos correctos
 * Los mensajes del WebSocket pueden venir con sentAt como string
 */
private normalizeMessage(message: Message | WebSocketMessage): Message {
  return {
    messageId: message.messageId,
    chatId: message.chatId,
    senderId: message.senderId,
    senderType: message.senderType,
    content: message.content,
    type: message.type,
    // ✅ Convertir string a Date si es necesario
    sentAt: message.sentAt instanceof Date ? message.sentAt : new Date(message.sentAt),
    status: message.status,
    replyTo: message.replyTo,
    edited: message.edited,
    // ✅ Convertir editedAt también
    editedAt: message.editedAt ? 
      (message.editedAt instanceof Date ? message.editedAt : new Date(message.editedAt)) : 
      undefined,
    metadata: message.metadata
  };
}
```

### 3. Aplicar Normalización en WebSocket

Actualizamos la suscripción a mensajes del WebSocket:

```typescript
// Después (correcto)
this.webSocket.messageReceived$
  .pipe(filter((message): message is Message => message !== null))
  .subscribe(message => {
    console.log('[ChatService] Mensaje recibido via WebSocket:', message);
    // ✅ Normalizar el mensaje antes de agregarlo al estado
    const normalizedMessage = this.normalizeMessage(message);
    this.addMessageToState(normalizedMessage.chatId, normalizedMessage);
  });
```

## Archivos Modificados

| Archivo | Cambios |
|---------|---------|
| `libs/chat/data-access/chat-service/src/lib/chat.service.ts` | - Agregada interfaz `WebSocketMessage`<br>- Agregado método `normalizeMessage()`<br>- Actualizado `initializeWebSocket()` para normalizar mensajes |

## Flujo de Datos Corregido

### Antes (Inconsistente)

```
┌─────────────────────────────────────────────────────────────────┐
│ BACKEND                                                         │
└───────────┬──────────────────────────────┬──────────────────────┘
            │                              │
     HTTP API                        WebSocket
sentAt: "ISO string"               sentAt: "ISO string"
            │                              │
            ▼                              ▼
┌─────────────────────┐         ┌──────────────────────┐
│ transformFromApi()  │         │ (sin transformación) │
│ sentAt → Date ✅    │         │ sentAt → string ❌   │
└─────────┬───────────┘         └──────────┬───────────┘
          │                                 │
          ▼                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ ESTADO: messages[]                                              │
│ Mensaje HTTP:  sentAt: Date ✅                                  │
│ Mensaje WS:    sentAt: string ❌                                │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│ UI COMPONENT: formatMessageTime(sentAt)                         │
│ Mensaje HTTP:  ✅ Funciona → "10:30"                            │
│ Mensaje WS:    ❌ Falla → ""                                    │
└─────────────────────────────────────────────────────────────────┘
```

### Después (Consistente)

```
┌─────────────────────────────────────────────────────────────────┐
│ BACKEND                                                         │
└───────────┬──────────────────────────────┬──────────────────────┘
            │                              │
     HTTP API                        WebSocket
sentAt: "ISO string"               sentAt: "ISO string"
            │                              │
            ▼                              ▼
┌─────────────────────┐         ┌──────────────────────┐
│ transformFromApi()  │         │ normalizeMessage()   │
│ sentAt → Date ✅    │         │ sentAt → Date ✅     │
└─────────┬───────────┘         └──────────┬───────────┘
          │                                 │
          ▼                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ ESTADO: messages[]                                              │
│ Mensaje HTTP:  sentAt: Date ✅                                  │
│ Mensaje WS:    sentAt: Date ✅                                  │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│ UI COMPONENT: formatMessageTime(sentAt)                         │
│ Mensaje HTTP:  ✅ Funciona → "10:30"                            │
│ Mensaje WS:    ✅ Funciona → "10:32"                            │
└─────────────────────────────────────────────────────────────────┘
```

## Testing

### Verificación Manual

1. **Iniciar aplicación**:
   ```bash
   npm run serve:console
   ```

2. **Cargar mensajes existentes** (HTTP):
   - Seleccionar un chat
   - Ver que los mensajes muestran la hora: `[10:30]`

3. **Enviar nuevo mensaje** (WebSocket):
   - Escribir y enviar un mensaje
   - Ver que el nuevo mensaje también muestra la hora: `[10:32]`

4. **Verificar en DevTools Console**:
   ```typescript
   // Ver estructura de los mensajes
   const chatService = ng.getComponent($0).chatService;
   chatService.messages$.subscribe(messages => {
     const chatId = 'tu-chat-id';
     console.log('Mensajes:', messages[chatId]);
     messages[chatId]?.forEach(msg => {
       console.log('sentAt type:', typeof msg.sentAt, msg.sentAt);
       // Todos deben ser: "object" Date {...}
     });
   });
   ```

### Test de Casos

**Caso 1: Mensajes HTTP**
```typescript
// Cargar mensajes existentes
chatService.getMessages('chat-id').subscribe(messages => {
  messages.forEach(msg => {
    console.assert(msg.sentAt instanceof Date, 'sentAt debe ser Date');
  });
});
```

**Caso 2: Mensajes WebSocket**
```typescript
// Enviar mensaje y verificar
chatService.sendMessage({
  chatId: 'chat-id',
  content: 'Test',
  type: 'text'
}).subscribe();

// Esperar a que llegue por WebSocket
setTimeout(() => {
  const messages = chatService.getMessagesForChat('chat-id');
  const lastMessage = messages[messages.length - 1];
  console.assert(lastMessage.sentAt instanceof Date, 'sentAt debe ser Date');
}, 1000);
```

**Caso 3: Visualización en UI**
- Todos los mensajes deben mostrar hora en formato `[HH:MM]`
- No debe haber mensajes sin hora

## Resultado

✅ **Todos los mensajes muestran hora consistentemente**  
✅ **Mensajes HTTP y WebSocket tienen el mismo formato**  
✅ **Campo `sentAt` siempre es `Date`, no `string`**  
✅ **Método `formatMessageTime()` funciona para todos los mensajes**

### Visualización Correcta

```
Conversación:
┌────────────────────────────────────────┐
│ [10:30] Visitante: Hola               │ ✅ HTTP
│ [10:32] Tú: ¿En qué puedo ayudarte?   │ ✅ WebSocket
│ [10:33] Visitante: Necesito info      │ ✅ WebSocket
│ [10:35] Tú: Claro, dime              │ ✅ WebSocket
└────────────────────────────────────────┘
```

## Mejoras Adicionales Implementadas

### Type Safety

- Creada interfaz `WebSocketMessage` para mensajes no normalizados
- Método `normalizeMessage()` con tipos estrictos
- Evita `any` y usa union types

### Robustez

- El método maneja tanto `Date` como `string` para `sentAt`
- También normaliza `editedAt` si existe
- Verificación `instanceof Date` antes de convertir

### Consistencia

- Todos los mensajes pasan por normalización
- Un solo punto de verdad para el formato de datos
- HTTP y WebSocket usan el mismo tipo `Message`

## Beneficios

1. **UX Mejorada**: Todos los mensajes muestran hora
2. **Consistencia**: Mismo formato independiente del origen
3. **Mantenibilidad**: Un solo método de normalización
4. **Type Safety**: TypeScript previene errores similares
5. **Escalabilidad**: Fácil agregar más campos si es necesario

## Referencias

- Issue: Inconsistencia en visualización de hora de mensajes
- Related: `WEBSOCKET-INTEGRATION-SUMMARY.md`
- Related: `WEBSOCKET-INVALID-NAMESPACE-FIX.md`
- TypeScript Date: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date

---

**Autor**: AI Coding Agent  
**Reviewer**: Roger Puga Ruiz  
**Status**: ✅ Completado y validado
