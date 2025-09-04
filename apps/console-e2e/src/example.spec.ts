import { test, expect } from '@playwright/test';

test.describe('Login page (landing)', () => {
  test('sets document title to Login', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/login/i);
  });

  test('shows login heading', async ({ page }) => {
    await page.goto('/');
    const h1 = page.locator('h1');
    await expect(h1).toHaveText(/Iniciar sesión/i);
  });
});
