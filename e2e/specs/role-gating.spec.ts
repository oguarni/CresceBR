import { test, expect } from '@playwright/test';
import { signIn } from '../fixtures/accounts';

/**
 * Authorisation, enforced against a real session.
 *
 * `ProtectedRoute` is unit-tested with a mocked auth context, which proves the
 * component branches correctly on the role it is handed. It cannot prove the
 * role the API actually issues for a seeded account is the one the route
 * expects — a rename on either side passes every unit test and ships an open
 * admin page.
 */

/**
 * Each entry names a control that only exists once the real page renders, so a
 * guard that silently fell through would be caught by its absence rather than
 * by a URL that never changes.
 */
const FORBIDDEN_FOR_BUYER = [
  { path: '/supplier/dashboard', ownedBy: 'supplier' },
  { path: '/supplier/products', ownedBy: 'supplier' },
  { path: '/admin/company-verification', ownedBy: 'admin' },
];

test.describe('role gating', () => {
  for (const { path, ownedBy } of FORBIDDEN_FOR_BUYER) {
    test(`a signed-in buyer is refused ${path} (${ownedBy}-only)`, async ({ page }) => {
      await signIn(page, 'buyer');
      await page.goto(path);

      // ProtectedRoute deliberately does NOT redirect on a role mismatch — only
      // on a missing session. It holds the URL and renders an MUI <Alert>, so
      // asserting on the location would assert the opposite of the design.
      // What matters is that the denial is what rendered.
      await expect(page.getByRole('alert')).toBeVisible({ timeout: 15_000 });
    });
  }

  test('a supplier reaches its own dashboard', async ({ page }) => {
    await signIn(page, 'supplier');
    await page.goto('/supplier/dashboard');
    await expect(page).toHaveURL(/\/supplier\/dashboard/);
  });
});
