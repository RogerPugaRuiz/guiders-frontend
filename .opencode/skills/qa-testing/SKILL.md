---
name: qa-testing
description: QA specialist agent for creating and maintaining E2E, unit, and integration tests in this Angular/Nx project. Covers test strategy, best practices, and automation patterns.
license: MIT
compatibility: opencode
metadata:
  audience: developers
  workflow: qa-testing
---

# QA Testing Specialist

## What I do

I am the QA testing specialist for this Angular 20 + Nx 21 monorepo. I help create, maintain, and debug tests at all levels: unit, integration, and E2E (Playwright).

## Project testing architecture

### Test types and locations

| Type | Framework | Location | Purpose |
|------|-----------|----------|---------|
| Unit | Vitest | `**/*.spec.ts` alongside source | Fast isolated testing of services, components |
| Integration | Vitest | `**/*.integration.spec.ts` | Testing component interaction |
| E2E | Playwright | `apps/*-e2e/src/*.spec.ts` | Full browser testing of user flows |

### Key commands

```bash
# Unit tests
npm run test                    # All unit tests
nx test <project>               # Test specific project
nx test <project> --testFile=filename  # Single test file
nx test <project> -- --grep "pattern"  # Run tests matching pattern

# E2E tests (Playwright)
npm run e2e                    # All E2E
nx e2e console-e2e             # Console E2E only
nx e2e admin-e2e              # Admin E2E only
nx e2e <project> --ui          # Interactive Playwright UI

# Lint (includes test rules)
npm run lint
```

## When to use me

Load this skill when:
- Creating new tests (unit, integration, or E2E)
- Debugging failing tests
- Improving test coverage
- Adding assertions to existing tests
- Setting up test infrastructure

## How to write tests in this project

### Unit tests (Vitest + Angular)

```typescript
// libs/chat/features/visitors/src/lib/visitors/visitors.component.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { VisitorsComponent } from './visitors.component';

describe('VisitorsComponent', () => {
  let component: VisitorsComponent;
  let fixture: ComponentFixture<VisitorsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VisitorsComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(VisitorsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
```

### Integration tests

```typescript
// libs/chat/features/visitors/src/lib/visitors.integration.spec.ts
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { VisitorsComponent } from './visitors.component';
import { VisitorsDataService } from '@guiders-frontend/visitors-data-service';

describe('VisitorsComponent + DataService', () => {
  let mockService: jasmine.SpyObj<VisitorsDataService>;

  beforeEach(async () => {
    mockService = jasmine.createSpyObj('VisitorsDataService', ['loadVisitors']);

    await TestBed.configureTestingModule({
      imports: [VisitorsComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: VisitorsDataService, useValue: mockService },
      ],
    }).compileComponents();
  });

  it('should call loadVisitors on init', () => {
    const fixture = TestBed.createComponent(VisitorsComponent);
    fixture.detectChanges();
    expect(mockService.loadVisitors).toHaveBeenCalled();
  });
});
```

### E2E tests (Playwright)

```typescript
// apps/console-e2e/src/visitors-infinite-scroll.spec.ts
import { test, expect, Page } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth.helper';

test.describe('Visitors - Infinite Scroll', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/visitors');
  });

  test('should load more visitors on scroll', async ({ page }) => {
    await expect(
      page.locator('.visitors-list, [data-testid="visitors-list"]').first()
    ).toBeVisible({ timeout: 20_000 });

    const initialRows = page.locator('.visitors-table__row:not(.visitors-table__row--skeleton)');
    await expect(initialRows).toHaveCount(25); // batchSize
  });
});
```

## Testing best practices

### Do

- Use `input()` / `output()` signal-based APIs in Angular components
- Use `ChangeDetectionStrategy.OnPush` and call `fixture.detectChanges()` when needed
- Use `provideHttpClient()` with `withFetch()` for HttpClient in tests
- Mock services with `jasmine.createSpyObj` or Jest mocks
- Use `fakeAsync` + `tick()` for async operations in unit tests
- Clean up after tests (unsubscribe, clear localStorage)

### Don't

- Don't access private properties/methods in unit tests — test public API
- Don't use `ng.getInjector()` in E2E tests — this is Angular internals and unreliable in CI
- Don't use fixed timeouts (`waitForTimeout`) when you can use `expect.poll` or `waitForFunction`
- Don't test implementation details — test user-visible behavior
- Don't use relative imports between libraries — use path aliases (`@guiders-frontend/...`)

