# Implementación WebSocket para Chat - commercial:send-message

## Resumen

Se ha implementado la funcionalidad del frontend para usar el evento WebSocket `commercial:send-message` en el componente chat.ts. Esta implementación permite enviar mensajes de chat en tiempo real usando Angular 20 signals y Socket.IO.

## Componentes Modificados

### 1. ChatComponent (`/components/chat/chat.ts`)

**Cambios realizados:**
- ✅ Inyección de `WebSocketService`
- ✅ Implementación de `OnInit` y `OnDestroy` para gestión del ciclo de vida
- ✅ Nuevo signal `isSendingMessage` para controlar el estado de envío
- ✅ Función `sendMessage()` completamente reescrita para usar WebSocket
- ✅ Función `setupWebSocketListeners()` para escuchar respuestas del servidor
- ✅ Actualización de `canSendMessage()` para incluir validaciones adicionales
- ✅ Función `getSendingStatus()` para acceso al estado desde el template

**Funcionalidades agregadas:**
- Validación de conexión WebSocket activa antes de enviar
- Generación de ID único para cada mensaje
- Uso del evento específico `commercial:send-message` requerido por el backend
- Indicador visual de estado de envío
- Timeout automático si no hay respuesta del servidor
- Listeners para respuestas de éxito y error del servidor
- Logging detallado para debugging

### 2. WebSocketService (`/core/services/websocket.service.ts`)

**Cambios realizados:**
- ✅ Nuevo método `emitEvent()` para enviar eventos específicos al servidor
- ✅ Mejor separación entre mensajes estándar y eventos personalizados

## Flujo de Funcionamiento

### Envío de Mensaje

1. **Validaciones iniciales:**
   - Verificar que hay texto en el mensaje
   - Verificar que hay un chat seleccionado
   - Verificar que no se está enviando otro mensaje
   - Verificar que hay conexión WebSocket activa

2. **Preparación del mensaje:**
   - Generar ID único usando timestamp + caracteres aleatorios
   - Obtener timestamp actual
   - Activar indicador de envío (`isSendingMessage = true`)

3. **Envío WebSocket:**
   - Usar `webSocketService.emitEvent('commercial:send-message', data)`
   - Datos enviados: `{ id, message, timestamp, chatId }`

4. **Post-envío:**
   - Limpiar el campo de texto
   - Resetear altura del textarea
   - Configurar timeout de 5 segundos para auto-desactivar indicador

### Respuestas del Servidor

El componente escucha dos tipos de respuesta:

1. **Éxito: `commercial:message-sent`**
   - Desactiva el indicador de envío
   - Logs de confirmación

2. **Error: `commercial:message-error`**
   - Desactiva el indicador de envío
   - Logs de error
   - Posible feedback visual al usuario

## Datos Enviados al Backend

```typescript
{
  id: string,        // ID único del mensaje (ej: "msg-1703787123456-abc123def")
  message: string,   // Contenido del mensaje
  timestamp: number, // Timestamp en milisegundos
  chatId: string     // ID del chat seleccionado
}
```

## Arquitectura y Patrones

- **Angular 20 Signals:** Manejo reactivo del estado
- **Componentes Standalone:** Sin módulos tradicionales
- **Inyección de Dependencias:** Usando `inject()` function
- **Gestión del Ciclo de Vida:** OnInit/OnDestroy con `takeUntil()`
- **WebSocket Moderno:** Socket.IO con manejo de eventos específicos

## Testing y Debugging

### Logs de Debugging

La implementación incluye logging detallado:

```
📤 [Chat] Enviando mensaje vía WebSocket: { id, message, chatId, timestamp }
✅ [Chat] Mensaje enviado exitosamente al servidor
✅ [Chat] Mensaje confirmado por el servidor: [response]
❌ [Chat] Error del servidor al enviar mensaje: [error]
⚠️ [Chat] Timeout al esperar confirmación del servidor
```

### Estados Posibles

- `isSendingMessage = false`: Listo para enviar
- `isSendingMessage = true`: Enviando mensaje
- WebSocket conectado/desconectado
- Chat seleccionado/no seleccionado

## Próximos Pasos Recomendados

1. **Testing:** Probar la funcionalidad con el backend
2. **Feedback Visual:** Agregar indicadores visuales en el UI
3. **Manejo de Errores:** Implementar notificaciones de error
4. **Optimizaciones:** Considerar retry automático en caso de error

## Compatibilidad

- ✅ Angular 20
- ✅ Socket.IO
- ✅ TypeScript
- ✅ Signals modernas
- ✅ Standalone Components
