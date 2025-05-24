# Uso de Iconos Lucide en Guiders

Este proyecto utiliza [Lucide](https://lucide.dev/) para los iconos. Lucide es un fork de Feather Icons con una licencia MIT.

## Instalación

La biblioteca ya está instalada como dependencia del proyecto:

```bash
# Ya instalada
npm install lucide-angular
```

## Cómo usar los iconos

### Opción 1: Importación directa en componentes standalone

```typescript
import { Component } from '@angular/core';
import { User, Settings } from 'lucide-angular'; // Importa los iconos que necesites

@Component({
  selector: 'app-mi-componente',
  standalone: true,
  imports: [User, Settings], // Importa los iconos como componentes
  template: `
    <div>
      <user-icon [size]="24" stroke="currentColor"></user-icon>
      <settings-icon [size]="24" stroke="#0969da"></settings-icon>
    </div>
  `
})
export class MiComponenteComponent {}
```

### Opción 2: Uso del módulo LucideIconsModule

Para componentes que no son standalone, puedes usar el módulo centralizado:

```typescript
import { Component } from '@angular/core';
import { LucideIconsModule } from 'ruta/al/lucide-icons.module';

@NgModule({
  imports: [
    CommonModule,
    LucideIconsModule
  ],
  declarations: [
    TuComponente
  ]
})
export class TuModulo {}
```

Luego en tu template:

```html
<user-icon [size]="24"></user-icon>
<settings-icon [size]="24" class="mi-clase-personalizada"></settings-icon>
```

## Propiedades disponibles

Los iconos de Lucide aceptan las siguientes propiedades:

- `[size]`: Tamaño del icono en píxeles (número)
- `[strokeWidth]`: Ancho del trazo (número)
- `[stroke]`: Color del trazo (string, ej: '#0969da', 'currentColor')
- `[fill]`: Color de relleno (por defecto 'none')
- `[absoluteStrokeWidth]`: Si debe mantener el ancho del trazo invariable (boolean)

## Lista de iconos disponibles

Para ver todos los iconos disponibles, visita la [documentación oficial de Lucide](https://lucide.dev/icons/).

## Licencia

Lucide se distribuye bajo licencia MIT. La información completa de la licencia se encuentra en el archivo README.md del proyecto.
