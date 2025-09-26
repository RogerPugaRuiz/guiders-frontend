# AI Coding Agent Instructions - Guiders Frontend

## Architecture Overview
Nx 21.4.1 monorepo with DDD pattern: `apps/` (admin, console) and domain-organized `libs/{domain}/{type}/{name}`.

**Stack**: Angular 20 standalone + Vite 6 + Vitest 3 + Playwright + SCSS + ESLint 9

### Library Types & Dependencies
- `features/` - Smart components with routing (`type:feature`)
- `ui/` - Presentational components (`type:ui`) 
- `data-access/` - HTTP services as separate projects (`type:data-access`)
- `shared/` - Cross-domain utilities (`type:ui`, `type:types`)

**Critical**: Each data-access service is an independent Nx project with proper tags. Features depend on UI + data-access libs.

## Development Commands
```bash
# Serve apps (specific ports)
npm run serve:console     # Port 4200 
npm run serve:admin       # Port 4201

# Build & test (parallel execution)
npm run build:all         # Both apps
npm run test:coverage     # CI configuration
npm run e2e              # All e2e tests

# Nx specific
nx graph                 # Visualize dependencies
nx affected -t build     # Only changed projects
```

## TypeScript & Module Resolution
- `moduleResolution: "bundler"`, `target: "es2022"`
- All imports via `@guiders-frontend/*` paths mapped in `tsconfig.base.json`
- Examples: `@guiders-frontend/visitors-data-service`, `@guiders-frontend/chat/features/inbox`

## Angular Patterns (Critical)
- **Standalone components only** - No NgModules
- **Dependency injection**: Use `inject()` function, not constructor injection
- **Lazy routes**: Export `routes: Route[]`, loaded via `loadChildren: () => import('@guiders-frontend/...').then(m => m.routes)`
- **Functional guards**: `authGuard` checks `localStorage.getItem('access-token')`

## HTTP & Data Access Pattern
Services follow strict pattern:
```typescript
@Injectable({ providedIn: 'root' })
export class DataService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:3000/api';
  
  // Always use withCredentials: true
  // Add Bearer token from localStorage if available
}
```

**Authentication**: Token from `localStorage.getItem('access-token')` → `Authorization: Bearer <token>` header.

## Project Generation & Tags
Use Nx generators with workspace defaults (scss, vitest, playwright):
- UI components: prefix `guiders-*`
- Features: prefix `lib-*`  
- **Always add proper tags**: `scope:{domain}`, `type:{ui|feature|data-access}`

## Key Dependencies & Data Flow
- **Apps**: `admin` (analytics), `console` (chat operations)
- **Chat domain**: `visitors-data-service` → `visitors` feature → `visitors-list` UI
- **Auth flow**: `session` service → `login` feature → `auth-guard`
- **Shared types**: All services import from `@guiders-frontend/shared/types`

## UI/UX Design System
**Based on**: `guia-diseno-interfaces-b2b-web-desktop.md`

### Component Standards
- **Prefix**: All UI components use `guiders-*` prefix
- **SCSS**: Use design tokens for spacing (4/8px scale), colors, typography
- **Accessibility**: WCAG 2.2 AA compliance - contrast ≥4.5:1, keyboard navigation, ARIA when needed
- **Hit areas**: Minimum 32×32px with 8px spacing between interactive elements

### Typography & Layout
- **Font stack**: Inter (UI), Roboto Mono (data/code) 
- **Scale**: 12, 14, 16, 18, 20, 24, 28, 32px with line-height 1.4–1.6
- **Grid**: 12 columns, 24px gutters, desktop breakpoints: 1280/1440/1600/1920px
- **Structure**: Header 64px, Sidebar 256px, Content fluid, Footer optional

### Component Patterns
- **Forms**: TextField, Select, Checkbox, validation with inline feedback
- **Navigation**: Tabs, Breadcrumbs, Sidebar with consistent states
- **Data display**: Tables with sorting/filtering, Empty states with CTAs
- **Feedback**: Toast notifications, loading skeletons, error boundaries

### Motion & States  
- **Durations**: 100-150ms micro, 200-300ms transitions, 400ms max
- **States**: Loading, empty, error, no permissions with recovery guidance
- **Respect**: `prefers-reduced-motion` setting

## Critical Files to Reference
- `libs/chat/data-access/visitors-data-service/` - HTTP service patterns
- `apps/console/src/app/app.routes.ts` - Lazy loading with guards
- `tsconfig.base.json` - Path mappings
- `nx.json` - Generator defaults and target configurations
- `guia-diseno-interfaces-b2b-web-desktop.md` - Complete UI/UX standards

**Before creating new libs**: Check `nx graph` and align with existing dependency patterns. Maintain proper barrel exports from `src/index.ts`.
