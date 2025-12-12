# Reglas de Dependencias

## Descripción

Sistema de tags de Nx para controlar las dependencias entre librerías y prevenir imports incorrectos.

## Tags del Sistema

### Por Scope (Dominio)

```
scope:auth       # Autenticación
scope:chat       # Conversaciones
scope:analytics  # Métricas
scope:admin      # Administración
scope:shared     # Compartido
```

### Por Type (Tipo de Librería)

```
type:feature     # Smart components con routing
type:ui          # Componentes presentacionales
type:data-access # Servicios HTTP
type:util        # Utilidades
```

## Configuración en project.json

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

## Reglas de Dependencia en .eslintrc.json

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

## Matriz de Dependencias

### Por Type

| Source ↓ / Target → | feature | ui | data-access | util |
|---------------------|---------|----|-----------  |------|
| **feature**         | ✓       | ✓  | ✓           | ✓    |
| **ui**              | ✗       | ✓  | ✗           | ✓    |
| **data-access**     | ✗       | ✗  | ✓           | ✓    |
| **util**            | ✗       | ✗  | ✗           | ✓    |

### Por Scope

| Source ↓ / Target → | auth | chat | analytics | admin | shared |
|---------------------|------|------|-----------|-------|--------|
| **auth**            | ✓    | ✗    | ✗         | ✗     | ✓      |
| **chat**            | ✓    | ✓    | ✗         | ✗     | ✓      |
| **analytics**       | ✓    | ✗    | ✓         | ✗     | ✓      |
| **admin**           | ✓    | ✗    | ✗         | ✓     | ✓      |
| **shared**          | ✗    | ✗    | ✗         | ✗     | ✓      |

## Ejemplos de Imports Válidos

```typescript
// libs/chat/features/inbox/src/lib/inbox.ts
// ✓ Mismo dominio, type:ui
import { VisitorCard } from '@guiders-frontend/chat/ui/visitor-card';

// ✓ Mismo dominio, type:data-access
import { VisitorsDataService } from '@guiders-frontend/chat/data-access/visitors-data-service';

// ✓ scope:shared
import { Badge } from '@guiders-frontend/shared/ui/badge';

// ✓ scope:auth (permitido para todos)
import { authGuard } from '@guiders-frontend/auth/features/login';
```

## Ejemplos de Imports Inválidos

```typescript
// libs/chat/ui/visitor-card/src/lib/visitor-card.ts

// ✗ ui no puede importar data-access
import { VisitorsDataService } from '@guiders-frontend/chat/data-access/visitors-data-service';

// ✗ ui no puede importar feature
import { Inbox } from '@guiders-frontend/chat/features/inbox';
```

```typescript
// libs/shared/ui/badge/src/lib/badge.ts

// ✗ shared no puede importar de otros dominios
import { VisitorCard } from '@guiders-frontend/chat/ui/visitor-card';
```

## Visualización con nx graph

```bash
# Ver grafo completo de dependencias
nx graph

# Ver dependencias de un proyecto específico
nx graph --focus=chat-features-inbox

# Ver proyectos afectados por cambios
nx affected:graph
```

## Agregar Tags al Crear Librería

```bash
# Feature con tags
nx g @nx/angular:lib inbox \
  --directory=libs/chat/features/inbox \
  --tags=scope:chat,type:feature

# UI con tags
nx g @nx/angular:lib visitor-card \
  --directory=libs/chat/ui/visitor-card \
  --tags=scope:chat,type:ui

# Data access con tags
nx g @nx/angular:lib visitors-data-service \
  --directory=libs/chat/data-access/visitors-data-service \
  --tags=scope:chat,type:data-access
```

## Verificar Violaciones

```bash
# Lint para detectar violaciones de boundaries
nx lint

# Lint solo un proyecto
nx lint chat-features-inbox

# Lint todos los proyectos afectados
nx affected -t lint
```

## Reglas de Naming para Tags

| Tag Type | Formato | Ejemplos |
|----------|---------|----------|
| Scope | `scope:{domain}` | `scope:chat`, `scope:auth` |
| Type | `type:{libraryType}` | `type:feature`, `type:ui` |

## Checklist

- [ ] Todos los proyectos tienen `tags` en `project.json`
- [ ] Incluir al menos un tag de `scope` y uno de `type`
- [ ] Reglas de boundaries en `.eslintrc.json`
- [ ] Ejecutar `nx lint` antes de commit
- [ ] Revisar `nx graph` periódicamente

## Anti-patrones

- Librerías sin tags
- Tags genéricos o inconsistentes
- Ignorar warnings de module boundaries
- Circular dependencies
- Features importando otras features de otros dominios
