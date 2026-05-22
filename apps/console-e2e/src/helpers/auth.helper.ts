import { Page } from '@playwright/test';
import { E2E } from '../constants/env';

// Keycloak sub for the E2E admin user (used to suppress tours in localStorage).
const E2E_ADMIN_SUB = '83f82e25-2732-4d5b-bf32-009a234bd587';

/**
 * Performs a real SSO login through Keycloak and the BFF OAuth callback.
 *
 * Flow:
 *   1. Navigate to /bff/auth/login/console  → redirects to Keycloak login page
 *   2. Fill in email + password and submit  → Keycloak redirects to BFF callback
 *   3. BFF callback sets console_session cookie and redirects to /
 *   4. Returns when the Angular app shell is ready (router-outlet in DOM)
 *
 * Tour tooltips are suppressed via addInitScript so they never appear during tests.
 *
 * NOTE: requires that no other process listens on localhost:8080 besides the
 * Keycloak Docker container. A local nginx on port 8080 (e.g. from Homebrew)
 * will intercept some browser navigations and return 404.
 */
export async function loginAsAdmin(page: Page): Promise<void> {
  // Suppress tours before any page scripts run.
  await page.addInitScript((sub: string) => {
    try {
      localStorage.setItem(`guiders_tour_console_${sub}`, 'true');
      localStorage.setItem(`guiders_tour_visitors_${sub}`, 'true');
      localStorage.removeItem('visitors_auto_refresh_interval');
      localStorage.removeItem('visitors_page_size');
    } catch (_) {
      // ignore
    }
  }, E2E_ADMIN_SUB);

  // Step 1: trigger BFF → Keycloak redirect.
  await page.goto(
    'http://localhost:3000/api/bff/auth/login/console?redirect=http://localhost:4200/',
    { waitUntil: 'domcontentloaded', timeout: 30_000 }
  );

  // Step 2: fill and submit the Keycloak login form.
  await page.waitForSelector('#kc-form-login', { timeout: 30_000 });
  await page.fill('#username', E2E.adminEmail);
  await page.fill('#password', E2E.adminPassword);

  // Step 3: submit and wait for BFF callback → Angular app.
  await Promise.all([
    page.waitForURL('http://localhost:4200/**', { timeout: 20_000 }),
    page.click('#kc-login'),
  ]);

  // Step 4: wait for Angular to bootstrap (router-outlet is present in DOM).
  await page.waitForSelector('router-outlet', { state: 'attached', timeout: 20_000 });
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
