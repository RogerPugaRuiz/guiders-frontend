# Estructura del Workspace Nx

## Descripción

Organización del monorepo Nx con aplicaciones y librerías.

## Estructura General

```
guiders-frontend/
├── apps/                           # Aplicaciones
│   ├── admin/                      # Dashboard administración
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── app.config.ts
│   │   │   │   ├── app.routes.ts
│   │   │   │   └── app.ts
│   │   │   └── main.ts
│   │   └── project.json
│   ├── admin-e2e/                  # E2E tests para admin
│   ├── console/                    # Consola de operadores
│   │   └── ...
│   └── console-e2e/                # E2E tests para console
├── libs/                           # Librerías compartidas
│   ├── auth/
│   ├── chat/
│   ├── analytics/
│   ├── admin/
│   └── shared/
├── nx.json                         # Configuración Nx
├── tsconfig.base.json              # Path mappings
└── package.json
```

## Aplicaciones (apps/)

### Console (Puerto 4200)

```
apps/console/
├── src/
│   ├── app/
│   │   ├── app.config.ts      # ApplicationConfig con providers
│   │   ├── app.routes.ts      # Rutas principales
│   │   └── app.ts             # Componente raíz
│   ├── environments/
│   │   ├── environment.ts
│   │   └── environment.prod.ts
│   ├── index.html
│   ├── main.ts
│   └── styles.scss
├── project.json
└── tsconfig.app.json
```

### Admin (Puerto 4201)

```
apps/admin/
├── src/
│   ├── app/
│   │   ├── app.config.ts
│   │   ├── app.routes.ts
│   │   └── app.ts
│   └── ...
└── project.json
```

## Configuración de Aplicación

```typescript
// apps/console/src/app/app.config.ts
import { ApplicationConfig, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { ENVIRONMENT_TOKEN } from '@guiders-frontend/shared/types';
import { environment } from '../environments/environment';
import { authRefreshInterceptor } from '@guiders-frontend/auth/data-access/session';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([authRefreshInterceptor])
    ),
    {
      provide: ENVIRONMENT_TOKEN,
      useValue: environment,
    },
  ],
};
```

## project.json

```json
// apps/console/project.json
{
  "name": "console",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "projectType": "application",
  "prefix": "app",
  "sourceRoot": "apps/console/src",
  "tags": ["scope:console", "type:app"],
  "targets": {
    "build": {
      "executor": "@angular-devkit/build-angular:application",
      "outputs": ["{options.outputPath}"],
      "options": {
        "outputPath": "dist/apps/console",
        "index": "apps/console/src/index.html",
        "browser": "apps/console/src/main.ts",
        "polyfills": ["zone.js"],
        "tsConfig": "apps/console/tsconfig.app.json",
        "inlineStyleLanguage": "scss",
        "assets": ["apps/console/src/assets"],
        "styles": ["apps/console/src/styles.scss"],
        "scripts": []
      },
      "configurations": {
        "production": {
          "budgets": [...],
          "outputHashing": "all"
        },
        "development": {
          "optimization": false,
          "extractLicenses": false,
          "sourceMap": true
        }
      },
      "defaultConfiguration": "production"
    },
    "serve": {
      "executor": "@angular-devkit/build-angular:dev-server",
      "configurations": {
        "production": {
          "buildTarget": "console:build:production"
        },
        "development": {
          "buildTarget": "console:build:development"
        }
      },
      "defaultConfiguration": "development"
    },
    "test": {
      "executor": "@nx/vite:test",
      "options": {
        "reportsDirectory": "../../coverage/apps/console"
      }
    },
    "lint": {
      "executor": "@nx/eslint:lint"
    }
  }
}
```

## Librerías (libs/)

```json
// libs/chat/features/inbox/project.json
{
  "name": "chat-features-inbox",
  "$schema": "../../../../node_modules/nx/schemas/project-schema.json",
  "sourceRoot": "libs/chat/features/inbox/src",
  "prefix": "lib",
  "tags": ["scope:chat", "type:feature"],
  "projectType": "library",
  "targets": {
    "test": {
      "executor": "@nx/vite:test",
      "options": {
        "reportsDirectory": "../../../../coverage/libs/chat/features/inbox"
      }
    },
    "lint": {
      "executor": "@nx/eslint:lint"
    }
  }
}
```

## nx.json

```json
{
  "$schema": "./node_modules/nx/schemas/nx-schema.json",
  "defaultBase": "main",
  "namedInputs": {
    "default": ["{projectRoot}/**/*", "sharedGlobals"],
    "production": [
      "default",
      "!{projectRoot}/**/*.spec.ts",
      "!{projectRoot}/**/*.md"
    ],
    "sharedGlobals": []
  },
  "targetDefaults": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": ["production", "^production"],
      "cache": true
    },
    "test": {
      "inputs": ["default", "^production"],
      "cache": true
    },
    "lint": {
      "inputs": ["default"],
      "cache": true
    }
  },
  "generators": {
    "@nx/angular:library": {
      "style": "scss",
      "linter": "eslint",
      "unitTestRunner": "vitest"
    },
    "@nx/angular:component": {
      "style": "scss",
      "changeDetection": "OnPush",
      "standalone": true
    }
  }
}
```

## tsconfig.base.json

```json
{
  "compilerOptions": {
    "paths": {
      "@guiders-frontend/auth/features/login": ["libs/auth/features/login/src/index.ts"],
      "@guiders-frontend/auth/data-access/session": ["libs/auth/data-access/session/src/index.ts"],
      "@guiders-frontend/chat/features/inbox": ["libs/chat/features/inbox/src/index.ts"],
      "@guiders-frontend/chat/ui/visitor-card": ["libs/chat/ui/visitor-card/src/index.ts"],
      "@guiders-frontend/shared/types": ["libs/shared/types/src/index.ts"],
      "@guiders-frontend/shared/ui/badge": ["libs/shared/ui/badge/src/index.ts"],
      "@guiders-frontend/shared/design-tokens": ["libs/shared/design-tokens/src/index.ts"]
    }
  }
}
```

## Cache y Affected

```bash
# Cache local (por defecto)
# Los builds/tests se cachean automáticamente

# Ver qué proyectos están afectados
nx affected:graph

# Build solo afectados
nx affected -t build

# Test solo afectados
nx affected -t test

# Limpiar cache
nx reset
```

## Checklist

- [ ] Cada app tiene `project.json` configurado
- [ ] Tags de scope y type en todas las libs
- [ ] Path mappings en `tsconfig.base.json`
- [ ] Configuración de generators en `nx.json`
- [ ] Cache habilitado para build/test/lint

## Anti-patrones

- Apps sin `project.json`
- Librerías sin tags
- Path mappings manuales (usar generadores)
- Ignorar affected para CI
- No usar cache de Nx
