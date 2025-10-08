# SnackBar de Confirmación al Tomar Chat

## Implementación

Se han agregado notificaciones SnackBar para informar al usuario sobre el resultado de la operación de tomar un chat.

## Cambios Realizados

### 1. Archivo: `libs/chat/features/visitors/src/lib/visitors/visitors.ts`

#### Import de MatSnackBar
```typescript
import { MatSnackBar } from '@angular/material/snack-bar';
```

#### Inyección del servicio
```typescript
private readonly snackBar = inject(MatSnackBar);
```

#### SnackBar de Éxito
**Cuándo**: Cuando el servidor confirma exitosamente la asignación del chat

```typescript
if (isAssigned) {
  console.log('✅ Chat asignado exitosamente en servidor:', response);

  // Mostrar SnackBar de éxito
  const visitorName = data.visitor.name || 'Visitante anónimo';
  this.snackBar.open(
    `✅ Chat con ${visitorName} tomado exitosamente`,
    'Cerrar',
    {
      duration: 4000,
      horizontalPosition: 'end',
      verticalPosition: 'bottom',
      panelClass: 'snackbar-success'
    }
  );
  // ...
}
```

**Características**:
- ✅ Emoji visual de éxito
- ⏱️ Duración: 4 segundos
- 📍 Posición: Esquina inferior derecha
- 🎨 Estilo: Verde (clase `snackbar-success`)

#### SnackBar de Error
**Cuándo**: Cuando ocurre un error de red o del servidor al intentar tomar el chat

```typescript
catchError((error: Error) => {
  console.error('❌ Error al tomar el chat:', error);
  
  // Mostrar SnackBar de error
  this.snackBar.open(
    '❌ Error al tomar el chat. Inténtalo de nuevo.',
    'Cerrar',
    {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'bottom',
      panelClass: 'snackbar-error'
    }
  );
  // ...
})
```

**Características**:
- ❌ Emoji visual de error
- ⏱️ Duración: 5 segundos (más tiempo por ser error)
- 📍 Posición: Esquina inferior derecha
- 🎨 Estilo: Rojo (clase `snackbar-error`)
- 🔄 Acción: Revierte la actualización optimista

#### SnackBar de Advertencia
**Cuándo**: Cuando el servidor responde pero rechaza la asignación

```typescript
} else {
  // Respuesta diferente, interpretada como rechazo
  console.log('⚠️ Servidor rechazó la asignación - response:', response);

  // Mostrar SnackBar de advertencia
  this.snackBar.open(
    '⚠️ El servidor rechazó la asignación del chat',
    'Cerrar',
    {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'bottom',
      panelClass: 'snackbar-warning'
    }
  );
  // ...
}
```

**Características**:
- ⚠️ Emoji visual de advertencia
- ⏱️ Duración: 5 segundos
- 📍 Posición: Esquina inferior derecha
- 🎨 Estilo: Naranja (clase `snackbar-warning`)
- 🔄 Acción: Revierte la actualización optimista

### 2. Archivo: `libs/chat/ui/visitors-list/src/lib/visitors-list/visitors-list.ts`

**Eliminadas notificaciones de inicio**: Se eliminaron los SnackBars que se mostraban al **iniciar** la operación de tomar chat para evitar duplicación.

**Antes**:
```typescript
// Mostraba "Tomando chat con..." al inicio
if (remainingChats > 0) {
  this.snackBar.open(`Tomando chat con ${visitorName}. Quedan ${remainingChats}...`);
} else {
  this.snackBar.open(`Tomando chat con ${visitorName}`);
}
```

**Ahora**:
```typescript
// Solo emite el evento - el padre mostrará el resultado final
this.takePendingChat.emit({
  visitor,
  chatId: firstChatId
});
```

**Mantiene**: SnackBar cuando no hay chats pendientes (validación inmediata).

### 3. Archivo: `apps/console/src/styles.scss`

Se agregaron estilos personalizados para los diferentes tipos de SnackBar:

