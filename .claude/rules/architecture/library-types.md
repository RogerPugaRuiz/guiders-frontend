# Tipos de Librerías

## Descripción

Organización de código en librerías Nx según su responsabilidad: features, ui, data-access, shared.

## Estructura General

```
libs/
├── {domain}/                    # auth, chat, analytics, admin
│   ├── features/               # Smart components
│   │   └── {feature-name}/
│   ├── ui/                     # Componentes presentacionales
│   │   └── {component-name}/
│   └── data-access/            # Servicios HTTP
│       └── {service-name}/
└── shared/                     # Cross-domain
    ├── types/
    ├── design-tokens/
    └── ui/
```

## Features

**Responsabilidad**: Smart components con routing, lógica de negocio y orquestación.

```
libs/chat/features/inbox/
├── src/
│   ├── lib/
│   │   ├── inbox.ts            # Componente principal
│   │   ├── inbox.html
│   │   ├── inbox.scss
│   │   └── inbox.routes.ts     # Rutas del feature
│   └── index.ts                # Barrel export
├── project.json
└── tsconfig.json
```

**Características**:
- Contienen rutas (`routes: Route[]`)
- Inyectan servicios de data-access
- Manejan estado local del feature
- Componen componentes UI
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

**Responsabilidad**: Componentes presentacionales reutilizables sin lógica de negocio.

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

**Características**:
- Solo inputs/outputs (sin inyección de servicios de datos)
- Selector: `guiders-{component-name}`
- Estilos basados en design tokens
- 100% presentacionales
- Tests unitarios

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

**Responsabilidad**: Servicios HTTP y gestión de datos externos.

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

**Características**:
- Servicios `@Injectable({ providedIn: 'root' })`
- HttpClient con `withCredentials: true`
- Cache con `shareReplay`
- Interfaces de datos
- Sin dependencias de UI

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

**Responsabilidad**: Utilidades y recursos compartidos entre dominios.

```
libs/shared/
├── types/                      # Interfaces compartidas
│   └── src/lib/
│       ├── visitor.interface.ts
│       └── environment.interface.ts
├── design-tokens/              # Variables SCSS
│   └── src/lib/
│       ├── tokens-vars.scss
│       └── mixins/
└── ui/                         # Componentes UI compartidos
    ├── badge/
    ├── button/
    └── modal/
```

## Tabla Resumen

| Tipo | Selector | Responsabilidad | Puede importar |
|------|----------|-----------------|----------------|
| **features** | `lib-*` | Routing, lógica de negocio | ui, data-access, shared |
| **ui** | `guiders-*` | Presentación | shared/ui, shared/types |
| **data-access** | N/A | HTTP, datos | shared/types |
| **shared** | `guiders-*` | Utilidades cross-domain | Otros shared |

## Generación con Nx

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

Cada librería debe tener un `src/index.ts` con exports públicos:

```typescript
// libs/shared/ui/badge/src/index.ts
export { Badge, BadgeVariant, BadgeSize } from './lib/badge/badge';

// libs/chat/features/inbox/src/index.ts
export { routes } from './lib/inbox.routes';
```

## Anti-patrones

- Features con lógica HTTP directa (usar data-access)
- UI components con inyección de servicios de datos
- Data-access con lógica de presentación
- Imports circulares entre features
- Shared con dependencias de dominios específicos
