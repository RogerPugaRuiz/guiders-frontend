# Design System — guiders-frontend

**Author:** Sally (UX Designer, BMad)
**Date:** 2026-04-23
**Scope:** Sistema de diseño actual implementado en el código (brownfield)
**Source of truth:** `libs/shared/design-tokens/src/lib/tokens-vars.scss`

---

## Purpose

This document captures the **existing design system** as implemented in the codebase. Use it as the reference standard when creating new screens, components, or features to ensure visual and interaction consistency.

---

## 1. Design Philosophy

**Palette name:** "Hormigón y Sombra" (Concrete & Shadow)
**Aesthetic:** Sophisticated neutral palette with cold grays and a warm greige bridge. B2B desktop-first, minimal chrome, content-forward.

**Core principles:**
- Neutral-first: the UI recedes; content speaks.
- Carbon (`#1a1a1a`) is the original accent color — not blue, not a brand color.
- Dark sidebar + content area is the primary layout pattern.
- Supports **8 named themes** (4 dark + 4 light) via `data-theme="<name>"` attribute on `<body>`. See §2.12.

---

## 2. Color Tokens

### 2.1 Primitive Palette — Neutral Scale

| Token | Value | Name |
|---|---|---|
| `$color-carbon` | `#1a1a1a` | Carbon Black — dark anchor |
| `$color-slate-dark` | `#363636` | Dark Slate |
| `$color-steel` | `#707276` | Steel Gray — cold balance |
| `$color-greige` | `#a8a39d` | Greige — warm gray-beige bridge |
| `$color-mist` | `#dcdcdc` | Mist Gray — soft light |
| `$color-bone` | `#f8f8f6` | Bone White — warm contrast |

| Neutral step | Value |
|---|---|
| `$neutral-50` | `#f8f8f6` |
| `$neutral-100` | `#f3f3f1` |
| `$neutral-200` | `#dcdcdc` |
| `$neutral-300` | `#c4c4c4` |
| `$neutral-400` | `#a8a39d` |
| `$neutral-500` | `#8a8a8a` |
| `$neutral-600` | `#707276` |
| `$neutral-700` | `#525252` |
| `$neutral-800` | `#363636` |
| `$neutral-900` | `#262626` |
| `$neutral-950` | `#1a1a1a` |

### 2.2 Semantic Color Scales

**Success (Green):**
`$success-50` `#f0fdf4` → `$success-500` `#22c55e` → `$success-700` `#15803d`

**Warning (Amber):**
`$warning-50` `#fffbeb` → `$warning-500` `#f59e0b` → `$warning-700` `#b45309`

**Error/Danger (Red):**
`$error-50` `#fef2f2` → `$error-500` `#ef4444` → `$error-700` `#b91c1c`

**Info (Blue):**
`$info-50` `#eff6ff` → `$info-500` `#3b82f6` → `$info-700` `#1d4ed8`

### 2.3 Semantic Surface Tokens (Light Mode)

| Token | Resolves to | Usage |
|---|---|---|
| `$color-surface-primary` | `#f8f8f6` | Main background |
| `$color-surface-secondary` | `#f3f3f1` | Section backgrounds |
| `$color-surface-tertiary` | `#dcdcdc` | Highlighted areas |
| `$color-surface-elevated` | `#ffffff` | Cards, modals |
| `$color-surface-hover` | `#eeeeec` | Hover state |
| `$color-surface-selected` | `#e8e8e6` | Selected state |
| `$color-surface-disabled` | `#f3f3f1` | Disabled elements |
| `$color-surface-overlay` | `rgba(#1a1a1a, 0.6)` | Modal backdrops |

### 2.4 Semantic Text Tokens (Light Mode)

| Token | Value | Usage |
|---|---|---|
| `$color-text-primary` | `#1a1a1a` | Main text (Carbon) |
| `$color-text-secondary` | `#707276` | Secondary text (Steel) |
| `$color-text-tertiary` | `#8a8a8a` | Tertiary/muted text |
| `$color-text-disabled` | `#a8a39d` | Disabled text (Greige) |
| `$color-text-placeholder` | `#a8a39d` | Input placeholders |
| `$color-text-inverse` | `#f8f8f6` | Text on dark backgrounds |

