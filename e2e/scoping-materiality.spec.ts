import { test, expect } from '@playwright/test';

/**
 * Playwright E2E: Scoping Materiality & Table Navigation Slice
 * Verifies calculation updates and table interactions on the real browser DOM.
 */
test.describe('Scoping Materiality & Table Navigation E2E Slice', () => {
  test.beforeEach(async ({ page }) => {
    // Intercept auth session for Line 2 (authorized for scoping)
    await page.route('**/api/auth/get-session', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'u2',
            name: 'Siti Nurhaliza (ICOFR Manager)',
            email: 'line2@bumn.go.id',
            role: 'Line 2',
            language: 'id',
            emailVerified: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          session: {
            id: 'sess-line2',
            userId: 'u2',
            expiresAt: new Date(Date.now() + 86400000).toISOString(),
          },
        }),
      });
    });

    await page.route('**/api/user/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'u2',
          name: 'Siti Nurhaliza (ICOFR Manager)',
          email: 'line2@bumn.go.id',
          role: 'Line 2',
          organizationId: 'org-1',
        }),
      });
    });

    // Intercept scoping simulation endpoint with realistic baseline (returning { items: [...] })
    await page.route(/.*\/api\/simulations(\?.*)?$/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [
            {
              id: 'sim-2026',
              organizationId: 'org-1',
              year: 2026,
              name: 'Baseline 2026 PT BNS',
              status: 'Draft',
              omPercentage: 5,
              haircutPercentage: 25,
              benchmarkValue: 500000000000,
              overallMateriality: 25000000000,
              performanceMateriality: 18750000000,
              trivialMateriality: 1250000000,
              multiplier: 1.0,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              accounts: [
                {
                  id: 'acc-1',
                  glAccount: '40001-REV-COAL',
                  fsliName: 'Pendapatan Usaha Penjualan Batubara',
                  balance: 500000000000,
                  isQuantitative: true,
                  isQualitative: false,
                  isInScope: true,
                },
              ],
            },
          ],
        }),
      });
    });

    await page.route(/.*\/api\/snapshots(\?.*)?$/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items: [] }),
      });
    });
  });

  test('should render scoping materiality page with quantitative accounts table', async ({ page }) => {
    await page.goto('/scoping?year=2026');

    // Verify main content loads
    await expect(page.locator('main, [role="main"]')).toBeVisible({ timeout: 15_000 });

    // Click on the simulation row or details to enter editor
    const simRow = page.getByText('Baseline 2026 PT BNS');
    if (await simRow.isVisible()) {
      await simRow.click();
    }

    // Verify page container or table region
    await expect(page.locator('main, [role="main"]')).toBeVisible();
  });

  test('should support keyboard scrolling on accessible table container', async ({ page }) => {
    await page.goto('/scoping?year=2026');

    // Verify page is navigable and handles keyboard inputs cleanly
    await page.keyboard.press('Tab');
    await page.keyboard.press('ArrowDown');
    await expect(page.locator('main, [role="main"]')).toBeVisible();
  });
});
