# Reglas de Arquitectura - guiders-frontend

## Visión General

Frontend **Angular 20** con **Nx 21.4.1**, arquitectura **DDD por dominios**, componentes standalone y signals.

## Stack Técnico

- **Framework**: Angular 20 (standalone components)
- **Monorepo**: Nx 21.4.1
- **Build**: Vite 6
- **Testing**: Vitest 3 + Playwright
- **Estilos**: SCSS + Design Tokens

## Estructura del Proyecto

```
├── apps/
│   ├── admin/          # Dashboard de administración (puerto 4201)
│   └── console/        # Operaciones de chat (puerto 4200)
└── libs/
    ├── {domain}/       # auth, chat, analytics, admin
    │   ├── features/   # Smart components con routing
    │   ├── ui/         # Componentes presentacionales
    │   └── data-access/# Servicios HTTP
    └── shared/         # Utilidades cross-domain
        ├── types/
        ├── design-tokens/
        └── ui/
```

## Principios Fundamentales

### 1. Standalone Components
Todo componente debe ser standalone (sin NgModules):
```typescript
@Component({
  selector: 'guiders-badge',
  imports: [CommonModule],  // Imports directos
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Badge { }
```

### 2. Signal Inputs
Usar `input()` y `computed()` en lugar de `@Input()`:
```typescript
readonly variant = input<BadgeVariant>('default');
readonly isActive = computed(() => this.variant() === 'primary');
```

### 3. Function Injection
Usar `inject()` en lugar de constructor injection:
```typescript
// Correcto
private readonly http = inject(HttpClient);

// Evitar
constructor(private http: HttpClient) { }
```

### 4. Path Aliases
Todos los imports usan `@guiders-frontend/*`:
```typescript
import { SessionService } from '@guiders-frontend/auth/data-access/session';
```

## Navegación

### Angular (`angular/`)
- [Components](./angular/components.md) - Componentes standalone con signals
- [Services](./angular/services.md) - Servicios inyectables
- [Guards e Interceptors](./angular/guards-interceptors.md) - Auth y HTTP
- [Directivas y Pipes](./angular/directives-pipes.md)

### Arquitectura (`architecture/`)
- [Tipos de Librería](./architecture/library-types.md) - features, ui, data-access
- [Estructura de Dominios](./architecture/domain-structure.md) - DDD
- [Reglas de Dependencias](./architecture/dependency-rules.md) - Tags Nx
- [Resolución de Módulos](./architecture/module-resolution.md) - Paths

### State Management (`state-management/`)
- [BehaviorSubject Pattern](./state-management/behavior-subject-pattern.md)
- [Servicios HTTP](./state-management/http-services.md)
- [WebSocket Integration](./state-management/websocket-integration.md)

### Design System (`design-system/`)
- [Design Tokens](./design-system/design-tokens.md) - Variables SCSS
- [Estándares de Componentes](./design-system/component-standards.md)
- [Patrones UI](./design-system/ui-patterns.md)

### Testing (`testing/`)
- [Vitest Patterns](./testing/vitest-patterns.md) - Unit testing
- [Testing Services](./testing/testing-services.md) - Mocking HTTP
- [Playwright E2E](./testing/playwright-e2e.md) - E2E testing

### Nx (`nx/`)
- [Estructura del Workspace](./nx/workspace-structure.md)
- [Generadores](./nx/generators.md) - Crear libs y componentes
- [Comandos](./nx/commands.md) - build, test, serve

## Anti-patrones Globales

- Usar NgModules (todo debe ser standalone)
- Constructor injection (usar `inject()`)
- `@Input()` decorators (usar `input()` signals)
- Imports relativos entre libs (usar `@guiders-frontend/*`)
- `ChangeDetectionStrategy.Default` (usar `OnPush`)
- Lógica de negocio en componentes UI
