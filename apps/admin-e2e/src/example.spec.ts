import { test, expect } from '@playwright/test';

test('admin app loads and redirects to login', async ({ page }) => {
  await page.goto('/');
  
  // La app debería redirigir a /login ya que no hay token de autenticación
  await expect(page).toHaveURL(/\/login$/);
  
  // El título debería ser "Login" cuando estamos en la página de login
  await expect(page).toHaveTitle('Login');
});

test('login page loads correctly', async ({ page }) => {
  await page.goto('/login');
  
  // Verificar que estamos en la página de login
  await expect(page).toHaveURL(/\/login$/);
  
  // Verificar que el título es correcto
  await expect(page).toHaveTitle('Login');
  
  // El componente de login debería estar presente
  await expect(page.locator('guiders-login-form')).toBeVisible();
});

test('dashboard redirects to login when not authenticated', async ({ page }) => {
  await page.goto('/dashboard');
  
  // Debería redirigir a login por el guard de autenticación
  await expect(page).toHaveURL(/\/login$/);
  
  // Y el título debería ser "Login"
  await expect(page).toHaveTitle('Login');
});

test('base HTML contains correct app root element', async ({ page }) => {
  await page.goto('/');
  
  // Verificar que el elemento root de la app admin está presente
  await expect(page.locator('admin-root')).toBeAttached();
});