```scss
// ===================================================
// ANGULAR MATERIAL SNACKBAR - ESTILOS PERSONALIZADOS
// ===================================================

// Estilo para SnackBar de éxito (verde)
.snackbar-success {
  --mdc-snackbar-container-color: #4caf50 !important;
  --mdc-snackbar-supporting-text-color: #ffffff !important;
  
  .mat-mdc-button.mat-mdc-snack-bar-action {
    --mdc-text-button-label-text-color: #ffffff !important;
  }
}

// Estilo para SnackBar de error (rojo)
.snackbar-error {
  --mdc-snackbar-container-color: #f44336 !important;
  --mdc-snackbar-supporting-text-color: #ffffff !important;
  
  .mat-mdc-button.mat-mdc-snack-bar-action {
    --mdc-text-button-label-text-color: #ffffff !important;
  }
}

// Estilo para SnackBar de advertencia (naranja)
.snackbar-warning {
  --mdc-snackbar-container-color: #ff9800 !important;
  --mdc-snackbar-supporting-text-color: #ffffff !important;
  
  .mat-mdc-button.mat-mdc-snack-bar-action {
    --mdc-text-button-label-text-color: #ffffff !important;
  }
}

// Estilo para SnackBar de información (azul)
.snackbar-info {
  --mdc-snackbar-container-color: #2196f3 !important;
  --mdc-snackbar-supporting-text-color: #ffffff !important;
  
  .mat-mdc-button.mat-mdc-snack-bar-action {
    --mdc-text-button-label-text-color: #ffffff !important;
  }
}
```

**Colores aplicados**:
- 🟢 **Éxito**: Verde (`#4caf50`)
- 🔴 **Error**: Rojo (`#f44336`)
- 🟠 **Advertencia**: Naranja (`#ff9800`)
- 🔵 **Info**: Azul (`#2196f3`)

## Flujo de Usuario Completo

### Escenario 1: Éxito ✅

1. Usuario hace click en "Tomar chat"
2. **UI inmediata**: Botón se deshabilita y chat desaparece de la lista (optimistic update)
3. **Backend procesa**: Petición HTTP en segundo plano
4. **Confirmación**: Servidor responde con `status: "ASSIGNED"`
5. **SnackBar verde**: "✅ Chat con [Nombre] tomado exitosamente" (4 segundos)
6. **Auto-refresh**: Se reactiva después de 5 segundos

### Escenario 2: Error de Red ❌

1. Usuario hace click en "Tomar chat"
2. **UI inmediata**: Botón se deshabilita y chat desaparece (optimistic update)
3. **Backend falla**: Error de red o servidor caído
4. **Reversión**: Chat vuelve a aparecer en la lista
5. **SnackBar rojo**: "❌ Error al tomar el chat. Inténtalo de nuevo." (5 segundos)
6. **Botón habilitado**: Usuario puede volver a intentar

### Escenario 3: Rechazo del Servidor ⚠️

1. Usuario hace click en "Tomar chat"
2. **UI inmediata**: Botón se deshabilita y chat desaparece (optimistic update)
3. **Backend responde**: Pero rechaza la operación (ej: chat ya asignado)
4. **Reversión**: Chat vuelve a aparecer en la lista
5. **SnackBar naranja**: "⚠️ El servidor rechazó la asignación del chat" (5 segundos)
6. **Botón habilitado**: Usuario ve que el chat sigue disponible

### Escenario 4: Sin Chats Pendientes ℹ️

1. Usuario hace click en visitante sin chats
2. **SnackBar gris**: "No hay chats pendientes para este visitante" (3 segundos)
3. **Sin cambios**: No se hace petición HTTP

## Beneficios de la Implementación

### 1. **Feedback Visual Claro**
- ✅ Usuario sabe inmediatamente si la operación fue exitosa
- ❌ Errores claramente diferenciados con color y emoji
- ⚠️ Rechazos del servidor comunicados

