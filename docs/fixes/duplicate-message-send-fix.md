# Fix: Envío duplicado de mensajes y borrado de mensajes

## Problema

Después de implementar el scroll infinito, se presentaban los siguientes problemas:
1. **Mensajes duplicados**: Al enviar un mensaje, se enviaba dos veces
2. **Borrado de mensajes**: A veces se borraban otros mensajes del chat
3. **Llamadas múltiples al IntersectionObserver**: El observer se disparaba varias veces

## Causa Raíz

### 1. IntersectionObserver sin control de estado
El `IntersectionObserver` se reconfiguraba en cada cambio de `ngOnChanges`, causando:
- Múltiples instancias del observer activas simultáneamente
- Llamadas duplicadas al evento `loadMoreMessages`
- No había flag para prevenir llamadas concurrentes

### 2. Sin debounce en envío de mensajes
El componente `message-input` no tenía protección contra:
- Doble click en botón de enviar
- Doble pulsación de Enter
- Múltiples emisiones del evento en poco tiempo

## Solución Implementada

### 1. Flag de control en IntersectionObserver

**Archivo**: `chat-placeholder.ts`

```typescript
private isHandlingIntersection = false; // Flag para evitar llamadas duplicadas

// En ngOnChanges
if (changes['selectedChat']) {
  this.cleanupIntersectionObserver();
  this.isHandlingIntersection = false; // Reset al cambiar chat
}

// Reset del flag cuando termina la carga
if (changes['isLoadingMore'] && !isLoading && changes['isLoadingMore'].previousValue) {
  console.log('[ChatPlaceholder] Carga completada, reseteando flag');
  this.isHandlingIntersection = false;
  
  // Reconfigurar observer después de cargar mensajes
  if (hasMore) {
    this.cleanupIntersectionObserver();
    setTimeout(() => {
      this.setupIntersectionObserver();
    }, 200);
  }
}

// En el callback del observer
if (entry.isIntersecting && 
    !this.isLoadingMore && 
    this.hasMoreMessages && 
    !this.isHandlingIntersection) {
  
  this.isHandlingIntersection = true; // Marcar como manejando
  this.loadMoreMessages.emit();
}
```

### 2. Debounce en envío de mensajes

**Archivo**: `message-input.ts`

```typescript
private sendingTimestamp = 0;
private readonly SEND_DEBOUNCE_MS = 500;

sendMessage(): void {
  const text = this.messageText().trim();
  if (!text || this.isSending()) {
    return;
  }

  // Prevenir envíos duplicados
  const now = Date.now();
  if (now - this.sendingTimestamp < this.SEND_DEBOUNCE_MS) {
    console.warn('[MessageInput] Envío bloqueado por debounce');
    return;
  }

  this.sendingTimestamp = now;
  this.isSending.set(true);
  
  this.messageSent.emit(text);

  // Limpiar después de enviar
  this.messageText.set('');
  this.adjustTextareaHeight();
  
  // Delay antes de permitir otro envío
  setTimeout(() => {
    this.isSending.set(false);
  }, 300);
}
```

### 3. Mejor gestión del ciclo de vida del observer

**Mejoras en `ngOnChanges`**:
- Solo reconfigurar observer cuando realmente cambia el estado relevante
- Limpiar observer antes de crear uno nuevo
- Delay mayor (200ms) después de cargar mensajes para asegurar que el DOM se actualice

```typescript
// Solo reconfigurar si terminó de cargar
if (changes['isLoadingMore'] && !isLoading && changes['isLoadingMore'].previousValue) {
  this.isHandlingIntersection = false;
  
  if (hasMore) {
    this.cleanupIntersectionObserver();
    setTimeout(() => {
      this.setupIntersectionObserver();
    }, 200); // Mayor delay para asegurar actualización del DOM
  }
}
```

## Flujo Corregido

### Envío de mensaje

