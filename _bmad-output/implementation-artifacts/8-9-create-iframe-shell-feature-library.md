# Story 8.9: Create iframe-shell Feature Library

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **guidance operator** embedded via iframe inside leadcars,
I want to see the full Guiders interface (sidebar, header, chat) when my session is active,
so that I can perform my operator duties without leaving the leadcars application.

## Context

This story creates the `iframe-shell` feature library that orchestrates the complete iframe application. It wires together:
- **Story 8-6** (`iframe-bootstrap`): Loading state while iframe initializes
- **Story 8-3** (`ThemeService`): Applies CSS variables to documentElement from BFF theme config
- **Story 8-4** (`PostMessageHandler`): Handles `LEADCARS_EMBED_CONFIG` for feature flags and UI hints
- **Story 8-5** (`IframeInitService`): Fetches `/iframe/init` from BFF on startup
- **Story 8-8** (`iframe-slots`): `SidebarSlotComponent` and `HeaderSlotComponent` for conditional layout
- **Story 8-7** (`session-expired-modal`): Session expired modal

**Architecture context:** The shell is the **root orchestrator** (architecture-whitelabel-iframe.md §Component Boundaries line 861). It:
1. Initializes `IframeInitService.initialize()` in `APP_INITIALIZER` (story 8-10)
2. Starts `PostMessageHandler.start()` after init
3. Listens for `LEADCARS_EMBED_CONFIG` to set slot variants
4. Orchestrates the template: bootstrap → shell with slots + modal

**Important architectural note:** The shell is `scope:shared type:feature` — it can import from all types within `scope:shared`. This is intentional per the boundary rules.

## Acceptance Criteria

1. [x] **Library created**: `libs/shared/feature/iframe-shell/` with Nx generator, tags `scope:shared type:feature`, standalone component, path alias `@guiders-frontend/shared/feature/iframe-shell` added to `tsconfig.base.json`
2. [x] **IframeShellComponent** (`selector: guiders-iframe-shell`):
   - Standalone, `ChangeDetectionStrategy.OnPush`
   - Injects: `ThemeService`, `PostMessageHandler`, `IframeInitService`
   - Signal `shellState: Signal<'loading' | 'ready' | 'error'>` — drives which view renders
   - Signal `embedConfig: Signal<EmbedConfig | null>(null)` — from `LEADCARS_EMBED_CONFIG` postMessage
   - On `PostMessageHandler.start()` and `IframeInitService.initialize()` completion → `shellState` transitions to `'ready'`
   - On error → `shellState` transitions to `'error'`
