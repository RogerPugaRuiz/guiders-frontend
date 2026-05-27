import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth.helper';

test.describe('Visitors - URL persistence for pagination', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('should strip the page query param from the URL on load', async ({ page }) => {
    // Navigate with a legacy page parameter in the URL
    await page.goto('/visitors?page=3');

    // Wait for the page to fully load
    await expect(page.locator('.visitors-page')).toBeVisible({ timeout: 15000 });

    // The app should clean up the ?page= param — infinite-scroll does not use it
    expect(page.url()).not.toContain('page=');
  });

  test('should not add a page param to the URL when navigating to /visitors', async ({ page }) => {
    await page.goto('/visitors');
    await expect(page.locator('.visitors-page')).toBeVisible({ timeout: 15000 });

    expect(page.url()).not.toContain('page=');
  });

  test('should not add a page param when applying a quick filter', async ({ page }) => {
    await page.goto('/visitors');
    await expect(page.locator('.visitors-page')).toBeVisible({ timeout: 15000 });

    // Click the first quick-filter button (e.g. "Online" tab)
    const filterButton = page.locator('.visitors-page__filter-btn, .guiders-tab').first();
    if (await filterButton.isVisible()) {
      await filterButton.click();
      await page.waitForTimeout(500);
    }

    expect(page.url()).not.toContain('page=');
  });
});
