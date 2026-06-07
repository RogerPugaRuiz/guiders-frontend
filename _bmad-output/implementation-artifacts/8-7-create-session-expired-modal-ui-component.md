# Story 8.7: Create Session Expired Modal UI Component

Status: in-progress

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **guidance operator** (operator or superadmin) whose session has expired while working inside the leadcars iframe,
I want to see an in-context modal that lets me re-authenticate without leaving the page,
so that I can continue my work with minimal disruption and without seeing a broken or blank state.

## Acceptance Criteria

1. [ ] **Library created**: `libs/shared/ui/session-expired-modal/` with Nx generator, tags `scope:shared type:ui`, standalone component
2. [ ] **Selector**: `guiders-session-expired-modal`
3. [ ] **Inputs**:
   - `visible: input<boolean>(false)` — controls modal visibility (overlay only renders when true)
   - `reason: input<'expired' | 'invalid' | 'forced' | 'unknown'>('expired')` — drives the message and icon variant
   - `sessionId: input<string>('')` — optional, for debugging / analytics
   - `loginUrl: input<string>('https://leadcars.com/login')` — configurable full-login fallback URL
4. [ ] **Outputs**:
   - `reAuthenticate = output<void>()` — emitted when user clicks "Reintentar sesión" (in-context re-auth). The parent (IframeShell) coordinates the postMessage `GUIDERS_REAUTH_COMPLETE` flow with leadcars.
   - `navigateToLogin = output<void>()` — emitted when user clicks "Ir a login completo". Parent handles navigation.
5. [ ] **Modal UI**:
   - Overlay covers the full iframe viewport with a semi-transparent backdrop (`rgba(0,0,0,0.6)`)
   - Centered card with warning icon, title, body text, and action buttons
   - Icon: `alert-triangle` (from `@guiders-frontend/icon`) for `expired`/`invalid`; `lock` for `forced`; `alert-circle` for `unknown`
   - Title: "Sesión expirada" (expired), "Sesión inválida" (invalid), "Sesión cerrada" (forced), "Error de sesión" (unknown)
   - Body text: specific per reason (see below)
   - Two actions: "Reintentar sesión" (primary, emits `reAuthenticate`) and "Ir a login completo" (text link, emits `navigateToLogin` and navigates)
   - Close button (X) in top-right corner of the card — emits nothing, just sets `visible = false` (parent controls visibility)