Semantic text:
- `$color-text-success` → `#15803d`
- `$color-text-warning` → `#b45309`
- `$color-text-error` → `#dc2626`
- `$color-text-info` → `#1d4ed8`

### 2.5 Semantic Border Tokens

| Token | Value | Usage |
|---|---|---|
| `$color-border-subtle` | `#dcdcdc` | Dividers, light separators |
| `$color-border-default` | `#c4c4c4` | Standard borders (inputs) |
| `$color-border-strong` | `#8a8a8a` | Emphasized borders |
| `$color-border-hover` | `#707276` | Input hover |
| `$color-border-focus` | `#1a1a1a` | Focus ring (Carbon) |

### 2.6 Interactive / Accent Tokens

**Primary accent = Carbon (`#1a1a1a`)** — not a brand color, not blue.

| Token | Value |
|---|---|
| `$color-accent` | `#1a1a1a` |
| `$color-accent-hover` | `#363636` |
| `$color-accent-active` | `#1a1a1a` |
| `$color-accent-disabled` | `#a8a39d` |
| `$color-on-accent` | `#f8f8f6` |

Secondary accent (for secondary buttons):
- Background: `$neutral-200` (`#dcdcdc`)
- Hover: `$neutral-300` (`#c4c4c4`)
- Text: `$neutral-950` (`#1a1a1a`)

### 2.7 Sidebar Tokens

The sidebar has two themes: **dark** (default) and **light**.

**Dark sidebar (default):**
| Token | Value |
|---|---|
| `$color-sidebar-dark-bg` | `#1a1a1a` |
| `$color-sidebar-dark-bg-hover` | `rgba(#f8f8f6, 0.08)` |
| `$color-sidebar-dark-bg-active` | `rgba(#f8f8f6, 0.12)` |
| `$color-sidebar-dark-text` | `#a8a39d` (Greige) |
| `$color-sidebar-dark-text-muted` | `#8a8a8a` |
| `$color-sidebar-dark-text-active` | `#f8f8f6` (Bone White) |
| `$color-sidebar-dark-border` | `#363636` |

**Light sidebar:**
| Token | Value |
|---|---|
| `$color-sidebar-light-bg` | `#f3f3f1` |
| `$color-sidebar-light-text` | `#8a8a8a` |
| `$color-sidebar-light-text-active` | `#1a1a1a` |

### 2.8 Chat/Message Tokens

| Token | Value | Usage |
|---|---|---|
| `$color-message-visitor` | `#dcdcdc` | Visitor message bubble bg |
| `$color-message-visitor-text` | `#1a1a1a` | Visitor message text |
| `$color-message-own` | `#f3f3f1` | Agent message bubble bg |
| `$color-message-own-text` | `#1a1a1a` | Agent message text |
| `$color-message-system` | `#eff6ff` (info-50) | System message bg |
| `$color-message-system-text` | `#1d4ed8` | System message text |
| `$color-message-meta` | `#8a8a8a` | Timestamps, metadata |

AI message gradient: `linear-gradient(135deg, #eff6ff, #f3f3f1)` with `#bfdbfe` border.

### 2.9 Status Indicator Colors

| Status | Color | Value |
|---|---|---|
| Online | `$color-status-online` | `#22c55e` (success-500) |
| Away/Idle | `$color-status-away` | `#f59e0b` (warning-500) |
| Busy | `$color-status-busy` | `#ef4444` (error-500) |
| Offline | `$color-status-offline` | `#a8a39d` (greige) |

### 2.10 Badge Color Tokens

| Variant | Background | Text |
|---|---|---|
| Neutral | `#dcdcdc` | `#525252` |
| Success | `#dcfce7` | `#15803d` |
| Warning | `#fef3c7` | `#b45309` |
| Error | `#fee2e2` | `#b91c1c` |
| Info | `#dbeafe` | `#1d4ed8` |

### 2.11 Avatar Color Palette (generated from userId hash)

16 colors used for avatar backgrounds (all WCAG AA with white text):
```
#6366f1 (indigo)   #8b5cf6 (violet)   #a855f7 (purple)   #d946ef (fuchsia)
#ec4899 (pink)     #f43f5e (rose-red)  #ef4444 (red)      #f97316 (orange)
#f59e0b (amber)    #84cc16 (lime)      #22c55e (green)    #10b981 (emerald)
#14b8a6 (teal)     #06b6d4 (cyan)      #0ea5e9 (sky)      #3b82f6 (blue)
```

