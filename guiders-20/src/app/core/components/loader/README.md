# Loader Component

Un componente de loader moderno y estilizado para Angular 20 con animaciones fluidas y cambio de colores.

## Características

- **Animación circular**: 8 puntos dispuestos en círculo que rotan continuamente
- **Cambio de colores**: Transición suave de azul → púrpura → rosa → púrpura → azul
- **Efectos visuales**: Escalado dinámico y sombras con glow
- **Responsive**: Se adapta a diferentes tamaños de pantalla
- **Accesibilidad**: Soporte para `prefers-reduced-motion` y alto contraste
- **Tema oscuro**: Soporte automático para modo oscuro

## Uso

```typescript
import { LoaderComponent } from './core/components/loader/loader.component';

@Component({
  imports: [LoaderComponent],
  template: `
    <!-- Loader con pantalla completa -->
    <app-loader 
      message="Cargando aplicación..." 
      [fullscreen]="true" />
    
    <!-- Loader sin pantalla completa -->
    <app-loader 
      message="Procesando datos..." 
      [fullscreen]="false" />
    
    <!-- Loader sin mensaje -->
    <app-loader 
      message="" 
      [fullscreen]="false" />
  `
})
```

## Props

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `message` | `string` | `'Cargando...'` | Mensaje a mostrar debajo del loader |
| `fullscreen` | `boolean` | `true` | Si debe cubrir toda la pantalla |

## Animaciones

### Rotación
- Los puntos rotan en círculo con una duración de 3 segundos
- Rotación continua y suave

### Cambio de colores
- Duración: 3.2 segundos por ciclo completo
- Transición secuencial: Azul → Rosa → Azul
- Cada punto tiene un delay de 0.4 segundos para crear el efecto de onda
- Los puntos cambian de color uno tras otro, creando una onda visual que recorre el círculo

### Escalado
- Los puntos escalan de 1x a 1.2x durante el cambio de color
- Efecto sutil que añade dinamismo

## Responsive Design

- **Desktop**: 100px de diámetro, puntos de 12px
- **Tablet** (≤768px): 80px de diámetro, puntos de 10px  
- **Mobile** (≤480px): 60px de diámetro, puntos de 8px

## Accesibilidad

- **Reduced Motion**: Las animaciones se ralentizan para usuarios con `prefers-reduced-motion`
- **High Contrast**: Colores se ajustan automáticamente para alto contraste
- **Focus Management**: El contenedor maneja el foco apropiadamente

## Personalización

Para personalizar los colores, modifica las variables CSS en `loader.component.scss`:

```scss
:host {
  --loader-bg: rgba(255, 255, 255, 0.95);
  --loader-text: #374151;
  --loader-shadow: rgba(0, 0, 0, 0.1);
}
```

## Demo

Visita `/loader-demo` para ver todas las variantes del loader en acción.
