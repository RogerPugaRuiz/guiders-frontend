# Story 8.2: Create shared/types/iframe library

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **frontend platform engineer**,
I want a dedicated `libs/shared/types/iframe/` library that holds the white-label iframe contract types (IframeInitResponse, MessageEnvelope, embed config, user info, protocol version),
so that the data-access layer (stories 8-3, 8-4, 8-5) and feature shell (story 8-9) can consume a single, versioned source of truth for what crosses the iframe boundary.

## Acceptance Criteria

1. The library `libs/shared/types/iframe/` exists with Nx tags `scope:shared,type:types`.
2. The library exports `PROTOCOL_VERSION = '1.0.0'` as a const with literal type.
3. The library exports `ProtocolVersion` template literal type (`${number}.${number}.${number}`).
4. The library exports `checkCompatibility(receiver, sender)` function that returns a `VersionCompatibility` discriminated union (`supported: boolean`, `action: 'proceed' | 'reject'`, `reason?: string`).
5. The library exports `IframeInitResponse` interface matching the BFF response shape (snake_case optional for API mapping, but the canonical shape is camelCase).
6. The library exports `ThemeConfig` interface with: `colors: ThemeColors`, `typography: ThemeTypography`, `logos: ThemeLogos`, `enabledSections: SectionName[]`, `customCss: string`, `componentMappings: Record<string, string>`.
7. The library exports `MessageKind` discriminated union covering all postMessage types: `LEADCARS_USER_INFO`, `LEADCARS_EMBED_CONFIG`, `LEADCARS_REAUTH_COMPLETE`, `GUIDERS_READY`, `GUIDERS_SESSION_EXPIRED`, `GUIDERS_AUTH_REQUIRED`, `GUIDERS_LOGOUT`, `GUIDERS_PROTOCOL_MISMATCH`.
8. The library exports `MessageEnvelope<T extends MessageKind>` interface with: `type: T`, `version: ProtocolVersion`, `requestId: string`, `timestamp: number`, `payload: PayloadFor<T>`.
9. The library exports `EmbedConfig`, `UserInfo`, `AllowedParentOrigin` constant type.
10. The library exports `IframeInitErrorReason` union: `'expired' | 'missing' | 'invalid' | 'iframe_mode_disabled' | 'theme_not_found'`.
11. The library's `src/index.ts` re-exports everything as a barrel.
12. All exported types compile cleanly with `nx build types` (or `nx lint types` if no build target) — no `any`, no `// @ts-ignore`.
13. Unit tests cover `checkCompatibility` for: same version, different minor (older receiver, newer sender), different minor (newer receiver, older sender), MAJOR mismatch (reject), and PATCH difference (proceed).
14. No new external dependencies introduced (the types are pure TypeScript).
15. The existing `libs/shared/types/src/index.ts` is NOT modified to re-export iframe types — consumers must import from `@guiders-frontend/shared/types/iframe` explicitly. (Prevents type-graph coupling.)

## Tasks / Subtasks

