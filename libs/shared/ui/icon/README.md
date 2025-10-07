# Icon Component

Sistema completo de iconografía SVG para interfaces B2B con soporte total para accesibilidad WCAG 2.2 AA.

## Características

✅ **80+ iconos** organizados en 10 categorías  
✅ **6 tamaños estándar** (xs, sm, md, lg, xl, 2xl)  
✅ **Accesibilidad completa** con ARIA y soporte para lectores de pantalla  
✅ **SVG inline** para máximo rendimiento  
✅ **Type-safe** con TypeScript  
✅ **Colores personalizables** vía CSS custom properties  

## Uso Básico

```typescript
import { IconComponent } from '@guiders-frontend/shared/ui/icon';

@Component({
  imports: [IconComponent],
  template: `
    <guiders-icon name="search" />
    <guiders-icon name="user" size="lg" />
    <guiders-icon 
      name="check-circle" 
      [config]="{ ariaLabel: 'Completado' }" />
  `
})
export class MyComponent {}
```

## API

### Inputs

| Prop | Type | Default | Descripción |
|------|------|---------|-------------|
| `name` | `IconName` | - | **Requerido.** Nombre del icono |
| `size` | `IconSize` | `'md'` | Tamaño del icono |
| `config` | `IconConfig` | `{}` | Configuración de accesibilidad |
| `class` | `string` | `''` | Clases CSS adicionales |

## Iconos Disponibles

**Navegación:** arrow-left, arrow-right, chevron-up, menu, close, home  
**Acciones:** plus, edit, trash, search, filter, download, upload  
**Estado:** check, alert-triangle, info, loading, eye  
**Comunicación:** message-circle, mail, phone, bell  
**Usuarios:** user, users, settings, lock  
**Archivos:** file, folder, image  
**Interface:** dashboard, calendar, star  
**Analytics:** bar-chart, trending-up  
**Sistema:** power, wifi, battery  
**B2B:** building, globe, target, layers, monitor, server  

## Tests

Run `nx test icon` to execute the unit tests.
