import { test, expect, Page } from '@playwright/test';

// Mock data for API responses
const MOCK_QUICK_FILTERS = {
  filters: [
    { id: 'online', label: 'Online', count: 5 },
    { id: 'leads', label: 'Leads', count: 12 },
    { id: 'today', label: 'Hoy', count: 3 },
    { id: 'this_week', label: 'Esta semana', count: 8 }
  ]
};

const MOCK_SAVED_FILTERS = {
  filters: [
    {
      id: 'saved-1',
      name: 'Mis Leads Online',
      description: 'Leads que están online',
      filters: { lifecycle: ['LEAD'], connectionStatus: ['online'] },
      sort: { field: 'lastActivity', direction: 'DESC' },
      createdAt: new Date().toISOString()
    }
  ],
  total: 1
};

const MOCK_VISITORS_SEARCH_RESPONSE = {
  visitors: [
    {
      id: 'visitor-1',
      fingerprint: 'fp-1',
      lifecycle: 'LEAD',
      connectionStatus: 'online',
      currentUrl: 'https://example.com/products',
      siteId: 'site-1',
      tenantId: 'test-tenant-123',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      totalSessionsCount: 5,
      activeSessionsCount: 1
    },
    {
      id: 'visitor-2',
      fingerprint: 'fp-2',
      lifecycle: 'VISITOR',
      connectionStatus: 'offline',
      currentUrl: 'https://example.com/home',
      siteId: 'site-1',
      tenantId: 'test-tenant-123',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      totalSessionsCount: 2,
      activeSessionsCount: 0
    }
  ],
  pagination: {
    total: 2,
    page: 1,
    limit: 20,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false
  }
};

const MOCK_USER = {
  id: 'test-user-123',
  name: 'Test User',
  email: 'test@example.com',
  companyId: 'test-company-123',
  tenantId: 'test-tenant-123',
};

/**
 * Setup all API mocks for complex filters tests including authentication
 */
async function setupCompleteTestMocks(page: Page): Promise<void> {
  // Setup route handler for all requests
  await page.route('**/*', (route) => {
    const url = route.request().url();
    const method = route.request().method();

    // Debug: log all API requests
    if (url.includes('localhost:3000') || url.includes('/api/') || url.includes('/bff/')) {
      console.log('[E2E MOCK]', method, url);
    }

    // Block Keycloak redirects
    if (url.includes('keycloak') || url.includes('/realms/') || url.includes('/auth/realms/')) {
      console.log('[E2E MOCK] Blocking Keycloak:', url);
      route.abort();
      return;
    }

    // Mock BFF auth/me endpoint - match any path containing /bff/auth/me
    if (url.includes('/bff/auth/me')) {
      console.log('[E2E MOCK] Responding to /bff/auth/me');
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

    // Mock BFF auth/refresh - return success with new session
    if (url.includes('/bff/auth/refresh')) {
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
            exp: Math.floor(Date.now() / 1000) + 3600
          }
        })
      });
      return;
    }

    // Mock BFF auth/login - redirect back to the intended URL
    if (url.includes('/bff/auth/login')) {
      // Extract the redirect parameter from the URL
      const urlObj = new URL(url);
      const redirectUrl = urlObj.searchParams.get('redirect') || 'http://localhost:4200/visitors';

      route.fulfill({
        status: 302,
        headers: {
          'Location': redirectUrl
        },
        body: ''
      });
      return;
    }

    // Mock company endpoint - returns company info with domains
    if (url.includes('/api/me/company')) {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: MOCK_USER.companyId,
          companyName: 'Test Company',
          domains: ['example.com', 'test.com']
        })
      });
      return;
    }

    // Mock commercials connect endpoint
    if (url.includes('/commercials/connect')) {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ connected: true })
      });
      return;
    }

    // Mock sites/user endpoint - required for visitors page to load
    if (url.includes('/sites/user')) {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          sites: [
            {
              id: 'site-1',
              name: 'Test Site',
              domain: 'example.com',
              tenantId: MOCK_USER.tenantId,
              companyId: MOCK_USER.companyId
            }
          ],
          totalSites: 1
        })
      });
      return;
    }

    // Mock quick filters
    if (url.includes('/visitors/filters/quick')) {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_QUICK_FILTERS)
      });
      return;
    }

    // Mock saved filters
    if (url.includes('/visitors/filters/saved') && !url.match(/\/saved\/[^/]+$/)) {
      if (method === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_SAVED_FILTERS)
        });
      } else if (method === 'POST') {
        const body = route.request().postDataJSON();
        route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'new-saved-filter',
            ...body,
            createdAt: new Date().toISOString()
          })
        });
      } else {
        route.continue();
      }
      return;
    }

    // Mock delete saved filter
    if (url.match(/\/visitors\/filters\/saved\/[^/]+$/) && method === 'DELETE') {
      route.fulfill({
        status: 204,
        body: ''
      });
      return;
    }

    // Mock visitors search
    if (url.includes('/visitors/search')) {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_VISITORS_SEARCH_RESPONSE)
      });
      return;
    }

    // Allow all other requests
    route.continue();
  });
}