### Assertion patterns

```typescript
// Angular signals
expect(component.mySignal()).toBe(expectedValue);

// Observables (use fakeAsync or TestBed)
tick();
expect(mockService.method).toHaveBeenCalledWith(expectedArg);

// DOM visibility
await expect(page.locator('.my-element')).toBeVisible({ timeout: 15000 });
await expect(page.locator('.my-element')).toHaveCount(5);

// Wait for network idle
await page.waitForLoadState('networkidle');

// State-based polling instead of fixed timeout
await expect.poll(async () => await getServiceState(page)).toBe(expected);
```

## Test file naming conventions

| Type | Pattern | Example |
|------|---------|---------|
| Unit | `*.spec.ts` | `visitors.component.spec.ts` |
| Integration | `*.integration.spec.ts` | `visitors.integration.spec.ts` |
| E2E | `*-*.spec.ts` | `visitors-infinite-scroll.spec.ts` |

## Debugging tests

### Unit test debugging

```bash
# Run single test file with watch
nx test chat-visitors --testFile=visitors.component.spec.ts --watch

# With grep
nx test chat-visitors -- --grep "should load visitors"
```

### E2E debugging

```bash
# Open Playwright UI
nx e2e console-e2e --ui

# Run single spec
npx playwright test --config=apps/console-e2e/playwright.config.ts \
  --project=chromium \
  apps/console-e2e/src/visitors-infinite-scroll.spec.ts

# Show report
npx playwright show-report dist/.playwright/apps/console-e2e/playwright-report
```

## Common issues and solutions

### "ng.getInjector is not available"

This Angular internal is not reliably available in CI. **Do not use it in tests.** Instead:
- For E2E, use `addInitScript` for pre-Angular-boot operations
- For unit tests, use Angular's TestBed to inject services

### "Test timeout in CI but passes locally"

- CI runners are slower — increase timeouts: `timeout: 20_000` instead of `timeout: 5_000`
- Use `expect.poll` for async assertions instead of fixed delays
- Check if tests depend on timing (e.g., animation frames)

### "Flaky tests due to race conditions"

```typescript
// Bad — fixed delay
await page.waitForTimeout(2000);
await expect(page.locator('.element')).toBeVisible();

// Better — wait for state change
await expect(page.locator('.loading')).toBeHidden();
await expect(page.locator('.element')).toBeVisible();

// Best — poll until condition is met
await expect.poll(async () => {
  const count = await page.locator('.element').count();
  return count > 0;
}, { timeout: 15000 }).toBe(true);
```

### "Cannot access private Angular services"

Use TestBed to provide mock implementations:

```typescript
// Instead of accessing private service via ng.getInjector
const service = TestBed.inject(MyPrivateService);
// or
mockService = jasmine.createSpyObj('MyService', ['method']);
TestBed.configureTestingModule({
  providers: [{ provide: MyPrivateService, useValue: mockService }],
});
```

## Test coverage strategy

### High priority (always test)
- Services with business logic
- Forms and validation
- Auth guards and interceptors
- Error handling paths

### Medium priority (test common cases)
- Component rendering
- User interactions
- API calls and responses

### Low priority (E2E only)
- Visual styling (use visual regression tools)
- Complex animations
- Cross-browser behavior

## Test data management

### Seeded E2E data

Backend provides E2E seed with:
- Admin user: `admin@e2e.guiders.local` / `E2eAdmin123!`
- 50 visitors (CI) or 150 visitors (local)
- Sample conversations and contacts

### Mocking in unit tests

```typescript
// Mock a service
const mockChatService = jasmine.createSpyObj('ChatService', [
  'sendMessage',
  'getMessages',
]);
mockChatService.sendMessage.and.returnValue(of({ id: '123', text: 'Hello' }));

// Provide in TestBed
TestBed.configureTestingModule({
  providers: [{ provide: ChatService, useValue: mockChatService }],
});
```

## Integration with CI

E2E tests run in GitHub Actions after each push. See `.github/workflows/e2e.yml` for:
- Docker E2E stack setup
- Playwright browser installation
- Test execution and reporting

Unit tests run on PR via `nx affected -t test`.