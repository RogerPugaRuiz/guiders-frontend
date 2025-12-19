# Playwright E2E Testing

## Description

End-to-end testing patterns with Playwright for Angular applications.

## Reference

`apps/console-e2e/src/visitors-complex-filters.spec.ts`

## Test Structure

```typescript
import { test, expect } from '@playwright/test';

test.describe('Visitors Page', () => {
  test.beforeEach(async ({ page }) => {
    // API Mock
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

    // Navigate to page
    await page.goto('/visitors');
  });

  test('should display visitors list', async ({ page }) => {
    // Wait for load
    await expect(page.locator('.visitor-card')).toHaveCount(2);

    // Verify content
    await expect(page.getByText('Visitor 1')).toBeVisible();
    await expect(page.getByText('Visitor 2')).toBeVisible();
  });
});
```

## Authentication Mock

```typescript
test.describe('Authenticated routes', () => {
  test.beforeEach(async ({ page, context }) => {
    // Session mock
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

    // Token mock (if using localStorage)
    await context.addInitScript(() => {
      localStorage.setItem('access-token', 'mock-token');
    });
  });
});
```

## Selectors

### By Role (Recommended)

```typescript
// Buttons
await page.getByRole('button', { name: 'Save' }).click();
await page.getByRole('button', { name: /cancel/i }).click();

// Links
await page.getByRole('link', { name: 'Home' }).click();

// Inputs
await page.getByRole('textbox', { name: 'Email' }).fill('test@test.com');
await page.getByRole('checkbox', { name: 'Accept terms' }).check();

// Headings
await expect(page.getByRole('heading', { name: 'Visitors' })).toBeVisible();

// Lists
await expect(page.getByRole('listitem')).toHaveCount(5);
```

### By Label

```typescript
await page.getByLabel('Name').fill('John');
await page.getByLabel('Email').fill('john@test.com');
await page.getByLabel('Password').fill('password123');
```

### By Placeholder

```typescript
await page.getByPlaceholder('Search...').fill('query');
```

### By Test ID

```typescript
// In template: data-testid="visitor-card"
await page.getByTestId('visitor-card').click();
await expect(page.getByTestId('loading-spinner')).not.toBeVisible();
```

### By CSS/Locator

```typescript
// CSS class
await page.locator('.visitor-card').first().click();

// Combination
await page.locator('.visitor-card').filter({ hasText: 'Visitor 1' }).click();

// nth selector
await page.locator('.visitor-card').nth(2).click();
```

## Assertions

```typescript
// Visibility
await expect(page.getByText('Welcome')).toBeVisible();
await expect(page.getByTestId('error')).not.toBeVisible();
await expect(page.locator('.modal')).toBeHidden();

// Content
await expect(page.locator('.title')).toHaveText('Visitors');
await expect(page.locator('.count')).toContainText('10');

// Attributes
await expect(page.getByRole('button')).toBeEnabled();
await expect(page.getByRole('button')).toBeDisabled();
await expect(page.locator('input')).toHaveValue('test@test.com');
await expect(page.locator('.card')).toHaveClass(/active/);

// Count
await expect(page.locator('.item')).toHaveCount(5);

// URL
await expect(page).toHaveURL('/visitors');
await expect(page).toHaveURL(/\/visitors\/\d+/);

// Screenshot
await expect(page).toHaveScreenshot('visitors-page.png');
```

## Interactions

```typescript
// Click
await page.getByRole('button', { name: 'Submit' }).click();
await page.getByRole('button').dblclick();
await page.locator('.menu').click({ button: 'right' });

// Forms
await page.getByLabel('Name').fill('John');
await page.getByLabel('Name').clear();
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

## Waits

```typescript
// Wait for element
await page.waitForSelector('.loaded');

// Wait for navigation
await Promise.all([
  page.waitForNavigation(),
  page.getByRole('link', { name: 'Home' }).click(),
]);

// Wait for API response
await page.waitForResponse('**/api/visitors');

// Wait for condition
await expect(page.locator('.spinner')).not.toBeVisible({ timeout: 10000 });

// Wait for fixed time (avoid if possible)
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
    await this.page.getByPlaceholder('Search').fill(query);
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

// In test
test.describe('Visitors', () => {
  test('should filter visitors', async ({ page }) => {
    const visitorsPage = new VisitorsPage(page);

    await visitorsPage.goto();
    await visitorsPage.search('John');

    expect(await visitorsPage.getVisitorCount()).toBe(1);
  });
});
```

## Configuration

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

## Nx Commands

```bash
# Run E2E
nx e2e console-e2e

# With Playwright UI
nx e2e console-e2e --ui

# Debug
nx e2e console-e2e --debug

# Headed (see browser)
nx e2e console-e2e --headed

# Specific test
nx e2e console-e2e --grep "visitors"
```

## Naming Rules

| Element | Pattern | Example |
|---------|---------|---------|
| File | `{feature}.spec.ts` | `visitors.spec.ts` |
| describe | Feature | `test.describe('Visitors', ...)` |
| test | Behavior | `test('should display list', ...)` |
| Page Object | `{Page}Page` | `VisitorsPage` |

## Anti-patterns

- Fragile selectors (use roles and labels)
- `waitForTimeout` instead of assertions
- Tests that depend on order
- Not mocking external APIs
- Tests without cleanup
- Screenshots in every test (only on-failure)