### 2.12 Multi-Theme System

The app supports **8 named themes** selectable by the user in `/settings/appearance`. Themes are applied via a `data-theme="<name>"` attribute on `<body>` by `ThemeService`. The value is persisted in `localStorage` under the key `guiders-sidebar-theme`.

**Dark themes:**

| `data-theme` value | Label | Accent | Background | Inspiration |
|---|---|---|---|---|
| `grey-dark` *(default)* | Grey | `#a8a39d` | `#1c1917` | "Hormigón y Sombra" — original palette |
| `carbon` | Carbon | `#ededed` | `#0a0a0a` | Vercel — deep blacks |
| `midnight` | Midnight | `#58a6ff` | `#0d1117` | GitHub — navy blues |
| `warm-dark` | Warm | `#9e8cfc` | `#16141d` | Linear — warm charcoals |

**Light themes:**

| `data-theme` value | Label | Accent | Background | Inspiration |
|---|---|---|---|---|
| `clean-light` | Clean | `#374151` | `#ffffff` | Pure white & greys — zero chroma |
| `daylight` | Daylight | `#1a6bcc` | `#f0f4f8` | Corporate blue |
| `fresh-light` | Fresh | `#0f9d74` | `#f5f7f5` | Mint green |
| `rose-quartz` | Rose | `#c2185b` | `#fdf6f7` | Mauve-pink |

**Legacy aliases** (backwards compat, normalised on read):
- `'dark'` → `'grey-dark'`
- `'light'` → `'daylight'`

**How CSS variables react to `data-theme`:**

All semantic CSS variables (`--color-bg-primary`, `--color-text-primary`, `--color-accent`, etc.) are defined per theme in blocks like:

```scss
[data-theme='carbon'] {
  --color-bg-primary: #0a0a0a;
  --color-accent: #ededed;
  // …
}
```

The sidebar remains visually dark regardless of the active theme — it uses its own `$color-sidebar-dark-*` SCSS tokens, not the global CSS variables.

**Service API** (`libs/shared/data-access/theme`):

```typescript
import { ThemeService, THEME_OPTIONS, SidebarTheme, NamedTheme } from '@guiders-frontend/shared/data-access/theme';

// Read current theme
const theme = themeService.theme(); // Signal<NamedTheme>

// Apply a theme (cast string to SidebarTheme if coming from a template)
themeService.setTheme('midnight');
themeService.setTheme(themeId as SidebarTheme);

// All available options (for a theme picker UI)
THEME_OPTIONS.forEach(opt => opt.id, opt.label, opt.accent, opt.bg, opt.light);
```

---

## 3. Typography

**Primary font:** `Inter`, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif
**Mono font:** `JetBrains Mono`, 'Fira Code', 'Monaco', 'Menlo', monospace

**Base font size:** 13px (`$font-size-base`)
**Base line height:** 1.5 (`$line-height-normal`)

### 3.1 Font Size Scale

| Token | Value | Usage |
|---|---|---|
| `$font-size-2xs` | 10px | Overlines, micro labels |
| `$font-size-xs` | 11px | Captions |
| `$font-size-sm` | 12px | Small labels, secondary text |
| `$font-size-base` | **13px** | Body text (default) |
| `$font-size-md` | 14px | Body medium |
| `$font-size-lg` | 16px | Body large, title small |
| `$font-size-xl` | 18px | Heading small |
| `$font-size-2xl` | 20px | Heading medium |
| `$font-size-3xl` | 24px | Heading large |
| `$font-size-4xl` | 30px | Display medium |
| `$font-size-5xl` | 36px | Display large |

### 3.2 Font Weight Scale

| Token | Value |
|---|---|
| `$font-weight-light` | 300 |
| `$font-weight-regular` | 400 |
| `$font-weight-medium` | 500 |
| `$font-weight-semibold` | 600 |
| `$font-weight-bold` | 700 |

### 3.3 Typography Presets (`@mixin typography($preset)`)

