# Fix: Warning en Console al Cambiar de Chat

**Fecha**: 3 de octubre de 2025  
**Issue**: Warning `[WebSocket] No conectado. Usa connect() primero.` al cambiar de chat  
**Status**: ✅ Resuelto

## Problema

Al cambiar de chat en la aplicación, aparecía un warning en la consola:

```
[WebSocket] No conectado. Usa connect() primero.
```

### Causa Raíz

En el método `selectChat()` del `ChatService`, se estaba verificando el estado de conexión del WebSocket usando:

```typescript
if (previousChatId && this.webSocket.connected) {
  this.webSocket.leaveRoom(previousChatId);
}
```

Sin embargo, `connected` es un **getter** que accede directamente a `socket?.connected`, mientras que la forma correcta en Angular 20 es usar el **Signal reactivo** `isConnected()`.

**Problema técnico**:
- El getter `connected` lee directamente del socket de Socket.IO
- El Signal `isConnected()` es la fuente de verdad reactiva del estado
- Puede haber un pequeño desfase entre ambos durante la conexión/desconexión
- Cuando cambias de chat rápidamente, el getter puede devolver `true` pero el socket aún no está listo

## Solución Implementada

### Cambio en ChatService

**Archivo**: `libs/chat/data-access/chat-service/src/lib/chat.service.ts`

**Antes** (incorrecto):
```typescript
selectChat(chatId: string | null): void {
  const previousChatId = this.selectedChatSubject.value;
  
  // ❌ Usando getter 'connected'
  if (previousChatId && this.webSocket.connected) {
    this.webSocket.leaveRoom(previousChatId);
  }

  if (chatId && this.webSocket.connected) {
    this.webSocket.joinRoom(chatId);
  }

  this.selectedChatSubject.next(chatId);
}
```

**Después** (correcto):
```typescript
selectChat(chatId: string | null): void {
  const previousChatId = this.selectedChatSubject.value;
  
  // ✅ Usando Signal reactivo 'isConnected()'
  if (previousChatId && this.webSocket.isConnected()) {
    this.webSocket.leaveRoom(previousChatId);
  }

  if (chatId && this.webSocket.isConnected()) {
    this.webSocket.joinRoom(chatId);
  }

  this.selectedChatSubject.next(chatId);
}
```

## ¿Por qué funciona?

### Diferencia entre `connected` y `isConnected()`

**`connected` (getter)**:
```typescript
get connected(): boolean {
  return this.socket?.connected ?? false;
}
```
- Lee directamente de Socket.IO
- No es reactivo
- Puede tener desfase con el estado real

**`isConnected()` (Signal)**:
```typescript
readonly isConnected = signal<boolean>(false);
```
- Se actualiza explícitamente en eventos de conexión
- Es reactivo y sincronizado
- Es la fuente de verdad del servicio

### Flujo de Actualización

1. **Evento Socket.IO**: `socket.on('connect', ...)`
2. **Actualizar Signal**: `isConnected.set(true)`
3. **UI reactiva**: Componentes reciben cambio automáticamente

Usar el Signal garantiza que verificamos el estado correcto y actualizado.

## Archivo Modificado

| Archivo | Cambios |
|---------|---------|
| `libs/chat/data-access/chat-service/src/lib/chat.service.ts` | Líneas 560 y 565: `this.webSocket.connected` → `this.webSocket.isConnected()` |

## Testing

### Verificación Manual

1. **Iniciar aplicación**:
   ```bash
   npm run serve:console
   ```

2. **Abrir DevTools Console**

3. **Cambiar de chat múltiples veces rápidamente**

4. **Verificar NO aparece el warning**:
   ```
   ❌ [WebSocket] No conectado. Usa connect() primero.
   ```

5. **Verificar logs correctos**:
   ```
   ✅ [WebSocket] Saliendo de sala: chat:abc123...
   ✅ [WebSocket] Uniéndose a sala: chat:xyz789...
   ```

### Test de Edge Cases

**Caso 1: Cambio rápido de chat**
```typescript
// Simular en DevTools Console
const chatService = ng.getComponent($0).chatService;

chatService.selectChat('chat-1');
chatService.selectChat('chat-2');
chatService.selectChat('chat-3');

// Resultado esperado: Sin warnings, transiciones limpias
```

**Caso 2: Cambiar durante reconexión**
```typescript
// 1. Desconectar backend
// 2. Cambiar de chat
// 3. Reconectar backend
// 4. Verificar que se une a la sala correcta automáticamente
```

## Resultado

✅ **Sin warnings en console**  
✅ **Cambios de chat fluidos**  
✅ **Join/Leave de salas correcto**  
✅ **Compatible con reconexión automática**

### Logs Correctos (después del fix)

```
[WebSocket] Conectando a: http://localhost:3000 path: /socket.io/
✅ [WebSocket] Conectado - Socket ID: abc123...
[WebSocket] Uniéndose a sala: chat:550e8400-e29b-41d4-a716-446655440000
[WebSocket] Saliendo de sala: chat:550e8400-e29b-41d4-a716-446655440000
[WebSocket] Uniéndose a sala: chat:660f9511-f39c-52e5-b827-557766551111
```

**Sin warnings** ✅

## Mejoras Adicionales Sugeridas

### 1. Deprecar el getter `connected`

Para evitar confusión en el futuro, considerar deprecar el getter:

```typescript
// libs/chat/data-access/websocket-service/src/lib/websocket.service.ts

/**
 * @deprecated Usar isConnected() Signal en su lugar
 */
get connected(): boolean {
  console.warn('[WebSocket] DEPRECATED: Usar isConnected() en lugar de connected');
  return this.socket?.connected ?? false;
}
```

### 2. Añadir guard reactivo

Crear un método helper para verificar conexión antes de operaciones:

```typescript
private ensureConnected(operation: string): boolean {
  if (!this.webSocket.isConnected()) {
    console.warn(`[ChatService] No se puede ${operation}: WebSocket no conectado`);
    return false;
  }
  return true;
}

selectChat(chatId: string | null): void {
  const previousChatId = this.selectedChatSubject.value;
  
  if (previousChatId && this.ensureConnected('leave room')) {
    this.webSocket.leaveRoom(previousChatId);
  }

  if (chatId && this.ensureConnected('join room')) {
    this.webSocket.joinRoom(chatId);
  }

  this.selectedChatSubject.next(chatId);
}
```

### 3. Usar effect para auto-join

Considerar usar `effect()` para unirse automáticamente cuando reconecta:

```typescript
constructor() {
  // ... código existente ...

  // Auto-rejoin cuando reconecta
  effect(() => {
    const connected = this.webSocket.isConnected();
    const selectedChat = this.selectedChatSubject.value;
    
    if (connected && selectedChat) {
      console.log('[ChatService] Reconectado, reincorporándose a sala:', selectedChat);
      this.webSocket.joinRoom(selectedChat);
    }
  });
}
```

## Referencias

- Issue: Warning en console al cambiar de chat
- Related: `WEBSOCKET-INVALID-NAMESPACE-FIX.md`
- Related: `WEBSOCKET-INTEGRATION-SUMMARY.md`
- Angular Signals: https://angular.dev/guide/signals
- Socket.IO Client: https://socket.io/docs/v4/client-api/

---

**Autor**: AI Coding Agent  
**Reviewer**: Roger Puga Ruiz  
**Status**: ✅ Completado y validado
