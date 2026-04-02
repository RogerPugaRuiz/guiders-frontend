---
project_name: 'guiders-frontend'
user_name: 'Roger Puga'
date: '2026-04-01'
sections_completed: ['technology_stack', 'typescript_rules', 'angular_rules', 'testing_rules', 'code_quality_rules', 'workflow_rules', 'critical_rules']
status: 'complete'
rule_count: 52
optimized_for_llm: true
---

# Contexto del Proyecto para Agentes de IA

_Este archivo contiene reglas críticas y patrones que los agentes de IA deben seguir al implementar código en este proyecto. Se enfoca en detalles no obvios que los agentes podrían pasar por alto._

---

## Stack de Tecnología y Versiones

- Angular ~20.1.0 — standalone, OnPush, inject()
- Nx 21.4.1 — monorepo DDD, generators, affected commands
- TypeScript ~5.8.2 — moduleResolution: "bundler", target: "es2022"
- Vite ^6.0.0 + Vitest ^3.0.0 + @analogjs/vitest-angular ~1.19.1
- RxJS ~7.8.0
- Socket.IO Client ^4.8.1 (salas, wsUrl separado del baseUrl HTTP)
- zone.js ~0.15.0
- ESLint ^9.8.0 + angular-eslint ^20.0.0 + Prettier ^2.6.2
- Playwright ^1.36.0

---

## Reglas Específicas de TypeScript

- `moduleResolution` DEBE ser `"bundler"` (no `"node"` ni `"node16"`)
- Importar librerías SIEMPRE vía `@guiders-frontend/*` — nunca rutas relativas entre libs distintas
- Cada librería exporta SOLO desde `src/index.ts` (barrel export obligatorio)
- Usar `catchError` + `of()` para fallbacks en Observables; nunca `try/catch` síncrono en pipes
- Los tipos internos de API (`interface ApiXxxResponse`) se declaran en el mismo archivo del servicio
- Strings de fecha del backend → siempre convertir a `Date`: `new Date(dateString)`
- `ENVIRONMENT_TOKEN` se inyecta con `inject(ENVIRONMENT_TOKEN)`, no por constructor

---

## Reglas Específicas de Angular

- `standalone: true` en TODOS los componentes — sin NgModules
- `ChangeDetectionStrategy.OnPush` obligatorio en componentes UI (`libs/*/ui/*`)
- Inyección SIEMPRE con `inject()` — nunca constructor injection
- `input()` y `output()` signals API — nunca decoradores `@Input()` / `@Output()`
- `signal()` + `computed()` para estado local en features
- `DestroyRef` + `takeUntilDestroyed(this.destroyRef)` para gestión de suscripciones
- Lazy loading: `loadChildren: () => import('@guiders-frontend/...').then(m => m.routes)`
- Cada feature exporta `routes: Route[]` desde `src/index.ts`
- Guards como funciones (`authGuard`), no como clases
- Estado en features: signals. Estado en servicios: `BehaviorSubject` + `asObservable()`
- NO usar NgRx, Redux ni otros stores externos
- Mensajes paginados V2 vienen en orden DESC — revertir con `.reverse()` antes de mostrar

---

## Reglas de Testing

- Unit tests: Vitest ^3.0.0 + `@analogjs/vitest-angular ~1.19.1`
- Archivos `*.spec.ts` en el mismo directorio que el componente/servicio
- Componentes standalone se importan directamente: `TestBed.configureTestingModule({ imports: [MyComponent] })`
- Inputs signals: usar `fixture.componentRef.setInput('name', value)` — nunca `component.name = value`
- Llamar `fixture.detectChanges()` después de `setInput()`
- E2E: Playwright con `test.describe` / `test()`, importar desde `@playwright/test`
- E2E archivos en `apps/{app}-e2e/src/`
- Ejecutar tests: `nx run-many -t test --projects=admin,console --parallel`
- Ejecutar e2e: `nx run-many -t e2e --projects=admin-e2e,console-e2e --parallel`

---

## Calidad de Código y Estilo

