# Dependency Rules

## Description

Nx tags system to control dependencies between libraries and prevent incorrect imports.

## System Tags

### By Scope (Domain)

```
scope:auth       # Authentication
scope:chat       # Conversations
scope:analytics  # Metrics
scope:admin      # Administration
scope:shared     # Shared
```

### By Type (Library Type)

```
type:feature     # Smart components with routing
type:ui          # Presentational components
type:data-access # HTTP Services
type:util        # Utilities
```

## Configuration in project.json

```json
// libs/chat/features/inbox/project.json
{
  "name": "chat-features-inbox",
  "tags": ["scope:chat", "type:feature"]
}

// libs/shared/ui/badge/project.json
{
  "name": "shared-ui-badge",
  "tags": ["scope:shared", "type:ui"]
}

// libs/chat/data-access/visitors-data-service/project.json
{
  "name": "chat-data-access-visitors-data-service",
  "tags": ["scope:chat", "type:data-access"]
}
```

## Dependency Rules in .eslintrc.json

```json
{
  "rules": {
    "@nx/enforce-module-boundaries": [
      "error",
      {
        "allow": [],
        "depConstraints": [
          {
            "sourceTag": "type:feature",
            "onlyDependOnLibsWithTags": [
              "type:feature",
              "type:ui",
              "type:data-access",
              "type:util"
            ]
          },
          {
            "sourceTag": "type:ui",
            "onlyDependOnLibsWithTags": [
              "type:ui",
              "type:util"
            ]
          },
          {
            "sourceTag": "type:data-access",
            "onlyDependOnLibsWithTags": [
              "type:data-access",
              "type:util"
            ]
          },
          {
            "sourceTag": "scope:chat",
            "onlyDependOnLibsWithTags": [
              "scope:chat",
              "scope:shared",
              "scope:auth"
            ]
          },
          {
            "sourceTag": "scope:analytics",
            "onlyDependOnLibsWithTags": [
              "scope:analytics",
              "scope:shared",
              "scope:auth"
            ]
          },
          {
            "sourceTag": "scope:shared",
            "onlyDependOnLibsWithTags": [
              "scope:shared"
            ]
          }
        ]
      }
    ]
  }
}
```

## Dependency Matrix

### By Type

| Source ↓ / Target → | feature | ui | data-access | util |
|---------------------|---------|----|-----------  |------|
| **feature**         | ✓       | ✓  | ✓           | ✓    |
| **ui**              | ✗       | ✓  | ✗           | ✓    |
| **data-access**     | ✗       | ✗  | ✓           | ✓    |
| **util**            | ✗       | ✗  | ✗           | ✓    |

### By Scope

| Source ↓ / Target → | auth | chat | analytics | admin | shared |
|---------------------|------|------|-----------|-------|--------|
| **auth**            | ✓    | ✗    | ✗         | ✗     | ✓      |
| **chat**            | ✓    | ✓    | ✗         | ✗     | ✓      |
| **analytics**       | ✓    | ✗    | ✓         | ✗     | ✓      |
| **admin**           | ✓    | ✗    | ✗         | ✓     | ✓      |
| **shared**          | ✗    | ✗    | ✗         | ✗     | ✓      |

## Valid Import Examples

```typescript
// libs/chat/features/inbox/src/lib/inbox.ts
// ✓ Same domain, type:ui
import { VisitorCard } from '@guiders-frontend/chat/ui/visitor-card';

// ✓ Same domain, type:data-access
import { VisitorsDataService } from '@guiders-frontend/chat/data-access/visitors-data-service';

// ✓ scope:shared
import { Badge } from '@guiders-frontend/shared/ui/badge';

// ✓ scope:auth (allowed for all)
import { authGuard } from '@guiders-frontend/auth/features/login';
```

## Invalid Import Examples

```typescript
// libs/chat/ui/visitor-card/src/lib/visitor-card.ts

// ✗ ui cannot import data-access
import { VisitorsDataService } from '@guiders-frontend/chat/data-access/visitors-data-service';

// ✗ ui cannot import feature
import { Inbox } from '@guiders-frontend/chat/features/inbox';
```

```typescript
// libs/shared/ui/badge/src/lib/badge.ts

// ✗ shared cannot import from other domains
import { VisitorCard } from '@guiders-frontend/chat/ui/visitor-card';
```

## Visualization with nx graph

```bash
# View complete dependency graph
nx graph

# View dependencies of a specific project
nx graph --focus=chat-features-inbox

# View projects affected by changes
nx affected:graph
```

## Add Tags when Creating Library

```bash
# Feature with tags
nx g @nx/angular:lib inbox \
  --directory=libs/chat/features/inbox \
  --tags=scope:chat,type:feature

# UI with tags
nx g @nx/angular:lib visitor-card \
  --directory=libs/chat/ui/visitor-card \
  --tags=scope:chat,type:ui

# Data access with tags
nx g @nx/angular:lib visitors-data-service \
  --directory=libs/chat/data-access/visitors-data-service \
  --tags=scope:chat,type:data-access
```

## Verify Violations

```bash
# Lint to detect boundary violations
nx lint

# Lint only one project
nx lint chat-features-inbox

# Lint all affected projects
nx affected -t lint
```

## Naming Rules for Tags

| Tag Type | Format | Examples |
|----------|---------|----------|
| Scope | `scope:{domain}` | `scope:chat`, `scope:auth` |
| Type | `type:{libraryType}` | `type:feature`, `type:ui` |

## Checklist

- [ ] All projects have `tags` in `project.json`
- [ ] Include at least one `scope` tag and one `type` tag
- [ ] Boundary rules in `.eslintrc.json`
- [ ] Run `nx lint` before commit
- [ ] Review `nx graph` periodically

## Anti-patterns

- Libraries without tags
- Generic or inconsistent tags
- Ignoring module boundary warnings
- Circular dependencies
- Features importing other features from other domains
