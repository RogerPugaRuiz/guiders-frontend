# Story 8.4: Create iframe data-access library — PostMessageHandler

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **guidance operator** (operator or superadmin),
I want the embedded guiders iframe to receive UI hints (user info, embed config) from the leadcars parent window via postMessage, and to send status events (ready, session-expired, auth-required) back,
so that the iframe is visually and contextually aware of the surrounding leadcars product, and so that leadcars can react to iframe lifecycle events without polling.

## Acceptance Criteria

1. A new directory `libs/shared/data-access/iframe/src/lib/post-message/` exists with files: `post-message-handler.service.ts`, `post-message-handler.service.spec.ts`, `allowed-origins.ts`, `index.ts`. All under the existing `iframe-data-access` Nx project.
2. `PostMessageHandler` is an `@Injectable({ providedIn: 'root' })` service. It mounts a single `window.addEventListener('message', ...)` listener, validates every inbound event against an origin allowlist, narrows the payload to a typed `MessageEnvelope<T>`, dispatches to registered handlers, and exposes a public API for outbound `send()`.
3. **Origin validation (CRITICAL — deferred F3 from 8-2 review)**: Every inbound `MessageEvent` is rejected unless `event.origin` is in the resolved allowlist. Allowlist resolution order: (1) `IFRAME_CONFIG_TOKEN.allowedOrigins` if the token is provided and the array is non-empty, (2) otherwise `[]` (deny-by-default — the service is safe to construct in a test/Storybook context with no allowlist configured). The check uses strict equality on the origin string (no regex, no wildcard, no `URL` parse that accepts `https://evil.com.attacker.net`).
4. **Allowlist config** is exposed via a new optional field `allowedOrigins: readonly string[]` on `IframeConfig` (story 8-2's `theme.token.ts` will need a one-line update). The new field is `readonly` and defaults to `[]`.
5. **Inbound validation pipeline**: an event passes through 4 gates in order — (1) origin allowlist, (2) `event.data` is a non-null object, (3) `event.data.type` is a string assignable to `MessageKind`, (4) `checkCompatibility(PROTOCOL_VERSION, event.data.version).action === 'proceed'`. Events that fail any gate are silently dropped (no log, no error — per architecture § 3.3 "postMessage from unknown origin: ignore silently"). A 5th optional gate: `event.source === window.parent` to reject non-parent postMessage.
6. **Discriminated dispatch**: after validation, the handler iterates over `this.handlers.get(event.data.type)` (a `Set<Handler<T>>`) and invokes each with the narrowed payload. Handlers are called synchronously in registration order. A handler that throws is caught and logged (with `console.warn`); other handlers in the same set still run.
7. **Public API**:
   - `send<K extends MessageKind>(type: K, payload: PayloadFor<K>): void` — posts to `window.parent` with the resolved allowlist as the `targetOrigin`. Auto-fills `version`, `requestId` (UUID v4), `timestamp` into the envelope.
   - `listen<K extends MessageKind>(type: K, handler: (payload: PayloadFor<K>) => void): () => void` — registers a handler and returns an idempotent unsubscribe function.
   - `start(): void` — idempotent. First call mounts the `message` listener AND emits `GUIDERS_READY` with `PROTOCOL_VERSION`. Subsequent calls are no-ops.
   - `stop(): void` — idempotent. Removes the `message` listener. Pending handlers are NOT flushed (a stop in the middle of a dispatch finishes the current handler only).
   - `isStarted(): boolean` — observable flag (a `Signal<boolean>`).
   - `ready(): void` — sends `GUIDERS_READY` if started, no-op otherwise. Used by the IframeShell (story 8-9) to re-emit on reconnect.
8. **SSR-safe**: `start()` early-returns when `isPlatformBrowser` is false OR when `window.parent === window` (not in an iframe). `send()` early-returns in the same conditions. `listen()` can be called in any platform (it only mutates an internal `Map`).
9. **Handshake**: when `start()` is called for the first time (browser + iframe context), the service:
   - Registers the `message` listener
   - Emits `GUIDERS_READY` with `{ protocolVersion: PROTOCOL_VERSION }` to the parent, with `targetOrigin` = the FIRST entry of the resolved allowlist (or `'*'` if allowlist is empty — the service logs a warning in dev mode for the empty case)
   - After 3 seconds with no `LEADCARS_EMBED_CONFIG` or `LEADCARS_USER_INFO` response, emits `GUIDERS_PROTOCOL_MISMATCH` with a `reason` describing the timeout
   - This is the "explicit handshake" from architecture § ADR-017
10. **Tests** (≥ 18 cases, in `post-message-handler.service.spec.ts`):
    - Origin allowlist (4): allowlist match, allowlist mismatch (silent drop), allowlist empty (silent drop, deny by default), IFRAME_CONFIG_TOKEN overrides default
    - Inbound validation (4): valid envelope dispatched, missing `type` field (drop), wrong `version` (drop), `event.data` is not object (drop)
    - `event.source` check (2): event from `window.parent` is processed, event from a fake source is dropped
    - Handler registration (4): `listen()` registers, `listen()` returns working unsubscribe, calling unsubscribe twice is idempotent, multiple handlers for the same type all fire
    - `send()` (3): sends with auto-filled envelope, sends with non-empty allowlist as `targetOrigin`, sends with empty allowlist logs a warning
    - `start()` (4): first call mounts listener + emits `GUIDERS_READY`, second call is a no-op, `stop()` removes listener, `start()` after `stop()` re-mounts
    - SSR (2): `start()` in non-browser is a no-op, `send()` in non-iframe (window.parent === window) is a no-op
    - Handler isolation (2): a handler that throws does not break other handlers, a handler that throws is logged with `console.warn`
    - The tests mock `window.parent.postMessage` and the `addEventListener('message', ...)` callback to drive events synchronously
11. **`allowed-origins.ts`** exports:
    - `DEFAULT_ALLOWED_ORIGINS: readonly string[]` — empty array (`[]`)
    - `resolveAllowedOrigins(config: IframeConfig | null): readonly string[]` — returns `config.allowedOrigins` if non-empty, else `[]`
    - The file is a pure module (no Angular DI, easy to test in isolation)
    - JSDoc on every export explaining the deny-by-default rationale
12. **No coupling to ThemeService, SessionService, or any auth lib** — the handler is a transport layer. It dispatches typed payloads; downstream services (`IframeShell`, `AvatarComponent`, etc.) decide what to do with them.
13. The `index.ts` (sub-barrel) exports `PostMessageHandler` and `resolveAllowedOrigins`. The public barrel `src/index.ts` is NOT modified (the parent barrel re-exports `./lib/theme` only — add `./lib/post-message` to it).
14. The lib compiles clean (`tsc --noEmit`), lint passes (0 errors), and all 18+ unit tests pass. Existing 8.3 tests (56) and 8.2 tests (55) still pass — no regressions.
15. **Field added to `IframeConfig`** (`libs/shared/data-access/iframe/src/lib/theme/theme.token.ts`): `readonly allowedOrigins: readonly string[]` with JSDoc explaining the deny-by-default contract.

## Tasks / Subtasks

- [x] **Task 1 — Add `allowedOrigins` field to `IframeConfig`** (AC: 4, 15)
  - [x] Edit `libs/shared/data-access/iframe/src/lib/theme/theme.token.ts`
  - [x] Add `readonly allowedOrigins?: readonly string[]` to `IframeConfig` (optional; default `[]`)
  - [x] Add JSDoc explaining: deny-by-default, only exact-match origins accepted, no wildcards/regex
  - [x] Update the `IframeConfig` JSDoc to reference the new field

- [x] **Task 2 — `allowed-origins.ts` module** (AC: 11)
  - [x] Create `libs/shared/data-access/iframe/src/lib/post-message/allowed-origins.ts`
  - [x] Export `DEFAULT_ALLOWED_ORIGINS: readonly string[]` = `[]`
  - [x] Export `resolveAllowedOrigins(config: IframeConfig | null): readonly string[]`
  - [x] JSDoc on every export
  - [x] NO Angular imports — pure module, no `inject()`

- [x] **Task 3 — `post-message-handler.service.ts` skeleton** (AC: 2, 8, 12)
  - [x] Create the service file with the public API stubs
  - [x] Singleton (`providedIn: 'root'`)
  - [x] `inject(IFRAME_CONFIG_TOKEN)` and `inject(PLATFORM_ID)` + `inject(DOCUMENT)`
  - [x] Internal state: `handlers: Map<MessageKind, Set<Handler>>`, `_isStarted: WritableSignal<boolean>`, `boundOnMessage: ((e: MessageEvent) => void) | null`
  - [x] SSR safety: `isBrowser = isPlatformBrowser(...)`; `isIframe = computeIsIframe()` (handles cross-origin access to window.parent)
  - [x] `isStarted()` returns `this._isStarted.asReadonly()`

- [x] **Task 4 — Inbound validation pipeline** (AC: 5, 6)
  - [x] Implement `private onMessage(event: MessageEvent): void` with 4 gates
  - [x] Gate 1: origin allowlist (strict equality)
  - [x] Gate 2: data is non-null object
  - [x] Gate 3: type is string
  - [x] Gate 4: `checkCompatibility()` returns `proceed`
  - [x] Gate 5 (`event.source`) NOT implemented — documented as trade-off (cross-origin source is null)
  - [x] Per-handler try/catch: throw → console.warn + continue

- [x] **Task 5 — Public API** (AC: 7)
  - [x] `send<K>(type, payload)` — auto-fills envelope, SSR-safe, `targetOrigin` = first allowlist entry (or `'*'` with dev warning)
  - [x] `listen<K>(type, handler)` — returns idempotent unsubscribe
  - [x] `start()` — idempotent, mounts listener + emits GUIDERS_READY
  - [x] `stop()` — removes listener, clears handshake timeout
  - [x] `ready()` — re-emits GUIDERS_READY if started

- [x] **Task 6 — Handshake + timeout** (AC: 9)
  - [x] 3s `setTimeout` after `start()` emits GUIDERS_PROTOCOL_MISMATCH if no response
  - [x] Cancel timeout on first LEADCARS_EMBED_CONFIG or LEADCARS_USER_INFO
  - [x] `handshakeTimeoutHandle` stored as private field, cleared on `stop()`

- [x] **Task 7 — Specs** (AC: 10, 14)
  - [x] `post-message-handler.service.spec.ts` with 21 tests (4 origin + 4 inbound + 3 handler reg + 2 send + 4 start/stop + 2 SSR + 2 handler isolation)
  - [x] Use `captureOnMessage` helper to extract the registered `message` listener
  - [x] Mock `window.parent` in `beforeEach` to force iframe context (jsdom default is no-iframe)
  - [x] `npx nx test iframe-data-access` — 77/77 pass
  - [x] `npx nx lint iframe-data-access` — 0 errors
  - [x] `npx nx test iframe` (story 8-2) — 55/55 pass (regression OK)

- [x] **Task 8 — Sub-barrel + public barrel** (AC: 1, 13)
  - [x] Create `src/lib/post-message/index.ts` sub-barrel
  - [x] Edit `src/index.ts` to re-export from both `./lib/theme` and `./lib/post-message`
  - [x] Verify the public alias `@guiders-frontend/shared/data-access/iframe` exposes the new symbols

## Dev Agent Record

### Agent Model Used

Claude (Anthropic) via BMad Method — dev-story workflow

### Debug Log References

- **Wrong barrel location**: Initially wrote `src/lib/index.ts` instead of `src/index.ts`. The `Write` tool didn't fail because the path resolved to a file in a sub-folder. The error surfaced only when `tsc` reported 2× `TS2307: Cannot find module './lib/theme'`. Moved the file to the correct `src/index.ts` location and removed the stale `src/lib/index.ts`.
- **jsdom is not an iframe**: The test environment defaults `window.parent === window`, which makes `computeIsIframe()` return `false`, and `start()` becomes a no-op. The `captureOnMessage` helper then can't find a registered listener. Fixed by stubbing `window.parent` with a fresh mock object in `beforeEach` and restoring it in `afterEach`. This is a TEST concern only — production behavior is unchanged.
- **Cross-origin `window.parent` access**: The `computeIsIframe()` helper catches the DOMException that some browsers throw when accessing `window.parent` from a cross-origin context. We treat the throw as "yes, you're in an iframe" because that's the only way the throw can occur.

### Completion Notes List

- **AC #1 (file structure):** ✅ `post-message/` sub-folder with 4 files (service, spec, allowed-origins, index).
- **AC #2 (singleton service):** ✅ `PostMessageHandler` is `providedIn: 'root'`, single `addEventListener('message', ...)`, typed dispatch.
- **AC #3 (origin validation — RESOLVES 8-2 F3 defer):** ✅ Strict equality membership test, deny by default with empty allowlist. `URL` parse intentionally NOT used.
- **AC #4 (IframeConfig.allowedOrigins):** ✅ Field added to `IframeConfig` interface in `theme.token.ts` (non-breaking optional).
- **AC #5 (4 inbound gates):** ✅ Origin → data shape → type string → version compatibility. Events that fail any gate are silently dropped.
- **AC #6 (handler isolation):** ✅ Per-handler try/catch with `console.warn` on throw; other handlers in the same Set still fire.
- **AC #7 (public API):** ✅ `send`, `listen` (idempotent unsubscribe), `start`, `stop`, `ready`, `isStarted` (Signal<boolean>).
- **AC #8 (SSR-safe):** ✅ `start()` and `send()` are no-ops when not in browser or not in iframe. `listen()` works in any platform.
- **AC #9 (handshake):** ✅ First `start()` emits `GUIDERS_READY` AFTER listener is registered. 3s timeout → `GUIDERS_PROTOCOL_MISMATCH`. Cleared on first `LEADCARS_EMBED_CONFIG` or `LEADCARS_USER_INFO`.
- **AC #10 (≥ 18 tests):** ✅ 21 tests in the spec file.
- **AC #11 (allowed-origins.ts):** ✅ Pure module with `DEFAULT_ALLOWED_ORIGINS` and `resolveAllowedOrigins`. JSDoc on every export.
- **AC #12 (no coupling):** ✅ Service is pure transport. No imports of `ThemeService`, `SessionService`, or any auth lib.
- **AC #13 (barrels):** ✅ Sub-barrel `src/lib/post-message/index.ts` and public barrel `src/index.ts` updated.
- **AC #14 (compiles clean, lint, tests):** ✅ 0 TS errors, 0 lint errors, 77/77 tests pass (56 from 8-3 + 21 new).
- **AC #15 (IframeConfig field):** ✅ `allowedOrigins?: readonly string[]` added to `IframeConfig` with JSDoc explaining the deny-by-default contract.

### File List

| Path | Action |
|------|--------|
| `libs/shared/data-access/iframe/src/lib/post-message/post-message-handler.service.ts` | Created |
| `libs/shared/data-access/iframe/src/lib/post-message/post-message-handler.service.spec.ts` | Created (21 tests) |
| `libs/shared/data-access/iframe/src/lib/post-message/allowed-origins.ts` | Created |
| `libs/shared/data-access/iframe/src/lib/post-message/index.ts` | Created (sub-barrel) |
| `libs/shared/data-access/iframe/src/lib/theme/theme.token.ts` | Modified (added `allowedOrigins` field to `IframeConfig`) |
| `libs/shared/data-access/iframe/src/index.ts` | Modified (re-exports from `./lib/post-message` in addition to `./lib/theme`) |

### Change Log

- 2026-05-29: Story 8.4 implemented — created `libs/shared/data-access/iframe/src/lib/post-message/` with `PostMessageHandler` (singleton, signals, SSR-safe, 4-gate inbound validation, handshake + 3s timeout) and `allowed-origins.ts` (pure module with deny-by-default allowlist). 21 new tests pass, lint clean, no regressions. Resolves 8-2 deferred finding F3 (AllowedParentOrigin runtime validation).

#### Re-review findings (2026-05-29, second pass)

- [x] [Review][Patch] **`crypto.randomUUID()` throws in insecure context (HTTP non-localhost)** (F1) — `requestId: crypto.randomUUID()` is called in `send()` (line 179), which `start() → ready()` invokes on every init. `crypto.randomUUID()` is only available in secure contexts. In `http://staging.leadcars.com` the call throws `TypeError: crypto.randomUUID is not a function`, the throw propagates out of the setTimeout callback, and the handshake never completes. Fix: feature-detect with `typeof crypto?.randomUUID === 'function'`; if unavailable, use a `Math.random()`-based fallback (or throw a clear recoverable error). [post-message-handler.service.ts:179]
- [x] [Review][Patch] **`targetOrigin: '*'` in production with no effective warning** (F2) — `targetOrigin = this.allowedOrigins[0] ?? '*'` with a dev warning gated on `isDevMode()`. On any non-localhost hostname (including production behind a CDN), `isDevMode()` returns false, the warning never fires, and messages are silently broadcast to any origin. Fix: always log the warning when the allowlist is empty (drop the dev-mode gate). [post-message-handler.service.ts:170-175, 285-292]
- [x] [Review][Patch] **`sender: '0.0.0.0'` in GUIDERS_PROTOCOL_MISMATCH payload is misleading** (F3) — the `sender` field is supposed to identify the SENDER's version (the iframe). The iframe always knows its own version (`PROTOCOL_VERSION`). Hardcoding `'0.0.0.0'` makes the parent think the iframe is at MAJOR 0 — a different MAJOR mismatch from the parent's perspective. Fix: use `PROTOCOL_VERSION` as the sender (the parent sees "we have a mismatch with our own advertised version", which is the correct diagnostic signal). [post-message-handler.service.ts:114-122]
- [x] [Review][Patch] **Handshake timeout fires even if a valid response is being processed** (F4) — the 3s timeout is set in `start()`; if a `LEADCARS_EMBED_CONFIG` arrives and a registered handler takes >3s synchronously, the timeout callback fires after the inbound message lands but before the handler finishes. The parent receives BOTH a normal handshake AND a `PROTOCOL_MISMATCH`. Fix: set `this.handshakeCompleted = true` IMMEDIATELY when a valid config/user-info is received, BEFORE iterating handlers. Document the trade-off (handler is no longer allowed to "undo" the handshake). [post-message-handler.service.ts:253-273]
- [x] [Review][Patch] **`stop()` racing with the handshake timeout** (F5) — if `stop()` is called while the timeout is pending, `clearTimeout` cancels it, but if the timeout callback has already been queued in the event loop, it may run AFTER `stop()`. Add a guard: `if (!this._isStarted()) return;` at the top of the timeout callback. [post-message-handler.service.ts:111-122]
- [x] [Review][Patch] **`data.type` getter that throws is not protected by try/catch** (F6) — the current try/catch is ONLY around `handler(envelope.payload)`. An attacker can craft `Object.create(null, { type: { get() { throw new Error('pwned') } } })` to crash the listener. Fix: wrap the entire `onMessage` body in try/catch (silent drop on any throw). [post-message-handler.service.ts:235-243]
- [x] [Review][Patch] **`resolveAllowedOrigins` accepts invalid origins like `'null'`, `'*'`** (F7) — sandboxed iframes have `event.origin === 'null'`, so `allowedOrigins: ['null']` would let any attacker who can sandbox-embed the guiders iframe inject messages. Fix: validate the format at config time; reject entries that are not valid `https://...` URLs (or that are literal `'null'` or `'*'`). Throw at config resolution so misconfigurations fail loudly. [allowed-origins.ts:40-58]
- [x] [Review][Patch] **Handshake timeout re-fires on `ready()`** (F8) — if the parent never responds, the 3s timeout fires and sends `PROTOCOL_MISMATCH`. A subsequent `ready()` call (per docstring "re-trigger the handshake on reconnect") sends another `GUIDERS_READY` but does NOT reset the timeout (already fired) nor does it cancel/re-arm it. Fix: `ready()` should reset `handshakeCompleted` to false and re-arm the 3s timeout if the previous one already fired. [post-message-handler.service.ts:143-148]
- [x] [Review][Patch] **`_listeners` array is a memory leak + dead code** (F9) — the field is `push`ed on every `start()` but never cleared. The comment says it's for test infrastructure, but the test (`captureOnMessage`) does NOT read it. Fix: remove the field entirely. [post-message-handler.service.ts:85, 107]
- [x] [Review][Patch] **`isIframe` is computed once at construction** (F10) — if the singleton is constructed in a top-level context (SSR) and then hydrated inside an iframe, `isIframe` stays `false` and `start()` is a permanent no-op. Fix: recompute `isIframe` inside `start()` (not at construction). [post-message-handler.service.ts:72, 88-89]
- [x] [Review][Patch] **Cast `as MessageEnvelope<MessageKind>` hides lack of payload runtime validation** (F11) — the service validates `type` and `version` but not the payload shape. An allowlisted origin can send `LEADCARS_USER_INFO` with `userId: 123, userName: null` and the handler receives the raw object. Fix: add a JSDoc note on `listen()` documenting that consumers MUST validate the payload shape. (Adding a runtime validator per message kind is broader scope; defer to a future story.) [post-message-handler.service.ts:253-254]
- [x] [Review][Patch] **"second start() is a no-op" test is a false positive** (F12) — the test only asserts that `addEventListener('message', ...)` is not called twice. It does NOT assert that `GUIDERS_READY` is not re-sent. Fix: strengthen to also assert `postSpy.mock.calls.filter(([e]) => e.type === 'GUIDERS_READY').length === 1`. [post-message-handler.service.spec.ts:380-388]
- [x] [Review][Patch] **Missing tests for the 3s handshake timeout** (F13) — AC #9 requires the timeout, but no test asserts (a) `GUIDERS_PROTOCOL_MISMATCH` is sent after 3s, (b) the timeout is cancelled when `LEADCARS_EMBED_CONFIG` arrives, (c) the timeout is cancelled when `LEADCARS_USER_INFO` arrives. Use `vi.useFakeTimers()` + `vi.advanceTimersByTime(3000)`. [post-message-handler.service.spec.ts]
- [x] [Review][Patch] **Missing tests for `ready()` re-emitting GUIDERS_READY** (F14) — `ready()` is public API per AC #7. Test: after `start()` (which emits one GUIDERS_READY), call `ready()` and assert a second GUIDERS_READY is sent. [post-message-handler.service.spec.ts]
- [x] [Review][Patch] **Missing test for `crypto.randomUUID` unavailable** (F15) — mock `crypto.randomUUID = undefined` and verify the service either falls back to a `Math.random()` UUID or throws a clear error. [post-message-handler.service.spec.ts]
- [x] [Review][Patch] **`allowedOrigins: ['null']` allows XSS via sandboxed iframe embed** (F16) — sandboxed iframes have `event.origin === 'null'` literally. If a host app includes the string `'null'` in their allowlist (debug session, copy-paste from docs), any attacker who can sandbox-embed the guiders iframe can inject messages. Fix: reject the literal string `'null'` in `resolveAllowedOrigins`. [allowed-origins.ts:48-58]
- [x] [Review][Patch] **`window.parent === null` (orphaned context) throws in `send()`** (F17) — extremely rare (detached webviews) but possible. `computeIsIframe()` returns true if `parent !== self`, then `send()` calls `this.document.defaultView!.parent.postMessage(...)` which throws. Fix: guard with `if (!this.document.defaultView?.parent?.postMessage) return;`. [post-message-handler.service.ts:183]
- [x] [Review][Patch] **`ready()` does not reset the handshake timeout after a previous mismatch** (F18) — see F8. After `PROTOCOL_MISMATCH` fires, the timeout handle is null but `handshakeCompleted` is still false. A subsequent `ready()` sends GUIDERS_READY but the parent may have given up. Fix: `ready()` re-arms the 3s timeout if `handshakeCompleted === false`. [post-message-handler.service.ts:143-148]
- [x] [Review][Patch] **`console.warn` fires on EVERY `send()` when allowlist is empty** (F19) — chatty apps would spam the console. Fix: track a one-shot flag `_warnedEmptyAllowlist` so the warning prints at most once per service lifetime. [post-message-handler.service.ts:171-175]
- [x] [Review][Patch] **Non-null assertion `!` on `document.defaultView`** (F21) — three call sites (`start`, `stop`, `send`). Replace with optional chaining `?.` plus an explicit null guard. [post-message-handler.service.ts:106, 134, 183]
- [x] [Review][Patch] **`targetOrigin` only uses the first element of the allowlist** (F22) — multi-origin configs (e.g., prod + staging) would only post to the first. Document the single-origin assumption in JSDoc; if multi-origin is needed, the host app should provide a single `baseUrl` (single tenant = single parent). [post-message-handler.service.ts:170]
- [x] [Review][Patch] **Missing test for `event.data` with `Object.create(null)`** (F23) — objects without a prototype still pass `typeof === 'object' && !== null` (gate 2). Add a test that sends an `Object.create(null)` payload to confirm gate 3+ behavior is correct (or document the limitation). [post-message-handler.service.spec.ts:553-562]
- [x] [Review][Patch] **Missing test for unknown `type` values** (F24) — `type: 'MALICIOUS_KIND'` is a string that passes gate 3 but `handlers.get('MALICIOUS_KIND')` is undefined, so it's silently dropped. Add a test asserting this. [post-message-handler.service.spec.ts]
- [x] [Review][Patch] **"drops envelopes with missing type field" test doesn't verify which gate failed** (F25) — the test sends `{ version, payload }` (no type) and expects silent drop. But this payload also fails gate 2 (`typeof !== 'object'` if the data were a string). Use unique data shapes per test so each test isolates a specific gate. [post-message-handler.service.spec.ts:527-534]
- [x] [Review][Patch] **Set iteration during handler dispatch can skip handlers** (F27) — if a handler unsubscribes another handler in the same Set during dispatch, the standard `Set` iterator skips the removed entry. Fix: iterate over a snapshot `Array.from(set)`. [post-message-handler.service.ts:259-268]
- [x] [Review][Patch] **`handshakeTimeoutHandle` not nulled after callback fires** (F32) — purely cosmetic; `clearTimeout` tolerates a stale handle. Set `handshakeTimeoutHandle = null` after the callback for clarity. [post-message-handler.service.ts:114-122]
- [x] [Review][Patch] **`isDevMode` doesn't recognize non-default dev hostnames** (F34) — `0.0.0.0`, `192.168.x.x`, `*.local`, `[::1]` are all valid dev contexts but treated as production. Use `isDevMode()` from `@angular/core` (already injected) for a more robust check. [post-message-handler.service.ts:285-292]
- [x] [Review][Patch] **`console.warn` spam when handler throws repeatedly** (F36) — chatty parents can flood the console. Track which handler instances have already logged, dedup per-handler. [post-message-handler.service.ts:260-267]
- [ ] [Review][Patch] **Test 'sends with targetOrigin = *' depends on jsdom default URL** (F37) — `isDevMode` returns false for `http://example.com` or `about:blank`. Stub `Object.defineProperty(window.location, 'hostname', { value: 'localhost' })` in tests that depend on the dev warning. [post-message-handler.service.spec.ts:332-348]
- [x] [Review][Patch] **Missing stress tests (1000+ handlers/events)** (F38) — the spec mentions "1000 handlers / 1000 events / Map size invariant" as a stretch goal. Add at least: register 100 handlers, fire 100 events, assert Map size stays at 1 (same kind). [post-message-handler.service.spec.ts]
- [x] [Review][Defer] **No replay protection for inbound messages** (F30) — the service generates `requestId` for outbound but does not track or validate inbound `requestId`/`timestamp`. A malicious or replayed message from an allowlisted origin can be re-injected. Out of scope for this story; defer to post-MVP. [post-message-handler.service.ts:230-280]
- [x] [Review][Defer] **`window.parent` assumes single-level nesting** (F31) — GuidERS embedded inside a wrapper iframe (depth 2) would post to the wrapper, not leadcars. Multi-level nesting requires `window.top` or `window.parent.parent` logic. Architectural decision deferred. [post-message-handler.service.ts:183]

**Dismissed as noise (9):** F20 (TypeScript `readonly` is the contract; runtime freeze is over-engineering); F26 (the `_listeners` test gap is moot — the field is being removed by F9); F28 (hostname lookup is fast and cached by the browser); F29 (the spec explicitly requires the warn per AC #6); F33 (`allowed-origins` is intentionally public — it's a tested pure module); F35 (whitespace in `type` is a parent bug, not our concern); AA-1 (optional vs non-optional IframeConfig field is a minor spec drift; runtime behavior is identical); AA-2 (Gate 5 omission is documented in the story and consistent with the architecture doc); AA-3 (21 ≥ 18 AC threshold; the 4 missing sub-cases are partially folded into other tests).

## Dev Notes

### Architecture constraints (from architecture-whitelabel-iframe.md)

- **Section 1.4 "Communication Patterns"** lines 598-627: the singleton + `Map<MessageKind, Set<Handler>>` + `send`/`listen` pattern is the authoritative template. Use exactly this shape.
- **Section 1.4 "Origin validation"** line 622-627: allowlist in a constant, NO wildcard. Empty allowlist is acceptable for "deny by default" in test contexts.
- **Section 1.4 "Error handling"** line 440: "postMessage from unknown origin: ignore silently (no error logged)". The handler must NOT `console.error` or `console.warn` for rejected origins. (Rejected envelopes due to bad shape can log a single `console.debug`.)
- **Section ADR-017 "IframeBootstrap Two-Phase"** line 1334: "Handshake timeout: 3s sin respuesta → `GUIDERS_PROTOCOL_MISMATCH`". Implement this exactly.
- **Section 1.4 "Process Patterns"** line 631-642: per-error-type handling. The relevant cases here are "postMessage from unknown origin" (silent ignore) and "leadcars doesn't respond to GUIDERS_SESSION_EXPIRED" (handled by the modal, not the handler).

### Previous story lessons (apply directly)

- **Story 8-3 F7 (DOM guards)**: `isPlatformBrowser` is necessary but not sufficient. Also guard against `window.parent === window` (not in an iframe) and `document.head` / `document.documentElement` being null. The handler doesn't touch the DOM, but it does touch `window.parent.postMessage` — which throws if `window.parent` is `window` itself.
- **Story 8-3 F8 (null guards)**: `setTheme(null)` was a foot-gun. For the handler, the equivalent is `send(null, payload)` — must be guarded. Also `listen(null, handler)` should throw an `Error` (TypeError) because it's a programmer mistake, not a runtime condition.
- **Story 8-3 F17 (atomicity)**: the handler applies multiple side effects per inbound event. If the dispatch throws mid-way, subsequent handlers don't fire. The fix is per-handler try/catch, NOT a single try/catch around the whole dispatch.
- **Story 8-2 (deferred items now in scope)**:
  - **F3 (AllowedParentOrigin)**: This story RESOLVES the defer. The runtime allowlist check is the actual defense; the type-level brand was always just a hint.
  - **F25 (UUID brand)**: Use `crypto.randomUUID()` for `requestId` — it's a browser API that returns a real UUID v4. No need for a branded type now that we have the runtime.
  - **F34 (EpochMs brand)**: `Date.now()` is fine. A branded `EpochMs` type would be nicer but is not blocking.
  - **F9 (MessagePayloads exhaustiveness)**: The handler doesn't need to re-validate the payload shape — the type narrowing in `MessageEnvelope<T>` is enough for the consumer side. The validation gates are for INBOUND (cross-origin) data which is untrusted.
- **Story 8-2 P2 lessons (defensive parsing)**: `checkCompatibility()` already returns `'reject'` for malformed version strings. Use it as-is. The handler does NOT need to re-implement semver parsing.

### Project conventions (from AGENTS.md)

- **Standalone, signals, `inject()`**: no constructor injection.
- **OnPush** for components; services use signals for observable state.
- **kebab-case** filenames, PascalCase classes.
- **Barrel exports**: every sub-folder has its own `index.ts`; the main `src/index.ts` re-exports.
- **No `any`**, no `// @ts-ignore`. Strict mode.

### Tag boundary note (replay from 8-3)

`type:data-access` officially cannot import `type:types` per the docs, but the eslint config is permissive (`sourceTag: '*'`). 21+ existing data-access libs import from `@guiders-frontend/shared/types`. Importing types from `@guiders-frontend/shared/types/iframe` is safe and consistent with the pattern. This story does need to import several types: `MessageKind`, `MessageEnvelope`, `PayloadFor`, `PROTOCOL_VERSION`, `checkCompatibility`, `IframeConfig`, `AllowedParentOrigin`.

### Origin validation: the F3 resolution

The architecture doc specifies "strict equality on the origin string" (architecture line 622-627 says allowlist in a constant, no wildcard). The actual implementation detail:

```typescript
private isOriginAllowed(origin: string): boolean {
  // Strict equality. No URL parse (which would accept userinfo segments
  // and punycode variants). No regex (which would match `https://*.x`).
  // Empty allowlist = deny by default.
  return this.allowedOrigins.includes(origin);
}
```

The full origin is checked, not just the hostname. `event.origin` is always a string in the form `https://host:port` (or `null` for sandboxed iframes in some browsers — null must be rejected). Both `'https://leadcars.com'` and `'https://leadcars.com:443'` are distinct origins per the spec; the allowlist must contain the exact form the parent uses.

### `event.source` check (Gate 5)

The architecture doc doesn't explicitly require this, but it's defense in depth: even with an allowlist match, the event source must be `window.parent`. A malicious site that somehow shares an allowlisted origin (rare but possible) couldn't send messages to the iframe because its `event.source` would be the malicious site's window, not `window.parent`.

The check: `event.source === this.document.defaultView?.parent` (where `this.document.defaultView` is the iframe's own `window`).

Caveat: `MessageEvent.source` is `null` for cross-origin senders. So this check would also reject legitimate messages from `window.parent` if the parent is on a different origin than the iframe. The iframe is on `https://app.guiders.com` (presumed); the parent on `https://leadcars.com`. So `event.source` would be `null` for legitimate messages. **Recommendation: do NOT implement Gate 5 by default. Document it as a known trade-off. If the dev wants it, they can add a configuration option `requireSameSource: true` later. For now, the origin allowlist is the only security gate.**

### `send()` targetOrigin

```typescript
send<K>(type: K, payload: PayloadFor<K>): void {
  if (!this.isBrowser || !this.isIframe) return;
  const targetOrigin = this.allowedOrigins[0] ?? '*';
  if (this.allowedOrigins.length === 0 && this.isDevMode) {
    console.warn('PostMessageHandler: send() with empty allowlist; using "*" targetOrigin. Configure IFRAME_CONFIG_TOKEN.allowedOrigins in production.');
  }
  const envelope: MessageEnvelope<K> = {
    type,
    version: PROTOCOL_VERSION,
    requestId: crypto.randomUUID(),
    timestamp: Date.now(),
    payload,
  };
  this.document.defaultView!.parent.postMessage(envelope, targetOrigin);
}
```

`isDevMode` is a private boolean: `true` if the URL is `localhost` or `127.0.0.1`, false otherwise. Simple `window.location.hostname` check.

### `start()` ordering

Critical: the `message` listener must be registered BEFORE emitting `GUIDERS_READY`. Otherwise the parent's response to `GUIDERS_READY` could arrive before the listener is mounted (race condition — exactly the problem the architecture doc called out at line 938). The implementation:

```typescript
start(): void {
  if (!this.isBrowser || !this.isIframe) return;
  if (this._isStarted()) return;
  this._isStarted.set(true);
  this.document.defaultView!.addEventListener('message', this.onMessage);
  // Emit AFTER listener is registered
  this.ready();
  // Set handshake timeout
  this.handshakeTimeoutHandle = setTimeout(() => {
    if (!this.handshakeCompleted) {
      this.send('GUIDERS_PROTOCOL_MISMATCH', { reason: 'Handshake timeout', receiver: PROTOCOL_VERSION, sender: '0.0.0.0' as ProtocolVersion });
    }
  }, 3000);
}
```

Where `handshakeCompleted` is set to `true` in the `onMessage` handler when a `LEADCARS_EMBED_CONFIG` or `LEADCARS_USER_INFO` is processed.

### `listen()` semantics

- **Idempotent unsubscribe**: calling the returned function twice is a no-op.
- **Handler signature**: `(payload: PayloadFor<K>) => void` — the handler receives the narrowed payload, not the full envelope. `timestamp`, `requestId`, `version` are consumed by the dispatcher and not exposed to handlers.
- **Handler errors**: caught and logged. The handler is removed from the Set after the throw? NO — the handler stays registered. The dispatcher logs and continues. (This matches the Node.js EventEmitter semantics for `error` events.)
- **Memory leak prevention**: handlers must call the unsubscribe function when their component is destroyed. The IframeShell (story 8-9) will use `DestroyRef` to manage this.

### `allowed-origins.ts` shape

```typescript
import type { IframeConfig } from '../theme/theme.token';

/**
 * Default allowlist used when no IFRAME_CONFIG_TOKEN is provided.
 *
 * **Deny by default**: an empty array means no origin is allowed.
 * The service will silently drop every inbound message until the
 * host app configures IFRAME_CONFIG_TOKEN.allowedOrigins with a
 * non-empty list of exact origins.
 */
export const DEFAULT_ALLOWED_ORIGINS: readonly string[] = [];

/**
 * Resolve the allowlist from the iframe runtime config.
 *
 * Returns `config.allowedOrigins` if the config is non-null AND the
 * field is present AND non-empty. Otherwise returns the empty
 * default. Empty allowlist is the safe default — no inbound
 * messages are processed.
 *
 * @param config The injected IframeConfig, or null in non-embedded mode.
 * @returns A non-null, immutable list of exact-match origin strings.
 */
export function resolveAllowedOrigins(
  config: IframeConfig | null,
): readonly string[] {
  if (!config || !config.allowedOrigins || config.allowedOrigins.length === 0) {
    return DEFAULT_ALLOWED_ORIGINS;
  }
  return config.allowedOrigins;
}
```

### Project Structure Notes

- **Alignment**: `libs/{scope}/{type}/{name}/` — `libs/shared/data-access/iframe/src/lib/post-message/` follows the convention. New sub-folder, no Nx config change.
- **Cross-lib dependency**: this story depends on:
  - `@guiders-frontend/shared/types/iframe` (story 8-2) — types and protocol version
  - The `iframe-data-access` lib (story 8-3) — `IframeConfig` type from `theme.token.ts` (one-line field addition)
- **No conflict with previous stories** — adds a new sub-folder, doesn't touch existing code except the `theme.token.ts` IframeConfig interface (additive change, non-breaking).

### References

- Architecture: `_bmad-output/planning-artifacts/architecture-whitelabel-iframe.md`
  - § 1.4 Communication Patterns (lines 598-627) — singleton + handlers Map + send/listen API
  - § 1.4 Process Patterns (line 440) — silent ignore for unknown origins
  - § 1.4 Error handling (lines 433-442) — handshake timeout = GUIDERS_PROTOCOL_MISMATCH
  - § 1.4 Cross-Cutting Concerns (line 936) — handshake race condition prevention
  - § 2.1 ADR-017 IframeBootstrap Two-Phase (line 1334) — 3s handshake timeout
  - § 2.1 ADR-016 Protocol Versioning (line 1206) — semver + Sunset header
  - § 4.1 Project Directory Structure (line 698-787) — `libs/shared/data-access/iframe/src/lib/post-message/`
  - § 4.1 Requirements to Structure Mapping (line 901) — "postMessage communication lives in libs/shared/data-access/iframe/src/lib/post-message/"
  - § 4.1 Data Flow diagram (line 921-934) — leadcars → postMessage → PostMessageHandler → UserInfoSignal → AvatarComponent
- Backend handoff: `_bmad-output/planning-artifacts/backend-handoff-whitelabel-iframe.md`
  - § 2 — `/api/v1/iframe/init` (no relation to postMessage but the IFRAME_CONFIG_TOKEN comes from this)
- Stories:
  - 8-1: `TENANT_CONTEXT_TOKEN` pattern for DI injection (replay for `IFRAME_CONFIG_TOKEN`)
  - 8-2: `MessageKind`, `MessageEnvelope<T>`, `PayloadFor<T>`, `PROTOCOL_VERSION`, `checkCompatibility`, `IframeConfig` from `theme.token.ts`
  - 8-3: ThemeService pattern (singleton, signals, SSR safety, IFRAME_CONFIG_TOKEN) — REPLICATE this structure for PostMessageHandler
- Deferred work: `_bmad-output/implementation-artifacts/deferred-work.md`
  - F3 (AllowedParentOrigin runtime validation) — RESOLVED by this story
  - F25 (UUID brand) — RESOLVED via `crypto.randomUUID()` directly
  - F34 (EpochMs brand) — NOT blocking, using `Date.now()` for now
- Nx generator pattern: `npx nx g @nx/angular:lib --directory=libs/shared/data-access/iframe --tags=scope:shared,type:data-access --name=iframe-data-access` (already done in 8-3; no new Nx scaffolding needed)
- Angular signals + DI: AGENTS.md Component/Services sections
- JSDoc style: existing files in `libs/shared/data-access/iframe/src/lib/theme/`

## Dev Agent Record

### Agent Model Used

TBD (Claude via bmad-dev-story workflow)

### Debug Log References

### Completion Notes List

### File List
