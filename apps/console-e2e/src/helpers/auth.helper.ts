import { Page } from '@playwright/test';

/**
 * Mock de token JWT para pruebas E2E
 * Este es un token ficticio que la aplicación aceptará en modo de pruebas
 */
const MOCK_ACCESS_TOKEN = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IlRlc3QgVXNlciIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsImlhdCI6MTUxNjIzOTAyMiwiZXhwIjo5OTk5OTk5OTk5fQ.mock';

/**
 * Datos de usuario mock para las pruebas
 */
const MOCK_USER = {
  id: 'test-user-123',
  name: 'Test User',
  email: 'test@example.com',
  companyId: 'test-company-123',
  tenantId: 'test-tenant-123',
};

/**
 * Configura autenticación mockeada para las pruebas E2E
 * Establece tokens y datos de usuario en localStorage
 *
 * @param page - Instancia de Page de Playwright
 */
export async function setupAuthMock(page: Page): Promise<void> {
  // IMPORTANTE: Bloquear redirecciones a Keycloak ANTES de cualquier navegación
  await page.route('**/*', (route) => {
    const url = route.request().url();

    // Bloquear cualquier redirección a Keycloak
    if (url.includes('keycloak') || url.includes('/realms/') || url.includes('/auth/realms/')) {
      console.log('[AUTH MOCK] Bloqueando redirección a Keycloak:', url);
      route.abort();
      return;
    }

    // Interceptar llamadas al BFF de autenticación
    if (url.includes('/api/bff/auth/')) {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          authenticated: true,
          user: MOCK_USER
        })
      });
      return;
    }

    // Interceptar validación de tokens
    if (url.includes('/api/auth/validate')) {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          valid: true,
          user: MOCK_USER
        })
      });
      return;
    }

    // Permitir todas las demás peticiones
    route.continue();
  });

  // Navegar a la página base para tener acceso al localStorage del dominio correcto
  await page.goto('/');

  // Configurar tokens de autenticación en localStorage
  await page.evaluate(({ token, user }) => {
    // Token de acceso
    localStorage.setItem('access-token', token);

    // Datos del usuario
    localStorage.setItem('user', JSON.stringify(user));

    // Otros datos que pueda necesitar la aplicación
    localStorage.setItem('isAuthenticated', 'true');

    // Mock de configuración de empresa/tenant
    localStorage.setItem('selectedSite', JSON.stringify({
      tenantId: user.tenantId,
      siteName: 'Test Site',
      companyId: user.companyId
    }));
  }, { token: MOCK_ACCESS_TOKEN, user: MOCK_USER });
}

/**
 * Limpia solo los datos de localStorage relacionados con visitantes
 * Mantiene los tokens de autenticación intactos
 *
 * @param page - Instancia de Page de Playwright
 */
export async function clearVisitorsLocalStorage(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.removeItem('visitors_auto_refresh_interval');
    localStorage.removeItem('visitors_page_size');
  });
}

/**
 * Limpia toda la autenticación del localStorage
 * Útil para tests que necesitan probar flujos sin auth
 *
 * @param page - Instancia de Page de Playwright
 */
export async function clearAuthMock(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.removeItem('access-token');
    localStorage.removeItem('user');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('selectedSite');
  });
}

/**
 * Configura un estado de autenticación completo para las pruebas
 * Incluye auth mock y navegación inicial
 *
 * @param page - Instancia de Page de Playwright
 * @returns Promise que se resuelve cuando la configuración está completa
 */
export async function setupAuthenticatedState(page: Page): Promise<void> {
  // Configurar mock de autenticación
  await setupAuthMock(page);

  // Limpiar datos de visitantes pero mantener auth
  await clearVisitorsLocalStorage(page);
}
