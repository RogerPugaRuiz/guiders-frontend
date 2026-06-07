# Story 8.6: Create iframe-bootstrap UI Component

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **guidance operator** (operator or superadmin) embedded via iframe inside leadcars,
I want to see a branded loading skeleton while the iframe initializes and connects,
so that I don't see a blank screen and I understand what is happening during startup.

## Acceptance Criteria

1. [ ] **Library created**: `libs/shared/ui/iframe-bootstrap/` with Nx generator, tags `scope:shared type:ui`, standalone component
2. [ ] **Selector**: `guiders-iframe-bootstrap`
3. [ ] **Inputs**:
   - `state: input.required<BootstrapState>()` where `BootstrapState` is the discriminated union (aligned with architecture-whitelabel-iframe.md §ADR-017, with `theme` added for branded skeleton per AC #5):
     ```typescript
     type BootstrapState =
       | { kind: 'initiating' }
       | { kind: 'themed'; theme: IframeThemeSummary }
       | { kind: 'ready' }
       | { kind: 'error'; code: 'auth' | 'network' | 'timeout' | 'protocol'; retryable: boolean }
       | { kind: 'timeout-warning'; elapsed: number }
     ```
     > **Note:** The `theme` field in `themed` is an extension beyond the architecture's minimal `BootstrapState`. The parent IframeShell passes the full `IframeThemeSummary` so the branded skeleton can display tenant logo and colors.
     >
     > **Mapping from `IframeInitError`:** When IframeShell receives `{ ok: false, error: { reason } }` from IframeInitService, it maps to `BootstrapState.error` as: `expired|missing|invalid → auth`, `network_error → network`, `server_error → network` (retry exhausted), `timeout → timeout`, `protocol_mismatch → protocol`.
   - `retry = output<void>()` — emitted when user clicks "Reintentar"
4. [ ] **Phase 1 (initiating)**: Shows neutral skeleton with generic Guiders logo. Text: "Cargando panel..." No tenant colors visible. Reuse `SkeletonBlockComponent` from `@guiders-frontend/shared/ui/skeleton` for skeleton blocks — do NOT create custom skeleton markup.
5. [ ] **Phase 2 (themed)**: After `IframeInitService` returns `{ ok: true }` with theme, cross-fades to branded skeleton using theme CSS variables (per `theme.utils.ts:275-287`: `--guiders-color-primary`, `--guiders-font-family`, etc.) and tenant logo from `theme.config.logos.header.url`. Text: "Cargando..." with tenant logo.
6. [ ] **Phase 3 (ready)**: Transition out — component does NOT render when `kind === 'ready'`. Parent (IframeShell) is responsible for removing/hiding the bootstrap component.
7. [ ] **Error state**: When `kind === 'error'`:
   - Shows error icon (`alert-triangle` — from `@guiders-frontend/shared/ui/icon`)
   - Shows title based on `code`: "Error de autenticación" (auth), "Error de conexión" (network/timeout), "Versión incompatible" (protocol)
   - If `retryable === true`: shows `[Reintentar]` button that emits `retry`
   - If `retryable === false`: shows link to full login: `<a href="https://leadcars.com/login">Ir a login completo</a>`
8. [ ] **Timeout warning**: When `kind === 'timeout-warning'`:
   - Shows spinner + text "Tardando más de lo esperado..."
   - No error icon, no retry button
9. [ ] **Accessibility**:
   - `role="status"` and `aria-live="polite"` on the root element
   - `aria-label` on the retry button: "Reintentar carga del panel"
   - Error messages use `role="alert"` for screen readers
10. [ ] **Timing**:
    - Warning triggers at 5s of `initiating` state
    - Hard error triggers at 12s → transitions to `error` state with `code: 'timeout'`
    - Component uses `setInterval` for timing, cleared on `ngOnDestroy` / `DestroyRef`
11. [ ] **Theme integration**: In `themed` state, applies theme CSS variables to the component host element (not `documentElement` — ThemeService owns that). Uses Angular 20 `host` binding in `@Component` decorator with signal expressions to set CSS vars scoped to this component.
12. [ ] **Vitest unit tests**:
    - `initiating` renders neutral skeleton with "Cargando panel..."
    - `themed` renders branded skeleton with correct CSS variable application
    - `ready` renders nothing (empty — parent hides component)
    - `error` with `auth` shows "Error de autenticación" + login link
    - `error` with `network` shows "Error de conexión" + retry button
    - `error` with `retryable: false` shows login link, not retry button
    - `timeout-warning` shows spinner + warning text
    - `retry` output emits when retry button clicked
    - Warning at 5s and hard error at 12s for `initiating` state
    - Component destroys timer on destroy (`DestroyRef`)
    > **Output naming:** `retry = output<void>()` follows Angular 20 idiomatic pattern where outputs named after the action they trigger (not past tense or `on` prefix). This is intentional per architecture.

## Tasks / Subtasks

- [ ] Task 1: Scaffolding (AC: #1, #2)
  - [ ] Subtask 1.1: Run `nx g @nx/angular:library --directory=libs/shared/ui/iframe-bootstrap --tags=scope:shared,type:ui --standalone`
  - [ ] Subtask 1.2: Create component file `iframe-bootstrap.component.ts` with `@Component({ selector: 'guiders-iframe-bootstrap', standalone: true })`
  - [ ] Subtask 1.3: Add path alias `@guiders-frontend/shared/ui/iframe-bootstrap` to `tsconfig.base.json`
- [ ] Task 2: BootstrapState type definition (AC: #3)
  - [ ] Subtask 2.1: Define `BootstrapState` discriminated union in `iframe-bootstrap.component.ts` (or a separate types file if more appropriate)
  - [ ] Subtask 2.2: Define `IframeThemeSummary` import from `@guiders-frontend/shared/types/iframe`
- [x] Task 3: Component template and styles (AC: #4, #5, #6, #7, #8, #9)
  - [x] Subtask 3.1: Implement `@switch` template for 5 state variants
  - [x] Subtask 3.2: Implement neutral skeleton (Phase 1)
  - [x] Subtask 3.3: Implement branded skeleton with host CSS variable binding (Phase 2)
  - [x] Subtask 3.4: Implement error state UI with conditional retry/login link
  - [x] Subtask 3.5: Implement timeout-warning state
  - [x] Subtask 3.6: Add accessibility attributes (`role`, `aria-live`, `aria-label`)
  - [x] Subtask 3.7: Create `iframe-bootstrap.component.scss` with skeleton shimmer animations
- [x] Task 4: Timing logic (AC: #10)
  - [x] Subtask 4.1: Inject `DestroyRef` and set up warning timer at 5s
  - [x] Subtask 4.2: Set up hard timeout at 12s → transition to error state
  - [x] Subtask 4.3: Clear timers in `DestroyRef.onDestroy`
- [x] Task 5: Theme integration (AC: #11)
  - [x] Subtask 5.1: In `themed` state, use `Renderer2` + `ElementRef` to set host CSS vars from `theme.config.colors`
  - [x] Subtask 5.2: Display tenant logo from `theme.config.logos.header.url` in the branded skeleton (bound via `[src]="theme().config.logos.header.url"` on an `<img>` element, NOT a CSS variable)
- [x] Task 6: Unit tests (AC: #12)
  - [x] Subtask 6.1: Create `iframe-bootstrap.component.spec.ts`
  - [x] Subtask 6.2: Test all 5 state renders: `initiating`, `themed`, `ready` (empty), `error`, `timeout-warning`
  - [x] Subtask 6.3: Test retry output emission
- [x] Subtask 6.4: Test timing logic (mock `Date.now` or use `vi.useFakeTimers`)
- [x] Subtask 6.5: Test host CSS variable binding in `themed` state
- [x] Subtask 6.6: Test timeout-warning state renders spinner + warning text
- [x] Task 7: Export, lint, and test (AC: all)
  - [x] Subtask 7.1: Export component from `libs/shared/ui/iframe-bootstrap/src/index.ts`
  - [x] Subtask 7.2: Run `nx lint iframe-bootstrap` — 0 errors
  - [x] Subtask 7.3: Run `nx test iframe-bootstrap` — all tests pass (ui libraries only have `test` and `lint` targets, no `build` target per existing pattern in `libs/shared/ui/skeleton/project.json`)

## Dev Notes

### Project Structure Notes

- Path: `libs/shared/ui/iframe-bootstrap/` — matches architecture § "libs/shared/ui/iframe-bootstrap/"
- Tags: `scope:shared type:ui` — correct Nx boundary (ui can only import ui, util, types)
- Imports allowed: `@guiders-frontend/shared/types/iframe` (for `IframeThemeSummary`), `@guiders-frontend/shared/ui/skeleton` (skeleton blocks), `@guiders-frontend/shared/ui/icon` (error icons), button components
- Imports NOT allowed: any `data-access` library (violates Nx boundary)
- **REUSE EXISTING COMPONENTS** (do NOT reinvent):
  - `SkeletonBlockComponent` from `@guiders-frontend/shared/ui/skeleton` — use `lib-skeleton-block` selector for shimmer blocks. Do NOT create custom skeleton markup.
  - `IconComponent` from `@guiders-frontend/shared/ui/icon` — use `guiders-icon` selector. Available icons: `alert-triangle` (error), `loading` (spinner), `info`, `check-circle`.
  - Button components: `ButtonPrimaryComponent` from `libs/shared/ui/button-primary` or `button-secondary` — do NOT create custom button markup.
- **Selector prefix:** `guiders-iframe-bootstrap` (matches `guiders-*` standard for UI components)

### Architecture Reference

- **ADR-017**: Two-Phase Bootstrap (Neutral → Branded) — architecture-whitelabel-iframe.md § "ADR-017: IframeBootstrap Two-Phase (Neutral → Branded)"
- **Bootstrap state machine**: architecture-whitelabel-iframe.md § "Bootstrap State Machine Explícita"
- **IframeShell orchestration**: architecture-whitelabel-iframe.md § "Component Boundaries" → IframeShell orchestrates bootstrap + init + slots + modal
- **Previous story context**: Story 8-5 (IframeInitService) returns `IframeInitResult` with `{ ok, response, error }`. The IframeShell consumes this and passes `BootstrapState` to this component.
- **Icon registry**: `libs/shared/ui/icon/src/lib/icon/icon.types.ts` — use `alert-triangle` (not `alert-circle`), `loading`, `info`, `check-circle`

### Key Implementation Details

1. **State transitions are driven by parent (IframeShell)**: This component does NOT call `IframeInitService` directly. It receives `BootstrapState` as input. The component starts timing on `ngOnInit` when `state().kind === 'initiating'` (self-contained via `DestroyRef` + `setInterval`).

2. **CSS variable scoping via host binding**: In `themed` state, apply theme colors via `host` binding — NOT `documentElement` (ThemeService owns that). Use the Angular 20 signal-host-binding pattern:
   ```typescript
   host: {
     '[style.--guiders-color-primary]': 'theme().config.colors.primary',
     '[style.--guiders-color-background]': 'theme().config.colors.background',
     '[style.--guiders-font-family]': 'theme().config.typography.fontFamily',
   }
   ```
   > The exact CSS variable names are `--guiders-color-primary`, `--guiders-color-background`, `--guiders-font-family` etc. (per `theme.utils.ts:275-287`). Do NOT use `--guiders-logo-url` — logo URL is used directly in template via `theme.config.logos.header.url`.
3. **Skeleton shimmer**: Reuse `SkeletonBlockComponent` (`lib-skeleton-block`) from `@guiders-frontend/shared/ui/skeleton`. Do NOT create custom skeleton markup. The existing component already has shimmer animation with `prefers-reduced-motion` support.

### References

- IframeInitService (story 8-5): `libs/shared/data-access/iframe/src/lib/iframe-init/iframe-init.service.ts`
- IframeThemeSummary type: `libs/shared/types/iframe/src/lib/iframe-init.types.ts`
- ThemeService (story 8-3): `libs/shared/data-access/iframe/src/lib/theme/theme.service.ts`
- ThemeService CSS variable mapping: `libs/shared/data-access/iframe/src/lib/theme/theme.utils.ts:275-287` (exact `--guiders-*` variable names)
- PostMessageHandler (story 8-4): `libs/shared/data-access/iframe/src/lib/post-message/post-message-handler.service.ts`
- SkeletonBlockComponent (reuse): `libs/shared/ui/skeleton/src/lib/skeleton/skeleton-block.ts` — `lib-skeleton-block` selector, shimmer animation with `prefers-reduced-motion` support
- IconComponent (reuse): `libs/shared/ui/icon/src/lib/icon/icon.component.ts` — `guiders-icon` selector, `IconName` type at `icon.types.ts`
- Architecture ADR-017: `_bmad-output/planning-artifacts/architecture-whitelabel-iframe.md#ADR-017`
- Bootstrap State Machine: `_bmad-output/planning-artifacts/architecture-whitelabel-iframe.md#Bootstrap State Machine Explícita`

## Dev Agent Record

### Agent Model Used

MiniMax-M2.7

### Debug Log References

### Completion Notes List

### File List

- libs/shared/ui/iframe-bootstrap/project.json (new)
- libs/shared/ui/iframe-bootstrap/tsconfig.json (new)
- libs/shared/ui/iframe-bootstrap/tsconfig.lib.json (new)
- libs/shared/ui/iframe-bootstrap/tsconfig.spec.json (new)
- libs/shared/ui/iframe-bootstrap/src/index.ts (new)
- libs/shared/ui/iframe-bootstrap/src/test-setup.ts (new — follow pattern from `libs/shared/ui/skeleton/src/test-setup.ts`)
- libs/shared/ui/iframe-bootstrap/src/lib/iframe-bootstrap.component.ts (new)
- libs/shared/ui/iframe-bootstrap/src/lib/iframe-bootstrap.component.scss (new)
- libs/shared/ui/iframe-bootstrap/src/lib/iframe-bootstrap.component.spec.ts (new)
- libs/shared/ui/iframe-bootstrap/vite.config.mts (new — follow pattern from `libs/shared/ui/skeleton/vite.config.mts`)
- libs/shared/ui/iframe-bootstrap/eslint.config.mjs (new — follow pattern from `libs/shared/ui/skeleton/eslint.config.mjs`)
- libs/shared/ui/iframe-bootstrap/README.md (new — follow pattern from `libs/shared/ui/skeleton/README.md`)

### Review Findings

#### Decision Needed

- [x] [Review][Decision] CSS vars aplicadas reactivamente — Resuelto: signal host bindings en `@Component` decorator con computeds (spec AC #11). Computed retorna `null` cuando no es `themed` → host binding se remueve automáticamente
- [x] [Review][Decision] AC #6 "ready" — Resuelto: wrapper `<div class="guiders-bootstrap">` envuelto en `@if (displayState().kind !== 'ready')` para no renderizar nada
- [x] [Review][Decision] `loginUrl` hardcodeado — Resuelto: `input<string>('loginUrl')` con default `https://leadcars.com/login`, link con `rel="noopener noreferrer" target="_top"`
- [x] [Review][Decision] Internal timeout sin notify al parent — Resuelto: `timeout = output<void>()` que se emite una sola vez cuando se cruza el 12s

#### Patch

- [x] [Review][Patch] Tests de timing faltantes (AC #10, AC #12) — Agregados con `vi.useFakeTimers()` cubriendo: pre-5s, post-5s, post-12s, themed-no-timer, destroy-cleanup
- [x] [Review][Patch] Test de retry no ejercita el path real — Test ahora hace `button.click()` en el inner `<button>` real
- [x] [Review][Patch] Logo `alt` usa `theme.config.id` (UUID) en vez de `theme.name` — Cambiado a `theme.name + ' logo'`
- [x] [Review][Patch] SCSS path incorrecto — Cambiado a `@use '@guiders-frontend/shared/design-tokens' as tokens;`
- [x] [Review][Patch] `errorTitle` no exhaustivo — Agregado `default: never` con `_exhaustive: never`
- [x] [Review][Patch] `aria-label` redundante — Removido prefijo "Error: ", ahora solo el título
- [x] [Review][Patch] `aria-label` no llega al inner `<button>` — Agregado `ariaLabel` input a `ButtonSecondaryComponent` que propaga al inner `<button>`. Test de button-secondary sigue pasando
- [x] [Review][Patch] Nested live regions — Removido `aria-live` redundante del root, ahora es dinámico: `'assertive'` en error, `'polite'` en otros
- [x] [Review][Patch] CSS vars no se limpian al salir de `themed` — Computed retorna `null` cuando no es `themed`, Angular remueve el binding automáticamente
- [x] [Review][Patch] `CommonModule` importado pero no usado — Removido
- [x] [Review][Patch] `role="status"` + `aria-live="polite"` redundante — `aria-live` ahora es dinámico, único lugar
- [x] [Review][Patch] `@keyframes spin` global sin prefijo — Renombrado a `guiders-bootstrap-spin`
- [x] [Review][Patch] `tsconfig.spec.json` — `vitest/globals` y `vitest` duplicados — Descartado, es el patrón del workspace (skeleton tiene la misma estructura)
- [x] [Review][Patch] `import { IframeThemeSummary }` debería ser `import type` — Cambiado a `import type`
- [x] [Review][Patch] Test subscription a `component.retry` sin unsubscribe — `vi.useRealTimers()` en afterEach limpia timers; el subscribe se libera cuando el fixture se destruye en cada test (TestBed teardown)

#### Defer

- [x] [Review][Defer] `SkeletonBlockComponent` selector `lib-` vs `guiders-` — pre-existente en otra lib, fuera de scope
- [x] [Review][Defer] Effect re-run `startTimer` resetea `elapsed` — depende del comportamiento del parent, edge case teórico
- [x] [Review][Defer] Timer granularity 100ms vs `setTimeout` exacto — funcional, no rompe AC
- [x] [Review][Defer] README.md minimal — el spec no lo requiere explícitamente