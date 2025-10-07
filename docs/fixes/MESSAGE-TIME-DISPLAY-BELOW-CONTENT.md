# Mejora: Hora del Mensaje Debajo del Contenido

**Fecha**: 3 de octubre de 2025  
**Issue**: La hora del mensaje debe mostrarse debajo del contenido del mensaje  
**Status**: ✅ Implementado

## Cambio Solicitado

Mover la visualización de la hora del mensaje para que aparezca debajo del contenido del mensaje en lugar de al lado.

### Antes

```
┌─────────────────────────────┐
│ Visitante                   │
│ ┌─────────────────────────┐ │
│ │ Hola, ¿cómo estás?      │ │ 10:30
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

Hora al lado del mensaje (en la misma línea)

### Después

```
┌─────────────────────────────┐
│ Visitante                   │
│ ┌─────────────────────────┐ │
│ │ Hola, ¿cómo estás?      │ │
│ └─────────────────────────┘ │
│ 10:30                       │
└─────────────────────────────┘
```

Hora debajo del mensaje (en línea separada)

## Solución Implementada

### 1. Cambio en HTML

**Archivo**: `libs/chat/ui/chat-placeholder/src/lib/chat-placeholder/chat-placeholder.html`

Agregamos un contenedor `message-container` que agrupa el cuerpo del mensaje y la hora:

```html
<!-- Antes -->
<div class="guiders-chat-placeholder__message-row">
  @if (!system) {
    <span class="guiders-chat-placeholder__message-author">
      {{ getSenderLabel(message) }}
    </span>
  }
  <div class="guiders-chat-placeholder__message-body">
    {{ message.content }}
  </div>
  <span class="guiders-chat-placeholder__message-meta">
    {{ formatMessageTime(message.sentAt) }}
  </span>
</div>

<!-- Después -->
<div class="guiders-chat-placeholder__message-row">
  @if (!system) {
    <span class="guiders-chat-placeholder__message-author">
      {{ getSenderLabel(message) }}
    </span>
  }
  <div class="guiders-chat-placeholder__message-container">
    <div class="guiders-chat-placeholder__message-body">
      {{ message.content }}
    </div>
    <span class="guiders-chat-placeholder__message-meta">
      {{ formatMessageTime(message.sentAt) }}
    </span>
  </div>
</div>
```

**Cambios clave**:
- ✅ Agregado `message-container` que envuelve body y meta
- ✅ Permite control de layout independiente del `message-row`

### 2. Cambios en CSS

**Archivo**: `libs/chat/ui/chat-placeholder/src/lib/chat-placeholder/chat-placeholder.scss`

#### Agregado Nuevo Contenedor

```scss
&__message-container {
  display: flex;
  flex-direction: column;
  gap: tokens.$spacing-2xs;
}
```

Este contenedor coloca el mensaje y la hora en columna con un pequeño gap.

#### Actualizado `message-row`

```scss
// Antes
&__message-row--own {
  align-self: flex-end;
  text-align: right; // ❌ Removido
}

// Después
&__message-row--own {
  align-self: flex-end; // Solo alineación del contenedor
}
```

**Razón**: El `text-align: right` afectaba todo el contenido. Ahora usamos `align-self` para posicionar elementos específicos.

#### Actualizado `message-author`

```scss
// Después
&__message-author--own {
  color: tokens.$color-primary-600;
  align-self: flex-end; // ✅ Alineación específica
}
```

La etiqueta del autor en mensajes propios se alinea a la derecha usando `align-self`.

#### Actualizado `message-meta`

```scss
// Antes
&__message-meta {
  font-size: tokens.$font-size-xs;
  color: tokens.$color-text-tertiary;
}

&__message-row--own &__message-meta {
  align-self: flex-end;
}

// Después
&__message-meta {
  font-size: tokens.$font-size-xs;
  color: tokens.$color-text-tertiary;
  padding: 0 tokens.$spacing-xs; // ✅ Padding para separación
}

&__message-row--own &__message-meta {
  align-self: flex-end; // Mantiene alineación a la derecha
}

&__message-row--system &__message-meta {
  align-self: center; // ✅ Centrado para mensajes del sistema
}
```

**Mejoras**:
- ✅ Padding horizontal para separar de los bordes
- ✅ Alineación específica para mensajes propios (derecha)
- ✅ Alineación específica para mensajes del sistema (centro)

## Estructura Visual Resultante

### Mensajes del Visitante (izquierda)

```
┌─────────────────────────────────────┐
│ Visitante                           │ ← author
│ ┌─────────────────────────────────┐ │
│ │ Hola, ¿cómo estás?              │ │ ← body
│ └─────────────────────────────────┘ │
│ 10:30                               │ ← meta (izquierda)
└─────────────────────────────────────┘
```

### Mensajes Propios (derecha)

```
              ┌─────────────────────────────────────┐
              │                                  Tú │ ← author (derecha)
              │ ┌─────────────────────────────────┐ │
              │ │              Muy bien, gracias  │ │ ← body
              │ └─────────────────────────────────┘ │
              │                               10:32 │ ← meta (derecha)
              └─────────────────────────────────────┘
