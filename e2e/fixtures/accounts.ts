import { Page, expect } from '@playwright/test';

/**
 * The three roles the marketplace gates on, as seeded by
 * backend/seeders/20240101000001-initial-data.cjs.
 *
 * These are development fixtures, not secrets — the same values are already
 * committed in the seeder. They stay overridable so a CI database seeded from a
 * different source does not need the specs edited.
 */
export const ACCOUNTS = {
  admin: {
    email: process.env.E2E_ADMIN_EMAIL ?? 'admin@crescebr.com',
    password: process.env.E2E_ADMIN_PASSWORD ?? 'admin123',
  },
  supplier: {
    email: process.env.E2E_SUPPLIER_EMAIL ?? 'supplier@example.com',
    password: process.env.E2E_SUPPLIER_PASSWORD ?? 'supplier123',
  },
  buyer: {
    email: process.env.E2E_BUYER_EMAIL ?? 'buyer@example.com',
    password: process.env.E2E_BUYER_PASSWORD ?? 'buyer123',
  },
} as const;

export type Role = keyof typeof ACCOUNTS;

/**
 * Sign in through the real form.
 *
 * Deliberately not a token injected into localStorage: the login round trip is
 * one of the seams this suite exists to cover, and faking it would skip the
 * vite proxy, the API contract and whatever the app does with the response.
 *
 * @example await signIn(page, 'buyer')
 */
export async function signIn(page: Page, role: Role): Promise<void> {
  const account = ACCOUNTS[role];

  await page.goto('/login');
  await openEmailTab(page);

  // Selecting by id, not by label: every label on this form comes from i18n,
  // so a name-based locator breaks the moment the interface language changes.
  await page.locator('#email').fill(account.email);
  await page.locator('#password').fill(account.password);
  await page.locator('form button[type="submit"]').click();

  // Landing anywhere other than /login is the signal; the destination differs
  // per role and asserting a specific one here would couple every spec to it.
  await expect(page).not.toHaveURL(/\/login/, { timeout: 15_000 });
}

/**
 * The form opens on the CNPJ tab, and the email field is not merely hidden —
 * it is not rendered at all until the tab changes.
 */
export async function openEmailTab(page: Page): Promise<void> {
  const emailField = page.locator('#email');
  if (await emailField.count()) return;
  // Declared order is [CNPJ, Email]; there are only these two.
  await page.getByRole('tab').nth(1).click();
  await expect(emailField).toBeVisible();
}
