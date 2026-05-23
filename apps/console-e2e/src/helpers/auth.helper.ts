import { Page } from '@playwright/test';
import { E2E } from '../constants/env';

/**
 * Performs a real SSO login through the BFF OAuth callback.
 *
 * The flow adapts automatically to the environment:
 *
 * - **Local dev** (apiUrl=localhost:3000): BFF → Keycloak (localhost:8080) → BFF callback
 * - **CI / E2E stack** (apiUrl=localhost:3099): BFF → embedded OIDC (localhost:3099/realms/e2e) → BFF callback
 *
 * In both cases the login form has a username + password field and a submit button.
 * We wait for any input[type=text|email] and input[type=password] pair to appear.
 *
 * Tour tooltips are suppressed via addInitScript so they never appear during tests.
 *
 * NOTE (local dev only): no other process must listen on localhost:8080 besides the
 * Keycloak Docker container. A local nginx on port 8080 (e.g. from Homebrew) will
 * intercept browser navigations and return 404.
 */
export async function loginAsAdmin(page: Page): Promise<void> {
  const apiUrl = E2E.apiUrl;
  const frontendUrl = 'http://localhost:4200';

  // Suppress tours before any page scripts run.
  await page.addInitScript(() => {
    try {
      // We suppress by key pattern — sub is unknown until after login,
      // so we use a storage event listener that sets the flag on first write.
      // As a pragmatic workaround, we override localStorage.setItem to intercept
      // tour keys written by the app and immediately overwrite them.
      const _orig = localStorage.setItem.bind(localStorage);
      localStorage.setItem = (key: string, value: string) => {
        _orig(key, value);
        if (key.startsWith('guiders_tour_')) {
          _orig(key, 'true');
        }
      };
      // Also suppress any already-set keys that might be stale.
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k?.startsWith('guiders_tour_')) {
          _orig(k, 'true');
        }
      }
      localStorage.removeItem('visitors_auto_refresh_interval');
      localStorage.removeItem('visitors_page_size');
    } catch (_) {
      // ignore — storage may not be available before navigation
    }
  });

  // Step 1: trigger BFF → OIDC provider redirect.
  await page.goto(
    `${apiUrl}/api/bff/auth/login/console?redirect=${encodeURIComponent(frontendUrl + '/')}`,
    { waitUntil: 'domcontentloaded', timeout: 30_000 }
  );

  // Step 2: wait for the login form (works for both Keycloak and embedded OIDC).
  // Keycloak uses #kc-form-login; embedded OIDC may use a different form id.
  await page.waitForSelector(
    'input[type="password"], input[name="password"]',
    { timeout: 30_000 }
  );

  // Fill username and password — support both Keycloak field ids and generic inputs.
  const usernameSelector =
    '#username, input[name="username"], input[type="email"], input[type="text"]';
  const passwordSelector =
    '#password, input[name="password"], input[type="password"]';

  await page.fill(usernameSelector, E2E.adminEmail);
  await page.fill(passwordSelector, E2E.adminPassword);

  // Step 3: submit and wait for BFF callback → Angular app.
  await Promise.all([
    page.waitForURL(`${frontendUrl}/**`, { timeout: 30_000 }),
    page.click(
      '#kc-login, button[type="submit"], input[type="submit"]'
    ),
  ]);

  // Step 4: wait for Angular to bootstrap (router-outlet is present in DOM).
  await page.waitForSelector('router-outlet', {
    state: 'attached',
    timeout: 20_000,
  });
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

/**
 * @deprecated Use loginAsAdmin() instead.
 * Kept for backward compatibility with specs that still use mocked auth.
 */
export async function setupAuthMock(page: Page): Promise<void> {
  const MOCK_USER = {
    id: 'test-user-123',
    name: 'Test User',
    email: 'test@example.com',
    companyId: 'test-company-123',
    tenantId: 'test-tenant-123',
  };

  await page.route('**/*', (route) => {
    const url = route.request().url();

    if (url.includes('keycloak') || url.includes('/realms/') || url.includes('/auth/realms/')) {
      route.abort();
      return;
    }
    if (url.includes('/socket.io')) {
      route.abort();
      return;
    }
    if (url.includes('/bff/auth/me')) {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          sub: MOCK_USER.id,
          email: MOCK_USER.email,
          name: MOCK_USER.name,
          roles: ['user', 'commercial'],
          app: 'console',
          session: {
            companyId: MOCK_USER.companyId,
            tenantId: MOCK_USER.tenantId,
            exp: Math.floor(Date.now() / 1000) + 3600,
          },
        }),
      });
      return;
    }
    if (url.includes('/bff/auth/refresh')) {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
      return;
    }
    if (url.includes('/bff/auth/login')) {
      const urlObj = new URL(url);
      const redirect = decodeURIComponent(urlObj.searchParams.get('redirect') || 'http://localhost:4200/');
      route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: `<html><head><meta http-equiv="refresh" content="0;url=${redirect}"></head><body></body></html>`,
      });
      return;
    }
    route.continue();
  });

  await page.goto('/');
}

/**
 * @deprecated Use loginAsAdmin() instead.
 */
export async function setupAuthenticatedState(page: Page): Promise<void> {
  await setupAuthMock(page);
  await clearVisitorsLocalStorage(page);
}

/**
 * @deprecated No-op kept for compatibility.
 */
export async function clearAuthMock(_page: Page): Promise<void> {
  // Nothing to clear when using real session cookies.
}
