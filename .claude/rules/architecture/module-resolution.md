# Module Resolution

## Description

Path mappings and barrel exports system for clean and consistent imports.

## Path Mappings

### tsconfig.base.json

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@guiders-frontend/auth/features/login": [
        "libs/auth/features/login/src/index.ts"
      ],
      "@guiders-frontend/auth/data-access/session": [
        "libs/auth/data-access/session/src/index.ts"
      ],
      "@guiders-frontend/chat/features/inbox": [
        "libs/chat/features/inbox/src/index.ts"
      ],
      "@guiders-frontend/chat/ui/visitor-card": [
        "libs/chat/ui/visitor-card/src/index.ts"
      ],
      "@guiders-frontend/chat/data-access/visitors-data-service": [
        "libs/chat/data-access/visitors-data-service/src/index.ts"
      ],
      "@guiders-frontend/shared/types": [
        "libs/shared/types/src/index.ts"
      ],
      "@guiders-frontend/shared/ui/badge": [
        "libs/shared/ui/badge/src/index.ts"
      ],
      "@guiders-frontend/shared/design-tokens": [
        "libs/shared/design-tokens/src/index.ts"
      ]
    }
  }
}
```

## Path Pattern

```
@guiders-frontend/{domain}/{type}/{name}

Where:
- domain: auth, chat, analytics, admin, shared
- type: features, ui, data-access, util, types
- name: specific library name
```

### Examples

```typescript
// Features
import { routes } from '@guiders-frontend/chat/features/inbox';
import { authGuard } from '@guiders-frontend/auth/features/login';

// UI Components
import { Badge } from '@guiders-frontend/shared/ui/badge';
import { VisitorCard } from '@guiders-frontend/chat/ui/visitor-card';

// Data Access
import { SessionService } from '@guiders-frontend/auth/data-access/session';
import { VisitorsDataService } from '@guiders-frontend/chat/data-access/visitors-data-service';

// Types
import { Environment, ENVIRONMENT_TOKEN } from '@guiders-frontend/shared/types';
import { Visitor } from '@guiders-frontend/chat/data-access/visitors-data-service';

// Design Tokens (SCSS)
@use '@guiders-frontend/shared/design-tokens' as tokens;
```

## Barrel Exports (index.ts)

### UI Component

```typescript
// libs/shared/ui/badge/src/index.ts
export { Badge } from './lib/badge/badge';
export type { BadgeVariant, BadgeSize, BadgeShape } from './lib/badge/badge';
```

### Feature

```typescript
// libs/chat/features/inbox/src/index.ts
export { routes } from './lib/inbox.routes';
// Don't export internal components
```

### Data Access

```typescript
// libs/auth/data-access/session/src/index.ts
export { SessionService } from './lib/session.service';
export { UserService } from './lib/user.service';
export { authRefreshInterceptor } from './lib/auth-refresh.interceptor';
export { ENVIRONMENT_TOKEN } from './lib/environment.token';
export type { User, UserSession } from './lib/user.interface';
```

### Types

```typescript
// libs/shared/types/src/index.ts
export type { Environment } from './lib/environment.interface';
export type { Visitor, VisitorStatus } from './lib/visitor.interface';
export type { PaginatedResponse } from './lib/pagination.interface';
export { ENVIRONMENT_TOKEN } from './lib/tokens';
```

## Correct vs Incorrect Imports

### Correct

```typescript
// Use path mapping
import { Badge } from '@guiders-frontend/shared/ui/badge';
import { SessionService } from '@guiders-frontend/auth/data-access/session';
```

### Incorrect

```typescript
// DON'T use relative paths between libs
import { Badge } from '../../../shared/ui/badge/src/lib/badge/badge';

// DON'T import internal files directly
import { Badge } from '@guiders-frontend/shared/ui/badge/src/lib/badge/badge';

// DON'T use explicit index.ts
import { Badge } from '@guiders-frontend/shared/ui/badge/src/index';
```

## SCSS Imports

### Path for Design Tokens

```scss
// Correct
@use '@guiders-frontend/shared/design-tokens' as tokens;

.my-component {
  color: tokens.$color-text-primary;
  padding: tokens.$spacing-md;
}
```

### Configuration in angular.json/project.json

```json
{
  "build": {
    "options": {
      "stylePreprocessorOptions": {
        "includePaths": [
          "libs/shared/design-tokens/src/lib"
        ]
      }
    }
  }
}
```

## Automatic Path Generation

When creating a library with Nx, the path mapping is automatically added:

```bash
nx g @nx/angular:lib my-lib --directory=libs/chat/features/my-lib
```

Result in tsconfig.base.json:

```json
{
  "paths": {
    "@guiders-frontend/chat/features/my-lib": [
      "libs/chat/features/my-lib/src/index.ts"
    ]
  }
}
```

## Troubleshooting

### Error: Cannot find module

1. Verify that the path exists in `tsconfig.base.json`
2. Verify that `src/index.ts` exports the module
3. Restart the development server

### Error: Import cycle detected

1. Verify circular dependencies with `nx graph`
2. Extract shared code to a common lib
3. Use lazy imports if necessary

### SCSS not found

1. Verify `stylePreprocessorOptions` in project.json
2. Verify that the path in `@use` is correct
3. Use relative path if within the same lib

## Export Rules

### Export

- Public components
- Public services
- Public interfaces/types
- Injection tokens
- Routes (only in features)
- Public directives and pipes

### DO NOT Export

- Internal components
- Internal helpers/utils
- Internal constants
- Private implementations

## Checklist

- [ ] Path mapping in `tsconfig.base.json`
- [ ] Barrel export in `src/index.ts`
- [ ] Only public exports in barrel
- [ ] Imports using `@guiders-frontend/*`
- [ ] SCSS using `@use` with correct path

## Anti-patterns

- Relative imports between libraries
- Direct imports to internal files
- Barrel exports with all content
- Circular dependencies between libs
- Manually modifying tsconfig.base.json (use generators)
