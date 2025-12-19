# Library Types

## Description

Code organization in Nx libraries by responsibility: features, ui, data-access, shared.

## General Structure

```
libs/
├── {domain}/                    # auth, chat, analytics, admin
│   ├── features/               # Smart components
│   │   └── {feature-name}/
│   ├── ui/                     # Presentational components
│   │   └── {component-name}/
│   └── data-access/            # HTTP Services
│       └── {service-name}/
└── shared/                     # Cross-domain
    ├── types/
    ├── design-tokens/
    └── ui/
```

## Features

**Responsibility**: Smart components with routing, business logic and orchestration.

```
libs/chat/features/inbox/
├── src/
│   ├── lib/
│   │   ├── inbox.ts            # Main component
│   │   ├── inbox.html
│   │   ├── inbox.scss
│   │   └── inbox.routes.ts     # Feature routes
│   └── index.ts                # Barrel export
├── project.json
└── tsconfig.json
```

**Characteristics**:
- Contains routes (`routes: Route[]`)
- Injects data-access services
- Handles local feature state
- Composes UI components
- Selector: `lib-{feature-name}`

```typescript
// inbox.routes.ts
export const routes: Route[] = [
  {
    path: '',
    component: Inbox,
    canActivate: [authGuard],
  },
];

// inbox.ts
@Component({
  selector: 'lib-inbox',
  imports: [CommonModule, VisitorCard, Badge],
  templateUrl: './inbox.html',
})
export class Inbox {
  private readonly chatService = inject(ChatService);
  readonly chats$ = this.chatService.getChats();
}
```

## UI

**Responsibility**: Reusable presentational components without business logic.

```
libs/shared/ui/badge/
├── src/
│   ├── lib/
│   │   └── badge/
│   │       ├── badge.ts
│   │       ├── badge.html
│   │       ├── badge.scss
│   │       └── badge.spec.ts
│   └── index.ts
├── project.json
└── tsconfig.json
```

**Characteristics**:
- Only inputs/outputs (no data service injection)
- Selector: `guiders-{component-name}`
- Styles based on design tokens
- 100% presentational
- Unit tests

```typescript
@Component({
  selector: 'guiders-badge',
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Badge {
  readonly variant = input<BadgeVariant>('default');
  readonly text = input<string>('');
  readonly clicked = output<void>();
}
```

## Data Access

**Responsibility**: HTTP services and external data management.

```
libs/chat/data-access/visitors-data-service/
├── src/
│   ├── lib/
│   │   ├── visitors-data.service.ts
│   │   ├── visitors-data.service.spec.ts
│   │   └── visitors.interface.ts
│   └── index.ts
├── project.json
└── tsconfig.json
```

**Characteristics**:
- Services `@Injectable({ providedIn: 'root' })`
- HttpClient with `withCredentials: true`
- Cache with `shareReplay`
- Data interfaces
- No UI dependencies

```typescript
@Injectable({ providedIn: 'root' })
export class VisitorsDataService {
  private readonly http = inject(HttpClient);
  private readonly environment = inject(ENVIRONMENT_TOKEN);

  getVisitors(): Observable<Visitor[]> {
    return this.http.get<Visitor[]>(
      `${this.environment.api.baseUrl}/visitors`,
      { withCredentials: true }
    );
  }
}
```

## Shared

**Responsibility**: Utilities and resources shared between domains.

```
libs/shared/
├── types/                      # Shared interfaces
│   └── src/lib/
│       ├── visitor.interface.ts
│       └── environment.interface.ts
├── design-tokens/              # SCSS Variables
│   └── src/lib/
│       ├── tokens-vars.scss
│       └── mixins/
└── ui/                         # Shared UI components
    ├── badge/
    ├── button/
    └── modal/
```

## Summary Table

| Type | Selector | Responsibility | Can import |
|------|----------|----------------|------------|
| **features** | `lib-*` | Routing, business logic | ui, data-access, shared |
| **ui** | `guiders-*` | Presentation | shared/ui, shared/types |
| **data-access** | N/A | HTTP, data | shared/types |
| **shared** | `guiders-*` | Cross-domain utilities | Other shared |

## Generation with Nx

```bash
# Feature
nx g @nx/angular:lib inbox \
  --directory=libs/chat/features/inbox \
  --tags=scope:chat,type:feature

# UI Component
nx g @nx/angular:lib badge \
  --directory=libs/shared/ui/badge \
  --tags=scope:shared,type:ui

# Data Access
nx g @nx/angular:lib visitors-data-service \
  --directory=libs/chat/data-access/visitors-data-service \
  --tags=scope:chat,type:data-access
```

## Barrel Exports

Each library should have a `src/index.ts` with public exports:

```typescript
// libs/shared/ui/badge/src/index.ts
export { Badge, BadgeVariant, BadgeSize } from './lib/badge/badge';

// libs/chat/features/inbox/src/index.ts
export { routes } from './lib/inbox.routes';
```

## Anti-patterns

- Features with direct HTTP logic (use data-access)
- UI components with data service injection
- Data-access with presentation logic
- Circular imports between features
- Shared with specific domain dependencies
