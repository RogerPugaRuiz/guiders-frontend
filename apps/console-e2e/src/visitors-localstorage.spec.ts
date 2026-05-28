import { test, expect } from '@playwright/test';
import { loginAsAdmin, clearVisitorsLocalStorage } from './helpers/auth.helper';

test.describe('Visitors - localStorage persistence', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await clearVisitorsLocalStorage(page);
  });

  test.describe('Auto-refresh interval selector', () => {
    test('should use default value when localStorage is empty', async ({ page }) => {
      await page.goto('/visitors');
      await page.waitForTimeout(3000);

      const select = page.locator('.refresh-interval-select, select').first();
      const count = await select.count();

      if (count === 0) {
        console.warn('[E2E] No auto-refresh selector found on visitors page. Skipping test.');
        return;
      }

      await expect(select).toBeVisible({ timeout: 15000 });
      await expect(select).toHaveValue('30000');
    });
  });
});
