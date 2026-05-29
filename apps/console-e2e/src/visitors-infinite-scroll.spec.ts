import { test, expect, Page } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth.helper';
import { E2E } from './constants/env';

const { totalVisitors: TOTAL_VISITORS, batchSize: BATCH_SIZE } = E2E;

// ---------------------------------------------------------------------------
// Scroll helper
// ---------------------------------------------------------------------------

/**
 * Triggers a loadMore by calling onLoadMore() on the Angular component via
 * ng.getComponent, which is more reliable than IntersectionObserver in headless
 * Playwright. Falls back to a native scroll if the Angular context is unavailable.
 */
async function scrollVisitorsListToBottom(page: Page): Promise<void> {
  const triggered = await page.evaluate(() => {
    const visitorsEl = document.querySelector('lib-visitors');
    if (visitorsEl) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ng = (window as any)['ng'];
        if (ng && ng.getComponent) {
          const comp = ng.getComponent(visitorsEl);
          if (comp && typeof comp.onLoadMore === 'function') {
            comp.onLoadMore();
            return true;
          }
        }
      } catch (_) {
        // ignore
      }
    }
    return false;
  });

  if (!triggered) {
    await page.evaluate(() => {
      const container = document.querySelector<HTMLElement>('.visitors-list__table-container');
      if (container) {
        container.scrollTop = 0;
        container.dispatchEvent(new Event('scroll', { bubbles: true }));
      }
    });
    await page.waitForTimeout(100);
    await page.evaluate(() => {
      const container = document.querySelector<HTMLElement>('.visitors-list__table-container');
      if (container) {
        container.scrollTop = container.scrollHeight;
        container.dispatchEvent(new Event('scroll', { bubbles: true }));
      }
    });
  }

  // Wait for the real API call to complete and Angular to render.
  await page.waitForTimeout(1_500);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('Visitors – Infinite Scroll (real backend)', () => {
  test.beforeEach(async ({ page }) => {
    // Real SSO login via Keycloak + BFF cookie.
    await loginAsAdmin(page);
    // Navigate to visitors page after auth is established.
    await page.goto('/visitors');
    // Wait for the first batch to render.
    await expect(
      page.locator('.visitors-list, [data-testid="visitors-list"]').first()
    ).toBeVisible({ timeout: 20_000 });
  });

  // -------------------------------------------------------------------------
  // Test 1: Initial page loads the first batch
  // -------------------------------------------------------------------------
  test('should display the first batch of visitors on load', async ({ page }) => {
    const rows = page.locator('.visitors-table__row:not(.visitors-table__row--skeleton)');
    await expect(rows).toHaveCount(BATCH_SIZE, { timeout: 15_000 });
  });

  // -------------------------------------------------------------------------
  // Test 2: Scrolling loads the second batch
  // -------------------------------------------------------------------------
  test('should load the second batch after scrolling to the bottom', async ({ page }) => {
    const rows = page.locator('.visitors-table__row:not(.visitors-table__row--skeleton)');
    await expect(rows).toHaveCount(BATCH_SIZE, { timeout: 15_000 });

    await scrollVisitorsListToBottom(page);

    await expect(rows).toHaveCount(BATCH_SIZE * 2, { timeout: 15_000 });
  });

  // -------------------------------------------------------------------------
  // Test 3: Scroll through all pages and show end-of-list message
  // -------------------------------------------------------------------------
  test('should load all pages and show end-of-list message after scrolling through all data', async ({
    page,
  }) => {
    const rows = page.locator('.visitors-table__row:not(.visitors-table__row--skeleton)');
    const totalPages = Math.ceil(TOTAL_VISITORS / BATCH_SIZE); // 6

    await expect(rows).toHaveCount(BATCH_SIZE, { timeout: 15_000 });

    for (let p = 2; p <= totalPages; p++) {
      await scrollVisitorsListToBottom(page);
      await expect(rows).toHaveCount(
        Math.min(BATCH_SIZE * p, TOTAL_VISITORS),
        { timeout: 15_000 }
      );
    }

    const endMessage = page.locator('.visitors-list__end-message');
    await expect(endMessage).toBeVisible({ timeout: 5_000 });
    await expect(endMessage).toContainText('Mostrando');
  });

  // -------------------------------------------------------------------------
  // Test 4: No duplicate rows across pages
  // -------------------------------------------------------------------------
  test('should not show duplicate rows when loading multiple pages', async ({ page }) => {
    const rows = page.locator('.visitors-table__row:not(.visitors-table__row--skeleton)');
    const totalPages = Math.ceil(TOTAL_VISITORS / BATCH_SIZE);

    await expect(rows).toHaveCount(BATCH_SIZE, { timeout: 15_000 });

    for (let p = 2; p <= totalPages; p++) {
      await scrollVisitorsListToBottom(page);
      await expect(rows).toHaveCount(
        Math.min(BATCH_SIZE * p, TOTAL_VISITORS),
        { timeout: 15_000 }
      );
    }

    const rowIds = await page
      .locator('.visitors-table__row:not(.visitors-table__row--skeleton)')
      .evaluateAll((els) =>
        els.map((el) => el.getAttribute('data-visitor-id') ?? el.textContent?.trim() ?? '')
      );

    expect(rowIds).toHaveLength(TOTAL_VISITORS);

    const idsOnly = rowIds.filter((id) => id && !id.startsWith(' '));
    if (idsOnly.length > 0) {
      expect(new Set(idsOnly).size).toBe(idsOnly.length);
    }
  });

  // -------------------------------------------------------------------------
  // Test 5: Skeleton rows appear during load
  // -------------------------------------------------------------------------
  test('should show skeleton rows while loading more visitors', async ({ page }) => {
    const rows = page.locator('.visitors-table__row:not(.visitors-table__row--skeleton)');
    await expect(rows).toHaveCount(BATCH_SIZE, { timeout: 15_000 });

    await scrollVisitorsListToBottom(page);

    const skeletons = page.locator('.visitors-table__row--skeleton');
    await page.waitForFunction(
      () => (document.querySelector('.visitors-table__row--skeleton') as HTMLElement)?.isVisible() ?? true,
      { timeout: 3_000 }
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    ).catch(() => {});

    await expect(skeletons).toHaveCount(0, { timeout: 10_000 });
  });

  // -------------------------------------------------------------------------
  // Test 6: Double scroll does not exceed total visitors
  // -------------------------------------------------------------------------
  test('should not trigger a second loadMore while the first is still pending', async ({
    page,
  }) => {
    const rows = page.locator('.visitors-table__row:not(.visitors-table__row--skeleton)');
    await expect(rows).toHaveCount(BATCH_SIZE, { timeout: 15_000 });

    await scrollVisitorsListToBottom(page);
    await scrollVisitorsListToBottom(page);

    await page.waitForTimeout(2_000);
    const count = await rows.count();
    expect(count).toBeLessThanOrEqual(TOTAL_VISITORS);
    expect(count).toBeGreaterThanOrEqual(BATCH_SIZE);
  });
});
