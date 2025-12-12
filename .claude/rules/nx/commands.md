# Comandos Nx

## Descripción

Comandos frecuentes para desarrollo, build, testing y análisis del workspace.

## Serve (Desarrollo)

```bash
# Console (puerto 4200)
nx serve console
npm run serve        # alias

# Admin (puerto 4201)
nx serve admin
npm run serve:admin  # alias

# Con configuración específica
nx serve console --configuration=development
nx serve console --configuration=production

# Puerto personalizado
nx serve console --port=4300
```

## Build

```bash
# Build de producción
nx build console
nx build admin

# Build de desarrollo
nx build console --configuration=development

# Build de todas las apps
npm run build:all

# Build de producción con optimización
npm run build:prod

# Build para staging
npm run build:staging
```

## Test

```bash
# Tests de un proyecto
nx test console
nx test chat-features-inbox

# Tests de todos los proyectos
npm run test

# Tests con coverage
nx test console --coverage
npm run test:coverage

# Tests en modo watch
nx test console --watch

# Tests específicos
nx test console --testNamePattern="should render"
```

## Lint

```bash
# Lint de un proyecto
nx lint console
nx lint chat-features-inbox

# Lint de todos
npm run lint

# Lint con auto-fix
nx lint console --fix
npm run lint:fix

# Ver reglas violadas
nx lint console --format=stylish
```

## E2E

```bash
# E2E de console
nx e2e console-e2e

# E2E con UI de Playwright
nx e2e console-e2e --ui

# E2E en modo headed
nx e2e console-e2e --headed

# E2E con filtro
nx e2e console-e2e --grep="visitors"
```

## Affected (Proyectos Afectados)

```bash
# Ver proyectos afectados
nx affected:graph

# Build solo afectados
nx affected -t build

# Test solo afectados
nx affected -t test

# Lint solo afectados
nx affected -t lint

# Múltiples targets
nx affected -t lint,test,build

# Comparar con rama específica
nx affected -t test --base=main --head=HEAD
```

## Run Many

```bash
# Ejecutar en múltiples proyectos
nx run-many -t build
nx run-many -t test
nx run-many -t lint

# Solo ciertos proyectos
nx run-many -t build --projects=console,admin

# Excluir proyectos
nx run-many -t test --exclude=console-e2e

# Paralelo
nx run-many -t test --parallel=4
```

## Graph (Visualización)

```bash
# Abrir grafo interactivo
nx graph

# Grafo de un proyecto específico
nx graph --focus=chat-features-inbox

# Grafo de afectados
nx affected:graph

# Exportar a archivo
nx graph --file=graph.json
```

## Show (Información)

```bash
# Listar todos los proyectos
nx show projects

# Proyectos de un tipo
nx show projects --type=app
nx show projects --type=lib

# Proyectos con tag
nx show projects --withTarget=build
```

## Reset y Cache

```bash
# Limpiar cache de Nx
nx reset

# Ver estado del cache
nx daemon --version

# Detener daemon
nx daemon --stop
```

## Migrations

```bash
# Actualizar Nx y dependencias
nx migrate latest

# Ejecutar migraciones
nx migrate --run-migrations

# Ver migraciones pendientes
nx migrate latest --dry-run
```

## Scripts de package.json

```json
{
  "scripts": {
    "serve": "nx serve console",
    "serve:admin": "nx serve admin",
    "dev": "nx serve console --configuration=development",
    "dev:admin": "nx serve admin --configuration=development",
    "build:all": "nx run-many -t build --parallel",
    "build:prod": "nx run-many -t build --configuration=production",
    "build:staging": "nx run-many -t build --configuration=staging",
    "test": "nx run-many -t test --parallel",
    "test:coverage": "nx run-many -t test --coverage --ci",
    "lint": "nx run-many -t lint",
    "lint:fix": "nx run-many -t lint --fix",
    "e2e": "nx run-many -t e2e"
  }
}
```

## Comandos de Generación

```bash
# Generar librería
nx g @nx/angular:lib my-lib --directory=libs/path

# Generar componente
nx g @nx/angular:component my-component --project=project-name

# Generar servicio
nx g @nx/angular:service my-service --project=project-name

# Dry run (sin crear archivos)
nx g @nx/angular:lib my-lib --dry-run
```

## CI/CD Commands

```bash
# Para CI - solo afectados
nx affected -t lint,test,build --base=origin/main

# Con coverage
nx affected -t test --coverage --ci

# Build de producción
nx run-many -t build --configuration=production --parallel=3
```

## Troubleshooting

```bash
# Ver configuración de proyecto
nx show project console --web

# Ver dependencias de proyecto
nx graph --focus=console

# Verificar workspace
nx report

# Ver logs detallados
NX_VERBOSE_LOGGING=true nx build console

# Forzar recálculo de cache
nx build console --skip-nx-cache
```

## Aliases Útiles

```bash
# En .bashrc o .zshrc
alias nxs="nx serve"
alias nxb="nx build"
alias nxt="nx test"
alias nxl="nx lint --fix"
alias nxg="nx graph"
alias nxa="nx affected"
```

## Tabla Resumen

| Acción | Comando |
|--------|---------|
| Serve console | `nx serve console` |
| Serve admin | `nx serve admin` |
| Build producción | `nx build console --configuration=production` |
| Tests | `nx test console` |
| Lint | `nx lint console` |
| E2E | `nx e2e console-e2e` |
| Grafo | `nx graph` |
| Afectados | `nx affected -t test` |
| Reset cache | `nx reset` |

## Anti-patrones

- Usar `npm run` para tareas de proyecto individual (usar `nx`)
- Buildear todo cuando solo cambió una lib (usar `affected`)
- Ignorar el grafo de dependencias
- No usar cache en CI
- Ejecutar tests secuencialmente (usar `--parallel`)