| Preset | Size | Weight | Line height |
|---|---|---|---|
| `display-large` | 36px | bold | 1.25 |
| `display-medium` | 30px | bold | 1.25 |
| `heading-large` / `h1` | 24px | semibold | 1.25 |
| `heading-medium` | 20px | semibold | 1.25 |
| `heading-small` | 18px | semibold | 1.375 |
| `title-large` | 16px | semibold | 1.375 |
| `title-medium` | 14px | semibold | 1.375 |
| `title-small` | 12px | semibold | 1.375 |
| `label-large` | 13px | medium | 1.25 |
| `label-medium` | 12px | medium | 1.25 |
| `label-small` | 11px | medium | 1.25 |
| `body-large` | 16px | regular | 1.625 |
| `body-medium` | 14px | regular | 1.625 |
| `body-base` | 13px | regular | 1.625 |
| `body-small` | 12px | regular | 1.625 |
| `caption` | 11px | regular | 1.5 |
| `overline` | 10px | semibold | 1.5, `letter-spacing: 0.05em`, UPPERCASE |

### 3.4 Global HTML Heading Sizes

```scss
h1 → heading-large  (24px semibold)
h2 → heading-medium (20px semibold)
h3 → heading-small  (18px semibold)
```

---

## 4. Spacing

**Scale:** 4px base grid

| Token | Value | Semantic alias |
|---|---|---|
| `$spacing-0-5` | 2px | `$spacing-2xs` |
| `$spacing-1` | 4px | `$spacing-xs` |
| `$spacing-2` | 8px | `$spacing-sm` |
| `$spacing-4` | 16px | `$spacing-md` |
| `$spacing-6` | 24px | `$spacing-lg` |
| `$spacing-8` | 32px | `$spacing-xl` |
| `$spacing-12` | 48px | `$spacing-2xl` |
| `$spacing-16` | 64px | `$spacing-3xl` |

Full numeric scale also available: `$spacing-3` (12px), `$spacing-5` (20px), `$spacing-7` (28px), `$spacing-9` (36px), `$spacing-10` (40px), `$spacing-11` (44px), `$spacing-14` (56px), `$spacing-20` (80px), `$spacing-24` (96px).

---

## 5. Borders & Border Radius

### Border Widths
| Token | Value |
|---|---|
| `$border-width-1` | 1px |
| `$border-width-2` | 2px |
| `$border-width-4` | 4px |

### Border Radius Scale

| Token | Value | Usage |
|---|---|---|
| `$border-radius-xs` | 2px | Very tight corners |
| `$border-radius-sm` | 4px | Chips, tags |
| `$border-radius-base` | 6px | Buttons default |
| `$border-radius-md` | 8px | Inputs, cards small |
| `$border-radius-lg` | 12px | Cards, panels |
| `$border-radius-xl` | 16px | Large cards |
| `$border-radius-2xl` | 24px | Modals |
| `$border-radius-full` | 9999px | Pills, avatars (circular) |
| `$border-radius-circle` | 50% | Circular elements |

---

## 6. Shadows

| Token | Value | Usage |
|---|---|---|
| `$shadow-xs` | `0 1px 2px rgba(carbon, 0.05)` | Subtle lift |
| `$shadow-sm` | `0 1px 3px + 1px 2px` | Cards |
| `$shadow-md` | `0 4px 6px + 2px 4px` | Hover cards, dropdowns |
| `$shadow-lg` | `0 10px 15px + 4px 6px` | Panels |
| `$shadow-xl` | `0 20px 25px + 8px 10px` | Modals |
| `$shadow-2xl` | `0 25px 50px rgba(carbon, 0.25)` | Large modals |
| `$shadow-focus` | `0 0 0 3px rgba(#1a1a1a, 0.15)` | Focus rings (standard) |
| `$shadow-focus-error` | `0 0 0 3px rgba(#ef4444, 0.25)` | Focus rings (error state) |

---

## 7. Animation & Transitions

### Duration Scale

| Token | Value | Usage |
|---|---|---|
| `$duration-instant` | 0ms | |
| `$duration-fastest` | 50ms | |
| `$duration-fast` | 100ms | Micro-interactions |
| `$duration-normal` | 150ms | Standard transitions |
| `$duration-slow` | 200ms | Hover effects |
| `$duration-slower` | 300ms | Panel slides |
| `$duration-slowest` | 500ms | Loading spinners |

### Predefined Transitions

