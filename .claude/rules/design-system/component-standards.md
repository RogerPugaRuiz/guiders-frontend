# Estándares de Componentes UI

## Descripción

Estándares para crear componentes UI consistentes, accesibles y mantenibles.

## Referencia

`libs/shared/ui/badge/src/lib/badge/badge.ts`

## Estructura de Archivo

```
libs/shared/ui/{component-name}/
├── src/
│   ├── lib/
│   │   └── {component-name}/
│   │       ├── {component-name}.ts       # Componente
│   │       ├── {component-name}.html     # Template
│   │       ├── {component-name}.scss     # Estilos
│   │       └── {component-name}.spec.ts  # Tests
│   └── index.ts                          # Barrel export
├── project.json
└── tsconfig.json
```

## Estructura del Componente

```typescript
import { Component, computed, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

// Tipos exportados
export type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger';
export type BadgeSize = 'small' | 'medium' | 'large';

@Component({
  selector: 'guiders-badge',
  imports: [CommonModule],
  templateUrl: './badge.html',
  styleUrl: './badge.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Badge {
  // === INPUTS ===
  readonly variant = input<BadgeVariant>('default');
  readonly size = input<BadgeSize>('medium');
  readonly text = input<string>('');
  readonly disabled = input<boolean>(false);

  // === ARIA (accesibilidad) ===
  readonly ariaLabel = input<string>('');

  // === OUTPUTS ===
  readonly clicked = output<void>();

  // === COMPUTED ===
  readonly badgeClasses = computed(() => ({
    'guiders-badge': true,
    [`guiders-badge--${this.variant()}`]: true,
    [`guiders-badge--${this.size()}`]: true,
    'guiders-badge--disabled': this.disabled(),
  }));

  readonly ariaLabelValue = computed(() =>
    this.ariaLabel() || `Badge: ${this.text()}`
  );
}
```

## Estructura SCSS (BEM)

```scss
@use '@guiders-frontend/shared/design-tokens' as tokens;

// Block
.guiders-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: tokens.$spacing-xs tokens.$spacing-sm;
  border-radius: tokens.$border-radius-sm;
  font-family: tokens.$font-family-ui;
  font-size: tokens.$font-size-sm;
  font-weight: tokens.$font-weight-medium;
  line-height: tokens.$line-height-tight;
  transition: tokens.$transition-fast;

  // === VARIANTS (Modifiers) ===
  &--default {
    background: tokens.$color-surface-secondary;
    color: tokens.$color-text-primary;
  }

  &--primary {
    background: tokens.$color-primary-500;
    color: tokens.$color-text-inverse;
  }

  &--success {
    background: tokens.$color-success-500;
    color: tokens.$color-text-inverse;
  }

  &--warning {
    background: tokens.$color-warning-500;
    color: tokens.$color-text-primary;
  }

  &--danger {
    background: tokens.$color-danger-500;
    color: tokens.$color-text-inverse;
  }

  // === SIZES (Modifiers) ===
  &--small {
    padding: tokens.$spacing-2xs tokens.$spacing-xs;
    font-size: tokens.$font-size-xs;
  }

  &--medium {
    padding: tokens.$spacing-xs tokens.$spacing-sm;
    font-size: tokens.$font-size-sm;
  }

  &--large {
    padding: tokens.$spacing-sm tokens.$spacing-md;
    font-size: tokens.$font-size-base;
  }

  // === STATES ===
  &--disabled {
    opacity: 0.6;
    cursor: not-allowed;
    pointer-events: none;
  }

  // === ELEMENTS ===
  &__icon {
    margin-right: tokens.$spacing-xs;
    width: 16px;
    height: 16px;
  }
}
```

## Template Accesible

```html
<span
  [ngClass]="badgeClasses()"
  [attr.aria-label]="ariaLabelValue()"
  role="status"
>
  @if (hasIcon()) {
    <span class="guiders-badge__icon" aria-hidden="true">
      <ng-content select="[icon]" />
    </span>
  }
  {{ displayText() }}
</span>
```

## Patrones de Inputs

### Input Requerido

```typescript
readonly userId = input.required<string>();
```

### Input con Valor por Defecto

```typescript
readonly variant = input<BadgeVariant>('default');
```

### Input Booleano

```typescript
readonly disabled = input<boolean>(false);
readonly loading = input<boolean>(false);
```

### Input con Transform

```typescript
import { numberAttribute, booleanAttribute } from '@angular/core';

readonly count = input(0, { transform: numberAttribute });
readonly active = input(false, { transform: booleanAttribute });
```

### Input con Alias

```typescript
readonly size = input<Size>('medium', { alias: 'badgeSize' });
```

## Accesibilidad (WCAG 2.2 AA)

### Inputs ARIA Obligatorios

```typescript
// Para componentes interactivos
readonly ariaLabel = input<string>('');
readonly ariaDescribedBy = input<string>('');
readonly ariaExpanded = input<boolean>();
readonly ariaHasPopup = input<boolean>();
```

### Computed ARIA

```typescript
readonly ariaLabelValue = computed(() => {
  const custom = this.ariaLabel();
  if (custom) return custom;

  // Generar label semántico automático
  const count = this.count();
  if (count !== undefined) {
    return count === 1 ? '1 elemento' : `${count} elementos`;
  }

  return `Etiqueta: ${this.text()}`;
});
```

### Focus Visible

```scss
.guiders-button {
  &:focus-visible {
    @include tokens.focus-ring;
  }
}
```

### Roles Semánticos

```html
<!-- Status (badges, notifications) -->
<span role="status" aria-live="polite">...</span>

<!-- Botones -->
<button type="button" [attr.aria-pressed]="isActive()">...</button>

<!-- Dialogs -->
<div role="dialog" aria-modal="true" aria-labelledby="title">...</div>
```

## Naming Convention

### Selector

```typescript
// UI components: guiders-*
selector: 'guiders-badge'
selector: 'guiders-button'
selector: 'guiders-modal'

// Feature components: lib-*
selector: 'lib-inbox'
selector: 'lib-visitor-list'
```

### Clases CSS (BEM)

```scss
// Block
.guiders-badge { }

// Element
.guiders-badge__icon { }
.guiders-badge__text { }

// Modifier
.guiders-badge--primary { }
.guiders-badge--small { }
.guiders-badge--disabled { }
```

### Archivos

```
badge.ts          # Componente
badge.html        # Template
badge.scss        # Estilos
badge.spec.ts     # Tests
```

## Checklist de Componente

- [ ] Selector con prefijo `guiders-*`
- [ ] `ChangeDetectionStrategy.OnPush`
- [ ] Imports standalone
- [ ] Inputs con `input()` signals
- [ ] Outputs con `output()`
- [ ] Computed para clases CSS
- [ ] SCSS con design tokens
- [ ] BEM para nomenclatura CSS
- [ ] Inputs ARIA para accesibilidad
- [ ] Focus visible con `focus-ring`
- [ ] Estados: hover, focus, disabled, loading
- [ ] Tests unitarios
- [ ] Barrel export en `index.ts`

## Anti-patrones

- Hardcodear colores o espaciados
- Omitir `ChangeDetectionStrategy.OnPush`
- Inputs/outputs con decoradores legacy
- Clases CSS sin namespace del componente
- Falta de estados interactivos
- Omitir atributos ARIA
- Lógica de negocio en componentes UI
