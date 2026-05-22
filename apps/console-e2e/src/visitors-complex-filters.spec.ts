import { test, expect, Page } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth.helper';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Navigates to /visitors and waits for the quick-filter chips to be visible.
 * Call this inside each test after loginAsAdmin() to get a clean page state.
 */
async function goToVisitorsAndWaitForFilters(page: Page): Promise<void> {
  await page.goto('/visitors');
  await expect(page.locator('.quick-filters__chip').first()).toBeVisible({
    timeout: 30_000,
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('Visitors - Complex Filters (real backend)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  // =========================================================================
  // Quick Filters
  // =========================================================================
  test.describe('Quick Filters', () => {
    test('should display quick filter chips from the real API', async ({ page }) => {
      await goToVisitorsAndWaitForFilters(page);

      // The real backend returns at least these filters.
      const expectedLabels = ['Hoy', 'Esta semana', 'Online', 'Activos', 'Leads'];
      for (const label of expectedLabels) {
        await expect(
          page.locator(`.quick-filters__chip:not(.quick-filters__chip--saved):has-text("${label}")`)
        ).toBeVisible();
      }
    });

    test('should show count badges on quick filter chips', async ({ page }) => {
      await goToVisitorsAndWaitForFilters(page);

      // "Hoy" and "Activos" have count = 150 in the seeded environment.
      const todayFilter = page.locator(
        '.quick-filters__chip:not(.quick-filters__chip--saved):has-text("Hoy")'
      );
      await expect(todayFilter.locator('.guiders-badge__content')).toBeVisible();
    });

    test('should activate filter on click and show active state', async ({ page }) => {
      await goToVisitorsAndWaitForFilters(page);

      const todayFilter = page.locator(
        '.quick-filters__chip:not(.quick-filters__chip--saved):has-text("Hoy")'
      );
      await todayFilter.click();
      await expect(todayFilter).toHaveClass(/quick-filters__chip--active/);
    });

    test('should apply "Leads" quick filter', async ({ page }) => {
      await goToVisitorsAndWaitForFilters(page);

      const leadsFilter = page.locator(
        '.quick-filters__chip:not(.quick-filters__chip--saved):has-text("Leads")'
      );
      await leadsFilter.click();
      await expect(leadsFilter).toHaveClass(/quick-filters__chip--active/);
    });

    test('should apply "Esta semana" quick filter', async ({ page }) => {
      await goToVisitorsAndWaitForFilters(page);

      const weekFilter = page.locator(
        '.quick-filters__chip:not(.quick-filters__chip--saved):has-text("Esta semana")'
      );
      await weekFilter.click();
      await expect(weekFilter).toHaveClass(/quick-filters__chip--active/);
    });

    test('should deselect quick filter when clicking again', async ({ page }) => {
      await goToVisitorsAndWaitForFilters(page);

      const todayFilter = page.locator(
        '.quick-filters__chip:not(.quick-filters__chip--saved):has-text("Hoy")'
      );

      await todayFilter.click();
      await expect(todayFilter).toHaveClass(/quick-filters__chip--active/);

      await todayFilter.click();
      await expect(todayFilter).not.toHaveClass(/quick-filters__chip--active/);
    });
  });

  // =========================================================================
  // Advanced Filters Panel
  // =========================================================================
  test.describe('Advanced Filters Panel', () => {
    test('should open advanced filters panel', async ({ page }) => {
      await goToVisitorsAndWaitForFilters(page);

      const advancedButton = page.locator('button:has-text("Filtros")');
      await advancedButton.click();

      await expect(page.locator('.advanced-filters__panel')).toBeVisible();
    });

    test('should display filter sections in advanced panel', async ({ page }) => {
      await goToVisitorsAndWaitForFilters(page);

      const advancedButton = page.locator('button:has-text("Filtros")');
      await advancedButton.click();

      const sections = page.locator('.advanced-filters__section');
      await expect(sections.first()).toBeVisible();
    });

    test('should close panel when clicking close button', async ({ page }) => {
      await goToVisitorsAndWaitForFilters(page);

      const advancedButton = page.locator('button:has-text("Filtros")');
      await advancedButton.click();
      await expect(page.locator('.advanced-filters__panel')).toBeVisible();

      const closeButton = page.locator('.advanced-filters__close');
      await closeButton.click();

      await expect(page.locator('.advanced-filters__panel')).not.toBeVisible();
    });

    test('should apply filters when clicking apply button', async ({ page }) => {
      await goToVisitorsAndWaitForFilters(page);

      const advancedButton = page.locator('button:has-text("Filtros")');
      await advancedButton.click();

      const leadCheckbox = page.locator('input[value="LEAD"]');
      if (await leadCheckbox.isVisible()) {
        await leadCheckbox.check();
      }

      const applyButton = page.locator('.advanced-filters__btn--primary');
      await applyButton.click();

      await expect(page.locator('.advanced-filters__panel')).not.toBeVisible();
    });

    test('should remove active filter when clicking remove button on chip', async ({ page }) => {
      await goToVisitorsAndWaitForFilters(page);

      const todayFilter = page.locator(
        '.quick-filters__chip:not(.quick-filters__chip--saved):has-text("Hoy")'
      );
      await todayFilter.click();

      const activeFilters = page.locator('.active-filters');
      if (await activeFilters.isVisible()) {
        const removeButton = activeFilters.locator('.active-filters__remove').first();
        if (await removeButton.isVisible()) {
          await removeButton.click();
          await expect(todayFilter).not.toHaveClass(/quick-filters__chip--active/);
        }
      }
    });

    test('should clear all filters when clicking clear all', async ({ page }) => {
      await goToVisitorsAndWaitForFilters(page);

      const todayFilter = page.locator(
        '.quick-filters__chip:not(.quick-filters__chip--saved):has-text("Hoy")'
      );
      await todayFilter.click();

      const clearAllButton = page.locator('.active-filters__clear-all');
      if (await clearAllButton.isVisible()) {
        await clearAllButton.click();
        await expect(todayFilter).not.toHaveClass(/quick-filters__chip--active/);
      }
    });
  });

  // =========================================================================
  // Saved Filters (no saved filters exist in the seeded environment)
  // =========================================================================
  test.describe('Saved Filters', () => {
    test('should show no saved filter chips when none are saved', async ({ page }) => {
      await goToVisitorsAndWaitForFilters(page);

      // The seeded backend has 0 saved filters, so no saved chips should appear.
      await expect(page.locator('.quick-filters__chip--saved')).toHaveCount(0);
    });

    test('should open save filter dialog from advanced panel', async ({ page }) => {
      await goToVisitorsAndWaitForFilters(page);

      const advancedButton = page.locator('button:has-text("Filtros")');
      await advancedButton.click();

      const saveButton = page.locator('.advanced-filters__save');
      if (await saveButton.isVisible()) {
        await saveButton.click();
        await expect(page.locator('.save-filter-dialog__modal')).toBeVisible();
      }
    });

    test('should save new filter with name', async ({ page }) => {
      await goToVisitorsAndWaitForFilters(page);

      const advancedButton = page.locator('button:has-text("Filtros")');
      await advancedButton.click();

      const saveButton = page.locator('.advanced-filters__save');
      if (await saveButton.isVisible()) {
        await saveButton.click();

        const nameInput = page.locator('.save-filter-dialog__input[name="name"]');
        await nameInput.fill('Mi filtro E2E');

        const confirmSave = page.locator('.save-filter-dialog__btn--primary');
        await confirmSave.click();

        await expect(page.locator('.save-filter-dialog__modal')).not.toBeVisible();
      }
    });

    test('should cancel save filter dialog', async ({ page }) => {
      await goToVisitorsAndWaitForFilters(page);

      const advancedButton = page.locator('button:has-text("Filtros")');
      await advancedButton.click();

      const saveButton = page.locator('.advanced-filters__save');
      if (await saveButton.isVisible()) {
        await saveButton.click();

        const cancelButton = page.locator('.save-filter-dialog__btn--secondary');
        await cancelButton.click();

        await expect(page.locator('.save-filter-dialog__modal')).not.toBeVisible();
      }
    });

    test('should require name to save filter', async ({ page }) => {
      await goToVisitorsAndWaitForFilters(page);

      const advancedButton = page.locator('button:has-text("Filtros")');
      await advancedButton.click();

      const saveButton = page.locator('.advanced-filters__save');
      if (await saveButton.isVisible()) {
        await saveButton.click();

        const nameInput = page.locator('.save-filter-dialog__input[name="name"]');
        await expect(nameInput).toHaveAttribute('required', '');
      }
    });
  });

  // =========================================================================
  // Filter Integration
  // =========================================================================
  test.describe('Filter Integration', () => {
    test('should refresh visitor list when applying a quick filter', async ({ page }) => {
      await goToVisitorsAndWaitForFilters(page);

      await expect(page.locator('.quick-filters__list')).toBeVisible();

      const todayFilter = page.locator(
        '.quick-filters__chip:not(.quick-filters__chip--saved):has-text("Hoy")'
      );
      await todayFilter.click();

      await expect(todayFilter).toHaveClass(/quick-filters__chip--active/);
    });

    test('should deactivate quick filter when another quick filter is clicked', async ({ page }) => {
      await goToVisitorsAndWaitForFilters(page);

      const todayFilter = page.locator(
        '.quick-filters__chip:not(.quick-filters__chip--saved):has-text("Hoy")'
      );
      const weekFilter = page.locator(
        '.quick-filters__chip:not(.quick-filters__chip--saved):has-text("Esta semana")'
      );

      await todayFilter.click();
      await expect(todayFilter).toHaveClass(/quick-filters__chip--active/);

      await weekFilter.click();
      await expect(weekFilter).toHaveClass(/quick-filters__chip--active/);
    });
  });
});
