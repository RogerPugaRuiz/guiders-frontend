# Nx Generators

## Description

Commands to generate libraries, components and other artifacts with standardized configuration.

## Generate Libraries

### Feature Library

```bash
nx g @nx/angular:lib inbox \
  --directory=libs/chat/features/inbox \
  --tags=scope:chat,type:feature \
  --standalone \
  --style=scss
```

Generates:
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

### Types Library (without Angular)

```bash
nx g @nx/js:lib types \
  --directory=libs/shared/types \
  --tags=scope:shared,type:util \
  --unitTestRunner=none
```

## Generate Components

### Component in Existing Library

```bash
nx g @nx/angular:component visitor-card \
  --project=chat-ui-visitor-card \
  --standalone \
  --changeDetection=OnPush \
  --style=scss
```

### Component with Routing

```bash
nx g @nx/angular:component settings \
  --project=admin-features-settings \
  --standalone \
  --changeDetection=OnPush \
  --style=scss
```

## Generate Services

```bash
nx g @nx/angular:service visitors-data \
  --project=chat-data-access-visitors-data-service \
  --skipTests=false
```

## Generate Guards and Interceptors

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

## Common Options

### For Libraries

| Option | Description | Example |
|--------|-------------|---------|
| `--directory` | Library path | `libs/chat/features/inbox` |
| `--tags` | Nx tags | `scope:chat,type:feature` |
| `--standalone` | Without NgModule | `true` |
| `--style` | Styles format | `scss` |
| `--prefix` | Selector prefix | `guiders` |

### For Components

| Option | Description | Example |
|--------|-------------|---------|
| `--project` | Target project | `chat-features-inbox` |
| `--standalone` | Without NgModule | `true` |
| `--changeDetection` | CD strategy | `OnPush` |
| `--style` | Styles format | `scss` |
| `--skipTests` | Skip tests | `false` |

## Defaults in nx.json

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

With these defaults, the command is simplified:

```bash
# Before
nx g @nx/angular:lib badge --directory=libs/shared/ui/badge --tags=scope:shared,type:ui --standalone --style=scss

# After (with defaults)
nx g @nx/angular:lib badge --directory=libs/shared/ui/badge --tags=scope:shared,type:ui
```

## Examples by Domain

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

## Move and Rename

```bash
# Move library
nx g @nx/workspace:move --project=old-name --destination=new/path

# Rename project
nx g @nx/workspace:move --project=old-name --newProjectName=new-name
```

## Remove

```bash
# Remove library
nx g @nx/workspace:remove --project=project-name
```

## Verify Generation

```bash
# Dry run (see what would be generated without creating files)
nx g @nx/angular:lib my-lib --directory=libs/test --dry-run

# See generated projects
nx show projects

# See dependency graph
nx graph
```

## Post-Generation Checklist

- [ ] Verify tags in `project.json`
- [ ] Update barrel exports in `src/index.ts`
- [ ] Verify path mapping in `tsconfig.base.json`
- [ ] Add to `.eslintrc.json` if necessary
- [ ] Run `nx lint` to verify

## Anti-patterns

- Creating files manually without generator
- Forgetting tags when generating
- Not verifying path mappings
- Generating without `--standalone`
- Using `--skipTests=true` by default
