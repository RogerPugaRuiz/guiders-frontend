# Design Tokens

## Descripción

Sistema de variables SCSS para mantener consistencia visual en colores, espaciado, tipografía y más.

## Referencia

`libs/shared/design-tokens/src/lib/tokens-vars.scss`

## Uso Básico

```scss
@use '@guiders-frontend/shared/design-tokens' as tokens;

.my-component {
  background: tokens.$color-surface-primary;
  padding: tokens.$spacing-md;
  border-radius: tokens.$border-radius-md;
  font-family: tokens.$font-family-ui;
}
```

## Colores

### Surface (Fondos)

```scss
$color-surface-primary: #ffffff;    // Fondo principal
$color-surface-secondary: #f8f9fa;  // Fondo secundario
$color-surface-tertiary: #f1f3f4;   // Fondo terciario
$color-surface-hover: #f1f3f4;      // Estado hover
$color-surface-selected: #e7f3ff;   // Estado seleccionado
$color-surface-disabled: #f1f3f4;   // Estado disabled
$color-surface-elevated: #ffffff;   // Cards/modales
```

### Texto

```scss
$color-text-primary: #212529;    // Texto principal
$color-text-secondary: #495057;  // Texto secundario
$color-text-tertiary: #6c757d;   // Texto terciario
$color-text-disabled: #ced4da;   // Texto disabled
$color-text-inverse: #ffffff;    // Texto sobre fondos oscuros
```

### Brand/Semánticos

```scss
// Primary (azul)
$color-primary-500: #007bff;
$color-primary-600: #0066cc;
$color-primary-700: #004d99;

// Success (verde)
$color-success-500: #28a745;
$color-success-600: #10b981;

// Warning (amarillo)
$color-warning-500: #ffc107;
$color-warning-600: #f59e0b;

// Danger/Error (rojo)
$color-danger-500: #dc3545;
$color-danger-600: #b02a37;

// Info (cyan)
$color-info-500: #17a2b8;
$color-info-600: #3b82f6;
```

### Bordes

```scss
$color-border-light: #f1f3f5;     // Divisiones sutiles
$color-border-subtle: #dee2e6;    // Bordes sutiles
$color-border-default: #ced4da;   // Bordes por defecto
$color-border-primary: #007bff;   // Bordes de acento
$color-border-strong: #6c757d;    // Bordes fuertes
```

## Espaciado (Escala 4px)

```scss
$spacing-2xs: 2px;   // Mínimo
$spacing-xs: 4px;    // Extra pequeño
$spacing-sm: 8px;    // Pequeño
$spacing-md: 16px;   // Medio (base)
$spacing-lg: 24px;   // Grande
$spacing-xl: 32px;   // Extra grande
$spacing-2xl: 48px;  // 2x extra grande
$spacing-3xl: 64px;  // 3x extra grande

// Alternativa numérica
$spacing-1: 4px;
$spacing-2: 8px;
$spacing-3: 12px;
$spacing-4: 16px;
$spacing-6: 24px;
$spacing-8: 32px;
```

## Tipografía

### Familias

```scss
$font-family-ui: Inter, system-ui, -apple-system, sans-serif;
$font-family-mono: 'Monaco', 'Menlo', monospace;
```

### Tamaños

```scss
$font-size-xs: 10px;    // Captions
$font-size-sm: 12px;    // Labels pequeños
$font-size-base: 13px;  // Texto base
$font-size-lg: 18px;    // Subtítulos
$font-size-xl: 20px;    // Títulos
$font-size-2xl: 24px;   // Títulos grandes
```

### Pesos

```scss
$font-weight-regular: 400;
$font-weight-medium: 500;
$font-weight-semibold: 600;
$font-weight-bold: 700;
```

### Line Heights

```scss
$line-height-tight: 1.25;    // Títulos
$line-height-normal: 1.5;    // Texto normal
$line-height-relaxed: 1.625; // Texto espaciado
```

## Border Radius

```scss
$border-radius-xs: 2px;
$border-radius-sm: 4px;
$border-radius-base: 6px;
$border-radius-md: 8px;
$border-radius-lg: 12px;
$border-radius-xl: 16px;
$border-radius-full: 9999px;  // Pill
$border-radius-circle: 50%;   // Círculo
```

## Sombras

```scss
$shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
$shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
$shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
$shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
```

## Transiciones

```scss
$duration-fast: 100ms;
$duration-normal: 150ms;
$duration-slow: 300ms;
$easing-standard: cubic-bezier(0.2, 0, 0, 1);

$transition-fast: all $duration-fast $easing-standard;
$transition-normal: all $duration-normal $easing-standard;
```

## Z-Index

```scss
$z-index-dropdown: 50;
$z-index-sticky: 100;
$z-index-tooltip: 1100;
$z-index-modal: 1300;
```

## Breakpoints

```scss
$breakpoint-md: 768px;
$breakpoint-lg: 1024px;
$breakpoint-xl: 1280px;
$breakpoint-2xl: 1440px;
```

## Mixins Disponibles

### Typography

```scss
@include tokens.typography('heading-3xl');  // Título grande
@include tokens.typography('heading-2xl');  // Título
@include tokens.typography('label-large');  // Label grande
@include tokens.typography('label-medium'); // Label medio
@include tokens.typography('body-medium');  // Cuerpo medio
@include tokens.typography('body-small');   // Cuerpo pequeño
@include tokens.typography('caption');      // Caption
```

### Button Base

```scss
.my-button {
  @include tokens.button-base;
  // Incluye: display, padding, border, radius, font, hover, focus, disabled
}
```

### Focus Ring

```scss
.my-input:focus-visible {
  @include tokens.focus-ring;
  // outline: 2px solid $color-primary-500;
}
```

### Loading Spinner

```scss
.spinner {
  @include tokens.loading-spinner;
  // Spinner animado de 20px
}
```

### Button Reset

```scss
.icon-button {
  @include tokens.button-reset;
  // Elimina estilos por defecto de button
}
```

## Ejemplo Completo

```scss
@use '@guiders-frontend/shared/design-tokens' as tokens;

.guiders-card {
  background: tokens.$color-surface-primary;
  border: 1px solid tokens.$color-border-subtle;
  border-radius: tokens.$border-radius-lg;
  padding: tokens.$spacing-lg;
  box-shadow: tokens.$shadow-md;
  transition: tokens.$transition-normal;

  &:hover {
    box-shadow: tokens.$shadow-lg;
  }

  &__title {
    @include tokens.typography('heading-2xl');
    color: tokens.$color-text-primary;
    margin-bottom: tokens.$spacing-sm;
  }

  &__description {
    @include tokens.typography('body-medium');
    color: tokens.$color-text-secondary;
  }

  &__action {
    @include tokens.button-base;
    background: tokens.$color-primary-500;
    color: tokens.$color-text-inverse;
    border-color: tokens.$color-primary-500;

    &:hover {
      background: tokens.$color-primary-600;
    }
  }
}
```

## Anti-patrones

- Hardcodear colores (`#007bff` en lugar de `$color-primary-500`)
- Hardcodear espaciados (`16px` en lugar de `$spacing-md`)
- Usar `px` arbitrarios que no sigan la escala de 4px
- No usar mixins para patrones repetitivos
- Importar tokens sin namespace (`@use` sin `as`)
