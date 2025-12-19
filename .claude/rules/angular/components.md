# Angular Components

## Description

Standalone components with signals, OnPush change detection and function injection.

## Reference
`libs/shared/ui/badge/src/lib/badge/badge.ts`

## Base Structure

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
// Required input
readonly userId = input.required<string>();

// Input with default value
readonly variant = input<BadgeVariant>('default');

// Optional input (undefined if not provided)
readonly label = input<string>();

// Input with alias
readonly size = input<Size>('medium', { alias: 'badgeSize' });

// Input with transform
readonly count = input(0, { transform: numberAttribute });
```

## Computed Values

```typescript
// Derive values from inputs
readonly displayText = computed(() => {
  const count = this.count();
  const max = this.maxCount();
  return count > max ? `${max}+` : count.toString();
});

// Dynamic CSS classes
readonly hostClasses = computed(() => ({
  'is-active': this.isActive(),
  'is-disabled': this.disabled(),
  [`size-${this.size()}`]: true,
}));

// Combine multiple signals
readonly isValid = computed(() =>
  this.value().length > 0 && !this.hasError()
);
```

## Outputs

```typescript
// Simple output
readonly clicked = output<void>();

// Output with data
readonly valueChange = output<string>();
readonly itemSelected = output<Item>();

// Emit events
this.clicked.emit();
this.valueChange.emit(newValue);
```

## Dependency Injection

```typescript
@Component({ /* ... */ })
export class MyComponent {
  // Services
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  // Injection tokens
  private readonly environment = inject(ENVIRONMENT_TOKEN);

  // Optional
  private readonly optional = inject(OptionalService, { optional: true });

  // DestroyRef for cleanup
  private readonly destroyRef = inject(DestroyRef);
}
```

## Lifecycle with Signals

```typescript
@Component({ /* ... */ })
export class MyComponent {
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    // Effect to react to changes
    effect(() => {
      console.log('Variant changed:', this.variant());
    });

    // Cleanup with takeUntilDestroyed
    someObservable$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(value => this.handleValue(value));
  }
}
```

## Template with Signals

```html
<!-- Call signals as functions -->
<div [ngClass]="badgeClasses()">
  {{ displayText() }}
</div>

<!-- Conditionals -->
@if (isVisible()) {
  <span>{{ text() }}</span>
}

<!-- Loops -->
@for (item of items(); track item.id) {
  <div>{{ item.name }}</div>
}
```

## Naming Rules

| Element | Pattern | Example |
|---------|---------|---------|
| UI Component | `guiders-{name}` | `guiders-badge`, `guiders-button` |
| Feature Component | `lib-{name}` | `lib-inbox`, `lib-login` |
| Class | PascalCase without suffix | `Badge`, `VisitorCard` |
| File | `{name}.ts` | `badge.ts`, `visitor-card.ts` |
| Template | `{name}.html` | `badge.html` |
| Styles | `{name}.scss` | `badge.scss` |

## Checklist

- [ ] `changeDetection: ChangeDetectionStrategy.OnPush`
- [ ] Standalone imports (no NgModules)
- [ ] Inputs with `input()` signals
- [ ] Computed for derived values
- [ ] `inject()` for dependencies
- [ ] Selector with correct prefix
- [ ] Template using `@if`, `@for` syntax

## Anti-patterns

- `@Input()` decorator (use `input()` signal)
- `@Output()` decorator (use `output()`)
- Constructor injection (use `inject()`)
- `ChangeDetectionStrategy.Default`
- NgModules
- Complex logic in templates (use computed)
- `ngOnInit` for initialization (use constructor or effect)
