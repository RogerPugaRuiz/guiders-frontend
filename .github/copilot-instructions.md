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
- **Change detection**: Components use `OnPush` strategy - call `cdr.detectChanges()` for manual updates
- **Lazy routes**: Export `routes: Route[]`, loaded via `loadChildren: () => import('@guiders-frontend/...').then(m => m.routes)`
- **Functional guards**: `authGuard` checks `localStorage.getItem('access-token')`

## State Management Pattern
Services use **BehaviorSubject + Observable** pattern:
```typescript
@Injectable({ providedIn: 'root' })
export class DataService {
  private readonly dataSubject = new BehaviorSubject<Data[]>([]);
  readonly data$ = this.dataSubject.asObservable();
  
  private readonly http = inject(HttpClient);
  private readonly environment = inject(ENVIRONMENT_TOKEN);
}
```

## HTTP & Data Access Pattern
**Authentication**: Token from `localStorage.getItem('access-token')` → `Authorization: Bearer <token>` header.

**Backend Response Mapping**: Backend may return different field names than expected:
- `id` (backend) → `messageId` (frontend)
- `createdAt` (backend) → `sentAt` (frontend)
- Always transform responses to match internal types
- Use `.reverse()` when backend returns descending order but UI needs ascending

**WebSocket Integration**: Socket.IO v4 with rooms, separate `wsUrl` from HTTP `baseUrl` in environment config.

## Design System - Critical Tokens
**Import pattern**: `@use '../../path/to/design-tokens/tokens-vars' as tokens;`

**Available spacing tokens** (4/8px scale):
- `tokens.$spacing-2xs` (2px), `$spacing-xs` (4px), `$spacing-sm` (8px)
- `tokens.$spacing-md` (16px), `$spacing-lg` (24px), `$spacing-xl` (32px)

**Font sizes**:
- `tokens.$font-size-xs` (12px), `$font-size-sm` (14px), `$font-size-base` (16px)
- `tokens.$font-size-lg` (18px), `$font-size-xl` (20px), `$font-size-2xl` (24px)

**Colors**:
- Text: `$color-text-primary`, `$color-text-secondary`, `$color-text-tertiary`
- Surface: `$color-surface-primary`, `$color-surface-secondary`
- Borders: `$color-border-subtle`, `$color-border-default`

**NO** `$spacing-3xs`, `$font-size-2xs` - these don't exist!

## Component Best Practices
- **Prefix**: All UI components use `guiders-*` selector
- **SCSS BEM**: `.component__element--modifier` pattern
- **ViewChild + scroll**: Reference the element with `overflow-y: auto`, not its parent
- **Auto-scroll timing**: Use `setTimeout(() => action(), 0)` after `cdr.detectChanges()` for DOM updates

## Project Generation & Tags
Use Nx generators with workspace defaults (scss, vitest, playwright):
- UI components: prefix `guiders-*`
- Features: prefix `lib-*`  
- **Always add proper tags**: `scope:{domain}`, `type:{ui|feature|data-access}`

## Key Dependencies & Data Flow
- **Apps**: `admin` (analytics), `console` (chat operations)
- **Chat domain**: `chat-service` (HTTP + WebSocket) → `websocket-service` → features → UI
- **Auth flow**: `session` service → `login` feature → `auth-guard`
- **Shared types**: All services import from `@guiders-frontend/shared/types`

## Critical Files to Reference
- `libs/chat/data-access/chat-service/src/lib/chat.service.ts` - HTTP service + state management pattern
- `libs/chat/data-access/websocket-service/src/lib/websocket.service.ts` - WebSocket with Socket.IO
- `libs/shared/design-tokens/src/lib/tokens-vars.scss` - Complete token reference
- `apps/console/src/app/app.routes.ts` - Lazy loading with guards
- `tsconfig.base.json` - Path mappings
- `nx.json` - Generator defaults and target configurations
- `guia-diseno-interfaces-b2b-web-desktop.md` - UI/UX standards

**Before creating new libs**: Check `nx graph` and align with existing dependency patterns. Maintain proper barrel exports from `src/index.ts`.