3. [x] **Bootstrap integration** (AC #2):
   - When `shellState === 'loading'`: renders `<guiders-iframe-bootstrap>` with `retry` output handler
   - `IframeBootstrapComponent` state driven by: `{ kind: 'initiating' }` during init, `{ kind: 'error' }` on failure
   - Retry handler calls `IframeInitService.initialize()` again and resets `shellState`
4. [x] **Shell layout** (when `shellState === 'ready'`):
   - Renders `<guiders-sidebar-slot>` with `variant` derived from `embedConfig.features`:
     - If `chatEnabled` is absent → `variant: 'default'`
     - If `chatEnabled` is `'icon-only'` (custom, not standard in `IframeFeatureFlags`) → check `embedConfig.features` array contains `'visitorsEnabled'` → use `'icon-only'` (logic: if only chat enabled without visitors, icon-only)
     - Otherwise → `variant: 'default'`
   - `<guiders-header-slot>` with `variant` from `embedConfig.variant || 'default'` (if parent sends it, use it; otherwise default)
   - `showBackButton` is `false` for MVP (no back navigation in iframe mode)
   - `<guiders-session-expired-modal>` with:
     - `visible` bound to a `sessionExpiredVisible` signal
     - `reason` bound to `'expired'` (or derived from BFF response)
     - `loginUrl` bound to `environment.fullLoginUrl` from `@guiders-frontend/shared/config`
     - `navigateToLogin` handler: calls `PostMessageHandler.send('GUIDERS_SESSION_EXPIRED', { sessionId, reAuthCallback, timestamp })` then does `window.location.href = loginUrl`
     - `dismissed` handler: sets `sessionExpiredVisible` to `false`
5. [x] **PostMessage integration** (AC #4):
   - On `LEADCARS_EMBED_CONFIG` received: set `embedConfig` signal, apply any theme overrides from `embedConfig.primaryColor`
   - On `LEADCARS_USER_INFO` received: no-op for MVP (UI hints are optional)
   - On `LEADCARS_REAUTH_COMPLETE` with `success: true`: close modal, reset session state
6. [x] **Exports**: Component exported from `src/index.ts` as `IframeShellComponent`
7. [x] **Vitest unit tests**:
   - `shellState` starts as `'loading'`
   - `shellState` transitions to `'ready'` after init success
   - `shellState` transitions to `'error'` after init failure with non-retryable error
   - `embedConfig` is set when `LEADCARS_EMBED_CONFIG` is received
   - `sidebar-slot` receives correct `variant` based on `embedConfig.features`
   - `header-slot` receives correct `variant`
   - `retry` output calls `IframeInitService.initialize()` and resets state
   - `navigateToLogin` sends postMessage and navigates
   - `dismissed` closes the modal
   - Modal is not visible when session is active
8. [x] **Library lint**: `nx lint iframe-shell` passes with 0 errors

## Dev Notes

### Project Structure

```
libs/shared/feature/iframe-shell/
├── project.json              # tags: scope:shared, type:feature
├── src/
│   ├── index.ts              # exports IframeShellComponent
│   └── lib/
│       ├── iframe-shell.component.ts
│       ├── iframe-shell.component.scss
│       └── iframe-shell.component.spec.ts
```

**Alignment with architecture** (architecture-whitelabel-iframe.md):
- `iframe-shell` matches §Component Boundaries line 761-768
- `scope:shared type:feature` per §Service Boundaries (line 885)
- Uses `IframeBootstrapComponent` from story 8-6 (same pattern)
- Uses `SidebarSlotComponent` + `HeaderSlotComponent` from story 8-8
- Uses `SessionExpiredModalComponent` from story 8-7
- Uses `ThemeService` + `PostMessageHandler` + `IframeInitService` from data-access libs

### Dependency order for initialization

The shell does NOT handle APP_INITIALIZER itself (that's story 8-10). For MVP, the shell component's `ngOnInit` or constructor calls:
1. `IframeInitService.initialize()` → on success sets `shellState = 'ready'`
2. `PostMessageHandler.start()` → starts listening for messages
3. Listen for `LEADCARS_EMBED_CONFIG` → set `embedConfig`

### Variant derivation from embedConfig.features

The `features` array from `LEADCARS_EMBED_CONFIG` contains `keyof IframeFeatureFlags` values. For MVP:
- `sidebar-slot variant = 'icon-only'` if `embedConfig.features?.includes('visitorsEnabled') === false` (icon-only when no visitor list)
- Otherwise `variant = 'default'`
- `header-slot variant = 'leadcars'` if the parent sent a `leadcars` brand hint; otherwise `'default'`

### Theme override from embedConfig.primaryColor

If `embedConfig.primaryColor` is set (optional accent override from parent), apply it as a CSS variable `--guiders-color-accent` to the documentElement. This overrides the BFF-provided theme's accent color for the session.

### PostMessage for session expired

The `navigateToLogin` handler must:
1. Call `PostMessageHandler.send('GUIDERS_SESSION_EXPIRED', { sessionId, reAuthCallback, timestamp })` — notify parent before navigating
2. Then do `window.location.href = loginUrl` — navigate to login page

This is the hybrid flow from Decision 2: leadcars controls re-auth, iframe sends the notification first.

### References

- [Source: architecture-whitelabel-iframe.md §Component Boundaries] IframeShell orchestrator spec (lines 761-768, 830-874)
- [Source: architecture-whitelabel-iframe.md §Service Boundaries] Service dependencies (lines 876-885)
- [Source: architecture-whitelabel-iframe.md §Data Boundaries] Data flow (lines 887-894)
- [Source: architecture-whitelabel-iframe.md §App Config Integration] APP_INITIALIZER pattern (lines 1000-1020)
- [Source: libs/shared/types/iframe/src/lib/post-message.types.ts] `EmbedConfig`, `LEADCARS_EMBED_CONFIG` payload shape
- [Source: libs/shared/ui/iframe-bootstrap/] Bootstrap component pattern (story 8-6)
- [Source: libs/shared/ui/session-expired-modal/] Modal component (story 8-7)
- [Source: libs/shared/ui/iframe-slots/] Slot components (story 8-8)
- [Source: libs/shared/data-access/iframe/src/lib/post-message/post-message-handler.service.ts] `listen()`, `send()`, `start()`, `stop()` API
- [Source: libs/shared/data-access/iframe/src/lib/iframe-init/iframe-init.service.ts] `initialize()` method

## Dev Agent Record

### Agent Model Used

MiniMax-M2.7

### Debug Log References

### Completion Notes List

### File List

- libs/shared/feature/iframe-shell/project.json (new)
- libs/shared/feature/iframe-shell/tsconfig.json (new)
- libs/shared/feature/iframe-shell/tsconfig.lib.json (new)
- libs/shared/feature/iframe-shell/tsconfig.spec.json (new)
- libs/shared/feature/iframe-shell/src/index.ts (new)
- libs/shared/feature/iframe-shell/src/test-setup.ts (new)
- libs/shared/feature/iframe-shell/src/lib/iframe-shell.component.ts (new)
- libs/shared/feature/iframe-shell/src/lib/iframe-shell.component.scss (new)
- libs/shared/feature/iframe-shell/src/lib/iframe-shell.component.spec.ts (new)
- libs/shared/feature/iframe-shell/vite.config.mts (new — follow pattern from session-expired-modal)
- libs/shared/feature/iframe-shell/eslint.config.mjs (new — follow pattern from session-expired-modal)
- libs/shared/feature/iframe-shell/README.md (new — follow pattern from session-expired-modal)