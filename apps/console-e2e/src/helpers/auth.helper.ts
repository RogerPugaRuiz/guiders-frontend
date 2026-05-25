import { Page, request } from '@playwright/test';
import { E2E } from '../constants/env';

/**
 * Authenticates as admin by:
 * 1. Obtaining an access_token via POST /api/user/auth/login (no Keycloak required).
 * 2. Decoding the JWT payload to extract user claims.
 * 3. Mocking GET /bff/auth/me so Angular's authGuard sees a valid session.
 * 4. Injecting Bearer token into all backend requests to prevent 401s.
 * 5. Marking all tours as completed in localStorage before the test navigates.
 *
 * This avoids the BFF/OIDC/Keycloak flow entirely, making tests runnable both
 * locally and in the E2E Docker stack.
 *
 * NOTE: This helper does NOT navigate. Each test must call page.goto('/route') after.
 */
export async function loginAsAdmin(page: Page): Promise<void> {
  const apiUrl = E2E.apiUrl;

  // Step 1: obtain access_token via direct login endpoint.
  const ctx = await request.newContext();
  const res = await ctx.post(`${apiUrl}/api/user/auth/login`, {
    data: {
      email: E2E.adminEmail,
      password: E2E.adminPassword,
    },
  });
  if (!res.ok()) {
    throw new Error(
      `Login failed: ${res.status()} ${res.statusText()} — check E2E credentials and that the backend is running at ${apiUrl}`
    );
  }
  const { access_token } = await res.json();
  await ctx.dispose();

  // Step 2: decode JWT payload (base64url, no signature verification needed for mocking).
  const jwtPayload = JSON.parse(
    Buffer.from(access_token.split('.')[1], 'base64url').toString('utf-8')
  );
  const userId: string = jwtPayload.sub;

  // Step 3: decode JWT to build mock user object.
  const mockUser = {
    sub: jwtPayload.sub,
    email: jwtPayload.email,
    roles: Array.isArray(jwtPayload.role) ? jwtPayload.role : [jwtPayload.role],
    companyId: jwtPayload.companyId,
    app: 'console',
    session: {
      exp: jwtPayload.exp,
      iat: jwtPayload.iat,
    },
  };

  // Step 4: set up route interceptors.
  // IMPORTANT: Playwright evaluates routes in LIFO order (last registered = first evaluated).
  // Register the low-priority catch-all FIRST, then specific mocks LAST so they take precedence.

  // 4a: Inject Bearer token into all requests going to the E2E backend.
  // This prevents backend endpoints from returning 401, which GlobalErrorInterceptor
  // treats as "unrecoverable" and redirects to BFF login (which returns 500 without Keycloak).
  const backendOriginRegex = new RegExp(`^${apiUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`);
  await page.route(backendOriginRegex, (route) => {
    const headers = {
      ...route.request().headers(),
      Authorization: `Bearer ${access_token}`,
    };
    route.continue({ headers });
  });

  // 4b: mock GET /bff/auth/me so Angular's authGuard considers the session valid.
  // Registered AFTER the catch-all so it takes precedence (LIFO).
  await page.route('**/bff/auth/me', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockUser),
    });
  });

  // 4c: mock BFF auth endpoints to prevent redirect loops.
  await page.route('**/bff/auth/refresh', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });

  // Step 5: suppress tours.
  // Strategy: use addInitScript to intercept localStorage.getItem (chromium/firefox) AND
  // also use page.goto('about:blank') first to get a live document where localStorage
  // is accessible, then set the tour keys directly.
  // TourService storage key format: guiders_tour_${tourId}_${userId}
  // Known tour IDs (from tours/ directory).
  const tourIds = ['console', 'admin', 'visitors'];

  // 5a: addInitScript — runs before Angular boots on every navigation.
  // In chromium/firefox this intercepts localStorage.getItem at the Storage prototype level.
  await page.addInitScript(
    ({ ids, uid }: { ids: string[]; uid: string }) => {
      // Directly write completed flags for known tours so TourService.isCompleted() returns true.
      try {
        for (const id of ids) {
          localStorage.setItem(`guiders_tour_${id}_${uid}`, 'true');
        }
        // Also intercept getItem as a belt-and-suspenders approach.
        const _orig = Object.getOwnPropertyDescriptor(Storage.prototype, 'getItem');
        if (_orig && _orig.value) {
          Storage.prototype.getItem = function (key: string): string | null {
            if (typeof key === 'string' && key.startsWith('guiders_tour_')) return 'true';
            return _orig.value.call(this, key);
          };
        }
      } catch (_) {
        // Ignore — may be called before a document exists (about:blank)
      }
    },
    { ids: tourIds, uid: userId }
  );
}

/**
 * Clears visitors-related localStorage keys.
 * Call this inside beforeEach if tests need a clean filter/pagination state.
 */
export async function clearVisitorsLocalStorage(page: Page): Promise<void> {
  try {
    await page.evaluate(() => {
      try {
        localStorage.removeItem('visitors_auto_refresh_interval');
        localStorage.removeItem('visitors_page_size');
      } catch (e) {
        console.warn('Could not access localStorage:', e);
      }
    });
  } catch (_) {
    // ignore
  }
}
