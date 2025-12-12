# Estructura de Dominios

## Descripción

Organización del código siguiendo Domain-Driven Design con dominios de negocio separados.

## Dominios del Proyecto

```
libs/
├── auth/           # Autenticación y sesión
├── chat/           # Conversaciones y mensajes
├── analytics/      # Métricas y reportes
├── admin/          # Administración del sistema
└── shared/         # Recursos compartidos
```

## Estructura por Dominio

```
libs/{domain}/
├── features/           # Smart components con rutas
│   ├── {feature-1}/
│   └── {feature-2}/
├── ui/                 # Componentes presentacionales
│   ├── {component-1}/
│   └── {component-2}/
└── data-access/        # Servicios de datos
    ├── {service-1}/
    └── {service-2}/
```

## Dominio: Auth

Gestión de autenticación, sesiones y usuarios.

```
libs/auth/
├── features/
│   └── login/              # Componente de login y guard
│       ├── src/lib/
│       │   ├── login.ts
│       │   ├── login.routes.ts
│       │   └── auth.guard.ts
│       └── src/index.ts
├── ui/
│   └── user-avatar/        # Avatar del usuario
└── data-access/
    └── session/            # SessionService, UserService
        ├── src/lib/
        │   ├── session.service.ts
        │   ├── user.service.ts
        │   ├── auth-refresh.service.ts
        │   └── auth-refresh.interceptor.ts
        └── src/index.ts
```

**Exports típicos:**
```typescript
// @guiders-frontend/auth/features/login
export { routes } from './lib/login.routes';
export { authGuard } from './lib/auth.guard';

// @guiders-frontend/auth/data-access/session
export { SessionService } from './lib/session.service';
export { ENVIRONMENT_TOKEN } from './lib/environment.token';
```

## Dominio: Chat

Gestión de conversaciones, visitantes y mensajes.

```
libs/chat/
├── features/
│   ├── inbox/              # Lista de conversaciones
│   ├── conversation/       # Detalle de conversación
│   └── visitors/           # Gestión de visitantes
├── ui/
│   ├── visitor-card/       # Tarjeta de visitante
│   ├── message-bubble/     # Burbuja de mensaje
│   └── chat-input/         # Input de mensajes
└── data-access/
    ├── visitors-data-service/
    ├── messages-service/
    └── websocket-service/
```

**Exports típicos:**
```typescript
// @guiders-frontend/chat/features/inbox
export { routes } from './lib/inbox.routes';

// @guiders-frontend/chat/ui/visitor-card
export { VisitorCard } from './lib/visitor-card/visitor-card';

// @guiders-frontend/chat/data-access/visitors-data-service
export { VisitorsDataService } from './lib/visitors-data.service';
export { Visitor, VisitorFilters } from './lib/visitor.interface';
```

## Dominio: Analytics

Métricas, dashboards y reportes.

```
libs/analytics/
├── features/
│   ├── dashboard/          # Dashboard principal
│   └── reports/            # Generación de reportes
├── ui/
│   ├── chart-card/         # Tarjeta con gráfico
│   └── metric-widget/      # Widget de métrica
└── data-access/
    └── metrics-service/    # Servicio de métricas
```

## Dominio: Admin

Configuración y administración del sistema.

```
libs/admin/
├── features/
│   ├── settings/           # Configuración general
│   ├── users/              # Gestión de usuarios
│   └── integrations/       # Integraciones externas
├── ui/
│   └── settings-form/      # Formularios de config
└── data-access/
    └── admin-service/      # Servicios de admin
```

## Dominio: Shared

Recursos compartidos entre todos los dominios.

```
libs/shared/
├── types/                  # Interfaces y tipos
│   └── src/lib/
│       ├── environment.interface.ts
│       ├── visitor.interface.ts
│       └── index.ts
├── design-tokens/          # Variables SCSS
│   └── src/lib/
│       ├── tokens-vars.scss
│       └── mixins/
├── ui/                     # Componentes UI compartidos
│   ├── badge/
│   ├── button/
│   ├── modal/
│   ├── spinner/
│   └── toast/
└── util/                   # Utilidades
    └── src/lib/
        ├── date.utils.ts
        └── string.utils.ts
```

## Comunicación entre Dominios

```
┌─────────────┐     ┌─────────────┐
│    auth     │────▶│    chat     │  (chat usa authGuard)
└─────────────┘     └─────────────┘
       │                   │
       ▼                   ▼
┌─────────────────────────────────┐
│            shared               │  (todos usan shared)
└─────────────────────────────────┘
       ▲                   ▲
       │                   │
┌─────────────┐     ┌─────────────┐
│  analytics  │     │    admin    │
└─────────────┘     └─────────────┘
```

**Reglas:**
- `shared` puede ser importado por cualquier dominio
- `auth` puede ser importado por otros dominios (guards, session)
- Otros dominios NO deben importar entre sí directamente

## Imports por Dominio

```typescript
// Componente en libs/chat/features/inbox
import { SessionService } from '@guiders-frontend/auth/data-access/session';  // ✓ Auth
import { Badge } from '@guiders-frontend/shared/ui/badge';                     // ✓ Shared
import { VisitorCard } from '@guiders-frontend/chat/ui/visitor-card';          // ✓ Mismo dominio
import { Dashboard } from '@guiders-frontend/analytics/features/dashboard';    // ✗ Otro dominio
```

## Reglas de Naming

| Elemento | Patrón | Ejemplo |
|----------|--------|---------|
| Dominio | singular, lowercase | `auth`, `chat`, `analytics` |
| Feature | lowercase con guiones | `inbox`, `user-settings` |
| UI Component | lowercase con guiones | `visitor-card`, `message-bubble` |
| Data Access | `{entity}-service` o `{entity}-data-service` | `visitors-data-service` |

## Checklist al Crear Dominio

- [ ] Crear estructura `features/`, `ui/`, `data-access/`
- [ ] Definir interfaces en `shared/types` si son compartidas
- [ ] Configurar tags de Nx: `scope:{domain}`
- [ ] Documentar exports públicos en README
- [ ] Crear barrel exports en `src/index.ts`

## Anti-patrones

- Importar features de otros dominios
- Lógica de dominio en `shared`
- Componentes UI con dependencias de dominio específico
- Servicios que mezclan responsabilidades de dominios
- Circular dependencies entre dominios
