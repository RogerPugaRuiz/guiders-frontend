# Domain Structure

## Description

Code organization following Domain-Driven Design with separated business domains.

## Project Domains

```
libs/
├── auth/           # Authentication and session
├── chat/           # Conversations and messages
├── analytics/      # Metrics and reports
├── admin/          # System administration
└── shared/         # Shared resources
```

## Structure per Domain

```
libs/{domain}/
├── features/           # Smart components with routes
│   ├── {feature-1}/
│   └── {feature-2}/
├── ui/                 # Presentational components
│   ├── {component-1}/
│   └── {component-2}/
└── data-access/        # Data services
    ├── {service-1}/
    └── {service-2}/
```

## Domain: Auth

Authentication, sessions and users management.

```
libs/auth/
├── features/
│   └── login/              # Login component and guard
│       ├── src/lib/
│       │   ├── login.ts
│       │   ├── login.routes.ts
│       │   └── auth.guard.ts
│       └── src/index.ts
├── ui/
│   └── user-avatar/        # User avatar
└── data-access/
    └── session/            # SessionService, UserService
        ├── src/lib/
        │   ├── session.service.ts
        │   ├── user.service.ts
        │   ├── auth-refresh.service.ts
        │   └── auth-refresh.interceptor.ts
        └── src/index.ts
```

**Typical exports:**
```typescript
// @guiders-frontend/auth/features/login
export { routes } from './lib/login.routes';
export { authGuard } from './lib/auth.guard';

// @guiders-frontend/auth/data-access/session
export { SessionService } from './lib/session.service';
export { ENVIRONMENT_TOKEN } from './lib/environment.token';
```

## Domain: Chat

Conversations, visitors and messages management.

```
libs/chat/
├── features/
│   ├── inbox/              # Conversations list
│   ├── conversation/       # Conversation detail
│   └── visitors/           # Visitors management
├── ui/
│   ├── visitor-card/       # Visitor card
│   ├── message-bubble/     # Message bubble
│   └── chat-input/         # Messages input
└── data-access/
    ├── visitors-data-service/
    ├── messages-service/
    └── websocket-service/
```

**Typical exports:**
```typescript
// @guiders-frontend/chat/features/inbox
export { routes } from './lib/inbox.routes';

// @guiders-frontend/chat/ui/visitor-card
export { VisitorCard } from './lib/visitor-card/visitor-card';

// @guiders-frontend/chat/data-access/visitors-data-service
export { VisitorsDataService } from './lib/visitors-data.service';
export { Visitor, VisitorFilters } from './lib/visitor.interface';
```

## Domain: Analytics

Metrics, dashboards and reports.

```
libs/analytics/
├── features/
│   ├── dashboard/          # Main dashboard
│   └── reports/            # Reports generation
├── ui/
│   ├── chart-card/         # Chart card
│   └── metric-widget/      # Metric widget
└── data-access/
    └── metrics-service/    # Metrics service
```

## Domain: Admin

System configuration and administration.

```
libs/admin/
├── features/
│   ├── settings/           # General configuration
│   ├── users/              # Users management
│   └── integrations/       # External integrations
├── ui/
│   └── settings-form/      # Config forms
└── data-access/
    └── admin-service/      # Admin services
```

## Domain: Shared

Resources shared between all domains.

```
libs/shared/
├── types/                  # Interfaces and types
│   └── src/lib/
│       ├── environment.interface.ts
│       ├── visitor.interface.ts
│       └── index.ts
├── design-tokens/          # SCSS Variables
│   └── src/lib/
│       ├── tokens-vars.scss
│       └── mixins/
├── ui/                     # Shared UI components
│   ├── badge/
│   ├── button/
│   ├── modal/
│   ├── spinner/
│   └── toast/
└── util/                   # Utilities
    └── src/lib/
        ├── date.utils.ts
        └── string.utils.ts
```

## Communication between Domains

```
┌─────────────┐     ┌─────────────┐
│    auth     │────▶│    chat     │  (chat uses authGuard)
└─────────────┘     └─────────────┘
       │                   │
       ▼                   ▼
┌─────────────────────────────────┐
│            shared               │  (all use shared)
└─────────────────────────────────┘
       ▲                   ▲
       │                   │
┌─────────────┐     ┌─────────────┐
│  analytics  │     │    admin    │
└─────────────┘     └─────────────┘
```

**Rules:**
- `shared` can be imported by any domain
- `auth` can be imported by other domains (guards, session)
- Other domains should NOT import from each other directly

## Imports by Domain

```typescript
// Component in libs/chat/features/inbox
import { SessionService } from '@guiders-frontend/auth/data-access/session';  // ✓ Auth
import { Badge } from '@guiders-frontend/shared/ui/badge';                     // ✓ Shared
import { VisitorCard } from '@guiders-frontend/chat/ui/visitor-card';          // ✓ Same domain
import { Dashboard } from '@guiders-frontend/analytics/features/dashboard';    // ✗ Other domain
```

## Naming Rules

| Element | Pattern | Example |
|----------|--------|---------|
| Domain | singular, lowercase | `auth`, `chat`, `analytics` |
| Feature | lowercase with hyphens | `inbox`, `user-settings` |
| UI Component | lowercase with hyphens | `visitor-card`, `message-bubble` |
| Data Access | `{entity}-service` or `{entity}-data-service` | `visitors-data-service` |

## Checklist when Creating Domain

- [ ] Create structure `features/`, `ui/`, `data-access/`
- [ ] Define interfaces in `shared/types` if they are shared
- [ ] Configure Nx tags: `scope:{domain}`
- [ ] Document public exports in README
- [ ] Create barrel exports in `src/index.ts`

## Anti-patterns

- Import features from other domains
- Domain logic in `shared`
- UI components with specific domain dependencies
- Services that mix domain responsibilities
- Circular dependencies between domains