```

### Mensajes del Sistema (centro)

```
        ┌─────────────────────────────────────┐
        │ ┌─────────────────────────────────┐ │
        │ │   El chat ha sido transferido   │ │ ← body (centro)
        │ └─────────────────────────────────┘ │
        │            10:35                    │ ← meta (centro)
        └─────────────────────────────────────┘
```

## Archivos Modificados

| Archivo | Cambios |
|---------|---------|
| `libs/chat/ui/chat-placeholder/src/lib/chat-placeholder/chat-placeholder.html` | - Agregado `message-container` div<br>- Movido `message-body` y `message-meta` dentro del container |
| `libs/chat/ui/chat-placeholder/src/lib/chat-placeholder/chat-placeholder.scss` | - Agregado estilo `__message-container`<br>- Actualizado `__message-row--own` (removido text-align)<br>- Actualizado `__message-author--own` (agregado align-self)<br>- Actualizado `__message-meta` (agregado padding y align-self para sistema) |

## Tokens Usados

```scss
gap: tokens.$spacing-2xs;           // Gap entre mensaje y hora
padding: 0 tokens.$spacing-xs;      // Padding horizontal de la hora
font-size: tokens.$font-size-xs;    // Tamaño de fuente de la hora
color: tokens.$color-text-tertiary; // Color de la hora
```

## Testing

### Verificación Visual

1. **Iniciar aplicación**:
   ```bash
   npm run serve:console
   ```

2. **Abrir un chat con mensajes**

3. **Verificar layout**:
   - ✅ Hora aparece debajo del contenido del mensaje
   - ✅ Hora está separada del mensaje con un pequeño gap
   - ✅ En mensajes propios, la hora está alineada a la derecha
   - ✅ En mensajes del visitante, la hora está alineada a la izquierda
   - ✅ En mensajes del sistema, la hora está centrada

4. **Verificar diferentes tipos de mensajes**:
   - Mensajes cortos: "Hola"
   - Mensajes largos: "Este es un mensaje muy largo que debe hacer wrap..."
   - Mensajes del sistema
   - Mensajes propios vs del visitante

### Casos de Prueba

**Caso 1: Mensajes de diferentes longitudes**
```
Visitante: "Hola"
         10:30

Tú: "Este es un mensaje mucho más largo que necesita varias líneas..."
                                                                  10:32
```

**Caso 2: Conversación completa**
```
Visitante: "¿Puedes ayudarme?"
         10:30

Tú: "Claro, dime en qué puedo ayudarte"
                                   10:31

Visitante: "Necesito información sobre el producto"
         10:32

SISTEMA: Chat transferido al departamento de ventas
                            10:33
```

## Resultado

✅ **Hora visible debajo del contenido del mensaje**  
✅ **Layout consistente para todos los tipos de mensaje**  
✅ **Alineación correcta según el tipo de mensaje**  
✅ **Espaciado apropiado entre mensaje y hora**  
✅ **Responsive y adaptable a diferentes tamaños de mensaje**

## Beneficios

1. **Claridad**: La hora no compite visualmente con el contenido
2. **Legibilidad**: El mensaje es más fácil de leer sin la hora al lado
3. **Consistencia**: Todas las burbujas tienen el mismo patrón
4. **Espaciado**: Mejor uso del espacio vertical
5. **Estándar UX**: Sigue el patrón común de apps de mensajería (WhatsApp, Telegram, etc.)

## Próximas Mejoras Sugeridas

### Información Adicional en Meta
Podrías agregar más información en la línea de meta:

```scss
&__message-meta {
  display: flex;
  align-items: center;
  gap: tokens.$spacing-xs;
  font-size: tokens.$font-size-xs;
  color: tokens.$color-text-tertiary;
  padding: 0 tokens.$spacing-xs;
}
```

```html
<span class="guiders-chat-placeholder__message-meta">
  {{ formatMessageTime(message.sentAt) }}
  @if (message.edited) {
    <span class="meta-edited">(editado)</span>
  }
  @if (message.status === 'READ' && own) {
    <guiders-icon name="check-double" size="xs" />
  }
</span>
```

### Tooltip con Fecha Completa
Al hacer hover sobre la hora, mostrar la fecha completa:

```html
<span 
  class="guiders-chat-placeholder__message-meta"
  [title]="formatFullDate(message.sentAt)">
  {{ formatMessageTime(message.sentAt) }}
</span>
```

```typescript
formatFullDate(value: Date | string | number | null | undefined): string {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'full',
    timeStyle: 'short'
  }).format(date);
  // Output: "jueves, 3 de octubre de 2025, 10:30"
}
```

## Referencias

- Issue: Mostrar hora debajo del mensaje
- Related: `MESSAGE-TIME-DISPLAY-INCONSISTENCY-FIX.md`
- Design System: `guia-diseno-interfaces-b2b-web-desktop.md`
- WhatsApp Pattern: Hora debajo del mensaje en burbujas
- Telegram Pattern: Hora en esquina inferior de la burbuja

---

**Autor**: AI Coding Agent  
**Reviewer**: Roger Puga Ruiz  
**Status**: ✅ Completado y validado
