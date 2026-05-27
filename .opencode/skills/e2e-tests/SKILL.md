---
name: e2e-tests
description: How to run, debug and write Playwright E2E tests in this project. Covers the Keycloak/BFF auth bypass strategy, the difference between local and CI environments, and patterns for new test files.
license: MIT
compatibility: opencode
metadata:
  audience: developers
  workflow: e2e-testing
---

# E2E Tests — Playwright in guiders-frontend

## Architecture overview

The console app normally authenticates via **BFF + Keycloak** (OAuth 2.0 PKCE).
E2E tests bypass that entirely using a lightweight mock strategy so they work
both locally and in CI without a running Keycloak instance.

```
Normal flow (dev):       Tests use:
  Angular → BFF :3000      POST :3099/api/user/auth/login
  BFF → Keycloak :8080     → JWT token
  Keycloak → BFF           → mock GET /bff/auth/me (Playwright route)
  BFF → Angular            → inject Bearer header on all backend requests
```

## Key files

| File | Purpose |
|------|---------|
| `apps/console-e2e/playwright.config.ts` | Playwright config — webServer, baseURL, projects |
| `apps/console-e2e/src/constants/env.ts` | E2E env constants (email, password, apiUrl, batchSize…) |
| `apps/console-e2e/src/helpers/auth.helper.ts` | `loginAsAdmin()` — the auth bypass helper |
| `.github/workflows/e2e.yml` | CI workflow — Docker E2E stack + test run |

## How auth works in tests

`loginAsAdmin(page)` (from `auth.helper.ts`) does **five** things:

1. `POST /api/user/auth/login` → obtains `access_token` (JWT) directly, no BFF needed.
2. Decodes the JWT payload to extract `sub`, `email`, `role`, `companyId`.
3. `page.route('**/bff/auth/me')` → returns a mock user object with status 200.
   This is what Angular's `authGuard` checks to decide if the session is valid.
4. `page.route(<backendOriginRegex>)` → injects `Authorization: Bearer <token>`
   on every request to the backend, preventing 401s that would trigger a BFF redirect.
5. `page.addInitScript()` → writes `guiders_tour_*` keys to localStorage before
   Angular boots, so TourService never shows onboarding modals during tests.

The helper does **NOT** navigate. Every test must call `page.goto('/route')` after `loginAsAdmin`.

```typescript
test.beforeEach(async ({ page }) => {
  await loginAsAdmin(page);
});

test('my test', async ({ page }) => {
  await page.goto('/visitors');
  // ...
});
```

## Running tests locally

### Critical rule: do NOT have a dev server running on :4200

`playwright.config.ts` has `reuseExistingServer: true`.  
If there is already a server on `:4200`, Playwright reuses it — even if it was
started with the wrong `VITE_API_BASE_URL` (pointing to `:3000` + Keycloak).
This causes an infinite BFF redirect loop.

**Kill any existing server first**, then run:

```bash
# Kill server on :4200 if running
kill $(lsof -ti:4200) 2>/dev/null

# Run all E2E tests (Playwright starts the server automatically)
E2E_API_URL=http://localhost:3099 \
PLAYWRIGHT_BASE_URL=http://localhost:4200 \
npx playwright test --config=apps/console-e2e/playwright.config.ts --project=chromium
```

When Playwright starts the server itself it uses the `webServer` config which sets:
```
VITE_API_BASE_URL=http://localhost:3099/api
```
This points Angular at the E2E backend (no Keycloak, direct JWT login).

### Run a specific spec file

```bash
kill $(lsof -ti:4200) 2>/dev/null
E2E_API_URL=http://localhost:3099 npx playwright test \
  --config=apps/console-e2e/playwright.config.ts \
  --project=chromium \
  apps/console-e2e/src/visitors-infinite-scroll.spec.ts
```

### Run tests matching a pattern (grep)

```bash
kill $(lsof -ti:4200) 2>/dev/null
E2E_API_URL=http://localhost:3099 npx playwright test \
  --config=apps/console-e2e/playwright.config.ts \
  --project=chromium \
  --grep "Infinite Scroll"
```

> **Note:** do not use `nx e2e console-e2e -- --grep "..."` with `|` in the pattern —
> the pipe is interpreted by the shell. Use `--grep` directly with `npx playwright test`.

### Open Playwright UI (interactive mode)

```bash
kill $(lsof -ti:4200) 2>/dev/null
E2E_API_URL=http://localhost:3099 npx playwright test \
  --config=apps/console-e2e/playwright.config.ts \
  --project=chromium --ui
```

### Show last HTML report

```bash
npx playwright show-report dist/.playwright/apps/console-e2e/playwright-report
```

