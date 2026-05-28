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
      const select = page.locator('.refresh-interval-select');
      await expect(select).toBeVisible({ timeout: 15000 });
      await expect(select).toHaveValue('30000');
    });
  });
});
