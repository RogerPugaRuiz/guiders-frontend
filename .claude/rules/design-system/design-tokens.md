# Design Tokens

## Description

SCSS variable system to maintain visual consistency in colors, spacing, typography, and more.

## Reference

`libs/shared/design-tokens/src/lib/tokens-vars.scss`

## Basic Usage

```scss
@use '@guiders-frontend/shared/design-tokens' as tokens;

.my-component {
  background: tokens.$color-surface-primary;
  padding: tokens.$spacing-md;
  border-radius: tokens.$border-radius-md;
  font-family: tokens.$font-family-ui;
}
```

## Colors

### Surface (Backgrounds)

```scss
$color-surface-primary: #ffffff;    // Primary background
$color-surface-secondary: #f8f9fa;  // Secondary background
$color-surface-tertiary: #f1f3f4;   // Tertiary background
$color-surface-hover: #f1f3f4;      // Hover state
$color-surface-selected: #e7f3ff;   // Selected state
$color-surface-disabled: #f1f3f4;   // Disabled state
$color-surface-elevated: #ffffff;   // Cards/modals
```

### Text

```scss
$color-text-primary: #212529;    // Primary text
$color-text-secondary: #495057;  // Secondary text
$color-text-tertiary: #6c757d;   // Tertiary text
$color-text-disabled: #ced4da;   // Disabled text
$color-text-inverse: #ffffff;    // Text on dark backgrounds
```

### Brand/Semantic

```scss
// Primary (blue)
$color-primary-500: #007bff;
$color-primary-600: #0066cc;
$color-primary-700: #004d99;

// Success (green)
$color-success-500: #28a745;
$color-success-600: #10b981;

// Warning (yellow)
$color-warning-500: #ffc107;
$color-warning-600: #f59e0b;

// Danger/Error (red)
$color-danger-500: #dc3545;
$color-danger-600: #b02a37;

// Info (cyan)
$color-info-500: #17a2b8;
$color-info-600: #3b82f6;
```

### Borders

```scss
$color-border-light: #f1f3f5;     // Subtle divisions
$color-border-subtle: #dee2e6;    // Subtle borders
$color-border-default: #ced4da;   // Default borders
$color-border-primary: #007bff;   // Accent borders
$color-border-strong: #6c757d;    // Strong borders
```

## Spacing (4px Scale)

```scss
$spacing-2xs: 2px;   // Minimum
$spacing-xs: 4px;    // Extra small
$spacing-sm: 8px;    // Small
$spacing-md: 16px;   // Medium (base)
$spacing-lg: 24px;   // Large
$spacing-xl: 32px;   // Extra large
$spacing-2xl: 48px;  // 2x extra large
$spacing-3xl: 64px;  // 3x extra large

// Alternative numeric
$spacing-1: 4px;
$spacing-2: 8px;
$spacing-3: 12px;
$spacing-4: 16px;
$spacing-6: 24px;
$spacing-8: 32px;
```

## Typography

### Families

```scss
$font-family-ui: Inter, system-ui, -apple-system, sans-serif;
$font-family-mono: 'Monaco', 'Menlo', monospace;
```

### Sizes

```scss
$font-size-xs: 10px;    // Captions
$font-size-sm: 12px;    // Small labels
$font-size-base: 13px;  // Base text
$font-size-lg: 18px;    // Subtitles
$font-size-xl: 20px;    // Titles
$font-size-2xl: 24px;   // Large titles
```

### Weights

```scss
$font-weight-regular: 400;
$font-weight-medium: 500;
$font-weight-semibold: 600;
$font-weight-bold: 700;
```

### Line Heights

```scss
$line-height-tight: 1.25;    // Titles
$line-height-normal: 1.5;    // Normal text
$line-height-relaxed: 1.625; // Spaced text
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
$border-radius-circle: 50%;   // Circle
```

## Shadows

```scss
$shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
$shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
$shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
$shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
```

## Transitions

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

## Available Mixins

### Typography

```scss
@include tokens.typography('heading-3xl');  // Large title
@include tokens.typography('heading-2xl');  // Title
@include tokens.typography('label-large');  // Large label
@include tokens.typography('label-medium'); // Medium label
@include tokens.typography('body-medium');  // Medium body
@include tokens.typography('body-small');   // Small body
@include tokens.typography('caption');      // Caption
```

### Button Base

```scss
.my-button {
  @include tokens.button-base;
  // Includes: display, padding, border, radius, font, hover, focus, disabled
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
  // 20px animated spinner
}
```

### Button Reset

```scss
.icon-button {
  @include tokens.button-reset;
  // Removes default button styles
}
```

## Complete Example

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

## Anti-patterns

- Hardcoding colors (`#007bff` instead of `$color-primary-500`)
- Hardcoding spacing (`16px` instead of `$spacing-md`)
- Using arbitrary `px` values that don't follow the 4px scale
- Not using mixins for repetitive patterns
- Importing tokens without namespace (`@use` without `as`)