## CI vs local — key differences

| | CI (GitHub Actions) | Local dev |
|--|--|--|
| Backend | Docker E2E stack on `:3099` — no Keycloak, seeded with 50 visitors | guiders-backend on `:3099` (if `seed:e2e` was run) |
| BFF | Not running | Running on `:3000` but NOT used by tests |
| Keycloak | Not running | Running on `:8080` but NOT used by tests |
| Server on :4200 | Playwright starts it | **Must be stopped before running tests** |
| `VITE_API_BASE_URL` | Set to `http://localhost:3099/api` by Playwright webServer config | Set to `http://localhost:3099/api` by Playwright webServer config (only if server is not pre-existing) |
| `E2E_TOTAL_VISITORS` | 50 (hardcoded in Docker entrypoint) | 150 (default seed) — set `E2E_TOTAL_VISITORS=50` to match CI |

## Backend E2E prerequisites (local)

The backend team provides a seed script. To set up:

```bash
# In guiders-backend repo:
npm run seed:e2e   # seeds DB with E2E data including admin user

# Credentials (hardcoded, no real secrets):
# email:    admin@e2e.guiders.local
# password: E2eAdmin123!
# backend:  http://localhost:3099
```

Verify the backend is ready:

```bash
curl -sf http://localhost:3099/api/tracking-v2/health && echo "OK"
```

## Writing new tests

### Spec file location

```
apps/console-e2e/src/<feature>-<concern>.spec.ts
```

### Minimal test template

```typescript
import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth.helper';

test.describe('Feature - Concern', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('should do something', async ({ page }) => {
    await page.goto('/route');
    await expect(page.locator('.my-element')).toBeVisible({ timeout: 15000 });
    // assertions...
  });
});
```

### Using env constants

```typescript
import { E2E } from './constants/env';

// E2E.apiUrl       → 'http://localhost:3099'
// E2E.adminEmail   → 'admin@e2e.guiders.local'
// E2E.batchSize    → 25
// E2E.totalVisitors → 50 (CI) or 150 (local)
```

### Intercepting backend requests in a test

```typescript
// Mock a specific endpoint
await page.route('**/api/some/endpoint', (route) => {
  route.fulfill({ status: 200, body: JSON.stringify({ data: [] }) });
});

// Spy on requests
await page.route('**/api/visitors**', async (route) => {
  await route.continue();
});
```

> **Route registration order matters (LIFO):** the last registered handler runs first.
> Register low-priority catch-alls BEFORE specific mocks.

### Triggering Angular component methods directly

When testing scroll-triggered behaviour (IntersectionObserver doesn't fire headlessly):

```typescript
await page.evaluate(() => {
  const el = document.querySelector('lib-visitors-list') as any;
  const comp = (window as any).ng?.getComponent(el);
  comp?.onLoadMore();
});
await page.waitForTimeout(1000);
```

### Do not rely on ?page= in the URL

The visitors feature uses **infinite scroll** — there is no `?page=` parameter.
If a URL with `?page=N` is loaded, Angular strips it immediately (`replaceUrl: true`).
Tests must verify this:

```typescript
await page.goto('/visitors?page=3');
await expect(page.locator('.visitors-page')).toBeVisible({ timeout: 15000 });
expect(page.url()).not.toContain('page=');
```

## Troubleshooting

### Infinite BFF redirect loop (`bff/auth/login` → `/visitors` → `bff/auth/login`)

**Cause:** a server on `:4200` was started with `VITE_API_BASE_URL` pointing to `:3000`
(the real BFF with Keycloak). Playwright reused that server instead of starting a new one.

**Fix:** kill the server on `:4200` before running tests.

```bash
kill $(lsof -ti:4200) 2>/dev/null
```

### `loginAsAdmin` throws `Login failed: 401`

- The E2E backend is not running on `:3099`.
- Check with `curl -sf http://localhost:3099/api/tracking-v2/health`.
- Run `npm run seed:e2e` in guiders-backend if the DB was reset.

### Tests pass in CI but fail locally

- Likely `E2E_TOTAL_VISITORS` mismatch. CI seeds 50 visitors; local seeds 150.
  Set `E2E_TOTAL_VISITORS=50` or adjust assertions.
- Or a pre-existing server on `:4200` (see redirect loop above).

### `No tests found` when using `nx e2e console-e2e -- --grep "..."`

nx passes the `--grep` argument differently. Use `npx playwright test` directly:

```bash
E2E_API_URL=http://localhost:3099 npx playwright test \
  --config=apps/console-e2e/playwright.config.ts \
  --grep "My test name"
```
