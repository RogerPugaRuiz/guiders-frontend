import { Page } from '@playwright/test';


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
 * Sets up mocked authentication for E2E tests.
 * Mocks all endpoints that APP_INITIALIZER needs:
 *   - /bff/auth/me
 *   - /bff/auth/refresh
 *   - /bff/auth/login
 *   - POST /v2/commercials/connect
 *   - GET  /v2/commercials/:id/chats
 *   - GET  /v2/csrf
 *   - socket.io aborted to prevent hangs
 *
 * @param page - Playwright Page instance
 */
export async function setupAuthMock(page: Page): Promise<void> {
  // IMPORTANTE: Bloquear redirecciones y mockear endpoints de autenticación
  await page.route('**/*', (route) => {
    const url = route.request().url();

    // Bloquear cualquier redirección a Keycloak
    if (url.includes('keycloak') || url.includes('/realms/') || url.includes('/auth/realms/')) {
      console.log('[AUTH MOCK] Bloqueando redirección a Keycloak:', url);
      route.abort();
      return;
    }

    // Bloquear peticiones WebSocket / socket.io para evitar cuelgues
    if (url.includes('/socket.io') || url.includes('socket.io')) {
      route.abort();
      return;
    }

    // Mockear endpoint BFF de autenticación /bff/auth/me
    if (url.includes('/bff/auth/me')) {
      console.log('[AUTH MOCK] Interceptando /bff/auth/me');
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          sub: MOCK_USER.id,
          email: MOCK_USER.email,
          name: MOCK_USER.name,
          roles: ['user', 'commercial'],
          app: 'console',
          session: {
            companyId: MOCK_USER.companyId,
            tenantId: MOCK_USER.tenantId,
            exp: Math.floor(Date.now() / 1000) + 3600 // +1 hora
          }
        })
      });
      return;
    }

    // Mockear endpoint de refresh de sesión
    if (url.includes('/bff/auth/refresh')) {
      console.log('[AUTH MOCK] Respondiendo a /bff/auth/refresh con 200');
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
      return;
    }

    // Redirigir intentos de login BFF de vuelta a la app
    if (url.includes('/bff/auth/login')) {
      console.log('[AUTH MOCK] Redirigiendo /bff/auth/login de vuelta a la app');
      const urlObj = new URL(url);
      const redirect = decodeURIComponent(urlObj.searchParams.get('redirect') || 'http://localhost:4200/');
      route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: `<html><head><meta http-equiv="refresh" content="0;url=${redirect}"></head><body></body></html>`,
      });
      return;
    }

    // Mockear POST /v2/commercials/connect - necesario para APP_INITIALIZER
    if (url.includes('/v2/commercials/connect') && route.request().method() === 'POST') {
      console.log('[AUTH MOCK] Interceptando POST /v2/commercials/connect');
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: MOCK_USER.id,
            name: MOCK_USER.name,
            email: MOCK_USER.email,
            status: 'online',
            companyId: MOCK_USER.companyId,
          }
        })
      });
      return;
    }

    // Mockear GET /v2/commercials/:id/chats - necesario para APP_INITIALIZER
    if (url.match(/\/v2\/commercials\/[^/]+\/chats/) && route.request().method() === 'GET') {
      console.log('[AUTH MOCK] Interceptando GET /v2/commercials/.../chats');
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [], total: 0, hasMore: false })
      });
      return;
    }

    // Mockear GET /v2/csrf - necesario para algunas llamadas HTTP
    if (url.includes('/v2/csrf')) {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ token: 'mock-csrf-token' })
      });
      return;
    }

    // Permitir todas las demás peticiones
    // La aplicación usará los mocks internos de visitors.ts
    route.continue();
  });

  // Navegar a la página base para tener acceso al localStorage del dominio correcto
  await page.goto('/');

  // La aplicación ahora usará el UserService con BFF mockeado
  // No necesitamos configurar localStorage manualmente porque el APP_INITIALIZER
  // llamará a /bff/auth/me que está mockeado arriba
}

/**
 * Limpia solo los datos de localStorage relacionados con visitantes
 * Mantiene los tokens de autenticación intactos
 *
 * @param page - Instancia de Page de Playwright
 */
export async function clearVisitorsLocalStorage(page: Page): Promise<void> {
  try {
    await page.evaluate(() => {
      try {
        localStorage.removeItem('visitors_auto_refresh_interval');
        localStorage.removeItem('visitors_page_size');
      } catch (e) {
        // Ignorar errores de acceso a localStorage
        console.warn('Could not access localStorage:', e);
      }
    });
  } catch (error) {
    // Ignorar errores si no podemos acceder a localStorage
    console.warn('Could not clear visitors localStorage:', error);
  }
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