| Token | Value |
|---|---|
| `$transition-fast` | `all 100ms cubic-bezier(0.2, 0, 0, 1)` |
| `$transition-normal` | `all 150ms cubic-bezier(0.2, 0, 0, 1)` |
| `$transition-slow` | `all 200ms cubic-bezier(0.2, 0, 0, 1)` |
| `$transition-colors` | color + background-color + border-color, 150ms |

### Built-in Keyframe Animations

- `spin` — 360° rotation, used for loading spinners
- `pulse` — opacity 1 → 0.5 → 1, used for skeleton loaders
- `fade-in` — opacity 0 → 1
- `slide-up` — opacity 0 + translateY(8px) → 1 + 0
- `slide-down` — opacity 0 + translateY(-8px) → 1 + 0

All animations respect `prefers-reduced-motion: reduce` — durations become `0.01ms`.

---

## 8. Z-Index Scale

| Token | Value | Usage |
|---|---|---|
| `$z-index-deep` | -1 | Below content |
| `$z-index-base` | 0 | |
| `$z-index-elevated` | 1 | Slightly raised |
| `$z-index-dropdown` | 50 | Dropdowns |
| `$z-index-sticky` | 100 | Sticky headers |
| `$z-index-overlay` | 1000 | Overlays |
| `$z-index-modal-backdrop` | 1100 | Modal backdrops |
| `$z-index-modal` | 1200 | Modals |
| `$z-index-popover` | 1300 | Popovers |
| `$z-index-tooltip` | 1400 | Tooltips |
| `$z-index-toast` | 1500 | Toast notifications |

---

## 9. Breakpoints

| Token | Value |
|---|---|
| `$breakpoint-xs` | 480px |
| `$breakpoint-sm` | 640px |
| `$breakpoint-md` | 768px |
| `$breakpoint-lg` | 1024px |
| `$breakpoint-xl` | 1280px |
| `$breakpoint-2xl` | 1440px |
| `$breakpoint-3xl` | 1920px |

---

## 10. Component Size Tokens

### Generic sizes (used for interactive elements)

| Token | Value |
|---|---|
| `$size-xs` | 16px |
| `$size-sm` | 20px |
| `$size-md` | 24px |
| `$size-lg` | 32px |
| `$size-xl` | 40px |
| `$size-2xl` | 48px |
| `$size-3xl` | 64px |

### Icon sizes

| Token | Value |
|---|---|
| `$icon-size-xs` | 12px |
| `$icon-size-sm` | 16px |
| `$icon-size-md` | 20px |
| `$icon-size-lg` | 24px |
| `$icon-size-xl` | 32px |

### Avatar sizes

| Token | Value |
|---|---|
| `$avatar-size-xs` | 24px |
| `$avatar-size-sm` | 32px |
| `$avatar-size-md` | 40px |
| `$avatar-size-lg` | 48px |
| `$avatar-size-xl` | 64px |

---

## 11. Components

All UI components live in `libs/shared/ui/{component-name}/`.
All use `standalone: true`, `ChangeDetectionStrategy.OnPush`, and signal-based inputs (`input()` / `output()`).

### 11.1 Button (`guiders-button`)

**Selector:** `guiders-button`
**File:** `libs/shared/ui/button/src/lib/button/button.ts`

**Variants:**

| Variant | Description | Visual |
|---|---|---|
| `primary` (default) | Main action, carbon gradient | Carbon bg + bone text, subtle elevation on hover |
| `secondary` | Secondary action | Light gray bg + border |
| `outline` | Outlined variant | Transparent bg + carbon border; fills on hover |
| `ghost` | Icon/subtle action | Transparent, sidebar-hover bg on hover |
| `danger` | Destructive action | Error-500 bg + white text |
| `cancel` | Cancel destructive | Outline variant of danger |
| `sidebar` | Navigation use only | Inherits sidebar text color; no self-managed hover |
| `unstyled` | Reset, use for icon wrappers | No styles, just hit area |

**Sizes:**

| Size | Height | Padding | Font |
|---|---|---|---|
| `small` | 32px min | 4px 12px | `button-small` |
| `medium` (default) | 40px min | 8px 16px | `button-medium` |
| `large` | 48px min | 12px 24px | `button-large` |

**States:** `disabled`, `loading` (spinner overlay), `active`, `full-width`

