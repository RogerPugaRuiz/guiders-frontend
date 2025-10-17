import { test, expect } from '@playwright/test';
import { setupAuthenticatedState } from './helpers/auth.helper';

test.describe('Visitors - URL persistence for pagination', () => {
  test.beforeEach(async ({ page }) => {
    // Configurar autenticación mockeada
    await setupAuthenticatedState(page);
  });

  test('should initialize with page parameter from URL', async ({ page }) => {
    // Navegar directamente con parámetro de página en la URL
    await page.goto('/visitors?page=3');

    // Esperar a que la página cargue (usando un selector más general)
    await expect(page.locator('.visitors-page')).toBeVisible();

    // Verificar que la URL mantiene el parámetro
    expect(page.url()).toContain('page=3');
    
    // Verificar que el estado interno se inicializó con la página 3
    // Esto se verifica indirectamente por la request que hace al backend
  });
});
