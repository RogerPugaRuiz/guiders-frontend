# Fix: Paginador fuera del área de scroll

## Problema
El paginador estaba dentro del contenedor con scroll de la lista de visitantes, lo que causaba que se desplazara junto con los datos.

## Solución

### Cambios en HTML (`visitors.html`)

Se reestructuró el contenido del panel de visitantes:

```html
<div class="bento-card-content visitors-panel__content">
  <!-- Área con scroll solo para la lista -->
  <div class="visitors-panel__list-container">
    <lib-visitors-list ... />
  </div>
  
  <!-- Paginador fuera del scroll -->
  <div class="visitors-panel__pagination">
    <guiders-pagination ... />
  </div>
</div>
```

### Cambios en SCSS (`visitors.scss`)

Se agregaron estilos específicos para controlar el scroll:

```scss
.visitors-panel {
  &__content {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 0;
    overflow: hidden; // Sin scroll en el contenedor
  }

  &__list-container {
    flex: 1;
    overflow-y: auto; // Solo aquí hay scroll
    padding: 0 tokens.$spacing-md;
    min-height: 0; // Clave para flex + overflow
  }

  &__pagination {
    flex-shrink: 0; // No se reduce nunca
    border-top: 1px solid tokens.$color-border-subtle;
    background: tokens.$color-surface-primary;
  }
}
```

## Comportamiento resultante

✅ **Lista con scroll**: La tabla de visitantes tiene scroll vertical cuando hay muchos registros
✅ **Paginador fijo**: El paginador permanece visible en la parte inferior sin scroll
✅ **Altura adaptativa**: El contenedor de la lista se ajusta al espacio disponible
✅ **Responsive**: Funciona correctamente en diferentes tamaños de pantalla

## Estructura visual

```
┌─────────────────────────────────────┐
│ Bento Card Header                   │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ Lista de visitantes             │ │
│ │ (con scroll vertical)           │ │
│ │ ↕                                │ │
│ │                                  │ │
│ │                                  │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ [<] [1] [2] [3] ... [12] [>]       │ ← Paginador fijo
└─────────────────────────────────────┘
```

## Propiedades CSS clave

1. **`display: flex` + `flex-direction: column`**: Layout vertical del contenedor
2. **`flex: 1`**: La lista ocupa todo el espacio disponible
3. **`overflow-y: auto`**: Scroll solo en la lista
4. **`flex-shrink: 0`**: El paginador no se reduce
5. **`min-height: 0`**: Permite que el flex item con overflow funcione correctamente

## Testing

Para verificar:
1. Cargar más de 20 visitantes (tamaño de página por defecto)
2. Observar que la lista tiene scroll vertical
3. Hacer scroll en la lista
4. Verificar que el paginador permanece visible y fijo en la parte inferior
5. Cambiar de página y confirmar que funciona correctamente