**API:**
```typescript
variant = input<ButtonVariant>('primary')
size = input<ButtonSize>('medium')
disabled = input<boolean>(false)
loading = input<boolean>(false)
fullWidth = input<boolean>(false)
active = input<boolean>(false)
buttonClick = output<MouseEvent>()
```

---

### 11.2 Badge (`guiders-badge`)

**Selector:** `guiders-badge`
**File:** `libs/shared/ui/badge/src/lib/badge/badge.ts`

**Variants:** `default` | `primary` | `secondary` | `success` | `warning` | `danger` | `info` | `neutral`

**Sizes:** `small` | `medium` (default) | `large`

**Shapes:** `rounded` (default) | `pill` | `square`

**Modifiers:** `dot` (indicator dot, no text) | `outline` | `disabled`

**Display logic:**
- If `count` prop set: shows `N` (capped at `maxCount`, default 99; shows `99+` when exceeded)
- If `text` prop set: shows text
- If `dot` prop: no text, just colored dot

**API:**
```typescript
variant = input<BadgeVariant>('default')
size = input<BadgeSize>('medium')
shape = input<BadgeShape>('rounded')
text = input<string>('')
count = input<number>()
maxCount = input<number>(99)
dot = input<boolean>(false)
outline = input<boolean>(false)
```

---

### 11.3 Avatar (`guiders-avatar`)

**Selector:** `guiders-avatar`
**File:** `libs/shared/ui/avatar/src/lib/avatar/avatar.ts`

**Sizes:** `small` | `medium` (default) | `large`

**Logic:**
- Generates initial from `name` → `email` → fallback `'V'`
- Background color deterministically generated from `userId` hash → 16-color palette
- Optionally shows presence status badge (online/away/busy/offline)

**API:**
```typescript
userId = input.required<string>()
name = input<string | undefined>(undefined)
email = input<string | undefined>(undefined)
presenceStatus = input<PresenceStatus | undefined>(undefined)
size = input<AvatarSize>('medium')
```

---

### 11.4 Icon (`guiders-icon`)

**Selector:** `guiders-icon`
**File:** `libs/shared/ui/icon/src/lib/icon/icon.component.ts`

**Sizes:** `xs` (12px) | `sm` (16px) | `md` (20px) | `lg` (24px) | `xl` (32px) | `2xl` (48px)

**Available icon names by category:**

| Category | Icons |
|---|---|
| Navigation | `arrow-left/right/up/down`, `chevron-*`, `sidebar-collapse/expand`, `menu`, `close`, `home` |
| Actions | `plus`, `minus`, `edit`, `trash`, `save`, `search`, `filter`, `refresh`, `download`, `upload`, `copy`, `external-link` |
| Status | `check`, `check-circle`, `x-circle`, `alert-triangle`, `info`, `help-circle`, `loading`, `eye`, `eye-off` |
| Communication | `message-circle`, `message-square`, `inbox`, `mail`, `phone`, `bell`, `bell-off`, `video`, `microphone`, `microphone-off` |
| Users | `user`, `users`, `user-plus`, `user-minus`, `settings`, `profile`, `shield`, `lock`, `unlock` |
| Files | `file`, `file-text`, `folder`, `folder-open`, `image`, `attachment` |
| Interface | `dashboard`, `calendar`, `clock`, `star`, `star-filled`, `heart`, `bookmark`, `tag`, `flag` |
| Analytics | `bar-chart`, `pie-chart`, `trending-up`, `trending-down`, `activity` |
| Business | `building`, `globe`, `target`, `layers`, `monitor`, `server` |

---

### 11.5 TextField (`guiders-text-field`)

**Selector:** `guiders-text-field`
**File:** `libs/shared/ui/text-field/src/lib/text-field/text-field.ts`

**Types:** `text` | `email` | `password` | `tel` | `url` | `search`
**Sizes:** `small` | `medium` (default) | `large`

**States:** `focused`, `disabled`, `readonly`, `error`, `required`
**Password type** automatically shows show/hide toggle.

**API:**
```typescript
label = input<string>()
placeholder = input<string>('')
helperText = input<string>()
errorMessage = input<string>()
type = input<TextFieldType>('text')
size = input<TextFieldSize>('medium')
value = input<string>('')
disabled = input<boolean>(false)
readonly = input<boolean>(false)
required = input<boolean>(false)
valueChange = output<string>()
```

---

### 11.6 Select (`guiders-select`)

