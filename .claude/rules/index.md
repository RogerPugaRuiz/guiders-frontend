# Architecture Rules - guiders-frontend

## Overview

**Angular 20** frontend with **Nx 21.4.1**, **DDD architecture by domains**, standalone components and signals.

## Technical Stack

- **Framework**: Angular 20 (standalone components)
- **Monorepo**: Nx 21.4.1
- **Build**: Vite 6
- **Testing**: Vitest 3 + Playwright
- **Styles**: SCSS + Design Tokens

## Project Structure

```
├── apps/
│   ├── admin/          # Administration dashboard (port 4201)
│   └── console/        # Chat operations (port 4200)
└── libs/
    ├── {domain}/       # auth, chat, analytics, admin
    │   ├── features/   # Smart components with routing
    │   ├── ui/         # Presentational components
    │   └── data-access/# HTTP Services
    └── shared/         # Cross-domain utilities
        ├── types/
        ├── design-tokens/
        └── ui/
```

## Fundamental Principles

### 1. Standalone Components
All components must be standalone (no NgModules):
```typescript
@Component({
  selector: 'guiders-badge',
  imports: [CommonModule],  // Direct imports
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Badge { }
```

### 2. Signal Inputs
Use `input()` and `computed()` instead of `@Input()`:
```typescript
readonly variant = input<BadgeVariant>('default');
readonly isActive = computed(() => this.variant() === 'primary');
```

### 3. Function Injection
Use `inject()` instead of constructor injection:
```typescript
// Correct
private readonly http = inject(HttpClient);

// Avoid
constructor(private http: HttpClient) { }
```

### 4. Path Aliases
All imports use `@guiders-frontend/*`:
```typescript
import { SessionService } from '@guiders-frontend/auth/data-access/session';
```

## Navigation

### Angular (`angular/`)
- [Components](./angular/components.md) - Standalone components with signals
- [Services](./angular/services.md) - Injectable services
- [Guards and Interceptors](./angular/guards-interceptors.md) - Auth and HTTP
- [Directives and Pipes](./angular/directives-pipes.md)

### Architecture (`architecture/`)
- [Library Types](./architecture/library-types.md) - features, ui, data-access
- [Domain Structure](./architecture/domain-structure.md) - DDD
- [Dependency Rules](./architecture/dependency-rules.md) - Nx Tags
- [Module Resolution](./architecture/module-resolution.md) - Paths

### State Management (`state-management/`)
- [BehaviorSubject Pattern](./state-management/behavior-subject-pattern.md)
- [HTTP Services](./state-management/http-services.md)
- [WebSocket Integration](./state-management/websocket-integration.md)

### Design System (`design-system/`)
- [Design Tokens](./design-system/design-tokens.md) - SCSS Variables
- [Component Standards](./design-system/component-standards.md)
- [UI Patterns](./design-system/ui-patterns.md)

### Testing (`testing/`)
- [Vitest Patterns](./testing/vitest-patterns.md) - Unit testing
- [Testing Services](./testing/testing-services.md) - Mocking HTTP
- [Playwright E2E](./testing/playwright-e2e.md) - E2E testing

### Nx (`nx/`)
- [Workspace Structure](./nx/workspace-structure.md)
- [Generators](./nx/generators.md) - Creating libs and components
- [Commands](./nx/commands.md) - build, test, serve

### Features (`features/`)
- [Inbox Structure](./features/inbox-structure.md) - **⚠️ CRITICAL: Consult when debugging /inbox**

## Global Anti-patterns

- Using NgModules (everything must be standalone)
- Constructor injection (use `inject()`)
- `@Input()` decorators (use `input()` signals)
- Relative imports between libs (use `@guiders-frontend/*`)
- `ChangeDetectionStrategy.Default` (use `OnPush`)
- Business logic in UI components
