# Avatar Colors Utility

Utilidad para asignar colores consistentes a avatares de usuario basándose en sus iniciales.

## Características

- ✅ **Colores consistentes**: Las mismas iniciales siempre generan el mismo color
- ✅ **Paleta accesible**: 14 colores que cumplen con WCAG AA para texto blanco
- ✅ **Distribución uniforme**: Usa hashing para distribución equitativa de colores
- ✅ **Insensible a mayúsculas**: "JP" y "jp" generan el mismo color
- ✅ **Manejo de edge cases**: Gestiona strings vacíos y espacios

## Uso

```typescript
import { getAvatarColor } from '@guiders-frontend/avatar-colors';

// Obtener color para iniciales
const color = getAvatarColor('JP'); // Retorna: '#2196F3' (ejemplo)

// El mismo input siempre retorna el mismo color
const color1 = getAvatarColor('MA');
const color2 = getAvatarColor('MA');
console.log(color1 === color2); // true

// Insensible a mayúsculas
const colorLower = getAvatarColor('jp');
const colorUpper = getAvatarColor('JP');
console.log(colorLower === colorUpper); // true
```

## Integración con componentes Angular

```typescript
import { Component } from '@angular/core';
import { getAvatarColor } from '@guiders-frontend/avatar-colors';

@Component({
  selector: 'app-user-avatar',
  template: `
    <div class="avatar" [style.background-color]="getBackgroundColor()">
      {{ initials }}
    </div>
  `
})
export class UserAvatarComponent {
  initials = 'JP';
  
  getBackgroundColor(): string {
    return getAvatarColor(this.initials);
  }
}
```

## Paleta de colores

La utilidad usa una paleta de 14 colores Material Design:

- Pink 500: `#E91E63`
- Purple 500: `#9C27B0`
- Deep Purple 500: `#673AB7`
- Indigo 500: `#3F51B5`
- Blue 500: `#2196F3`
- Light Blue 500: `#03A9F4`
- Cyan 500: `#00BCD4`
- Teal 500: `#009688`
- Green 500: `#4CAF50`
- Light Green 500: `#8BC34A`
- Orange 500: `#FF9800`
- Deep Orange 500: `#FF5722`
- Brown 500: `#795548`
- Blue Grey 500: `#607D8B`

Todos los colores cumplen con WCAG AA para contraste con texto blanco.

## Algoritmo

La función usa el algoritmo de hash DJB2 para convertir las iniciales en un número, luego aplica módulo para seleccionar un índice de la paleta. Esto garantiza:

1. **Consistencia**: Mismo input → mismo output
2. **Distribución**: Los colores se distribuyen uniformemente
3. **Rendimiento**: Operación O(n) donde n es la longitud del string

## Testing

La utilidad incluye tests que verifican:
- Formato de color válido (hexadecimal)
- Consistencia de colores para mismas iniciales
- Insensibilidad a mayúsculas/minúsculas
- Manejo de edge cases (strings vacíos, espacios)

Ejecutar tests:
```bash
nx test avatar-colors
```
