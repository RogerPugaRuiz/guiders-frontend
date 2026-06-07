# Story 8.1: Fix ThemeService Multi-Tenant localStorage Leak

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **platform superadmin**,
I want the ThemeService to scope localStorage keys by tenant,
so that two different tenants (e.g. leadcars and another client) embedded as iframes in the same browser never see each other's theme preference.

## Acceptance Criteria

1. The localStorage key for theme persistence is namespaced by tenant id, NOT a single global key.
2. When `tenantId` is unknown/unset (default mode), the original behavior is preserved (backwards compatible with existing users).
3. When `tenantId` is set via the iframe init flow, the theme is stored under `guiders-sidebar-theme-${tenantId}`.
4. Reading a non-existent tenant-scoped key returns the DEFAULT_THEME (grey-dark), not an error.
5. Existing users with the old key `guiders-sidebar-theme` keep their theme on next load (one-time migration).
6. All existing unit tests for `ThemeService` continue to pass.
7. New unit tests cover: tenant-scoped read, tenant-scoped write, key collision isolation, migration from old key.
8. The fix does NOT change the public API of `ThemeService` (signals, computed, methods all stay the same).
9. SSR-safe: still works when `isPlatformBrowser` is false.

## Tasks / Subtasks

- [x] **Task 1: Add tenantId injection to ThemeService** (AC: #1, #2, #3)
  - [x] 1.1 Inject `TENANT_CONTEXT_TOKEN` to access the optional tenantId
  - [x] 1.2 Add private getter `getStorageKey()` that returns `guiders-sidebar-theme-${tenantId}` when present, otherwise the legacy global key
  - [x] 1.3 Replace all references to `THEME_STORAGE_KEY` constant with calls to `getStorageKey()`
  - [x] 1.4 Keep `THEME_STORAGE_KEY` constant for backwards compatibility (used internally for migration)

- [x] **Task 2: Implement one-time migration from old key** (AC: #5)
  - [x] 2.1 In `loadThemeFromStorage()`: if new key is empty AND old key `guiders-sidebar-theme` exists, read old key and write to new key
  - [x] 2.2 Remove old key after successful migration
  - [x] 2.3 Add unit test for migration path

- [x] **Task 3: Update existing unit tests** (AC: #6)
  - [x] 3.1 Run `nx test theme` to confirm existing tests still pass
  - [x] 3.2 Update tests that mock `localStorage.getItem`/`setItem` to use the new key
  - [x] 3.3 Verify `setTheme`/`getTheme` behavior unchanged for default case

- [x] **Task 4: Add new unit tests** (AC: #7)
  - [x] 4.1 Test: `loadThemeFromStorage()` with tenantId set returns tenant-scoped value
  - [x] 4.2 Test: `setTheme()` writes to tenant-scoped key
  - [x] 4.3 Test: tenant A's theme doesn't affect tenant B's theme (simulate two `localStorage` instances with mocked keys)
  - [x] 4.4 Test: `loadThemeFromStorage()` falls back to old key on first load, then migrates
  - [x] 4.5 Test: `loadThemeFromStorage()` returns DEFAULT_THEME when neither key exists
  - [x] 4.6 Test: `setTheme()` then `loadThemeFromStorage()` round-trips correctly

- [x] **Task 5: Verify no public API changes** (AC: #8)
  - [x] 5.1 Run `nx build theme` to confirm compilation (no build target — `type:data-access` doesn't have one; verified via lint + downstream consumers)
  - [x] 5.2 Run `nx lint theme` to confirm no lint errors
  - [x] 5.3 Verify signal `theme` still exposed as readonly
  - [x] 5.4 Verify computed signals (`isDarkTheme`, `isLightTheme`, `currentThemeOption`) still work

- [x] **Task 6: Verify SSR safety** (AC: #9)
  - [x] 6.1 Verify `loadThemeFromStorage()` returns `DEFAULT_THEME` when `isPlatformBrowser` is false
  - [x] 6.2 Verify `setTheme()` is a no-op in SSR

## Dev Notes

### Context — Why This Matters

This is a **REAL, EXISTING vulnerability** in the codebase, identified during the white-label iframe architecture review (see Architecture Decision Record 432-446 in `architecture-whitelabel-iframe.md`).

**Current state:** `libs/shared/data-access/theme/src/lib/theme.service.ts:130` declares:
```typescript
const THEME_STORAGE_KEY = 'guiders-sidebar-theme';
```

This is a single, fixed key. When two different tenants (e.g. `tenant-a.leadcars.com` and `tenant-b.leadcars.com`) are embedded as iframes from the same origin (app.guiders.com) in the same browser, **they share localStorage**. Tenant A's saved theme leaks into Tenant B's session.

**After fix:** Key becomes `guiders-sidebar-theme-${tenantId}`. Tenants are isolated. No code outside the service needs to change.

### Source tree components to touch

| File | Action |
|------|--------|
| `libs/shared/data-access/theme/src/lib/theme.service.ts` | Modify |
| `libs/shared/data-access/theme/src/lib/theme.service.spec.ts` | Modify (if exists) + add new tests |
| `libs/shared/data-access/theme/src/index.ts` | Verify no export changes needed |

**No new files. No library changes. No Nx tag changes. No architecture changes.**

### Pattern to follow

This is a **surgical fix** — minimal blast radius. Pattern:

```typescript
// BEFORE
const THEME_STORAGE_KEY = 'guiders-sidebar-theme';

private loadThemeFromStorage(): NamedTheme {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  return normaliseTheme(stored);
}

// AFTER
private get tenantId(): string | null {
  return this.environment.tenantId ?? null;  // from ENVIRONMENT_TOKEN
}

private getStorageKey(): string {
  return this.tenantId
    ? `guiders-sidebar-theme-${this.tenantId}`
    : THEME_STORAGE_KEY; // legacy fallback
}

private loadThemeFromStorage(): NamedTheme {
  if (!this.isBrowser) return DEFAULT_THEME;
  
  try {
    // Try new key first
    let stored = localStorage.getItem(this.getStorageKey());
    
    // Migration: if new key empty and old key exists
    if (!stored && this.tenantId) {
      stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored) {
        localStorage.setItem(this.getStorageKey(), stored);
        localStorage.removeItem(THEME_STORAGE_KEY);
      }
    }
    
    return normaliseTheme(stored);
  } catch (error) {
    console.warn('ThemeService: Failed to load theme from localStorage', error);
    return DEFAULT_THEME;
  }
}
```

### ENVIRONMENT_TOKEN shape

The `ENVIRONMENT_TOKEN` is already injected in similar libs. Check existing pattern in `libs/auth/data-access/session` for the exact interface:

```typescript
// Typical shape (verify in project)
interface Environment {
  api: { baseUrl: string };
  iframeToken?: string;   // 🆕 may exist
  tenantId?: string;      // 🆕 may not exist yet — if not, hardcode null for now
}
```

**If `tenantId` is NOT in the environment interface:** Do not add it in this story. The Story is purely about making the storage key dynamic. If `tenantId` is always null, the behavior is identical to today (backwards compatible). Future story (8-3) will set the tenantId when iframe mode is active.

### Project conventions (from project-context.md)

- **DI:** `inject()` only, never constructor injection ✅
- **State:** Signals (`signal()`, `computed()`), NOT BehaviorSubject ✅
- **TypeScript:** `moduleResolution: "bundler"`, strict mode
- **Testing:** Vitest with `@analogjs/vitest-angular`
- **Test files:** Co-located `*.spec.ts`
- **Inputs via signals:** `input()`/`input.required<T>()` (not applicable here, no component inputs)
- **DestroyRef:** Not needed (no subscriptions)
- **File naming:** `kebab-case.ts` for files, `PascalCase` for classes
- **No new external dependencies:** Use only what's already in `package.json`

### Testing standards

- **Framework:** Vitest ^3.0.0 + `@analogjs/vitest-angular ~1.19.1`
- **Test command:** `nx test theme`
- **Coverage target:** Maintain existing coverage
- **Test pattern:** Use `TestBed.configureTestingModule({ providers: [ThemeService] })` with `localStorage` mock
- **Mock pattern:** Use `vi.spyOn(Storage.prototype, 'getItem')` and `setItem` to verify the right key is called

### Critical Reminders

- ⚠️ DO NOT change the public API (no rename of methods, no removal of exports)
- ⚠️ DO NOT introduce a new dependency (no `nanoid`, no new packages)
- ⚠️ DO NOT modify `libs/shared/data-access/theme/src/index.ts` unless necessary
- ⚠️ DO NOT add tenantId to ENVIRONMENT_TOKEN in this story (future story)
- ⚠️ DO handle SSR: `isPlatformBrowser` check must remain
- ⚠️ Migration is one-time and silent (no UI prompt to user)
- ⚠️ When tenantId is null, behavior MUST be identical to current (regression-free)

### References

- Architecture: `_bmad-output/planning-artifacts/architecture-whitelabel-iframe.md` lines 432-446 (fix urgente)
- Architecture FMEA: lines 705-720 (top 15 RPN, this is RPN #336 in ThemeService localStorage)
- Architecture Backend Handoff: `_bmad-output/planning-artifacts/backend-handoff-whitelabel-iframe.md` (mentions this fix)
- Project context: `{output_folder}/project-context.md` (TypeScript and Angular rules)
- Existing ThemeService: `libs/shared/data-access/theme/src/lib/theme.service.ts`

### Review Findings

<!-- Code review 2026-05-29 — Blind Hunter + Edge Case Hunter + Acceptance Auditor -->

- [x] [Review][Decision] Migration removes shared legacy key — only first tenant inherits the old theme — Resolved: option B (copy without remove). Legacy key now persists as fallback; every new tenant inherits the same pre-multi-tenant default on first load. [theme.service.ts:220-227, spec test at lines 135-180]
- [x] [Review][Decision] Process deviation — new file + `TENANT_CONTEXT_TOKEN` seam — Resolved: option 1. `TENANT_CONTEXT_TOKEN` ratified as the official injection seam for story 8-3. The deviation from the spec's "no new files" guidance is justified because honoring the higher-priority "DO NOT add tenantId to ENVIRONMENT_TOKEN" constraint was incompatible with reading the field from `ENVIRONMENT_TOKEN`. Story 8-3 will provide this token from the iframe-init flow. [tenant-context.token.ts, index.ts:3]
- [x] [Review][Patch] Empty-string/undefined tenantId silently falls back to legacy global key — Resolved: `getStorageKey()` now guards with `this.tenantId != null && this.tenantId !== ''` (not just truthy). Empty-string and undefined correctly fall back to legacy key without writing a `guiders-sidebar-theme-` (empty suffix) key. [theme.service.ts:196-202, test at lines 122-130]
- [x] [Review][Patch] Non-atomic migration loses session theme if removeItem throws — Resolved as side-effect of D1 fix: the `removeItem` call was removed entirely. Migration now only does `setItem` (which is non-destructive — failure falls back to DEFAULT_THEME but doesn't leave a half-mutated state). The `stored` value is captured before the write, so a successful `setItem` is never lost. [theme.service.ts:226-230]
- [x] [Review][Patch] Migration persists un-normalised legacy value into new namespace — Resolved as part of D1 fix. `normaliseTheme(legacy)` is now applied before `setItem` so legacy aliases (`'dark'`/`'light'`) are canonicalised on migration. [theme.service.ts:223, test at lines 144-150]
- [x] [Review][Defer] No trimming/normalization of tenantId whitespace — `'leadcars'` vs `'leadcars '` resolve to different keys. Deferred — depends on upstream provider hygiene (story 8-3 sets tenantId). [theme.service.ts:198]
- [x] [Review][Defer] No escaping of tenantId in key construction — naive interpolation; no current collision but unguarded against adjacent key schemes. Deferred — low risk, no current collision. [theme.service.ts:198]
- [x] [Review][Defer] `getItem` returning `''` (empty) treated identically to `null` — an intentionally-empty scoped key gets clobbered by migration. Deferred — `normaliseTheme('')` → DEFAULT_THEME so display unaffected. [theme.service.ts:220]

**Dismissed as noise (3):** field initialization order (verified safe — fields declared before `_theme`); injection token has no default factory (by design — `null` default = backwards-compatible); `normaliseTheme(null)` reliance (verified handled at line 136).

## Dev Agent Record

### Agent Model Used

Claude (Anthropic) via BMad Method — dev-story workflow

### Debug Log References

- Initial state: `libs/shared/data-access/theme/src/lib/theme.service.ts:130` used fixed key `'guiders-sidebar-theme'` (multi-tenant leak confirmed).
- Fix: introduced `TENANT_CONTEXT_TOKEN` injection and `getStorageKey()` method.
- One-time migration: in `loadThemeFromStorage()`, if the scoped key is empty and the legacy global key has a value, copy forward and remove the legacy key.
- All tests pass: 17/17 (1 placeholder + 16 new) for theme lib; 8 affected projects pass regression.

### Completion Notes List

- **AC #1 (key namespaced by tenantId):** ✅ `getStorageKey()` returns `guiders-sidebar-theme-${tenantId}` when tenantId is set.
- **AC #2 (backwards compatible):** ✅ When `tenantId` is null, behavior is identical to before (legacy global key).
- **AC #3 (storage under scoped key):** ✅ `setTheme()` uses `getStorageKey()`.
- **AC #4 (DEFAULT_THEME on missing key):** ✅ `normaliseTheme(null)` returns `'grey-dark'`.
- **AC #5 (one-time migration):** ✅ Implemented in `loadThemeFromStorage()` — when scoped key is empty and legacy key has a value, copy forward and remove legacy key.
- **AC #6 (existing tests pass):** ✅ All existing tests still pass; placeholder test untouched.
- **AC #7 (new tests):** ✅ 16 new tests covering: scoped read, scoped write, cross-tenant isolation, migration, no-migration when scoped key exists, no-migration in default mode, SSR safety, error handling.
- **AC #8 (no public API changes):** ✅ Public API unchanged: `ThemeService`, `THEME_OPTIONS`, `SidebarTheme`, `NamedTheme`, `ThemeOption` all still exported. New export: `TENANT_CONTEXT_TOKEN`.
- **AC #9 (SSR-safe):** ✅ `isPlatformBrowser` check preserved; tested explicitly with `PLATFORM_ID: 'server'`.

### File List

| Path | Action |
|------|--------|
| `libs/shared/data-access/theme/src/lib/theme.service.ts` | Modified (added TENANT_CONTEXT_TOKEN injection, getStorageKey() method, one-time migration in loadThemeFromStorage()) |
| `libs/shared/data-access/theme/src/lib/tenant-context.token.ts` | Created (new InjectionToken for tenantId) |
| `libs/shared/data-access/theme/src/lib/theme.service.spec.ts` | Created (16 new tests, 270 lines) |
| `libs/shared/data-access/theme/src/index.ts` | Modified (export TENANT_CONTEXT_TOKEN) |

### Change Log

- 2026-05-29: Story 8.1 implemented — fix multi-tenant localStorage leak in ThemeService. All 17 tests pass, lint clean, no regressions in 8 affected projects.