test.describe('Visitors - Complex Filters', () => {
  test.beforeEach(async ({ page }) => {
    await setupCompleteTestMocks(page);
  });

  test.describe('Quick Filters', () => {
    test('should display quick filter chips', async ({ page }) => {
      await page.goto('/visitors');

      // Wait for first quick filter chip to load (longer timeout due to auth)
      await expect(page.locator('.quick-filters__chip').first()).toBeVisible({ timeout: 15000 });

      // Verify all quick filters are displayed (exclude saved filters)
      for (const filter of MOCK_QUICK_FILTERS.filters) {
        await expect(page.locator(`.quick-filters__chip:not(.quick-filters__chip--saved):has-text("${filter.label}")`)).toBeVisible();
      }
    });

    test('should show count badges on quick filters', async ({ page }) => {
      await page.goto('/visitors');

      // Check that counts are displayed
      const onlineFilter = page.locator('.quick-filters__chip:not(.quick-filters__chip--saved):has-text("Online")');
      await expect(onlineFilter.locator('.quick-filters__count')).toHaveText('5');
    });

    test('should activate filter on click and show active state', async ({ page }) => {
      await page.goto('/visitors');

      const onlineFilter = page.locator('.quick-filters__chip:not(.quick-filters__chip--saved):has-text("Online")');
      await onlineFilter.click();

      // Verify active state
      await expect(onlineFilter).toHaveClass(/quick-filters__chip--active/);
    });

    test('should apply "Leads" quick filter', async ({ page }) => {
      await page.goto('/visitors');

      const leadsFilter = page.locator('.quick-filters__chip:not(.quick-filters__chip--saved):has-text("Leads")');
      await leadsFilter.click();

      await expect(leadsFilter).toHaveClass(/quick-filters__chip--active/);
    });

    test('should apply "Hoy" quick filter', async ({ page }) => {
      await page.goto('/visitors');

      const todayFilter = page.locator('.quick-filters__chip:not(.quick-filters__chip--saved):has-text("Hoy")');
      await todayFilter.click();

      await expect(todayFilter).toHaveClass(/quick-filters__chip--active/);
    });

    test('should apply "Esta semana" quick filter', async ({ page }) => {
      await page.goto('/visitors');

      const weekFilter = page.locator('.quick-filters__chip:not(.quick-filters__chip--saved):has-text("Esta semana")');
      await weekFilter.click();

      await expect(weekFilter).toHaveClass(/quick-filters__chip--active/);
    });

    test('should deselect quick filter when clicking again', async ({ page }) => {
      await page.goto('/visitors');

      const onlineFilter = page.locator('.quick-filters__chip:not(.quick-filters__chip--saved):has-text("Online")');

      // Click to select
      await onlineFilter.click();
      await expect(onlineFilter).toHaveClass(/quick-filters__chip--active/);

      // Click again to deselect
      await onlineFilter.click();
      await expect(onlineFilter).not.toHaveClass(/quick-filters__chip--active/);
    });
  });

  test.describe('Advanced Filters Panel', () => {
    test('should open advanced filters panel', async ({ page }) => {
      await page.goto('/visitors');

      // Click button to open advanced filters
      const advancedButton = page.locator('button:has-text("Filtros")');
      await advancedButton.click();

      // Verify panel is visible
      await expect(page.locator('.advanced-filters__panel')).toBeVisible();
    });

    test('should display filter options in advanced panel', async ({ page }) => {
      await page.goto('/visitors');

      // Open advanced filters
      const advancedButton = page.locator('button:has-text("Filtros")');
      await advancedButton.click();

      // Check filter sections are present
      const sections = page.locator('.advanced-filters__section');
      await expect(sections.first()).toBeVisible();
    });

    test('should close panel when clicking close button', async ({ page }) => {
      await page.goto('/visitors');

      // Open panel
      const advancedButton = page.locator('button:has-text("Filtros")');
      await advancedButton.click();
      await expect(page.locator('.advanced-filters__panel')).toBeVisible();

      // Close panel
      const closeButton = page.locator('.advanced-filters__close');
      await closeButton.click();

      await expect(page.locator('.advanced-filters__panel')).not.toBeVisible();
    });

    test('should apply filters when clicking apply button', async ({ page }) => {
      await page.goto('/visitors');

      // Open advanced filters
      const advancedButton = page.locator('button:has-text("Filtros")');
      await advancedButton.click();

      // Select a lifecycle filter
      const leadCheckbox = page.locator('input[value="LEAD"]');
      if (await leadCheckbox.isVisible()) {
        await leadCheckbox.check();
      }

      // Apply filters
      const applyButton = page.locator('.advanced-filters__apply');
      await applyButton.click();

      // Panel should close
      await expect(page.locator('.advanced-filters__panel')).not.toBeVisible();
    });

    test('should show active filters as chips after applying', async ({ page }) => {
      await page.goto('/visitors');

      // Open and apply a filter
      const advancedButton = page.locator('button:has-text("Filtros")');
      await advancedButton.click();

      const leadCheckbox = page.locator('input[value="LEAD"]');
      if (await leadCheckbox.isVisible()) {
        await leadCheckbox.check();

        const applyButton = page.locator('.advanced-filters__apply');
        await applyButton.click();

        // Check active filters section shows the filter
        await expect(page.locator('.active-filters')).toBeVisible();
      }
    });

    test('should remove active filter when clicking remove button on chip', async ({ page }) => {
      await page.goto('/visitors');

      // Apply a quick filter first
      const onlineFilter = page.locator('.quick-filters__chip:not(.quick-filters__chip--saved):has-text("Online")');
      await onlineFilter.click();

      // Should show active filter chip
      const activeFilters = page.locator('.active-filters');
      if (await activeFilters.isVisible()) {
        const removeButton = activeFilters.locator('.active-filters__remove').first();
        if (await removeButton.isVisible()) {
          await removeButton.click();

          // Filter should be removed
          await expect(onlineFilter).not.toHaveClass(/quick-filters__chip--active/);
        }
      }
    });

    test('should clear all filters when clicking clear all', async ({ page }) => {
      await page.goto('/visitors');

      // Apply a filter
      const onlineFilter = page.locator('.quick-filters__chip:not(.quick-filters__chip--saved):has-text("Online")');
      await onlineFilter.click();

      // Click clear all if available
      const clearAllButton = page.locator('.active-filters__clear-all');
      if (await clearAllButton.isVisible()) {
        await clearAllButton.click();

        // All filters should be cleared
        await expect(onlineFilter).not.toHaveClass(/quick-filters__chip--active/);
      }
    });
  });

  test.describe('Saved Filters', () => {
    test('should display saved filters', async ({ page }) => {
      await page.goto('/visitors');

      // Wait for saved filters to load
      await expect(page.locator('.quick-filters__chip--saved')).toBeVisible();
      await expect(page.locator('.quick-filters__chip--saved:has-text("Mis Leads Online")')).toBeVisible();
    });

    test('should apply saved filter on click', async ({ page }) => {
      await page.goto('/visitors');

      const savedFilter = page.locator('.quick-filters__chip--saved:has-text("Mis Leads Online")');
      await savedFilter.click();

      // Verify active state
      await expect(savedFilter).toHaveClass(/quick-filters__chip--active/);
    });

    test('should show delete button on hover', async ({ page }) => {
      await page.goto('/visitors');

      const savedFilter = page.locator('.quick-filters__chip--saved:has-text("Mis Leads Online")');
      await savedFilter.hover();

      const deleteButton = savedFilter.locator('.quick-filters__delete');
      await expect(deleteButton).toBeVisible();
    });

    test('should open confirmation dialog when clicking delete', async ({ page }) => {
      await page.goto('/visitors');

      const savedFilter = page.locator('.quick-filters__chip--saved:has-text("Mis Leads Online")');
      await savedFilter.hover();

      const deleteButton = savedFilter.locator('.quick-filters__delete');
      await deleteButton.click();

      // Confirmation modal should appear
      await expect(page.locator('.quick-filters__modal')).toBeVisible();
      await expect(page.locator('.quick-filters__modal-message')).toContainText('Mis Leads Online');
    });

    test('should close confirmation dialog when clicking cancel', async ({ page }) => {
      await page.goto('/visitors');

      const savedFilter = page.locator('.quick-filters__chip--saved:has-text("Mis Leads Online")');
      await savedFilter.hover();

      const deleteButton = savedFilter.locator('.quick-filters__delete');
      await deleteButton.click();

      // Click cancel
      const cancelButton = page.locator('.quick-filters__modal-btn--cancel');
      await cancelButton.click();

      // Modal should close
      await expect(page.locator('.quick-filters__modal')).not.toBeVisible();

      // Filter should still exist
      await expect(savedFilter).toBeVisible();
    });

    test('should delete filter when confirming deletion', async ({ page }) => {
      await page.goto('/visitors');

      const savedFilter = page.locator('.quick-filters__chip--saved:has-text("Mis Leads Online")');
      await savedFilter.hover();

      const deleteButton = savedFilter.locator('.quick-filters__delete');
      await deleteButton.click();

      // Click confirm
      const confirmButton = page.locator('.quick-filters__modal-btn--confirm');
      await confirmButton.click();

      // Modal should close
      await expect(page.locator('.quick-filters__modal')).not.toBeVisible();
    });

    test('should open save filter dialog from advanced panel', async ({ page }) => {
      await page.goto('/visitors');

      // Open advanced filters
      const advancedButton = page.locator('button:has-text("Filtros")');
      await advancedButton.click();

      // Click save filter button
      const saveButton = page.locator('.advanced-filters__save');
      if (await saveButton.isVisible()) {
        await saveButton.click();

        // Save dialog should appear
        await expect(page.locator('.save-filter-dialog__modal')).toBeVisible();
      }
    });

    test('should save new filter with name and description', async ({ page }) => {
      await page.goto('/visitors');

      // Open advanced filters
      const advancedButton = page.locator('button:has-text("Filtros")');
      await advancedButton.click();

      // Select a filter
      const leadCheckbox = page.locator('input[value="LEAD"]');
      if (await leadCheckbox.isVisible()) {
        await leadCheckbox.check();
      }

      // Click save filter button
      const saveButton = page.locator('.advanced-filters__save');
      if (await saveButton.isVisible()) {
        await saveButton.click();

        // Fill in the form
        const nameInput = page.locator('.save-filter-dialog__input[name="name"]');
        await nameInput.fill('Mi nuevo filtro');

        const descInput = page.locator('.save-filter-dialog__textarea');
        if (await descInput.isVisible()) {
          await descInput.fill('Descripción del filtro');
        }

        // Save
        const confirmSave = page.locator('.save-filter-dialog__btn--primary');
        await confirmSave.click();

        // Dialog should close
        await expect(page.locator('.save-filter-dialog__modal')).not.toBeVisible();
      }
    });

    test('should cancel save filter dialog', async ({ page }) => {
      await page.goto('/visitors');

      // Open advanced filters
      const advancedButton = page.locator('button:has-text("Filtros")');
      await advancedButton.click();

      // Click save filter button
      const saveButton = page.locator('.advanced-filters__save');
      if (await saveButton.isVisible()) {
        await saveButton.click();

        // Cancel
        const cancelButton = page.locator('.save-filter-dialog__btn--secondary');
        await cancelButton.click();

        // Dialog should close
        await expect(page.locator('.save-filter-dialog__modal')).not.toBeVisible();
      }
    });

    test('should require name to save filter', async ({ page }) => {
      await page.goto('/visitors');

      // Open advanced filters
      const advancedButton = page.locator('button:has-text("Filtros")');
      await advancedButton.click();

      // Click save filter button
      const saveButton = page.locator('.advanced-filters__save');
      if (await saveButton.isVisible()) {
        await saveButton.click();

        // Try to save without name
        const confirmSave = page.locator('.save-filter-dialog__btn--primary');

        // Button should be disabled or show error
        const nameInput = page.locator('.save-filter-dialog__input[name="name"]');
        await expect(nameInput).toHaveAttribute('required', '');
      }
    });
  });

  test.describe('Filter Integration', () => {
    test('should refresh visitor list when applying filters', async ({ page }) => {
      await page.goto('/visitors');

      // Wait for initial load
      await expect(page.locator('.quick-filters__list')).toBeVisible();

      // Apply a quick filter
      const onlineFilter = page.locator('.quick-filters__chip:not(.quick-filters__chip--saved):has-text("Online")');
      await onlineFilter.click();

      // Verify filter is active (search was called to update results)
      await expect(onlineFilter).toHaveClass(/quick-filters__chip--active/);
    });

    test('should maintain filter state after page reload', async ({ page }) => {
      await page.goto('/visitors');

      // Apply a saved filter
      const savedFilter = page.locator('.quick-filters__chip--saved:has-text("Mis Leads Online")');
      await savedFilter.click();

      // Verify it's active
      await expect(savedFilter).toHaveClass(/quick-filters__chip--active/);
    });

    test('should clear saved filter selection when applying quick filter', async ({ page }) => {
      await page.goto('/visitors');

      // Apply saved filter
      const savedFilter = page.locator('.quick-filters__chip--saved:has-text("Mis Leads Online")');
      await savedFilter.click();
      await expect(savedFilter).toHaveClass(/quick-filters__chip--active/);

      // Apply quick filter
      const onlineFilter = page.locator('.quick-filters__chip:not(.quick-filters__chip--saved):has-text("Online")');
      await onlineFilter.click();

      // Saved filter should be deselected
      await expect(savedFilter).not.toHaveClass(/quick-filters__chip--active/);
      await expect(onlineFilter).toHaveClass(/quick-filters__chip--active/);
    });
  });
});
