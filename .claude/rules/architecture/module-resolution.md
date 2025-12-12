# Resolución de Módulos

## Descripción

Sistema de path mappings y barrel exports para imports limpios y consistentes.

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

## Patrón de Path

```
@guiders-frontend/{domain}/{type}/{name}

Donde:
- domain: auth, chat, analytics, admin, shared
- type: features, ui, data-access, util, types
- name: nombre específico de la librería
```

### Ejemplos

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

### Componente UI

```typescript
// libs/shared/ui/badge/src/index.ts
export { Badge } from './lib/badge/badge';
export type { BadgeVariant, BadgeSize, BadgeShape } from './lib/badge/badge';
```

### Feature

```typescript
// libs/chat/features/inbox/src/index.ts
export { routes } from './lib/inbox.routes';
// No exportar componentes internos
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

## Imports Correctos vs Incorrectos

### Correcto

```typescript
// Usar path mapping
import { Badge } from '@guiders-frontend/shared/ui/badge';
import { SessionService } from '@guiders-frontend/auth/data-access/session';
```

### Incorrecto

```typescript
// NO usar paths relativos entre libs
import { Badge } from '../../../shared/ui/badge/src/lib/badge/badge';

// NO importar archivos internos directamente
import { Badge } from '@guiders-frontend/shared/ui/badge/src/lib/badge/badge';

// NO usar index.ts explícito
import { Badge } from '@guiders-frontend/shared/ui/badge/src/index';
```

## SCSS Imports

### Path para Design Tokens

```scss
// Correcto
@use '@guiders-frontend/shared/design-tokens' as tokens;

.my-component {
  color: tokens.$color-text-primary;
  padding: tokens.$spacing-md;
}
```

### Configuración en angular.json/project.json

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

## Generación Automática de Paths

Al crear una librería con Nx, el path mapping se agrega automáticamente:

```bash
nx g @nx/angular:lib my-lib --directory=libs/chat/features/my-lib
```

Resultado en tsconfig.base.json:

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

1. Verificar que el path existe en `tsconfig.base.json`
2. Verificar que `src/index.ts` exporta el módulo
3. Reiniciar el servidor de desarrollo

### Error: Import cycle detected

1. Verificar dependencias circulares con `nx graph`
2. Extraer código compartido a una lib común
3. Usar lazy imports si es necesario

### SCSS not found

1. Verificar `stylePreprocessorOptions` en project.json
2. Verificar que el path en `@use` es correcto
3. Usar path relativo si es dentro de la misma lib

## Reglas de Export

### Exportar

- Componentes públicos
- Servicios públicos
- Interfaces/Types públicos
- Tokens de inyección
- Routes (solo en features)
- Directivas y Pipes públicos

### NO Exportar

- Componentes internos
- Helpers/utils internos
- Constantes internas
- Implementaciones privadas

## Checklist

- [ ] Path mapping en `tsconfig.base.json`
- [ ] Barrel export en `src/index.ts`
- [ ] Solo exports públicos en barrel
- [ ] Imports usando `@guiders-frontend/*`
- [ ] SCSS usando `@use` con path correcto

## Anti-patrones

- Imports relativos entre librerías
- Imports directos a archivos internos
- Barrel exports con todo el contenido
- Circular dependencies entre libs
- Modificar manualmente tsconfig.base.json (usar generadores)
