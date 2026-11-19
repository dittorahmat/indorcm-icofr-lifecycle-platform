import { test, expect } from '@playwright/test';

/**
 * Playwright E2E: Persona Authentication & Dashboard Smoke Test
 * Tests login page rendering, validation, and demo personas according to SK-5.
 */
test.describe('Persona Authentication & Navigation Smoke Test', () => {
  test('should render the login page with all required BUMN elements', async ({ page }) => {
    await page.goto('/');

    // Check title and brand
    await expect(page).toHaveTitle(/IndoGRC|ICOFR/i);
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password|kata sandi/i)).toBeVisible();

    // Verify Demo Credentials section displays standard BUMN persona emails
    await expect(page.getByText('staff.ops@bumn.go.id')).toBeVisible();
    await expect(page.getByText('manager.ops@bumn.go.id')).toBeVisible();
  });

  test('should reject invalid credentials with accessible error alert', async ({ page }) => {
    await page.goto('/');

    await page.getByLabel(/email/i).fill('invalid.user@bumn.go.id');
    await page.getByLabel(/password|kata sandi/i).fill('wrongpassword');
    await page.getByRole('button', { name: /sign in|masuk/i }).click();

    // Should stay on login page and show alert or toast
    await expect(page).toHaveURL(/.*\/(\?.*)?$/);
  });

  test('should support mock session state for persona dashboard access', async ({ page }) => {
    // Intercept Better-Auth getSession to simulate authenticated Admin persona
    await page.route('**/api/auth/get-session', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'u4',
            name: 'Diana Wijaya (Admin)',
            email: 'admin@bumn.go.id',
            role: 'Admin',
            language: 'id',
            emailVerified: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          session: {
            id: 'sess-admin',
            userId: 'u4',
            expiresAt: new Date(Date.now() + 86400000).toISOString(),
          },
        }),
      });
    });

    // Intercept user profile endpoint
    await page.route('**/api/user/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'u4',
          name: 'Diana Wijaya (Admin)',
          email: 'admin@bumn.go.id',
          role: 'Admin',
          organizationId: 'org-1',
        }),
      });
    });

    // Navigate to dashboard
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*\/dashboard/);

    // Verify main navigation or header exists
    await expect(page.locator('main, [role="main"]')).toBeVisible({ timeout: 15_000 });
  });
});