### 2. **No Redundancia**
- **Antes**: Mostraba notificación al inicio + no mostraba resultado final
- **Ahora**: Solo muestra notificación con el **resultado final**
- Evita confusión con múltiples notificaciones

### 3. **Consistencia con Material Design**
- Usa SnackBar de Angular Material (estándar)
- Colores semánticos (verde=éxito, rojo=error, naranja=advertencia)
- Posición consistente (inferior derecha)
- Duración apropiada por tipo (4-5 segundos)

### 4. **Optimistic UI + Confirmación**
- La UI se actualiza **inmediatamente** (optimistic)
- El SnackBar confirma el **resultado real** del servidor
- Combina velocidad percibida + feedback confiable

### 5. **Accesibilidad**
- SnackBar de Material tiene ARIA labels automáticos
- Botón "Cerrar" accesible por teclado
- Auto-dismiss pero con opción de cerrar manualmente

## Testing Manual

### Verificar Éxito
1. Iniciar app: `npm run dev`
2. Ir a `/visitors`
3. Click en visitante con chat pendiente
4. **Verificar**:
   - ✅ Chat desaparece inmediatamente de la lista
   - ✅ SnackBar verde aparece en inferior derecha
   - ✅ Mensaje: "✅ Chat con [Nombre] tomado exitosamente"
   - ✅ Se auto-cierra después de 4 segundos
   - ✅ Botón "Cerrar" funciona

### Simular Error
1. Desconectar red o detener backend
2. Intentar tomar chat
3. **Verificar**:
   - ❌ Chat desaparece y luego reaparece (revert)
   - ❌ SnackBar rojo aparece
   - ❌ Mensaje: "❌ Error al tomar el chat. Inténtalo de nuevo."
   - ❌ Duración: 5 segundos

### Simular Rechazo
1. Modificar backend para responder sin `status: ASSIGNED`
2. Intentar tomar chat
3. **Verificar**:
   - ⚠️ Chat desaparece y luego reaparece
   - ⚠️ SnackBar naranja aparece
   - ⚠️ Mensaje: "⚠️ El servidor rechazó la asignación del chat"

## Código Reutilizable

Para usar estos estilos en otras partes de la aplicación:

```typescript
// Éxito
this.snackBar.open('Operación exitosa', 'Cerrar', {
  duration: 4000,
  horizontalPosition: 'end',
  verticalPosition: 'bottom',
  panelClass: 'snackbar-success'
});

// Error
this.snackBar.open('Error en la operación', 'Cerrar', {
  duration: 5000,
  horizontalPosition: 'end',
  verticalPosition: 'bottom',
  panelClass: 'snackbar-error'
});

// Advertencia
this.snackBar.open('Acción no permitida', 'Cerrar', {
  duration: 5000,
  horizontalPosition: 'end',
  verticalPosition: 'bottom',
  panelClass: 'snackbar-warning'
});

// Información
this.snackBar.open('Nueva notificación', 'Cerrar', {
  duration: 4000,
  horizontalPosition: 'end',
  verticalPosition: 'bottom',
  panelClass: 'snackbar-info'
});
```

## Validaciones

- ✅ **Build exitoso**: Sin errores de compilación
- ✅ **Lint pasado**: En `visitors` y `visitors-list`
- ✅ **TypeScript**: Sin errores de tipo
- ✅ **SCSS válido**: Estilos personalizados compilados
- ✅ **Bundle size**: +1KB aprox (estilos CSS adicionales)

## Estado

✅ **IMPLEMENTADO** - SnackBar de confirmación al tomar chat  
✅ **PROBADO** - Build y lint exitosos  
🔄 **PENDIENTE** - Testing manual en navegador (usuario debe verificar)

## Referencias

- [Angular Material SnackBar API](https://material.angular.dev/components/snack-bar/api)
- [Material Design Snackbars](https://m3.material.io/components/snackbar/overview)
- [Optimistic UI Pattern](https://www.apollographql.com/docs/react/performance/optimistic-ui/)