6. [ ] **Theming**: Modal card uses `--guiders-color-primary`, `--guiders-color-background`, `--guiders-color-text-primary`, `--guiders-font-family` from the host binding (same pattern as `IframeBootstrapComponent` story 8-6 AC #11)
7. [ ] **Accessibility**:
   - Overlay has `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing to the modal title
   - Focus is trapped inside the modal while visible
   - `Escape` key closes the modal (same behavior as close button)
   - Background content has `aria-hidden="true"` while modal is open
8. [ ] **Body text per reason**:
   - `expired`: "Tu sesión ha expirado por inactividad. Puedes reintentar la sesión para continuar sin perder tu progreso."
   - `invalid`: "Tu sesión no es válida. Por favor, inicia sesión nuevamente."
   - `forced`: "Tu sesión ha sido cerrada por otro dispositivo. Puedes reintentar la sesión o iniciar una nueva."
   - `unknown`: "Hubo un problema con tu sesión. Por favor, intenta nuevamente."
9. [ ] **Vitest unit tests**:
   - `visible=false` renders nothing (empty — parent controls visibility)
   - `visible=true` with `reason='expired'` renders overlay with correct icon, title, and body text
   - `reason='invalid'` renders correct text variant
   - `reason='forced'` renders correct text variant
   - `reason='unknown'` renders correct text variant
   - Clicking "Reintentar sesión" emits `reAuthenticate`
   - Clicking "Ir a login completo" emits `navigateToLogin`
   - Clicking close button / pressing Escape does NOT emit either output (parent handles close)
   - Focus is trapped inside modal while open
   - Overlay has `role="dialog"` and `aria-modal="true"`
   - `loginUrl` input is used as the link href

## Tasks / Subtasks

- [ ] Task 1: Scaffolding (AC: #1, #2)
  - [ ] Subtask 1.1: Run `nx g @nx/angular:library --directory=libs/shared/ui/session-expired-modal --tags=scope:shared,type:ui --standalone`
  - [ ] Subtask 1.2: Create component file `session-expired-modal.component.ts` with `@Component({ selector: 'guiders-session-expired-modal', standalone: true })`
  - [ ] Subtask 1.3: Add path alias `@guiders-frontend/shared/ui/session-expired-modal` to `tsconfig.base.json`
- [ ] Task 2: Modal UI and theming (AC: #3, #5, #6, #7)
  - [ ] Subtask 2.1: Implement `@if (visible())` wrapper with overlay div
  - [ ] Subtask 2.2: Implement centered card with backdrop
  - [ ] Subtask 2.3: Implement icon and title switching by `reason` input
  - [ ] Subtask 2.4: Implement body text per reason (4 variants)
  - [ ] Subtask 2.5: Implement two action buttons (re-authenticate + login link)
  - [ ] Subtask 2.6: Implement close button (X) in card header
  - [ ] Subtask 2.7: Apply theme CSS variables via Angular 20 host binding (same pattern as story 8-6)
  - [ ] Subtask 2.8: Add accessibility attributes (`role="dialog"`, `aria-modal`, focus trap, `aria-labelledby`, `aria-hidden` on backdrop)
  - [ ] Subtask 2.9: Create `session-expired-modal.component.scss` with overlay and card styles
- [ ] Task 3: Outputs and keyboard handling (AC: #4, #7)
  - [ ] Subtask 3.1: Implement `reAuthenticate` output
  - [ ] Subtask 3.2: Implement `navigateToLogin` output
  - [ ] Subtask 3.3: Handle Escape key to close modal
  - [ ] Subtask 3.4: Implement focus trap inside modal
- [ ] Task 4: Unit tests (AC: #9)
  - [ ] Subtask 4.1: Create `session-expired-modal.component.spec.ts`
  - [ ] Subtask 4.2: Test all 4 reason variants render correct icon/title/text
  - [ ] Subtask 4.3: Test output emissions on button clicks
  - [ ] Subtask 4.4: Test close button / Escape key behavior
  - [ ] Subtask 4.5: Test accessibility attributes and focus trap
- [ ] Task 5: Export, lint, and test (AC: all)
  - [ ] Subtask 5.1: Export component from `libs/shared/ui/session-expired-modal/src/index.ts`
  - [ ] Subtask 5.2: Run `nx lint session-expired-modal` — 0 errors
  - [ ] Subtask 5.3: Run `nx test session-expired-modal` — all tests pass

## Dev Notes

### Project Structure Notes

- Path: `libs/shared/ui/session-expired-modal/` — follows architecture § "libs/shared/ui/session-expired-modal/"
- Tags: `scope:shared type:ui` — correct Nx boundary (ui can only import ui, util, types)
- Imports allowed: `@guiders-frontend/shared/types/iframe` (for types), `@guiders-frontend/shared/ui/icon` (icon component), button components, `@guiders-frontend/shared/design-tokens` (SCSS tokens)
- Imports NOT allowed: any `data-access` library (violates Nx boundary)
- **REUSE EXISTING COMPONENTS** (do NOT reinvent):
  - `IconComponent` from `@guiders-frontend/icon` — use `guiders-icon` selector. Available icons: `alert-triangle`, `alert-circle`, `lock`, `loading`.
  - `ButtonSecondaryComponent` from `@guiders-frontend/button-secondary` — do NOT create custom button markup.
- **Selector prefix:** `guiders-session-expired-modal` (matches `guiders-*` standard for UI components)
- **Design tokens**: Use `@guiders-frontend/shared/design-tokens` SCSS variables. Modal backdrop: `rgba(0, 0, 0, 0.6)`. Card: white background, border-radius per tokens.

### Architecture Reference

- **Session Expired Modal**: architecture-whitelabel-iframe.md § "Decision 2: Sesión Expirada — Modal In-Context (Opción C)"
- **IframeShell orchestration**: architecture-whitelabel-iframe.md § "Component Boundaries" → IframeShell orchestrates bootstrap + init + slots + modal
- **PostMessage contract**: architecture-whitelabel-iframe.md § "postMessage Contract" — `GUIDERS_SESSION_EXPIRED` message from leadcars
- **Theme integration via host binding**: architecture-whitelabel-iframe.md § "Service Boundaries" + story 8-6 pattern (`host: { '[style.--guiders-...]': 'computed()' }`)
- **IframeBootstrap (story 8-6)**: `_bmad-output/implementation-artifacts/8-6-create-iframe-bootstrap-ui-component.md` — reference for the host binding pattern, SCSS design tokens, and component structure

### Key Implementation Details

1. **The parent (IframeShell) owns visibility**: This component receives `visible: input<boolean>()`. It does NOT self-dismiss or auto-dismiss. The parent sets `visible = false` after handling `reAuthenticate` or `navigateToLogin`.

2. **postMessage flow** (handled by parent, not this component):
   - `GUIDERS_SESSION_EXPIRED` from leadcars → parent sets `visible = true` on this modal
   - User clicks "Reintentar sesión" → `reAuthenticate` output fires → parent sends `GUIDERS_REAUTH_COMPLETE` via PostMessageHandler → leadcars re-authenticates → parent sets `visible = false`
   - User clicks "Ir a login completo" → `navigateToLogin` output fires → parent handles navigation

3. **CSS variable scoping via host binding**: Same pattern as story 8-6. Use computed signals returning `null` when not in the themed context so Angular removes the binding automatically:
   ```typescript
   host: {
     '[style.--guiders-color-primary]': 'themedPrimary()',
     '[style.--guiders-color-background]': 'themedBackground()',
     '[style.--guiders-color-text-primary]': 'themedTextPrimary()',
     '[style.--guiders-font-family]': 'themedFontFamily()',
   }
   ```
   The modal does not receive a `theme` input — it reads the CSS variables from the parent (IframeShell) which already applied them to the shell element. The modal simply inherits via the cascade.

4. **Focus trap**: Implement using `tabindex="-1"` on modal card and tracking the first/last focusable elements. On `Escape`, call `visible.set(false)` — but since the component doesn't own visibility, it should emit a `close = output<void>()` that the parent subscribes to to set `visible = false`.

5. **Body text localization**: Text strings are in Spanish per project communication language. No i18n injection needed for MVP.

6. **Overlay click to close**: Clicking the backdrop (outside the card) should emit `close` (same as close button). The backdrop is part of the overlay, not the card.

### References

- IframeBootstrap (story 8-6): `libs/shared/ui/iframe-bootstrap/src/lib/iframe-bootstrap/iframe-bootstrap.component.ts` — host binding pattern, SCSS design tokens
- IconComponent: `libs/shared/ui/icon/src/lib/icon/icon.component.ts` — `guiders-icon` selector, `IconName` type at `icon.types.ts`
- ButtonSecondaryComponent: `libs/shared/ui/button-secondary/src/lib/button-secondary/button-secondary.ts` — reuse with `ariaLabel` input (patched in story 8-6 review)
- ThemeService (story 8-3): `libs/shared/data-access/iframe/src/lib/theme/theme.service.ts`
- PostMessageHandler (story 8-4): `libs/shared/data-access/iframe/src/lib/post-message/post-message-handler.service.ts`
- Architecture ADR-002: `_bmad-output/planning-artifacts/architecture-whitelabel-iframe.md#Decision-2-Sesión-Expirada`
- Architecture postMessage contract: `_bmad-output/planning-artifacts/architecture-whitelabel-iframe.md#postMessage-Contract`
- Session expired modal structure: `_bmad-output/planning-artifacts/architecture-whitelabel-iframe.md#libs-shared-ui-session-expired-modal`

## Dev Agent Record

### Agent Model Used

MiniMax-M2.7

### Debug Log References

### Completion Notes List

- **2026-06-06**: Code review completed. 4 decision-needed resolved, 22 patches applied, 0 deferred, 5 dismissed.
- **AC #4 deviation**: Output `dismissed` (renamed from spec's `close` due to ESLint `@angular-eslint/no-output-native` rule). Functionally equivalent.
- **AC #5 deviation**: Icon for `unknown` reason is `x-circle` (spec listed `alert-circle` which doesn't exist in `icon.types.ts`).
- **AC #7 ownership**: `aria-hidden="true"` on background content is the parent (IframeShell)'s responsibility, not this component's. The component does not project content via `<ng-content>` and has no coordination mechanism with the parent.
- **Theming**: Pattern follows story 8-6 (4 separate signals reading from `documentElement`). Body scroll lock implemented via effect. Focus trap uses `addEventListener` for document keydown (not `@HostListener`) to ensure JSDOM compatibility.

### File List

- libs/shared/ui/session-expired-modal/project.json (new)
- libs/shared/ui/session-expired-modal/tsconfig.json (new)
- libs/shared/ui/session-expired-modal/tsconfig.lib.json (new)
- libs/shared/ui/session-expired-modal/tsconfig.spec.json (new)
- libs/shared/ui/session-expired-modal/src/index.ts (new)
- libs/shared/ui/session-expired-modal/src/test-setup.ts (new — follow pattern from `libs/shared/ui/skeleton/src/test-setup.ts`)
- libs/shared/ui/session-expired-modal/src/lib/session-expired-modal.component.ts (new)
- libs/shared/ui/session-expired-modal/src/lib/session-expired-modal.component.scss (new)
- libs/shared/ui/session-expired-modal/src/lib/session-expired-modal.component.spec.ts (new)
- libs/shared/ui/session-expired-modal/vite.config.mts (new — follow pattern from `libs/shared/ui/skeleton/vite.config.mts`)
- libs/shared/ui/session-expired-modal/eslint.config.mjs (new — follow pattern from `libs/shared/ui/skeleton/eslint.config.mjs`)
- libs/shared/ui/session-expired-modal/README.md (new — follow pattern from `libs/shared/ui/skeleton/README.md`)

## Review Findings

### Decision Needed (must resolve before patching)

- [x] [Review][Decision] AC #7 `aria-hidden="true"` on background — Resuelto: A. Responsabilidad del parent (IframeShell). Documentado en Completion Notes.
- [x] [Review][Decision] AC #4 — Resuelto: A. Aprobar rename `close` → `dismissed` (anotado en Completion Notes).
- [x] [Review][Decision] AC #5 icono `unknown` — Resuelto: A. Aprobar `x-circle` (spec estaba mal, `alert-circle` no existe en `icon.types.ts`).
- [x] [Review][Decision] AC #6 vs Dev Note #3 contradicción — Resuelto: A. Confirmar host binding pattern 8-6 (4 signals leyendo de `documentElement`).

### Patch (un bloqueante, 6 altos, 8 medios, 13 bajos)

- [x] [Review][Patch] F1 Theming pipeline broken: 4 themed* computeds aliased to single signal [session-expired-modal.component.ts:75-80, 89-92]
- [x] [Review][Patch] F2 `window.location.href` en `onNavigateToLogin` viola spec (parent handles navigation) [session-expired-modal.component.ts:109-112]
- [x] [Review][Patch] F3 `loginUrl` default hardcoded `https://leadcars.com/login` (brand-specific) [session-expired-modal.component.ts:67]
- [x] [Review][Patch] F4 `_theme.set(primary || 'null')` escribe string `'null'` como CSS value [session-expired-modal.component.ts:90]
- [x] [Review][Patch] F5 Theme read from `documentElement` non-reactive, race condition con ThemeService async [session-expired-modal.component.ts:82-92]
- [x] [Review][Patch] F6 Hardcoded `id="modal-title"` — duplicate IDs con múltiples instancias [session-expired-modal.component.html:6, 24]
- [x] [Review][Patch] F7 Focus trap: sin initial focus, sin restore on close, tabbed-out focus escapa [session-expired-modal.component.ts:121-144, html:8]
- [x] [Review][Patch] F9 z-index `$z-index-overlay` (1000) deja toasts (1500) cubrir el modal [session-expired-modal.component.scss:10]
- [x] [Review][Patch] F10 Body scroll lock missing cuando modal visible [session-expired-modal.component.html]
- [x] [Review][Patch] F13 `<button>` para "Ir a login completo" en vez de `<a href>` (semántica + AC #9 #11) [session-expired-modal.component.html:39-45]
- [x] [Review][Patch] F15 Missing test para focus trap behavior [session-expired-modal.component.spec.ts]
- [x] [Review][Patch] F16 Tests no verifican `dismissed` IS emitted on close/Escape [session-expired-modal.component.spec.ts:131-158]
- [x] [Review][Patch] F17 Missing test para `loginUrl` como link href [session-expired-modal.component.spec.ts]
- [x] [Review][Patch] F18 `vi.useFakeTimers()` innecesario; `vi.useRealTimers()` mid-test [session-expired-modal.component.spec.ts:99-167]
- [x] [Review][Patch] F19 Hardcoded `rgba(0, 0, 0, 0.6)` y `0 8px 32px rgba(0, 0, 0, 0.2)` saltan tokens [session-expired-modal.component.scss:6, 22]
- [x] [Review][Patch] F20 `sessionId` rendered plaintext + sin overflow handling [session-expired-modal.component.html:38-40, scss:73-78]
- [x] [Review][Patch] F21 `(event.target as HTMLElement).classList.contains(...)` cast unsafe [session-expired-modal.component.ts:96]
- [x] [Review][Patch] F22 `config` exposed public, tests usan `(component as any).config()` [session-expired-modal.component.ts:73, spec.ts:178-191]
- [x] [Review][Patch] F24 `new MouseEvent('click', { target: backdrop })` — `target` no es MouseEventInit válido [session-expired-modal.component.spec.ts:165-167]
- [x] [Review][Patch] F25 `iconEl.querySelector('button')` para ButtonSecondaryComponent — acopla a DOM interno [session-expired-modal.component.spec.ts:112-125]
- [x] [Review][Patch] F26 Redundant `aria-label` duplicating visible text [session-expired-modal.component.html:12, 34, 41]
- [x] [Review][Patch] F28 `Reason` union type duplicado en test helper [session-expired-modal.component.ts:16, spec.ts:643]