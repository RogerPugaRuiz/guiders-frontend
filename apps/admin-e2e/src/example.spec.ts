import { test, expect } from '@playwright/test';

test('home page title', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/admin/i);
});

test('shows admin app heading', async ({ page }) => {
  await page.goto('/');
  const h1 = page.locator('h1');
  await expect(h1).toHaveText(/Admin Application/);
});
