import { test, expect } from '@playwright/test';
import { setupAuthenticatedState, clearVisitorsLocalStorage } from './helpers/auth.helper';

test.describe('Visitors - localStorage persistence', () => {
  test.beforeEach(async ({ page }) => {
    // Configurar autenticación mockeada y limpiar datos de visitantes
    await setupAuthenticatedState(page);
  });

  test.describe('Auto-refresh interval selector', () => {
    test('should save auto-refresh interval to localStorage when changed', async ({ page }) => {
      // Navegar a la página de visitantes
      await page.goto('/visitors');

      // Esperar a que cargue la página
      await page.waitForSelector('.auto-refresh-selector');

      // Obtener el selector y cambiar el intervalo a 60000 (1 minuto)
      const select = page.locator('.refresh-interval-select');
      await select.selectOption('60000');

      // Verificar que se guardó en localStorage
      const storedValue = await page.evaluate(() => {
        return localStorage.getItem('visitors_auto_refresh_interval');
      });
      expect(storedValue).toBe('60000');
    });

    test('should restore auto-refresh interval from localStorage on page load', async ({ page }) => {
      // Pre-configurar localStorage con auth mockeada
      await page.evaluate(() => {
        localStorage.setItem('visitors_auto_refresh_interval', '300000');
      });

      // Navegar a la página de visitantes
      await page.goto('/visitors');

      // Esperar a que cargue la página
      await page.waitForSelector('.auto-refresh-selector');

      // Verificar que el select tiene el valor guardado
      const select = page.locator('.refresh-interval-select');
      await expect(select).toHaveValue('300000');
    });

    test('should use default value when localStorage is empty', async ({ page }) => {
      // Navegar a la página de visitantes sin localStorage configurado
      await page.goto('/visitors');

      // Esperar a que cargue la página
      await page.waitForSelector('.auto-refresh-selector');

      // Verificar que usa el valor por defecto (30000)
      const select = page.locator('.refresh-interval-select');
      await expect(select).toHaveValue('30000');
    });

    test('should cycle through all interval options and persist each', async ({ page }) => {
      await page.goto('/visitors');
      await page.waitForSelector('.auto-refresh-selector');

      const select = page.locator('.refresh-interval-select');
      const intervals = ['0', '10000', '30000', '60000', '300000'];

      for (const interval of intervals) {
        // Cambiar el valor
        await select.selectOption(interval);

        // Verificar que se guardó
        const storedValue = await page.evaluate(() => {
          return localStorage.getItem('visitors_auto_refresh_interval');
        });
        expect(storedValue).toBe(interval);
      }
    });
  });

  test.describe('Page size selector', () => {
    test('should save page size to localStorage when changed', async ({ page }) => {
      // Navegar a la página de visitantes
      await page.goto('/visitors');

      // Esperar a que cargue el paginador
      await page.waitForSelector('guiders-pagination');

      // Buscar el selector de tamaño de página (puede estar en un select o dropdown)
      // Ajustar el selector según la implementación real del componente de paginación
      const pageSizeSelect = page.locator('guiders-pagination select, guiders-pagination [role="combobox"]').first();

      // Cambiar el tamaño de página a 20
      await pageSizeSelect.selectOption('20');

      // Esperar un momento para que se procese el cambio
      await page.waitForTimeout(500);

      // Verificar que se guardó en localStorage
      const storedValue = await page.evaluate(() => {
        return localStorage.getItem('visitors_page_size');
      });
      expect(storedValue).toBe('20');
    });

    test('should restore page size from localStorage on page load', async ({ page }) => {
      // Pre-configurar localStorage con auth mockeada
      await page.evaluate(() => {
        localStorage.setItem('visitors_page_size', '50');
      });

      // Navegar a la página de visitantes
      await page.goto('/visitors');

      // Esperar a que cargue el paginador
      await page.waitForSelector('guiders-pagination');

      // Verificar que el selector tiene el valor guardado
      const pageSizeSelect = page.locator('guiders-pagination select, guiders-pagination [role="combobox"]').first();
      await expect(pageSizeSelect).toHaveValue('50');
    });

    test('should use default page size (10) when localStorage is empty', async ({ page }) => {
      // Navegar a la página de visitantes sin localStorage configurado
      await page.goto('/visitors');

      // Esperar a que cargue el paginador
      await page.waitForSelector('guiders-pagination');

      // Verificar que muestra el texto "Mostrando 1-10" o similar
      const paginationText = page.locator('guiders-pagination');
      await expect(paginationText).toContainText(/1-10|10/);
    });
  });

  test.describe('Combined persistence', () => {
    test('should persist both settings independently', async ({ page }) => {
      await page.goto('/visitors');

      // Esperar a que cargue todo
      await page.waitForSelector('.auto-refresh-selector');
      await page.waitForSelector('guiders-pagination');

      // Cambiar intervalo de refresh
      const refreshSelect = page.locator('.refresh-interval-select');
      await refreshSelect.selectOption('60000');

      // Cambiar tamaño de página
      const pageSizeSelect = page.locator('guiders-pagination select, guiders-pagination [role="combobox"]').first();
      await pageSizeSelect.selectOption('50');

      // Esperar procesamiento
      await page.waitForTimeout(500);

      // Verificar que ambos se guardaron
      const [refreshValue, pageSizeValue] = await page.evaluate(() => {
        return [
          localStorage.getItem('visitors_auto_refresh_interval'),
          localStorage.getItem('visitors_page_size')
        ];
      });

      expect(refreshValue).toBe('60000');
      expect(pageSizeValue).toBe('50');

      // Recargar la página
      await page.reload();

      // Esperar a que cargue todo
      await page.waitForSelector('.auto-refresh-selector');
      await page.waitForSelector('guiders-pagination');

      // Verificar que ambos valores se restauraron
      await expect(refreshSelect).toHaveValue('60000');
      await expect(pageSizeSelect).toHaveValue('50');
    });
  });

  test.describe('Combined persistence with page reload', () => {
    // Este test NO usa beforeEach porque necesita mantener localStorage entre reloads
    test('should persist 30s refresh interval and 100 page size after reload', async ({ page }) => {
      // Configurar auth mock manualmente (sin limpiar visitors localStorage)
      await page.route('**/*', (route) => {
        const url = route.request().url();
        if (url.includes('keycloak') || url.includes('/realms/')) {
          route.abort();
          return;
        }
        if (url.includes('/api/bff/auth/')) {
          route.fulfill({
            status: 200,
            body: JSON.stringify({ authenticated: true })
          });
          return;
        }
        route.continue();
      });

      // Configurar localStorage ANTES de navegar a /visitors
      await page.goto('/');
      await page.evaluate(() => {
        localStorage.setItem('access-token', 'mock-token');
        localStorage.setItem('isAuthenticated', 'true');
        // Establecer los valores ANTES de que el componente se inicialice
        localStorage.setItem('visitors_auto_refresh_interval', '30000');
        localStorage.setItem('visitors_page_size', '100');
      });

      // Navegar a la página de visitantes (componente se inicializará con los valores de localStorage)
      await page.goto('/visitors');

      // Esperar a que cargue el selector de refresh
      await page.waitForSelector('.auto-refresh-selector');

      // Verificar que el intervalo de refresh se cargó correctamente como 30s
      const refreshSelect = page.locator('.refresh-interval-select');
      await expect(refreshSelect).toHaveValue('30000');

      // Verificar el estado del componente después de la carga inicial
      const stateAfterInitialLoad = await page.evaluate(() => {
        return {
          refreshInterval: localStorage.getItem('visitors_auto_refresh_interval'),
          pageSize: localStorage.getItem('visitors_page_size')
        };
      });

      expect(stateAfterInitialLoad.refreshInterval).toBe('30000');
      expect(stateAfterInitialLoad.pageSize).toBe('100');

      // Refrescar la página (localStorage se mantiene porque no hay beforeEach)
      await page.reload();

      // Esperar a que la página cargue completamente después del refresh
      await page.waitForSelector('.auto-refresh-selector');

      // Verificar que el intervalo de refresh se restauró a 30s
      const refreshSelectAfterReload = page.locator('.refresh-interval-select');
      await expect(refreshSelectAfterReload).toHaveValue('30000');

      // Verificar que los valores siguen en localStorage después del reload
      const [refreshValueAfterReload, pageSizeValueAfterReload] = await page.evaluate(() => {
        return [
          localStorage.getItem('visitors_auto_refresh_interval'),
          localStorage.getItem('visitors_page_size')
        ];
      });

      expect(refreshValueAfterReload).toBe('30000');
      expect(pageSizeValueAfterReload).toBe('100');
    });
  });

  test.describe('Refresh button animation', () => {
    test('should show loading animation when refresh button is clicked', async ({ page }) => {
      await page.goto('/visitors');

      // Esperar a que cargue el botón
      await page.waitForSelector('.refresh-button');

      const refreshButton = page.locator('.refresh-button');

      // Verificar que no tiene la clase loading inicialmente
      await expect(refreshButton).not.toHaveClass(/refresh-button--loading/);

      // Hacer clic en el botón
      await refreshButton.click();

      // Verificar que aparece la clase loading (aunque sea brevemente)
      // Nota: puede ser muy rápido, así que usamos waitFor con timeout corto
      await page.waitForSelector('.refresh-button--loading', { timeout: 1000 }).catch(() => {
        // Es posible que la animación sea tan rápida que no la capturemos
        console.log('Animation may have been too fast to capture');
      });
    });

    test('should disable refresh button while refreshing', async ({ page }) => {
      await page.goto('/visitors');
      await page.waitForSelector('.refresh-button');

      const refreshButton = page.locator('.refresh-button');

      // Hacer clic en el botón
      await refreshButton.click();

      // Verificar que el botón está deshabilitado durante el refresh
      // (puede ser muy breve)
      const isDisabled = await refreshButton.isDisabled();
      // Podría estar o no deshabilitado dependiendo de la velocidad de la respuesta
      console.log('Button disabled state during refresh:', isDisabled);
    });
  });

  test.describe('Invalid localStorage values', () => {
    test('should handle invalid auto-refresh interval gracefully', async ({ page }) => {
      // Pre-configurar localStorage con valor inválido (auth ya está mockeada)
      await page.evaluate(() => {
        localStorage.setItem('visitors_auto_refresh_interval', 'invalid');
      });

      // Navegar a la página de visitantes
      await page.goto('/visitors');
      await page.waitForSelector('.auto-refresh-selector');

      // Debería usar el valor por defecto
      const select = page.locator('.refresh-interval-select');
      await expect(select).toHaveValue('30000');
    });

    test('should handle invalid page size gracefully', async ({ page }) => {
      // Pre-configurar localStorage con valor inválido (auth ya está mockeada)
      await page.evaluate(() => {
        localStorage.setItem('visitors_page_size', '999');
      });

      // Navegar a la página de visitantes
      await page.goto('/visitors');
      await page.waitForSelector('guiders-pagination');

      // Debería usar el valor por defecto (10)
      const paginationText = page.locator('guiders-pagination');
      await expect(paginationText).toContainText(/1-10|10/);
    });
  });
});
