# Nx Workspace Structure

## Description

Organization of the Nx monorepo with applications and libraries.

## General Structure

```
guiders-frontend/
├── apps/                           # Applications
│   ├── admin/                      # Administration dashboard
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── app.config.ts
│   │   │   │   ├── app.routes.ts
│   │   │   │   └── app.ts
│   │   │   └── main.ts
│   │   └── project.json
│   ├── admin-e2e/                  # E2E tests for admin
│   ├── console/                    # Operator console
│   │   └── ...
│   └── console-e2e/                # E2E tests for console
├── libs/                           # Shared libraries
│   ├── auth/
│   ├── chat/
│   ├── analytics/
│   ├── admin/
│   └── shared/
├── nx.json                         # Nx configuration
├── tsconfig.base.json              # Path mappings
└── package.json
```

## Applications (apps/)

### Console (Port 4200)

```
apps/console/
├── src/
│   ├── app/
│   │   ├── app.config.ts      # ApplicationConfig with providers
│   │   ├── app.routes.ts      # Main routes
│   │   └── app.ts             # Root component
│   ├── environments/
│   │   ├── environment.ts
│   │   └── environment.prod.ts
│   ├── index.html
│   ├── main.ts
│   └── styles.scss
├── project.json
└── tsconfig.app.json
```

### Admin (Port 4201)

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

## Application Configuration

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

## Libraries (libs/)

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

## Cache and Affected

```bash
# Local cache (default)
# Builds/tests are cached automatically

# See which projects are affected
nx affected:graph

# Build only affected
nx affected -t build

# Test only affected
nx affected -t test

# Clean cache
nx reset
```

## Checklist

- [ ] Each app has `project.json` configured
- [ ] Scope and type tags on all libs
- [ ] Path mappings in `tsconfig.base.json`
- [ ] Generator configuration in `nx.json`
- [ ] Cache enabled for build/test/lint

## Anti-patterns

- Apps without `project.json`
- Libraries without tags
- Manual path mappings (use generators)
- Ignoring affected for CI
- Not using Nx cache
