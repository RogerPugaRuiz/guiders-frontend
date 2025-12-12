# Componentes Angular

## Descripción

Componentes standalone con signals, OnPush change detection y function injection.

## Referencia
`libs/shared/ui/badge/src/lib/badge/badge.ts`

## Estructura Base

```typescript
import { Component, computed, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger';

@Component({
  selector: 'guiders-badge',
  imports: [CommonModule],
  templateUrl: './badge.html',
  styleUrl: './badge.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Badge {
  // === INPUTS (signals) ===
  readonly variant = input<BadgeVariant>('default');
  readonly text = input<string>('');
  readonly disabled = input<boolean>(false);

  // === OUTPUTS ===
  readonly clicked = output<void>();

  // === COMPUTED VALUES ===
  readonly badgeClasses = computed(() => ({
    'guiders-badge': true,
    [`guiders-badge--${this.variant()}`]: true,
    'guiders-badge--disabled': this.disabled(),
  }));

  // === METHODS ===
  onClick(): void {
    if (!this.disabled()) {
      this.clicked.emit();
    }
  }
}
```

## Signal Inputs

```typescript
// Input requerido
readonly userId = input.required<string>();

// Input con valor por defecto
readonly variant = input<BadgeVariant>('default');

// Input opcional (undefined si no se proporciona)
readonly label = input<string>();

// Input con alias
readonly size = input<Size>('medium', { alias: 'badgeSize' });

// Input con transform
readonly count = input(0, { transform: numberAttribute });
```

## Computed Values

```typescript
// Derivar valores de inputs
readonly displayText = computed(() => {
  const count = this.count();
  const max = this.maxCount();
  return count > max ? `${max}+` : count.toString();
});

// Clases CSS dinámicas
readonly hostClasses = computed(() => ({
  'is-active': this.isActive(),
  'is-disabled': this.disabled(),
  [`size-${this.size()}`]: true,
}));

// Combinar múltiples signals
readonly isValid = computed(() =>
  this.value().length > 0 && !this.hasError()
);
```

## Outputs

```typescript
// Output simple
readonly clicked = output<void>();

// Output con datos
readonly valueChange = output<string>();
readonly itemSelected = output<Item>();

// Emitir eventos
this.clicked.emit();
this.valueChange.emit(newValue);
```

## Inyección de Dependencias

```typescript
@Component({ /* ... */ })
export class MyComponent {
  // Servicios
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  // Tokens de inyección
  private readonly environment = inject(ENVIRONMENT_TOKEN);

  // Opcional
  private readonly optional = inject(OptionalService, { optional: true });

  // DestroyRef para cleanup
  private readonly destroyRef = inject(DestroyRef);
}
```

## Lifecycle con Signals

```typescript
@Component({ /* ... */ })
export class MyComponent {
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    // Effect para reaccionar a cambios
    effect(() => {
      console.log('Variant changed:', this.variant());
    });

    // Cleanup con takeUntilDestroyed
    someObservable$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(value => this.handleValue(value));
  }
}
```

## Template con Signals

```html
<!-- Llamar signals como funciones -->
<div [ngClass]="badgeClasses()">
  {{ displayText() }}
</div>

<!-- Condicionales -->
@if (isVisible()) {
  <span>{{ text() }}</span>
}

<!-- Loops -->
@for (item of items(); track item.id) {
  <div>{{ item.name }}</div>
}
```

## Reglas de Naming

| Elemento | Patrón | Ejemplo |
|----------|--------|---------|
| UI Component | `guiders-{name}` | `guiders-badge`, `guiders-button` |
| Feature Component | `lib-{name}` | `lib-inbox`, `lib-login` |
| Clase | PascalCase sin sufijo | `Badge`, `VisitorCard` |
| Archivo | `{name}.ts` | `badge.ts`, `visitor-card.ts` |
| Template | `{name}.html` | `badge.html` |
| Estilos | `{name}.scss` | `badge.scss` |

## Checklist

- [ ] `changeDetection: ChangeDetectionStrategy.OnPush`
- [ ] Imports standalone (no NgModules)
- [ ] Inputs con `input()` signals
- [ ] Computed para valores derivados
- [ ] `inject()` para dependencias
- [ ] Selector con prefijo correcto
- [ ] Template usando sintaxis `@if`, `@for`

## Anti-patrones

- `@Input()` decorator (usar `input()` signal)
- `@Output()` decorator (usar `output()`)
- Constructor injection (usar `inject()`)
- `ChangeDetectionStrategy.Default`
- NgModules
- Lógica compleja en templates (usar computed)
- `ngOnInit` para inicialización (usar constructor o effect)
