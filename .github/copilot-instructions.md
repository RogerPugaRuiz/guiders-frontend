# Copilot Instructions for AI Agents

## Arquitectura y Estructura General
- Este monorepo usa **Nx** (v21+) con una arquitectura de **domain-driven design** organizando código bajo `apps/` para aplicaciones y `libs/` para librerías compartidas.
- Las aplicaciones principales son:
  - `admin`: Panel administrativo Angular (puerto 4201)
  - `console`: Consola de usuario Angular (puerto 4200)
  - Cada una tiene su propio E2E con Playwright (`admin-e2e`, `console-e2e`).
- Stack tecnológico: Angular 20 standalone + Vite + Vitest + Playwright + SCSS + ESLint.

## Arquitectura de Librerías y Patrones de Dependencia
- **Estructura por dominio**: `libs/{domain}/{type}/{feature-name}` (ej: `libs/auth/features/login`, `libs/auth/ui/login-form`)
- **Tipos de librerías**:
  - `features/`: Componentes inteligentes con rutas y lógica de negocio
  - `ui/`: Componentes presentacionales reutilizables
  - `data-access/`: Servicios HTTP y lógica de acceso a datos (cada servicio como proyecto independiente)
  - `utils/`: Utilidades y helpers (futuro)
- **Estructura de Data Access**: Cada servicio tiene su propio proyecto independiente:
  - `libs/chat/data-access/chat-service/` - Servicio principal de chat
  - `libs/chat/data-access/visitors-data-service/` - Servicio de gestión de visitantes
  - Patrón: `libs/{domain}/data-access/{service-name}/`
- **Dependencias**: Las features dependen de UI components y data-access services, estableciendo una jerarquía clara (`visitors` → `visitors-list` + `visitors-data-service`)
- **Tagging**: Se usa `tags: ["type:feature", "scope:auth"]` para categorizar proyectos

## Comandos y Flujos de Desarrollo
- **Servir apps**:
  - `npm run serve:admin` (http://localhost:4201)
  - `npm run serve:console` (http://localhost:4200)
- **Operaciones por proyecto**: `nx build/test/lint <project-name>`
- **E2E**: `nx e2e <app>-e2e` (configurado automáticamente con Playwright)
- **Visualización**: `nx graph` para dependencias del workspace
- **Generación**: Usa Nx Console UI o `nx g @nx/angular:lib <name>` con las opciones predefinidas en `nx.json`

## Patrones Angular Modernos y Convenciones
- **Componentes standalone**: Todos los componentes usan `imports: []` en lugar de módulos
- **Signals API**: 
  ```typescript
  readonly isLoading = signal<boolean>(false);
  readonly isFormValid = computed(() => this.loginForm.valid);
  readonly disabled = input<boolean>(false);
  readonly loginSubmit = output<LoginCredentials>();
  ```
- **Dependency Injection**: Usa `inject()` function en lugar de constructor injection
- **Functional Guards**: `export const authGuard: CanActivateFn = (route, state) => {}`
- **Lazy Loading**: `loadChildren: () => import('@guiders-frontend/auth/features/login').then(m => m.loginRoutes)`

## Convenciones de Nombres y Selectores
- **Apps**: `{app-name}-root` (ej: `console-root`, `admin-root`)
- **Librerías UI**: `guiders-{component-name}` (ej: `guiders-login-form`)
- **Librerías Feature**: `lib-{feature-name}` (ej: `lib-login`)
- **Rutas**: Cada feature exporta `{name}Routes: Route[]` para lazy loading
- **Barrel exports**: Todos los public APIs se exportan desde `src/index.ts`

## Servicios Data Access y Patrones HTTP
- **Estructura consistente**: Cada servicio HTTP es un proyecto independiente bajo `data-access/`
- **Convención de nombres**: `{feature}-data-service` (ej: `visitors-data-service`, `chat-service`)
- **Imports de servicios**: `@guiders-frontend/{service-name}` (ej: `@guiders-frontend/visitors-data-service`)
- **Implementación**: Servicios usan `inject(HttpClient)` y proveen métodos observables para API calls
- **Configuración**: Cada servicio tiene su propio `project.json` con tags `["type:data-access", "scope:{domain}"]`

## Configuración de Path Mapping y TypeScript
- **Imports**: `@guiders-frontend/{domain}/{type}/{name}` (definidos en `tsconfig.base.json`)
- **Ejemplo Features**: `import { LoginComponent } from '@guiders-frontend/auth/features/login';`
- **Ejemplo UI**: `import { LoginForm } from '@guiders-frontend/auth/ui/login-form';`
- **Ejemplo Services**: `import { VisitorsDataService } from '@guiders-frontend/visitors-data-service';`
- **Testing**: Vitest configurado para todas las librerías, Playwright para E2E de apps
- **ModuleResolution**: Usa `"bundler"` en lugar de `"node"` (compatible con Vite y bundlers modernos)
- **Target**: ES2022 para aprovechar características modernas de JavaScript

## Archivos Clave y Configuración
- `nx.json`: Configuración global, generators defaults, plugins y targetDefaults
- `tsconfig.base.json`: Path mappings para imports de librerías
- `libs/{domain}/{type}/{name}/project.json`: Configuración específica del proyecto con tags
- `apps/{app}/src/app/app.routes.ts`: Rutas principales con lazy loading

## Guards y Autenticación
- **Functional guards**: Utilizan `localStorage.getItem('access-token')` para verificación
- **Protección de rutas**: Se aplican con `canActivate: [authGuard]` en definiciones de rutas
- **Redirección**: Guards redirigen a `/login` cuando no hay token válido

## Recomendaciones para Agentes
- Usa `nx show project <name>` para entender targets disponibles de cualquier proyecto
- Sigue el patrón domain/type/feature para nuevas librerías
- **Para servicios data-access**: Crea proyectos independientes bajo `libs/{domain}/data-access/{service-name}/`
- Implementa componentes con signals API y dependency injection moderna
- **Para servicios HTTP**: Usa `inject(HttpClient)` y retorna Observables, configura con `providedIn: 'root'`
- Verifica dependencias con `nx graph` antes de crear nuevas referencias entre proyectos
- Usa los generators configurados en `nx.json` para consistencia (SCSS, Vitest, ESLint)
- **Consistencia de estructura**: Todos los servicios data-access deben ser proyectos independientes, no carpetas dentro de otros proyectos