- ESLint 9 flat config — `@nx/enforce-module-boundaries` activo; viola si se cruzan dominios
- Prettier: `singleQuote: true` (único override)
- SCSS import: `@use 'path/to/tokens-vars' as tokens;` — SIEMPRE con namespace `tokens`
- BEM: `.component__element--modifier`
- Tokens de espaciado válidos: `$spacing-2xs`(2px) `xs`(4px) `sm`(8px) `md`(16px) `lg`(24px) `xl`(32px) `2xl`(48px) `3xl`(64px)
- Tokens de fuente válidos: `$font-size-xs`(12px) `sm`(14px) `base`(16px) `lg`(18px) `xl`(20px) `2xl`(24px)
- **NO EXISTEN**: `$spacing-3xs`, `$font-size-2xs`, `$spacing-xxs` — causarán error de compilación SCSS
- Colores SIEMPRE mediante tokens (`$color-text-primary`, `$color-surface-secondary`, etc.) — nunca valores hex crudos
- Archivos: `kebab-case.ts` | Clases/Componentes: `PascalCase` sin sufijo (`Button`, `Inbox`, `Sidebar`)
- Selectores UI: `guiders-*` | Selectores features: `lib-*`
- Tags Nx obligatorios en `project.json`: `scope:{chat|auth|analytics|shared}` + `type:{ui|feature|data-access}`

---

## Flujo de Desarrollo

- Ramas: `main` (prod), `develop` (integración), `feature/*` (funcionalidades)
- Commits: Conventional Commits — `feat:`, `feat(scope):`, `fix:`, `fix(scope):`, `refactor:`, `docs:`
- PRs hacia `main` o `develop`; CI obligatorio antes de merge
- Instalar dependencias: `npm ci --legacy-peer-deps` — **nunca** `npm install`
- Node.js versión **20** requerida
- CI ejecuta: `npx nx run-many -t lint test build e2e`
- Verificar cambios afectados: `nx affected -t build|test|lint` antes de commit

---

## Reglas Críticas — Anti-Patrones a Evitar

### Transformación de respuestas HTTP

- Backend devuelve `id` → frontend usa `messageId`: SIEMPRE usar `transformMessageFromApi()`
- Backend devuelve `createdAt` → frontend usa `sentAt`: mapear en la transformación
- Estado `ASSIGNED` → mapear a `ACTIVE`; prioridad `NORMAL` → mapear a `MEDIUM`
- `getMessages()` V1: resultado viene DESC → invertir con `.reverse()`
- `getMessagesV2()`: resultado DESC; revertir al carga inicial; mensajes paginados (página 2+) van al **INICIO** del array existente

### WebSocket

- Ignorar mensajes propios (`senderId === currentUserId`) — ya los agrega la respuesta HTTP
- Verificar `messageId` duplicado antes de agregar al estado local

### Angular / DOM

- `ViewChild` scroll: referenciar el elemento con `overflow-y: auto`, **no** su contenedor padre
- Auto-scroll tras cambio DOM: `setTimeout(() => scroll(), 0)` después de `cdr.detectChanges()`
- `OnPush`: llamar `cdr.detectChanges()` cuando se actualice estado fuera del ciclo Angular

### Nx

- Revisar `nx graph` antes de crear una lib nueva — evitar duplicados
- Exportar SOLO desde `src/index.ts` — nunca desde rutas internas de la lib
- Usar `nx g @nx/angular:lib` con `--directory` correcto y agregar tags siempre

### HTTP / Seguridad

- `withCredentials: true` en TODAS las peticiones HTTP
- Token: `localStorage.getItem('access-token')` → `Authorization: Bearer <token>`
- `npm ci --legacy-peer-deps` para instalar — peer deps tienen conflictos con npm estricto

---

## Guía de Uso

**Para agentes de IA:**

- Leer este archivo antes de implementar cualquier código
- Seguir TODAS las reglas exactamente como están documentadas
- Ante la duda, preferir la opción más restrictiva
- Actualizar este archivo si surgen nuevos patrones

**Para humanos:**

- Mantener este archivo conciso y enfocado en las necesidades de los agentes
- Actualizar cuando cambie el stack tecnológico o los patrones
- Revisar periódicamente para eliminar reglas obsoletas

_Última actualización: 2026-04-01_