**Selector:** `guiders-select`
**File:** `libs/shared/ui/select/src/lib/select/select.ts`

**Sizes:** `small` | `medium` (default) | `large`
**Supports:** placeholder, multiple selection, option groups (`group` property on `SelectOption`)

**States:** `focused`, `disabled`, `error`, `required`

**API:**
```typescript
options = input.required<SelectOption[]>()  // { value, label, disabled?, group? }
value = input<string | number>()
multiple = input<boolean>(false)
valueChange = output<string | number | (string | number)[]>()
selectionChange = output<SelectOption | SelectOption[]>()
```

---

### 11.7 Sidebar (`guiders-sidebar`)

**Selector:** `guiders-sidebar`
**File:** `libs/shared/ui/sidebar/src/lib/sidebar/sidebar.ts`

**Themes:** The sidebar always renders in dark style regardless of the active app theme. It uses its own `$color-sidebar-dark-*` SCSS tokens (see §2.7), not the global `data-theme` CSS variables. The `SidebarConfig.theme` input (`'dark' | 'light'`) controls sidebar-internal styling only and is independent of `ThemeService`.
**Width:** expanded `280px` | collapsed `64px`

**Features:**
- Collapsible with toggle button
- Items with `badge`, `children` (sub-menu), `route`, `isActive`
- Collapsed state shows icon-only with popover for sub-items
- App switcher button (optional)
- User menu at bottom (email, name, logout, configure account)
- Theme toggle (dark/light)

**SidebarItem interface:**
```typescript
{
  id: string
  label: string
  icon?: IconName
  route?: string
  badge?: { text: string, variant: BadgeVariant }
  children?: SidebarItem[]
  isActive?: boolean
}
```

**API:**
```typescript
items = input.required<SidebarItem[]>()
config = input<SidebarConfig>({ collapsed: false, showToggle: true, theme: 'dark', width: '280px', collapsedWidth: '64px' })
logoUrl = input<string | null>(null)
brandName = input<string>('Guiders')
userEmail = input<string | null>(null)
userName = input<string | null>(null)
showAppSwitcher = input<boolean>(false)
itemClick = output<SidebarItem>()
toggleSidebar = output<boolean>()
userLogout = output<void>()
themeChange = output<'light' | 'dark'>()
```

---

### 11.8 Other UI Components (inventory)

| Component | Selector | Notes |
|---|---|---|
| `ButtonPrimary` | `guiders-button-primary` | Standalone primary button variant |
| `ButtonSecondary` | `guiders-button-secondary` | Standalone secondary button variant |
| `ButtonTertiary` | `guiders-button-tertiary` | Standalone tertiary/ghost button variant |
| `Checkbox` | (checkbox lib) | Standard checkbox with label |
| `Radio` | (radio lib) | Radio input |
| `Pagination` | (pagination lib) | Page navigation control |
| `StatusSelector` | (status-selector lib) | Presence status dropdown |
| `UserMenu` | `guiders-user-menu` | User avatar + dropdown with logout/settings |
| `BentoGrid` | (bento-grid lib) | Grid layout for dashboard widgets |
| `BentoCard` | (bento-card lib) | Dashboard widget card |
| `BentoKpi` | (bento-kpi lib) | KPI metric display card |
| `ActivityStatCard` | (activity-stat-card lib) | Activity stats widget |
| `DonutChart` | (donut-chart lib) | SVG donut chart for analytics |

---

## 12. SCSS Usage Patterns

### Importing tokens in component styles

```scss
@use '@guiders-frontend/shared/design-tokens' as tokens;

.my-component {
  padding: tokens.$spacing-md;          // 16px
  color: tokens.$color-text-primary;
  font-size: tokens.$font-size-base;    // 13px
  border-radius: tokens.$border-radius-md;
  transition: tokens.$transition-normal;
}
```

Or within the lib itself (relative import):
```scss
@use '../../../../../design-tokens/src/lib/tokens-vars' as tokens;
```

### Using mixins

