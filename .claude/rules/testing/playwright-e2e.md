# Playwright E2E Testing

## Descripción

Patrones de testing end-to-end con Playwright para aplicaciones Angular.

## Referencia

`apps/console-e2e/src/visitors-complex-filters.spec.ts`

## Estructura de Test

```typescript
import { test, expect } from '@playwright/test';

test.describe('Visitors Page', () => {
  test.beforeEach(async ({ page }) => {
    // Mock de API
    await page.route('**/api/visitors', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: '1', name: 'Visitor 1', status: 'active' },
          { id: '2', name: 'Visitor 2', status: 'pending' },
        ]),
      });
    });

    // Navegar a la página
    await page.goto('/visitors');
  });

  test('should display visitors list', async ({ page }) => {
    // Esperar a que cargue
    await expect(page.locator('.visitor-card')).toHaveCount(2);

    // Verificar contenido
    await expect(page.getByText('Visitor 1')).toBeVisible();
    await expect(page.getByText('Visitor 2')).toBeVisible();
  });
});
```

## Mock de Autenticación

```typescript
test.describe('Authenticated routes', () => {
  test.beforeEach(async ({ page, context }) => {
    // Mock de sesión
    await page.route('**/api/auth/session', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'user-1',
            email: 'test@test.com',
            roles: ['admin'],
          },
        }),
      });
    });

    // Mock de token (si usa localStorage)
    await context.addInitScript(() => {
      localStorage.setItem('access-token', 'mock-token');
    });
  });
});
```

## Selectores

### Por Role (Recomendado)

```typescript
// Botones
await page.getByRole('button', { name: 'Guardar' }).click();
await page.getByRole('button', { name: /cancelar/i }).click();

// Links
await page.getByRole('link', { name: 'Inicio' }).click();

// Inputs
await page.getByRole('textbox', { name: 'Email' }).fill('test@test.com');
await page.getByRole('checkbox', { name: 'Acepto términos' }).check();

// Headings
await expect(page.getByRole('heading', { name: 'Visitantes' })).toBeVisible();

// Lists
await expect(page.getByRole('listitem')).toHaveCount(5);
```

### Por Label

```typescript
await page.getByLabel('Nombre').fill('Juan');
await page.getByLabel('Email').fill('juan@test.com');
await page.getByLabel('Contraseña').fill('password123');
```

### Por Placeholder

```typescript
await page.getByPlaceholder('Buscar...').fill('query');
```

### Por Test ID

```typescript
// En el template: data-testid="visitor-card"
await page.getByTestId('visitor-card').click();
await expect(page.getByTestId('loading-spinner')).not.toBeVisible();
```

### Por CSS/Locator

```typescript
// Clase CSS
await page.locator('.visitor-card').first().click();

// Combinación
await page.locator('.visitor-card').filter({ hasText: 'Visitor 1' }).click();

// nth selector
await page.locator('.visitor-card').nth(2).click();
```

## Assertions

```typescript
// Visibilidad
await expect(page.getByText('Bienvenido')).toBeVisible();
await expect(page.getByTestId('error')).not.toBeVisible();
await expect(page.locator('.modal')).toBeHidden();

// Contenido
await expect(page.locator('.title')).toHaveText('Visitantes');
await expect(page.locator('.count')).toContainText('10');

// Atributos
await expect(page.getByRole('button')).toBeEnabled();
await expect(page.getByRole('button')).toBeDisabled();
await expect(page.locator('input')).toHaveValue('test@test.com');
await expect(page.locator('.card')).toHaveClass(/active/);

// Conteo
await expect(page.locator('.item')).toHaveCount(5);

// URL
await expect(page).toHaveURL('/visitors');
await expect(page).toHaveURL(/\/visitors\/\d+/);

// Screenshot
await expect(page).toHaveScreenshot('visitors-page.png');
```

## Interacciones

```typescript
// Click
await page.getByRole('button', { name: 'Enviar' }).click();
await page.getByRole('button').dblclick();
await page.locator('.menu').click({ button: 'right' });

// Formularios
await page.getByLabel('Nombre').fill('Juan');
await page.getByLabel('Nombre').clear();
await page.getByRole('textbox').pressSequentially('Hello', { delay: 100 });

// Selects
await page.getByRole('combobox').selectOption('option1');
await page.getByRole('combobox').selectOption({ label: 'Option 1' });

// Checkboxes
await page.getByRole('checkbox').check();
await page.getByRole('checkbox').uncheck();

// Keyboard
await page.keyboard.press('Enter');
await page.keyboard.press('Escape');
await page.keyboard.type('Hello World');

// Drag and drop
await page.locator('.draggable').dragTo(page.locator('.droppable'));

// Hover
await page.locator('.menu-trigger').hover();
```

## Esperas

```typescript
// Esperar elemento
await page.waitForSelector('.loaded');

// Esperar navegación
await Promise.all([
  page.waitForNavigation(),
  page.getByRole('link', { name: 'Inicio' }).click(),
]);

// Esperar respuesta de API
await page.waitForResponse('**/api/visitors');

// Esperar condición
await expect(page.locator('.spinner')).not.toBeVisible({ timeout: 10000 });

// Esperar tiempo fijo (evitar si es posible)
await page.waitForTimeout(1000);
```

## Page Object Model

```typescript
// pages/visitors.page.ts
export class VisitorsPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/visitors');
  }

  async search(query: string) {
    await this.page.getByPlaceholder('Buscar').fill(query);
  }

  async selectVisitor(name: string) {
    await this.page
      .locator('.visitor-card')
      .filter({ hasText: name })
      .click();
  }

  getVisitorCards() {
    return this.page.locator('.visitor-card');
  }

  async getVisitorCount() {
    return await this.getVisitorCards().count();
  }
}

// En el test
test.describe('Visitors', () => {
  test('should filter visitors', async ({ page }) => {
    const visitorsPage = new VisitorsPage(page);

    await visitorsPage.goto();
    await visitorsPage.search('John');

    expect(await visitorsPage.getVisitorCount()).toBe(1);
  });
});
```

## Configuración

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:4200',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run serve',
    url: 'http://localhost:4200',
    reuseExistingServer: !process.env.CI,
  },
});
```

## Comandos Nx

```bash
# Ejecutar E2E
nx e2e console-e2e

# Con UI de Playwright
nx e2e console-e2e --ui

# Debug
nx e2e console-e2e --debug

# Headed (ver navegador)
nx e2e console-e2e --headed

# Específico test
nx e2e console-e2e --grep "visitors"
```

## Reglas de Naming

| Elemento | Patrón | Ejemplo |
|----------|--------|---------|
| Archivo | `{feature}.spec.ts` | `visitors.spec.ts` |
| describe | Feature | `test.describe('Visitors', ...)` |
| test | Comportamiento | `test('should display list', ...)` |
| Page Object | `{Page}Page` | `VisitorsPage` |

## Anti-patrones

- Selectores frágiles (usar roles y labels)
- `waitForTimeout` en lugar de assertions
- Tests que dependen del orden
- No mockear APIs externas
- Tests sin cleanup
- Screenshots en cada test (solo on-failure)