```
Usuario escribe y presiona Enter
  ↓
message-input.sendMessage()
  ↓
Verificar: !isSending && debounce OK
  ↓
Marcar: isSending = true
  ↓
Emit: messageSent.emit(text)
  ↓
Limpiar input
  ↓
Delay 300ms
  ↓
Marcar: isSending = false
```

### Carga de mensajes antiguos (scroll infinito)

```
Usuario hace scroll arriba
  ↓
scrollAnchor entra en viewport
  ↓
IntersectionObserver detecta intersección
  ↓
Verificar: !isLoadingMore && hasMore && !isHandlingIntersection
  ↓
Marcar: isHandlingIntersection = true
  ↓
Emit: loadMoreMessages.emit()
  ↓
inbox.onLoadMoreMessages() carga datos
  ↓
isLoadingMore cambia a false
  ↓
ngOnChanges detecta cambio
  ↓
Reset: isHandlingIntersection = false
  ↓
Reconfigurar observer (delay 200ms)
```

## Protecciones Implementadas

### 1. Contra envíos duplicados
- ✅ Flag `isSending` que bloquea envíos concurrentes
- ✅ Debounce de 500ms entre envíos
- ✅ Timestamp del último envío
- ✅ Delay de 300ms antes de permitir nuevo envío

### 2. Contra cargas duplicadas
- ✅ Flag `isHandlingIntersection` para bloquear intersecciones concurrentes
- ✅ Verificación de `isLoadingMore` del estado
- ✅ Limpieza del observer antes de reconfigurar
- ✅ Delays apropiados para sincronización con DOM

### 3. Contra borrado de mensajes
- ✅ Observer solo se activa cuando hay condiciones correctas
- ✅ Reconfigración controlada del observer
- ✅ Limpieza apropiada al cambiar de chat

## Testing

### Casos de prueba

1. **Envío simple**:
   - Escribir mensaje y presionar Enter
   - ✅ Debe enviarse solo una vez

2. **Envío rápido**:
   - Presionar Enter múltiples veces rápidamente
   - ✅ Solo se envía el primer mensaje

3. **Doble click en botón**:
   - Click rápido en botón enviar
   - ✅ Solo se envía una vez

4. **Scroll infinito**:
   - Hacer scroll al inicio del chat
   - ✅ Cargar mensajes antiguos una sola vez
   - ✅ Mantener posición del scroll

5. **Cambio de chat**:
   - Cambiar entre diferentes chats
   - ✅ Observer se limpia correctamente
   - ✅ No se dispara en el chat anterior

## Logs de Debug

Los siguientes logs ayudan a diagnosticar problemas:

```typescript
// MessageInput
console.log('[MessageInput] Enviando mensaje:', text);
console.warn('[MessageInput] Envío bloqueado por debounce');

// ChatPlaceholder
console.log('[ChatPlaceholder] hasMoreMessages cambió:', value);
console.log('[ChatPlaceholder] Carga completada, reseteando flag');
console.log('[ChatPlaceholder] ✅ Condiciones cumplidas, emitiendo loadMoreMessages');
console.log('[ChatPlaceholder] ⏸️ Ya se está manejando una intersección');
```

## Mejores Prácticas

1. **Siempre usar flags de control** para operaciones asíncronas
2. **Implementar debounce** en acciones del usuario que generan requests
3. **Limpiar observers** antes de crear nuevos
4. **Usar delays apropiados** para sincronización con actualización del DOM
5. **Logs detallados** para debugging de flujos complejos

## Archivos Modificados

- `libs/chat/ui/chat-placeholder/src/lib/chat-placeholder/chat-placeholder.ts`
- `libs/chat/ui/message-input/src/lib/message-input/message-input.ts`

## Resultado

✅ **Mensajes se envían una sola vez**
✅ **Scroll infinito funciona correctamente**
✅ **No se borran mensajes**
✅ **Observer se maneja apropiadamente**
✅ **Cambio entre chats funciona sin problemas**
