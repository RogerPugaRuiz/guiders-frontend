import { test, expect } from '@playwright/test';
import { setupAuthenticatedState } from './helpers/auth.helper';

test.describe('Visitors - localStorage persistence', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedState(page);
  });

  test.describe('Auto-refresh interval selector', () => {
    test('should use default value when localStorage is empty', async ({ page }) => {
      await page.goto('/visitors');
      await expect(page.locator('.auto-refresh-selector')).toBeVisible();

      const select = page.locator('.refresh-interval-select');
      await expect(select).toHaveValue('30000');
    });
  });
});