```scss
// Typography preset
@include tokens.typography('label-large');    // 13px medium

// Focus ring
@include tokens.focus-ring;                   // 2px carbon outline + 2px offset
@include tokens.focus-ring($color: #ef4444); // Custom color

// Button base styles
@include tokens.button-base;

// Input base styles
@include tokens.input-base;

// Card
@include tokens.card;                        // Standard card
@include tokens.card($elevated: true);       // Elevated card with shadow

// Text truncation
@include tokens.truncate;                    // Single line ellipsis
@include tokens.line-clamp(2);              // Multi-line clamp

// Custom scrollbar
@include tokens.custom-scrollbar;

// Visually hidden (accessible)
@include tokens.visually-hidden;
```

### Using CSS Custom Properties (in component styles)

CSS custom properties are available globally via `:root` in `apps/console/src/styles.scss`. Components can use them without importing SCSS tokens:

```scss
.my-component {
  color: var(--color-text-primary);
  background: var(--color-surface-primary);
  border: 1px solid var(--color-border-default);
  box-shadow: var(--shadow-md);
  border-radius: var(--radius-md);
  transition: var(--transition-normal);
}
```

Dark mode is handled automatically — the CSS custom properties update when `data-theme` is applied to `<body>` (see §2.12).

### BEM Naming Convention

```scss
.component-name {}                      // Block
.component-name__element {}             // Element
.component-name--modifier {}            // Modifier
.component-name__element--modifier {}   // Element + modifier
```

Prefix rules:
- Shared UI components: `guiders-*` (e.g. `.guiders-button`, `.guiders-badge`)
- Feature components: `lib-*` (e.g. `.lib-inbox`)

---

## 13. Layout Structure

### App Layout (Console)

```
.app-layout {
  display: grid;
  grid-template-columns: 256px 1fr;
  grid-template-areas: 'sidebar main';
  min-height: 100vh;
}

@media (max-width: 768px) {
  grid-template-columns: 1fr;
  grid-template-areas: 'main';
}
```

The sidebar is **always dark** (dark theme by default) even when the content area is in light mode. Sidebar and content area have independent theming.

### Global Body / HTML

```scss
html {
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  overflow: hidden;  // No scrolling at html level
}

body {
  font-family: Inter, system-ui;
  font-size: 13px;  // $font-size-base
  overflow: hidden; // Scroll managed by inner containers
}
```

---

## 14. Global Utility Classes

| Class | Function |
|---|---|
| `.sr-only` | Visually hidden but accessible to screen readers |
| `.skip-link` | Skip navigation link for keyboard users |

> **Note:** `.theme-dark` no longer exists. Theming is handled exclusively via `data-theme="<name>"` on `<body>` — see §2.12.

### Toast / Snackbar (`guiders-toast-host`)

The app uses a custom `ToastService` + `ToastHostComponent` from `@guiders-frontend/toast` (not Angular Material). Mount `<guiders-toast-host>` once in the layout component.

```typescript
import { ToastService } from '@guiders-frontend/toast';
this.toast.success('Guardado');
this.toast.error('Error al guardar');
```

Toasts auto-dismiss after 2 seconds. No Angular Material snackbar classes.

---

## 15. Accessibility Patterns

- **Focus rings:** `outline: 2px solid $color-accent; outline-offset: 2px` on all `:focus-visible`
- **Minimum touch targets:** 32px min-height on all interactive elements; 44px recommended
- **Color + text:** Colors are never the sole differentiator — text labels or icons always accompany color-coded states
- **Motion:** `prefers-reduced-motion` reduces all animation durations to `0.01ms`
- **Screen reader utilities:** `.sr-only` class using absolute positioning clip pattern
- **ARIA IDs:** Generated with unique suffix (`Math.random()`) in TextField and Select for `aria-describedby` linkage

---

## 16. How to Use This Document

When creating a new component or screen:

1. **Colors:** Use semantic tokens (`$color-text-primary`, not `#1a1a1a`) — they automatically work across all 8 themes via CSS variables.
2. **Spacing:** Use scale tokens (`$spacing-md` = 16px) — never hardcode px values.
3. **Typography:** Use `@include tokens.typography($preset)` — never set `font-size` + `font-weight` manually.
4. **Borders:** Use `$border-radius-*` and `$color-border-*` tokens.
5. **Shadows:** Use `$shadow-*` tokens — match depth to the element's elevation role.
6. **Components:** Check section 11 before building a new component — it may already exist.
7. **Dark mode:** Use CSS custom properties (`var(--color-*)`) or semantic SCSS tokens — both adapt automatically.

---

*End of Design System Documentation*