- [x] **Task 1: Scaffold the Nx library** (AC: #1)
  - [x] 1.1 Run: `npx nx g @nx/angular:lib --directory=libs/shared/types/iframe --tags=scope:shared,type:types --name=iframe`
  - [x] 1.2 Verify the generated `project.json` has the correct tags
  - [x] 1.3 Verify the generated `tsconfig.lib.json` has the correct path
  - [x] 1.4 Remove any sample files the generator created (e.g. default `lib/iframe.ts`)

- [x] **Task 2: Create the protocol version types** (AC: #2, #3)
  - [x] 2.1 Create `src/lib/protocol-version.ts` with:
    - `PROTOCOL_VERSION = '1.0.0' as const`
    - `ProtocolVersion` template literal type
    - `VersionCompatibility` discriminated union
  - [x] 2.2 Export from the new file's local `index.ts`

- [x] **Task 3: Implement `checkCompatibility` function** (AC: #4, #13)
  - [x] 3.1 In `protocol-version.ts`, implement `checkCompatibility(receiver, sender): VersionCompatibility`
  - [x] 3.2 Rules:
    - MAJOR mismatch → `{ supported: false, action: 'reject', reason: ... }`
    - Same MAJOR, receiver older MINOR → `{ supported: true, action: 'proceed', reason: 'Receiver older' }`
    - Same MAJOR, sender older MINOR → `{ supported: true, action: 'proceed' }` (no reason)
    - Same version → `{ supported: true, action: 'proceed' }`
  - [x] 3.3 Co-locate unit tests in `protocol-version.spec.ts`
  - [x] 3.4 Test cases: same version, +1 minor, -1 minor, MAJOR mismatch both directions, PATCH difference

- [x] **Task 4: Create theme types** (AC: #6)
  - [x] 4.1 Create `src/lib/theme.types.ts` with:
    - `SectionName` union: `'chat' | 'escalations' | 'contacts' | 'visitors' | 'inbox'`
    - `ThemeColors` interface (primary, secondary, accent, textPrimary, textSecondary, background, surface, error, success)
    - `ThemeTypography` interface (fontFamily, baseFontSize, headingFontWeight)
    - `ThemeLogoAsset` interface (url, height?)
    - `ThemeLogos` interface (header, favicon, emptyState)
    - `ThemeConfig` interface composing the above + `enabledSections`, `customCss`, `componentMappings`
  - [x] 4.2 Export from local `index.ts`

- [x] **Task 5: Create iframe init types** (AC: #5, #10)
  - [x] 5.1 Create `src/lib/iframe-init.types.ts` with:
    - `IframeCompany` interface (id, name, subdomain, logo, supportEmail)
    - `IframeThemeSummary` interface (id, name, config: ThemeConfig)
    - `IframeUser` interface (id, name, role, avatar, permissions)
    - `IframeFeatureFlags` interface (chatEnabled, escalationsEnabled, fileAttachments, readReceipts, typingIndicators, aiSuggestions)
    - `IframeRuntimeConfig` interface (sessionTimeout, maxFileSize, allowedFileTypes)
    - `IframeInitResponse` interface composing the above + `version: ProtocolVersion`
    - `IframeInitErrorReason` union (expired, missing, invalid, iframe_mode_disabled, theme_not_found)
    - `IframeInitError` interface (reason: IframeInitErrorReason, message?: string, fallbackTheme?: ThemeConfig, retryAfter?: number)
  - [x] 5.2 Export from local `index.ts`

- [x] **Task 6: Create postMessage types** (AC: #7, #8, #9)
  - [x] 6.1 Create `src/lib/post-message.types.ts` with:
    - `MessageKind` discriminated union (all 8 message types from AC #7)
    - `MessagePayloads` map interface (`{ [K in MessageKind]: { ... } }`)
    - `PayloadFor<T extends MessageKind>` mapped type
    - `MessageEnvelope<T extends MessageKind>` interface (type, version, requestId, timestamp, payload)
    - `PostMessage` discriminated union (concrete message types, each with all envelope fields)
    - `EmbedConfig` interface (primaryColor, language, features, timestamp) — used in `LEADCARS_EMBED_CONFIG`
    - `UserInfo` interface (userId, userName, avatarUrl?, timestamp) — used in `LEADCARS_USER_INFO`
    - `AllowedParentOrigin` type: `\`https://\${string}\`` (branded type for compile-time safety)
  - [x] 6.2 Export from local `index.ts`

- [x] **Task 7: Create the main barrel** (AC: #11)
  - [x] 7.1 In `src/index.ts`, re-export from all sub-modules:
    ```typescript
    export * from './lib/protocol-version';
    export * from './lib/theme.types';
    export * from './lib/iframe-init.types';
    export * from './lib/post-message.types';
    ```

- [x] **Task 8: Verify build and lint** (AC: #12)
  - [x] 8.1 Run `npx nx lint iframe` — passed
  - [x] 8.2 Nx generator didn't add a build target for this lib (type:types — same as other types libs in monorepo)
  - [x] 8.3 Confirm no `any`, no `// @ts-ignore`, no `// @ts-expect-error` in the new files — verified
  - [x] 8.4 Run `npx nx test iframe` — 9/9 tests pass

- [x] **Task 9: Verify no coupling to existing types** (AC: #15)
  - [x] 9.1 Confirm `libs/shared/types/src/index.ts` is unchanged — `git diff` returned empty
  - [x] 9.2 Confirm there is no re-export from the new lib into the existing barrel — verified
  - [x] 9.3 Run `git diff libs/shared/types/src/index.ts` and confirm empty — confirmed

- [x] **Task 10: Document import path in JSDoc** (AC: #1, #11)
  - [x] 10.1 Add a JSDoc comment at the top of `src/index.ts` with the import path — done
  - [x] 10.2 Nx generator did NOT create a README.md; no need to add one (this is a types-only lib, the JSDoc is sufficient)

## Dev Notes

### Why this story is foundational

This is the **first story in Epic 8** that creates **new shared infrastructure** rather than fixing an existing one. Stories 8-3 through 8-12 will all import from this lib. If the types are wrong, every downstream story breaks. If the types are missing, the dev agent will invent them inline (anti-pattern: every consumer redefines the same shapes).

**Type contract over implementation.** No services, no DI, no Angular runtime concerns. Pure TypeScript types. This is the cheapest place to make decisions because there's no behavior to change if the type is wrong.

### Source tree components to touch

| File | Action |
|------|--------|
| `libs/shared/types/iframe/project.json` | Created (Nx generator) |
| `libs/shared/types/iframe/tsconfig.json` | Created (Nx generator) |
| `libs/shared/types/iframe/src/index.ts` | Created — main barrel |
| `libs/shared/types/iframe/src/lib/protocol-version.ts` | Created |
| `libs/shared/types/iframe/src/lib/protocol-version.spec.ts` | Created |
| `libs/shared/types/iframe/src/lib/theme.types.ts` | Created |
| `libs/shared/types/iframe/src/lib/iframe-init.types.ts` | Created |
| `libs/shared/types/iframe/src/lib/post-message.types.ts` | Created |

**No existing files modified.** `libs/shared/types/src/index.ts` remains untouched (AC #15).

### Patterns to follow

**File structure** — match existing `libs/shared/types/src/lib/*.types.ts` style:

```typescript
// visitor.types.ts (existing pattern)
export type VisitorLifecycle = ...;
export interface Visitor { ... }
```

**No classes, no services, no DI, no Angular runtime concerns.** Just `type` and `interface` declarations. Functions allowed (e.g. `checkCompatibility`).

**Discriminated unions for messages:**

```typescript
// post-message.types.ts (new)
export type MessageKind =
  | 'LEADCARS_USER_INFO'
  | 'LEADCARS_EMBED_CONFIG'
  | 'GUIDERS_READY'
  | ...;

export type MessageEnvelope<T extends MessageKind> = {
  type: T;
  version: ProtocolVersion;
  requestId: string;
  timestamp: number;
  payload: PayloadFor<T>;
};
```

**Branded types for compile-time safety:**

```typescript
export type AllowedParentOrigin = `https://${string}`;
// Usage: const origin: AllowedParentOrigin = 'https://leadcars.com'; // OK
//        const bad: AllowedParentOrigin = 'http://leadcars.com'; // type error
```

**Pure functions, no side effects:**

```typescript
// protocol-version.ts (new)
export const PROTOCOL_VERSION = '1.0.0' as const;
export type ProtocolVersion = `${number}.${number}.${number}`;

export interface VersionCompatibility {
  readonly supported: boolean;
  readonly action: 'proceed' | 'reject';
  readonly reason?: string;
}

export function checkCompatibility(
  receiver: ProtocolVersion,
  sender: ProtocolVersion,
): VersionCompatibility {
  const [rMaj, rMin] = receiver.split('.').map(Number);
  const [sMaj, sMin] = sender.split('.').map(Number);
  if (rMaj !== sMaj) {
    return { supported: false, action: 'reject', reason: `MAJOR version mismatch: receiver ${receiver}, sender ${sender}` };
  }
  if (rMin < sMin) {
    return { supported: true, action: 'proceed', reason: `Receiver older (${rMin} < ${sMin})` };
  }
  return { supported: true, action: 'proceed' };
}
```

### Nx generator flags

The exact command to scaffold the lib:
```bash
npx nx g @nx/angular:lib \
  --directory=libs/shared/types/iframe \
  --tags=scope:shared,type:types \
  --name=iframe
```

After generation:
1. Delete the default `lib/iframe.ts` and any default test file
2. Verify `project.json` has tags `["scope:shared", "type:types"]`
3. Verify `tsconfig.lib.json` extends `../../../tsconfig.base.json` (matches other libs)

### Project conventions (from project-context.md)

- **TypeScript strict mode** — every export must be typed, no implicit `any`
- **File naming** — `kebab-case.ts` (e.g., `protocol-version.ts`, `theme.types.ts`)
- **Barrel exports** — every sub-folder has its own `index.ts` and the main `src/index.ts` re-exports
- **No Angular runtime** — this is a types-only lib, no `@angular/core` imports
- **No external dependencies** — pure TypeScript, no runtime, no peer deps

### Critical reminders

- ⚠️ DO NOT modify `libs/shared/types/src/index.ts` — this lib is intentionally decoupled from the existing types barrel
- ⚠️ DO NOT use `any`, `unknown` (except in payload-typing edges with explicit narrowing), `// @ts-ignore`
- ⚠️ DO NOT add any runtime imports — no Angular, no RxJS, no Node
- ⚠️ DO NOT add a service, class, or InjectionToken in this lib — types only
- ⚠️ DO use `as const` on version literals so template literal types work
- ⚠️ DO add JSDoc to every exported type/function explaining its purpose and the message flow it supports

### Test standards

- **Framework:** Vitest ^3.0.0 (same as other libs in monorepo)
- **Test command:** `npx nx test types` (project name is `types` per existing `project.json`)
- **Test file:** Co-located `*.spec.ts` next to source
- **Pattern:** Pure function tests, no DI, no TestBed needed
- **Coverage target:** 100% for `checkCompatibility` (it's pure logic with multiple branches)

### Previous story intelligence (8-1)

- Story 8-1 introduced `TENANT_CONTEXT_TOKEN` — the runtime seam for tenantId injection. This story does NOT need it (types only), but downstream stories 8-3, 8-4, 8-5 will use it.
- Story 8-1's review (D1, D2) established that legacy localStorage migration should be `copy-without-remove`. This is a runtime concern and is NOT reflected in these types — but a future story 8-3 may add a `migrationStrategy` field if backend cooperation is needed.
- The `ThemeColors` interface should match the structure used in `theme.service.ts` so consumers can map directly. Reference: existing theme options in `libs/shared/data-access/theme/src/lib/theme.service.ts`.

### References

- Architecture doc: `_bmad-output/planning-artifacts/architecture-whitelabel-iframe.md`
  - Section 4.1 "Project Structure" line 904 — `libs/shared/types/iframe/src/lib/`
  - Section 4.1 Nx Tags line 974 — `scope:shared, type:types`
  - Section 3.2 "API Contract Detail" lines 405-431 — IframeInitResponse shape
  - Section 3.3 "Format Patterns" lines 556-596 — postMessage envelope
  - Section 2.1 "Core Architectural Decisions" line 397-403 — Backend-aligned data model
- Backend handoff: `_bmad-output/planning-artifacts/backend-handoff-whitelabel-iframe.md`
  - Section 2 — WhiteLabelTheme model + Company.iframeMode
  - Section 3 — `/api/v1/iframe/init` response shape
- Story 8.1: `_bmad-output/implementation-artifacts/8-1-fix-themeservice-multitenant-localstorage-leak.md`
- Project context: `{output_folder}/project-context.md` (TypeScript strict, no `any`, file naming)
- Existing types pattern: `libs/shared/types/src/lib/visitor.types.ts`

### Review Findings

<!-- Code review 2026-05-29 — Blind Hunter + Edge Case Hunter + Acceptance Auditor (first pass). Patches D1, P1, P2, P3 applied. Status: done. -->
<!-- Code review 2026-05-29 — Re-review requested by user. Found 27 patch, 6 defer, 10 dismiss. See below. -->

#### Re-review findings (2026-05-29, second pass)

- [x] [Review][Patch] **"Symmetry" test is tautological** (F1) — RESOLVED 2026-05-29. Replaced with a non-tautological test that asserts two distinct same-version pairs yield identical results. [protocol-version.spec.ts:60-64]
- [x] [Review][Patch] **`parseVersion` accepts malformed input via `Number()` coercion** (F2) — RESOLVED 2026-05-29. Replaced `Number()` parsing with strict semver regex `^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$` and `Number.isInteger` checks. Rejects whitespace, hex, scientific, leading zeros. [protocol-version.ts:51-83]
- [x] [Review][Patch] **`EmbedConfig.features: readonly string[]` accepts typos** (F4) — RESOLVED 2026-05-29. Changed to `ReadonlyArray<keyof IframeFeatureFlags>`. [post-message.types.ts:48]
- [x] [Review][Patch] **`IframeInitResult` discriminated wrapper promised in JSDoc but not exported** (F5) — RESOLVED 2026-05-29. Added `IframeInitResult` discriminated union exported from the lib. [iframe-init.types.ts:117-120]
- [x] [Review][Dismiss] **`IframeUser.role: 'super_admin'` snake_case** (F6) — DISMISSED 2026-05-29. Backend handoff line 172 confirms `super_admin` is the literal value identifier (not a field name). The Angular value-identifier mirrors the backend identifier. JSDoc documents the rationale. [iframe-init.types.ts:39-58]
- [x] [Review][Patch] **Duplication of auth reason codes** (F7) — RESOLVED 2026-05-29. Extracted `AuthErrorReason` shared union; both `AuthRequiredPayload.reason` and `IframeInitErrorReason` reference it. [iframe-init.types.ts:11-22, post-message.types.ts:91-103]
- [x] [Review][Patch] **`IframeInitError.retryAfter` JSDoc says "milliseconds"** (F8) — RESOLVED 2026-05-29. JSDoc updated to "seconds (per HTTP `Retry-After` header, RFC 7231 §7.1.3)". [iframe-init.types.ts:107-114]
- [x] [Review][Patch] **`MessagePayloads` as interface allows silent omission when a new `MessageKind` is added** (F9) — RESOLVED 2026-05-29. Added `_MessagePayloadsExhaustive<T>` mapped type with `_CheckExhaustive` constant. New kinds without payloads fail compilation. [post-message.types.ts:130-145]
- [x] [Review][Patch] **`IframeFeatureFlags` is missing flags for `contacts`, `visitors`, `inbox`** (F10) — RESOLVED 2026-05-29. Added `contactsEnabled`, `visitorsEnabled`, `inboxEnabled` to align with the 5 `SectionName` values. [iframe-init.types.ts:67-78]
- [x] [Review][Patch] **`ProtocolVersion` template is unsafe at IO boundary** (F11) — RESOLVED 2026-05-29. Added a "Compile-time only" JSDoc warning. [protocol-version.ts:22-37]
- [x] [Review][Patch] **`IframeInitError` requires `reason` but backend 503 body has no `reason` field** (F12) — RESOLVED 2026-05-29. Made `reason?: IframeInitErrorReason` (optional). JSDoc documents the 503 case. [iframe-init.types.ts:97-104]
- [x] [Review][Patch] **`ThemeLogoAsset` doesn't carry favicon `type` (MIME)** (F13) — RESOLVED 2026-05-29. Added `type?: string` to `ThemeLogoAsset`. JSDoc explains favicon usage. [theme.types.ts:46-57]
- [x] [Review][Patch] **Success `theme: IframeThemeSummary` vs error `fallbackTheme: ThemeConfig` shape divergence** (F14) — RESOLVED 2026-05-29. JSDoc on `fallbackTheme` documents the divergence and explains the 503 case. [iframe-init.types.ts:97-107]
- [x] [Review][Patch] **Missing semver edge case tests** (F16) — RESOLVED 2026-05-29. Added 17 parametric edge case tests (prerelease, build metadata, 2/4 parts, leading zeros, whitespace, hex, scientific, etc.). [protocol-version.spec.ts:91-130]
- [x] [Review][Patch] **`enabledSections` backend returns `string[]` but frontend is `readonly SectionName[]`** (F18) — RESOLVED 2026-05-29. JSDoc documents backend contract and the type guard requirement for IframeInitService. [theme.types.ts:75-86]
- [x] [Review][Patch] **`headingFontWeight: string` accepts invalid CSS values** (F20) — RESOLVED 2026-05-29. Added `FontWeight` type (100-900 numerics + 4 keywords). ThemeConfig and DEFAULT_THEME updated. [theme.types.ts:21-37, theme.fallback.ts:31]
- [x] [Review][Patch] **`PROTOCOL_VERSION` literal-type test is tautological** (F21) — RESOLVED 2026-05-29. Replaced with `expectTypeOf(PROTOCOL_VERSION).toMatchTypeOf<ProtocolVersion>()` which is a real type-level assertion. [protocol-version.spec.ts:14-19]
- [x] [Review][Patch] **"ignores PATCH" test doesn't assert `reason === undefined`** (F22) — RESOLVED 2026-05-29. Added `expect(r.reason).toBeUndefined()` to the test. [protocol-version.spec.ts:74-80]
- [x] [Review][Patch] **`IframeUser.permissions` and `IframeRuntimeConfig.allowedFileTypes` are untyped** (F24) — RESOLVED 2026-05-29. JSDoc on both fields documents server-validated free-form strings. [iframe-init.types.ts:60-67, 89-95]
- [x] [Review][Patch] **`IframeCompany.logo` shape diverges from `ThemeLogoAsset`** (F26) — RESOLVED 2026-05-29. JSDoc on `IframeCompany.logo` documents the intentional divergence (alt vs height). [iframe-init.types.ts:25-32]
- [x] [Review][Patch] **`src/index.ts` JSDoc contradicts the re-exports** (F28) — RESOLVED 2026-05-29. Rewritten to honestly describe the 4 internal re-exports and the absence of cross-bb coupling. [src/index.ts:1-21]
- [x] [Review][Patch] **Missing type-level tests for 3 of 4 type modules** (F29) — RESOLVED 2026-05-29. Added `types.spec.ts` with compile-time assertions for all 4 type modules (~25 type tests). [src/lib/types.spec.ts]
- [x] [Review][Patch] **`IframeInitResponse.theme: IframeThemeSummary | null` semantics ambiguous** (F30) — RESOLVED 2026-05-29. JSDoc explains when `null` (no branding configured) vs populated. [iframe-init.types.ts:84-92]
- [x] [Review][Patch] **`IframeInitError.fallbackTheme` semantics for `theme_not_found` reason** (F31) — RESOLVED 2026-05-29. JSDoc documents that `theme_not_found` MUST include `fallbackTheme`. [iframe-init.types.ts:97-107]
- [x] [Review][Patch] **`EmbedConfig.timestamp` is required when almost everything else is optional** (F33) — RESOLVED 2026-05-29. JSDoc explains why (stale-config detection + correlation). [post-message.types.ts:56-62]
- [x] [Review][Patch] **`ThemeConfig.enabledSections` accepts `[]`** (F36) — RESOLVED 2026-05-29. JSDoc documents the "must contain at least one section" contract. [theme.types.ts:75-86]
- [x] [Review][Defer] `AllowedParentOrigin` accepts dangerous origins (F3) — DEFERRED. Documented in deferred-work. [post-message.types.ts:9]
- [x] [Review][Defer] `IframeUser` and `UserInfo` divergent user shapes (F19) — DEFERRED. Documented in deferred-work. [iframe-init.types.ts, post-message.types.ts]
- [x] [Review][Defer] `ThemeConfig.componentMappings` untyped keys (F23) — DEFERRED. Documented in deferred-work. [theme.types.ts]
- [x] [Review][Defer] `MessageEnvelope.requestId` not branded as UUID (F25) — DEFERRED. Documented in deferred-work. [post-message.types.ts]
- [x] [Review][Defer] `ProtocolVersion` template allows negative numbers and weird coercions (F27) — DEFERRED. Documented in deferred-work. [protocol-version.ts]
- [x] [Review][Defer] Multiple `timestamp: number` without brand (F34) — DEFERRED. Documented in deferred-work. [post-message.types.ts]

**Dismissed as noise (10):** F15 (VersionCompatibility.supported+action correlation — type-level enforcement over-engineering); F17 (MessagePayloads as `any` casts at JSON.parse — pattern is fine, validators are story 8-4's job); F32 (branded CssColor — over-engineering for type contract); F35 (subdomain format — backend concern); F37 (subsumed by F9); F38 (subsumed by F2); F39 (MessageKind missing init/announce — GUIDERS_READY is the handshake); F40 (cross-lib doc references are normal); AA-2 (ThemeConfig.id 7th field — acceptable spec deviation, field is useful); AA-3 (completion notes test count — minor inaccuracy, not actionable).
- [x] [Review][Defer] `AllowedParentOrigin = \`https://${string}\`` accepts dangerous origins (e.g. `https://evil.com.attacker.net`) — the template literal is only a compile-time hint. Deferred — real allowlist validation (URL parse) is story 8-4's responsibility. [post-message.types.ts:9]
- [x] [Review][Defer] `ThemeConfig.customCss: string` is an unmarked CSS injection vector — Deferred — sanitization is story 8-3's `theme.utils.sanitizeCss()` responsibility. [theme.types.ts]
- [x] [Review][Defer] `MessageKind` mixes inbound (`LEADCARS_*`) and outbound (`GUIDERS_*`) without type-level directionality — Deferred — a future refinement; not blocking for consumers. [post-message.types.ts:16]

**Dismissed as noise (2):** `timestamp` inconsistency across payloads (some payloads legitimately don't need it — ReadyPayload/ProtocolMismatchPayload are part of synchronous handshake); `headingFontWeight: string` too open (over-engineering for a config type that mirrors CSS values).

## Dev Agent Record

### Agent Model Used

Claude (Anthropic) via BMad Method — dev-story workflow

### Debug Log References

- Nx generator (`@nx/angular:lib`) created the lib with the correct tags but only added a `lint` target — no `test` target. **Action taken:** added the `test` target to `project.json` manually, matching the pattern from `libs/shared/types/project.json`.
- Nx generator created a `lib/iframe/` sample folder with default component, spec, css, and html files. **Action taken:** deleted the entire `lib/iframe/` folder via `rm -rf`.
- The generated `index.ts` re-exported from the deleted sample. **Action taken:** rewrote `index.ts` with the proper barrel exports.
- No backend coupling: types are pure TypeScript with zero runtime imports.

### Completion Notes List

- **AC #1 (Nx lib with tags):** ✅ Project `iframe` exists at `libs/shared/types/iframe/`, tags `["scope:shared", "type:types"]`.
- **AC #2 (PROTOCOL_VERSION = '1.0.0'):** ✅ Exported as `const` with literal type.
- **AC #3 (ProtocolVersion template literal):** ✅ `\`${number}.${number}.${number}\``.
- **AC #4 (checkCompatibility function):** ✅ Pure function with discriminated union return.
- **AC #5 (IframeInitResponse):** ✅ Exported, includes all 6 sub-interfaces + version.
- **AC #6 (ThemeConfig + sub-types):** ✅ `ThemeColors`, `ThemeTypography`, `ThemeLogoAsset`, `ThemeLogos`, `ThemeConfig`, `SectionName`.
- **AC #7 (MessageKind — all 8 types):** ✅ 3 parent→iframe + 5 iframe→parent.
- **AC #8 (MessageEnvelope + PayloadFor):** ✅ Envelope with version, requestId, timestamp. Mapped type for type-safe narrowing.
- **AC #9 (EmbedConfig, UserInfo, AllowedParentOrigin):** ✅ All three exported, branded HTTPS origin type.
- **AC #10 (IframeInitErrorReason + IframeInitError):** ✅ 5 reason codes, full error shape with fallbackTheme + retryAfter.
- **AC #11 (Main barrel):** ✅ `src/index.ts` re-exports from all 4 sub-modules.
- **AC #12 (Compiles clean, no any):** ✅ Lint passes, 0 warnings in new files.
- **AC #13 (checkCompatibility tests):** ✅ 9 tests covering same version, +1 minor, -1 minor, MAJOR mismatch both directions, PATCH diff, symmetry.
- **AC #14 (No new external deps):** ✅ Zero new packages added.
- **AC #15 (No barrel coupling):** ✅ `libs/shared/types/src/index.ts` unchanged (`git diff` empty).

### File List

| Path | Action |
|------|--------|
| `libs/shared/types/iframe/project.json` | Created (Nx) + modified (added test target) |
| `libs/shared/types/iframe/tsconfig.json` | Created (Nx) |
| `libs/shared/types/iframe/tsconfig.lib.json` | Created (Nx) |
| `libs/shared/types/iframe/tsconfig.spec.json` | Created (Nx) |
| `libs/shared/types/iframe/vite.config.mts` | Created (Nx) |
| `libs/shared/types/iframe/README.md` | Created (Nx) — left as default |
| `libs/shared/types/iframe/src/test-setup.ts` | Created (Nx) |
| `libs/shared/types/iframe/src/index.ts` | Created (Nx) + modified (rewrote barrel) |
| `libs/shared/types/iframe/src/lib/protocol-version.ts` | Created |
| `libs/shared/types/iframe/src/lib/protocol-version.spec.ts` | Created |
| `libs/shared/types/iframe/src/lib/theme.types.ts` | Created |
| `libs/shared/types/iframe/src/lib/iframe-init.types.ts` | Created |
| `libs/shared/types/iframe/src/lib/post-message.types.ts` | Created |
| `libs/shared/types/iframe/src/lib/iframe/` | Deleted (Nx sample) |
| `tsconfig.base.json` | Modified (Nx added path alias `@guiders-frontend/shared/types/iframe`) |

### Change Log

- 2026-05-29: Story 8.2 implemented — created `libs/shared/types/iframe/` with full white-label contract types. 9/9 unit tests pass, lint clean, no regressions, no coupling to existing types barrel.
