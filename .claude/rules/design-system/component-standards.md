# UI Component Standards

## Description

Standards for creating consistent, accessible, and maintainable UI components.

## Reference

`libs/shared/ui/badge/src/lib/badge/badge.ts`

## File Structure

```
libs/shared/ui/{component-name}/
├── src/
│   ├── lib/
│   │   └── {component-name}/
│   │       ├── {component-name}.ts       # Component
│   │       ├── {component-name}.html     # Template
│   │       ├── {component-name}.scss     # Styles
│   │       └── {component-name}.spec.ts  # Tests
│   └── index.ts                          # Barrel export
├── project.json
└── tsconfig.json
```

## Component Structure

```typescript
import { Component, computed, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

// Exported types
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

  // === ARIA (accessibility) ===
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

## SCSS Structure (BEM)

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

## Accessible Template

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

## Input Patterns

### Required Input

```typescript
readonly userId = input.required<string>();
```

### Input with Default Value

```typescript
readonly variant = input<BadgeVariant>('default');
```

### Boolean Input

```typescript
readonly disabled = input<boolean>(false);
readonly loading = input<boolean>(false);
```

### Input with Transform

```typescript
import { numberAttribute, booleanAttribute } from '@angular/core';

readonly count = input(0, { transform: numberAttribute });
readonly active = input(false, { transform: booleanAttribute });
```

### Input with Alias

```typescript
readonly size = input<Size>('medium', { alias: 'badgeSize' });
```

## Accessibility (WCAG 2.2 AA)

### Required ARIA Inputs

```typescript
// For interactive components
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

  // Generate automatic semantic label
  const count = this.count();
  if (count !== undefined) {
    return count === 1 ? '1 item' : `${count} items`;
  }

  return `Label: ${this.text()}`;
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

### Semantic Roles

```html
<!-- Status (badges, notifications) -->
<span role="status" aria-live="polite">...</span>

<!-- Buttons -->
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

### CSS Classes (BEM)

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

### Files

```
badge.ts          # Component
badge.html        # Template
badge.scss        # Styles
badge.spec.ts     # Tests
```

## Component Checklist

- [ ] Selector with `guiders-*` prefix
- [ ] `ChangeDetectionStrategy.OnPush`
- [ ] Standalone imports
- [ ] Inputs with `input()` signals
- [ ] Outputs with `output()`
- [ ] Computed for CSS classes
- [ ] SCSS with design tokens
- [ ] BEM for CSS nomenclature
- [ ] ARIA inputs for accessibility
- [ ] Focus visible with `focus-ring`
- [ ] States: hover, focus, disabled, loading
- [ ] Unit tests
- [ ] Barrel export in `index.ts`

## Anti-patterns

- Hardcoding colors or spacing
- Omitting `ChangeDetectionStrategy.OnPush`
- Inputs/outputs with legacy decorators
- CSS classes without component namespace
- Missing interactive states
- Omitting ARIA attributes
- Business logic in UI components
