# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Serve Applications

```bash
npm run serve          # Console app on port 4200
npm run serve:admin     # Admin app on port 4201
npm run dev            # Console in development mode
npm run dev:admin      # Admin in development mode
```

### Build & Test

```bash
npm run build:all      # Build both apps in parallel
npm run build:prod     # Production builds
npm run build:staging  # Staging builds
npm run test           # Run all tests in parallel
npm run test:coverage  # Run tests with CI configuration
npm run lint           # Lint all projects
npm run lint:fix       # Lint with auto-fix
npm run e2e            # Run all e2e tests
```

### Nx Commands

```bash
nx graph              # Visualize project dependencies
nx affected -t build  # Build only affected projects
nx affected -t test   # Test only affected projects
nx affected -t lint   # Lint only affected projects
```

## Architecture Overview

**Tech Stack**: Nx 21.4.1 monorepo with Angular 20 standalone components, Vite 6, Vitest 3, Playwright, SCSS, ESLint 9.

**Structure**: Domain-Driven Design (DDD) pattern with `apps/` (admin, console) and domain-organized libraries in `libs/{domain}/{type}/{name}`.

### Library Organization

- **Domain boundaries**: `analytics`, `auth`, `chat`, `shared`
- **Library types**:
  - `features/` - Smart components with routing and business logic
  - `ui/` - Presentational components, prefixed with `guiders-*`
  - `data-access/` - HTTP services as independent Nx projects
  - `shared/` - Cross-domain utilities (types, design-tokens, ui components)

### Import Paths

All imports use `@guiders-frontend/*` paths mapped in `tsconfig.base.json`:

- `@guiders-frontend/visitors-data-service`
- `@guiders-frontend/chat/features/inbox`
- `@guiders-frontend/shared/types`

## Angular Patterns

### Component Architecture

- **Standalone components only** - No NgModules
- **Dependency injection**: Use `inject()` function, not constructor injection
- **Lazy routes**: Export `routes: Route[]`, loaded via `loadChildren`

### Authentication

- **Guard**: `authGuard` checks `localStorage.getItem('access-token')`
- **HTTP**: All requests include `withCredentials: true` and Bearer token if available

### HTTP Services Pattern

```typescript
@Injectable({ providedIn: 'root' })
export class DataService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:3000/api';

  // Always use withCredentials: true
  // Add Bearer token from localStorage if available
}
```

## Project Generation

### Nx Generators

Use workspace defaults (scss, vitest, playwright):

```bash
# UI components with guiders- prefix
nx g @nx/angular:lib ui-component-name --directory=libs/shared/ui/component-name

# Features with lib- prefix
nx g @nx/angular:lib feature-name --directory=libs/domain/features/feature-name

# Data access services
nx g @nx/angular:lib service-name --directory=libs/domain/data-access/service-name
```

### Tags System

Always add proper tags for dependency enforcement:

- `scope:{domain}` - analytics, auth, chat, shared
- `type:{ui|feature|data-access}`

## Design System & UI

**Design Tokens**: Use `@guiders-frontend/design-tokens` for spacing (4/8px scale), colors, typography.

**Component Standards**:

- Prefix: All UI components use `guiders-*`
- SCSS: Based on design tokens
- Accessibility: WCAG 2.2 AA compliance
- Typography: Inter (UI), Roboto Mono (data/code)

## Key Dependencies & Data Flow

**Applications**:

- `admin` - Analytics dashboard (port 4201)
- `console` - Chat operations (port 4200)

**Critical Dependencies**:

- `visitors-data-service` → `visitors` feature → `visitors-list` UI
- `session` service → `login` feature → `auth-guard`
- All services import types from `@guiders-frontend/shared/types`

## Linting & Type Checking

Always run after significant changes:

```bash
npm run lint:fix
npm run test

```

## Important Files to Reference

- `libs/chat/data-access/visitors-data-service/` - HTTP service patterns
- `apps/console/src/app/app.routes.ts` - Lazy loading with guards
- `tsconfig.base.json` - Path mappings
- `nx.json` - Generator defaults and target configurations
- `.github/copilot-instructions.md` - Detailed development patterns
- `llm/ui-design-prompt.md` - AI prompt guide for UI component generation

Before creating new libraries, check `nx graph` and align with existing dependency patterns. Maintain proper barrel exports from `src/index.ts`.

<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- You have access to the Nx MCP server and its tools, use them to help the user
- When answering questions about the repository, use the `nx_workspace` tool first to gain an understanding of the workspace architecture where applicable.
- When working in individual projects, use the `nx_project_details` mcp tool to analyze and understand the specific project structure and dependencies
- For questions around nx configuration, best practices or if you're unsure, use the `nx_docs` tool to get relevant, up-to-date docs. Always use this instead of assuming things about nx configuration
- If the user needs help with an Nx configuration or project graph error, use the `nx_workspace` tool to get any errors

<!-- nx configuration end-->
- responde siempre en español