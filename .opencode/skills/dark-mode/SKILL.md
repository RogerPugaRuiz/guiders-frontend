---
name: dark-mode
description: Implement dark/light theme support in Angular components using ThemeService and CSS variables
license: MIT
compatibility: opencode
metadata:
  audience: developers
  workflow: theming
  framework: angular
---

# Dark Mode - Theme Implementation Skill

## What I do

I help you implement dark/light theme support in Angular components following the Guiders Frontend project conventions.

### My responsibilities:

- Inject and use the `ThemeService` from `@guiders-frontend/shared/data-access/theme`
- Apply theme classes dynamically to components
- Set up CSS variables that change based on theme
- Follow the same pattern used in the sidebar component
- Ensure theme persists in localStorage
- Validate proper theme implementation

## When to use me

Use this skill when you need to:

- Add dark/light theme support to a new component
- Update an existing component to support themes
- Implement theme-aware CSS variables
- Follow the project's theming conventions
- Debug theme-related issues

## Project Theme System Overview

The Guiders Frontend uses a centralized theme system:

### ThemeService

- **Location**: `@guiders-frontend/shared/data-access/theme`
- **Storage key**: `'guiders-sidebar-theme'`
- **Default theme**: `'dark'`
- **Type**: `'light' | 'dark'`
- **Signals exposed**:
  - `theme()` - Current theme signal
  - `isDarkTheme()` - Computed boolean
  - `isLightTheme()` - Computed boolean
- **Methods**:
  - `setTheme(theme: 'light' | 'dark')` - Set theme manually
  - `toggleTheme()` - Switch between themes

### How the Sidebar Implements It

**TypeScript** (`sidebar.ts`):

```typescript
import { ThemeService } from '@guiders-frontend/shared/data-access/theme';

export class Sidebar {
  private readonly themeService = inject(ThemeService);

  // Use the service's signal directly
  readonly currentTheme = this.themeService.theme;

  // Create computed classes
  readonly sidebarClasses = computed(() => ({
    sidebar: true,
    'sidebar--dark': this.currentTheme() === 'dark',
    'sidebar--light': this.currentTheme() === 'light',
  }));

  // Optional: computed for convenience
  readonly isDarkTheme = computed(() => this.currentTheme() === 'dark');

  // Toggle handler
  onToggleTheme(): void {
    const newTheme = this.themeService.toggleTheme();
    this.themeChange.emit(newTheme);
  }
}
```

**HTML** (`sidebar.html`):

```html
<aside [ngClass]="sidebarClasses()">
  <!-- Component content -->
</aside>
```

**SCSS** (`sidebar.scss`):

```scss
.sidebar {
  // TEMA DARK (por defecto)
  --sidebar-bg: #{tokens.$color-sidebar-dark-bg};
  --sidebar-text: #{tokens.$color-sidebar-dark-text};

  background: var(--sidebar-bg);
  color: var(--sidebar-text);

  // TEMA LIGHT
  &--light {
    --sidebar-bg: #{tokens.$color-sidebar-light-bg};
    --sidebar-text: #{tokens.$color-sidebar-light-text};
  }
}
```

## Implementation Steps

### Step 1: Import ThemeService in TypeScript

```typescript
import { Component, inject, computed } from '@angular/core';
import { ThemeService } from '@guiders-frontend/shared/data-access/theme';

@Component({
  selector: 'guiders-my-component',
  // ...
})
export class MyComponent {
  private readonly themeService = inject(ThemeService);

  // Use theme signal directly (reactive)
  readonly currentTheme = this.themeService.theme;

  // Create computed classes for ngClass
  readonly componentClasses = computed(() => ({
    'my-component': true,
    'my-component--dark': this.currentTheme() === 'dark',
    'my-component--light': this.currentTheme() === 'light',
  }));
}
```

### Step 2: Apply Classes in HTML

```html
<div [ngClass]="componentClasses()">
  <!-- Component content -->
</div>
```

**Alternative using host binding**:

```typescript
@Component({
  selector: 'guiders-my-component',
  host: {
    '[attr.data-theme]': 'currentTheme()'
  },
  // ...
})
```

### Step 3: Define CSS Variables in SCSS

```scss
@use 'path/to/tokens-vars' as tokens;

.my-component {
  // TEMA DARK (por defecto)
  --my-component-bg: #{tokens.$neutral-900};
  --my-component-text: #{tokens.$neutral-100};
  --my-component-border: #{tokens.$neutral-700};

  background: var(--my-component-bg);
  color: var(--my-component-text);
  border: 1px solid var(--my-component-border);

  // TEMA LIGHT
  &--light {
    --my-component-bg: #{tokens.$neutral-50};
    --my-component-text: #{tokens.$neutral-900};
    --my-component-border: #{tokens.$neutral-300};
  }
}
```

**Alternative using :host selector**:

```scss
:host {
  // Default dark theme
  --my-component-bg: #{tokens.$neutral-900};
}

:host[data-theme='light'] {
  --my-component-bg: #{tokens.$neutral-50};
}

.my-component {
  background: var(--my-component-bg);
}
```

## Design Tokens Reference

Available theme-specific tokens in `@guiders-frontend/shared/design-tokens`:

### Sidebar Tokens

```scss
// Dark theme
tokens.$color-sidebar-dark-bg
tokens.$color-sidebar-dark-bg-hover
tokens.$color-sidebar-dark-bg-active
tokens.$color-sidebar-dark-text
tokens.$color-sidebar-dark-text-active
tokens.$color-sidebar-dark-text-muted
tokens.$color-sidebar-dark-border

// Light theme
tokens.$color-sidebar-light-bg
tokens.$color-sidebar-light-bg-hover
tokens.$color-sidebar-light-bg-active
tokens.$color-sidebar-light-text
tokens.$color-sidebar-light-text-active
tokens.$color-sidebar-light-text-muted
tokens.$color-sidebar-light-border
```

### Neutral Colors (General Use)

```scss
tokens.$neutral-50   // Very light
tokens.$neutral-100
tokens.$neutral-200
tokens.$neutral-300
tokens.$neutral-400
tokens.$neutral-500
tokens.$neutral-600
tokens.$neutral-700
tokens.$neutral-800
tokens.$neutral-900  // Very dark
```

### Other Useful Tokens

```scss
tokens.$color-surface-primary
tokens.$color-surface-secondary
tokens.$color-text-primary
tokens.$color-text-secondary
tokens.$color-border-default
```

## Examples

### Example 1: User Menu Component

**TypeScript**:

```typescript
export class UserMenu {
  private readonly themeService = inject(ThemeService);
  readonly currentTheme = this.themeService.theme;
}
```

**HTML**:

```html
<div class="user-menu" [class.user-menu--light]="currentTheme() === 'light'" [class.user-menu--dark]="currentTheme() === 'dark'">
  <!-- content -->
</div>
```

**SCSS**:

```scss
.user-menu {
  --user-menu-email-color: #{tokens.$neutral-300};

  &--light {
    --user-menu-email-color: #{tokens.$neutral-800};
  }

  &__email {
    color: var(--user-menu-email-color);
  }
}
```

### Example 2: Using :host with data-theme

**TypeScript**:

```typescript
@Component({
  selector: 'guiders-card',
  host: {
    '[attr.data-theme]': 'themeService.theme()',
  },
})
export class Card {
  readonly themeService = inject(ThemeService);
}
```

**SCSS**:

```scss
:host {
  --card-bg: #{tokens.$neutral-900};
  --card-text: #{tokens.$neutral-100};
}

:host[data-theme='light'] {
  --card-bg: #{tokens.$neutral-50};
  --card-text: #{tokens.$neutral-900};
}

.card {
  background: var(--card-bg);
  color: var(--card-text);
}
```

## Best Practices

### ✅ DO:

- Always inject `ThemeService` using `inject()`
- Use the `theme()` signal directly from the service (reactive)
- Define dark theme as default (project convention)
- Use CSS variables for theme-specific values
- Use design tokens from `@guiders-frontend/shared/design-tokens`
- Apply theme classes at the component root level
- Test both light and dark themes

### ❌ DON'T:

- Don't use `@media (prefers-color-scheme)` - use ThemeService instead
- Don't hard-code colors - use design tokens
- Don't duplicate ThemeService logic - use the existing service
- Don't forget fallback values in `var(--custom-prop, fallback)`
- Don't use `@Input()` for theme - use the centralized service

## Checklist

When implementing dark mode in a component:

- [ ] Import `ThemeService` from `@guiders-frontend/shared/data-access/theme`
- [ ] Inject service using `inject(ThemeService)`
- [ ] Use `themeService.theme()` signal (not creating new signals)
- [ ] Apply theme classes via `[ngClass]` or `host` binding
- [ ] Define CSS variables for dark theme (default)
- [ ] Define CSS variables for light theme (modifier class or `:host[data-theme='light']`)
- [ ] Use design tokens, not hard-coded colors
- [ ] Test theme switching works correctly
- [ ] Verify localStorage persistence (`'guiders-sidebar-theme'`)

## Troubleshooting

### Theme not applying

- ✅ Check ThemeService is imported and injected correctly
- ✅ Verify `currentTheme` signal is used in template
- ✅ Ensure CSS classes are applied to the correct element
- ✅ Check SCSS variable definitions use correct syntax

### Theme not persisting

- ✅ Verify you're using the centralized ThemeService
- ✅ Check localStorage key is `'guiders-sidebar-theme'`
- ✅ Ensure service is provided at root level

### CSS variables not working

- ✅ Use `var(--custom-prop, fallback)` syntax
- ✅ Ensure variables are defined in the correct scope
- ✅ Check that design tokens are imported: `@use '...tokens-vars' as tokens;`
- ✅ Verify interpolation syntax: `#{tokens.$variable-name}`

### Colors not changing

- ✅ Verify both dark and light theme variables are defined
- ✅ Check theme classes are actually applied in the DOM
- ✅ Ensure specificity is correct (no overrides)
- ✅ Test with browser DevTools to inspect computed styles

## Remember

- **The project uses localStorage, NOT system preferences**
- **ThemeService is the single source of truth**
- **Dark theme is the default** (project convention)
- **All theme-related state is managed centrally**
- **CSS variables make theme switching instant and smooth**
- **Design tokens ensure consistency across the app**
