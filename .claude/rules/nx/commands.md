# Nx Commands

## Description

Common commands for development, build, testing and workspace analysis.

## Serve (Development)

```bash
# Console (port 4200)
nx serve console
npm run serve        # alias

# Admin (port 4201)
nx serve admin
npm run serve:admin  # alias

# With specific configuration
nx serve console --configuration=development
nx serve console --configuration=production

# Custom port
nx serve console --port=4300
```

## Build

```bash
# Production build
nx build console
nx build admin

# Development build
nx build console --configuration=development

# Build all apps
npm run build:all

# Production build with optimization
npm run build:prod

# Build for staging
npm run build:staging
```

## Test

```bash
# Test a project
nx test console
nx test chat-features-inbox

# Test all projects
npm run test

# Tests with coverage
nx test console --coverage
npm run test:coverage

# Tests in watch mode
nx test console --watch

# Specific tests
nx test console --testNamePattern="should render"
```

## Lint

```bash
# Lint a project
nx lint console
nx lint chat-features-inbox

# Lint all
npm run lint

# Lint with auto-fix
nx lint console --fix
npm run lint:fix

# See violated rules
nx lint console --format=stylish
```

## E2E

```bash
# Console E2E
nx e2e console-e2e

# E2E with Playwright UI
nx e2e console-e2e --ui

# E2E in headed mode
nx e2e console-e2e --headed

# E2E with filter
nx e2e console-e2e --grep="visitors"
```

## Affected (Affected Projects)

```bash
# See affected projects
nx affected:graph

# Build only affected
nx affected -t build

# Test only affected
nx affected -t test

# Lint only affected
nx affected -t lint

# Multiple targets
nx affected -t lint,test,build

# Compare with specific branch
nx affected -t test --base=main --head=HEAD
```

## Run Many

```bash
# Run on multiple projects
nx run-many -t build
nx run-many -t test
nx run-many -t lint

# Only certain projects
nx run-many -t build --projects=console,admin

# Exclude projects
nx run-many -t test --exclude=console-e2e

# Parallel
nx run-many -t test --parallel=4
```

## Graph (Visualization)

```bash
# Open interactive graph
nx graph

# Graph of specific project
nx graph --focus=chat-features-inbox

# Graph of affected
nx affected:graph

# Export to file
nx graph --file=graph.json
```

## Show (Information)

```bash
# List all projects
nx show projects

# Projects of a type
nx show projects --type=app
nx show projects --type=lib

# Projects with tag
nx show projects --withTarget=build
```

## Reset and Cache

```bash
# Clean Nx cache
nx reset

# See cache status
nx daemon --version

# Stop daemon
nx daemon --stop
```

## Migrations

```bash
# Update Nx and dependencies
nx migrate latest

# Run migrations
nx migrate --run-migrations

# See pending migrations
nx migrate latest --dry-run
```

## package.json Scripts

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

## Generation Commands

```bash
# Generate library
nx g @nx/angular:lib my-lib --directory=libs/path

# Generate component
nx g @nx/angular:component my-component --project=project-name

# Generate service
nx g @nx/angular:service my-service --project=project-name

# Dry run (without creating files)
nx g @nx/angular:lib my-lib --dry-run
```

## CI/CD Commands

```bash
# For CI - only affected
nx affected -t lint,test,build --base=origin/main

# With coverage
nx affected -t test --coverage --ci

# Production build
nx run-many -t build --configuration=production --parallel=3
```

## Troubleshooting

```bash
# See project configuration
nx show project console --web

# See project dependencies
nx graph --focus=console

# Verify workspace
nx report

# See detailed logs
NX_VERBOSE_LOGGING=true nx build console

# Force cache recalculation
nx build console --skip-nx-cache
```

## Useful Aliases

```bash
# In .bashrc or .zshrc
alias nxs="nx serve"
alias nxb="nx build"
alias nxt="nx test"
alias nxl="nx lint --fix"
alias nxg="nx graph"
alias nxa="nx affected"
```

## Summary Table

| Action | Command |
|--------|---------|
| Serve console | `nx serve console` |
| Serve admin | `nx serve admin` |
| Production build | `nx build console --configuration=production` |
| Tests | `nx test console` |
| Lint | `nx lint console` |
| E2E | `nx e2e console-e2e` |
| Graph | `nx graph` |
| Affected | `nx affected -t test` |
| Reset cache | `nx reset` |

## Anti-patterns

- Using `npm run` for individual project tasks (use `nx`)
- Building everything when only one lib changed (use `affected`)
- Ignoring the dependency graph
- Not using cache in CI
- Running tests sequentially (use `--parallel`)
