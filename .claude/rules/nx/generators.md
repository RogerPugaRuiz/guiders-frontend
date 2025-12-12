# Generadores Nx

## Descripción

Comandos para generar librerías, componentes y otros artefactos con configuración estandarizada.

## Generar Librerías

### Feature Library

```bash
nx g @nx/angular:lib inbox \
  --directory=libs/chat/features/inbox \
  --tags=scope:chat,type:feature \
  --standalone \
  --style=scss
```

Genera:
```
libs/chat/features/inbox/
├── src/
│   ├── lib/
│   │   └── inbox/
│   │       ├── inbox.ts
│   │       ├── inbox.html
│   │       ├── inbox.scss
│   │       └── inbox.spec.ts
│   └── index.ts
├── project.json
└── tsconfig.json
```

### UI Library

```bash
nx g @nx/angular:lib badge \
  --directory=libs/shared/ui/badge \
  --tags=scope:shared,type:ui \
  --standalone \
  --style=scss \
  --prefix=guiders
```

### Data Access Library

```bash
nx g @nx/angular:lib visitors-data-service \
  --directory=libs/chat/data-access/visitors-data-service \
  --tags=scope:chat,type:data-access \
  --standalone
```

### Types Library (sin Angular)

```bash
nx g @nx/js:lib types \
  --directory=libs/shared/types \
  --tags=scope:shared,type:util \
  --unitTestRunner=none
```

## Generar Componentes

### Componente en Librería Existente

```bash
nx g @nx/angular:component visitor-card \
  --project=chat-ui-visitor-card \
  --standalone \
  --changeDetection=OnPush \
  --style=scss
```

### Componente con Routing

```bash
nx g @nx/angular:component settings \
  --project=admin-features-settings \
  --standalone \
  --changeDetection=OnPush \
  --style=scss
```

## Generar Servicios

```bash
nx g @nx/angular:service visitors-data \
  --project=chat-data-access-visitors-data-service \
  --skipTests=false
```

## Generar Guards e Interceptors

### Guard

```bash
nx g @nx/angular:guard auth \
  --project=auth-features-login \
  --functional
```

### Interceptor

```bash
nx g @nx/angular:interceptor auth-refresh \
  --project=auth-data-access-session \
  --functional
```

## Opciones Comunes

### Para Librerías

| Opción | Descripción | Ejemplo |
|--------|-------------|---------|
| `--directory` | Ruta de la librería | `libs/chat/features/inbox` |
| `--tags` | Tags de Nx | `scope:chat,type:feature` |
| `--standalone` | Sin NgModule | `true` |
| `--style` | Formato de estilos | `scss` |
| `--prefix` | Prefijo del selector | `guiders` |

### Para Componentes

| Opción | Descripción | Ejemplo |
|--------|-------------|---------|
| `--project` | Proyecto destino | `chat-features-inbox` |
| `--standalone` | Sin NgModule | `true` |
| `--changeDetection` | Estrategia CD | `OnPush` |
| `--style` | Formato de estilos | `scss` |
| `--skipTests` | Omitir tests | `false` |

## Defaults en nx.json

```json
{
  "generators": {
    "@nx/angular:library": {
      "style": "scss",
      "linter": "eslint",
      "unitTestRunner": "vitest",
      "standalone": true
    },
    "@nx/angular:component": {
      "style": "scss",
      "changeDetection": "OnPush",
      "standalone": true
    }
  }
}
```

Con estos defaults, el comando se simplifica:

```bash
# Antes
nx g @nx/angular:lib badge --directory=libs/shared/ui/badge --tags=scope:shared,type:ui --standalone --style=scss

# Después (con defaults)
nx g @nx/angular:lib badge --directory=libs/shared/ui/badge --tags=scope:shared,type:ui
```

## Ejemplos por Dominio

### Auth

```bash
# Feature
nx g @nx/angular:lib login --directory=libs/auth/features/login --tags=scope:auth,type:feature

# Data Access
nx g @nx/angular:lib session --directory=libs/auth/data-access/session --tags=scope:auth,type:data-access
```

### Chat

```bash
# Feature
nx g @nx/angular:lib inbox --directory=libs/chat/features/inbox --tags=scope:chat,type:feature
nx g @nx/angular:lib conversation --directory=libs/chat/features/conversation --tags=scope:chat,type:feature

# UI
nx g @nx/angular:lib visitor-card --directory=libs/chat/ui/visitor-card --tags=scope:chat,type:ui --prefix=guiders
nx g @nx/angular:lib message-bubble --directory=libs/chat/ui/message-bubble --tags=scope:chat,type:ui --prefix=guiders

# Data Access
nx g @nx/angular:lib visitors-data-service --directory=libs/chat/data-access/visitors-data-service --tags=scope:chat,type:data-access
```

### Shared

```bash
# UI
nx g @nx/angular:lib badge --directory=libs/shared/ui/badge --tags=scope:shared,type:ui --prefix=guiders
nx g @nx/angular:lib button --directory=libs/shared/ui/button --tags=scope:shared,type:ui --prefix=guiders
nx g @nx/angular:lib modal --directory=libs/shared/ui/modal --tags=scope:shared,type:ui --prefix=guiders

# Types
nx g @nx/js:lib types --directory=libs/shared/types --tags=scope:shared,type:util
```

## Mover y Renombrar

```bash
# Mover librería
nx g @nx/workspace:move --project=old-name --destination=new/path

# Renombrar proyecto
nx g @nx/workspace:move --project=old-name --newProjectName=new-name
```

## Eliminar

```bash
# Eliminar librería
nx g @nx/workspace:remove --project=project-name
```

## Verificar Generación

```bash
# Dry run (ver qué se generaría sin crear archivos)
nx g @nx/angular:lib my-lib --directory=libs/test --dry-run

# Ver proyectos generados
nx show projects

# Ver grafo de dependencias
nx graph
```

## Checklist Post-Generación

- [ ] Verificar tags en `project.json`
- [ ] Actualizar barrel exports en `src/index.ts`
- [ ] Verificar path mapping en `tsconfig.base.json`
- [ ] Agregar a `.eslintrc.json` si es necesario
- [ ] Ejecutar `nx lint` para verificar

## Anti-patrones

- Crear archivos manualmente sin generador
- Olvidar tags al generar
- No verificar path mappings
- Generar sin `--standalone`
- Usar `--skipTests=true` por defecto
