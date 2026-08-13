import { test, expect } from '@playwright/test';
import { signIn } from '../fixtures/accounts';

/**
 * The buyer's entry path, on desktop and on a phone.
 *
 * Named `buyer-*` so playwright.config.ts also runs it under the mobile-chrome
 * project: buyers browse the catalogue on phones, suppliers do not administer
 * inventory on one.
 */

test.describe('buyer catalogue', () => {
  test('the home page renders products from the API', async ({ page }) => {
    const productResponses: number[] = [];
    page.on('response', response => {
      if (/\/api\/v1\/products/.test(response.url())) productResponses.push(response.status());
    });

    await page.goto('/');
    await expect(page).toHaveURL(/\/$/);

    // Waiting on the request rather than on rendered copy: the catalogue is
    // seeded data and its titles are not this test's contract, but "the page
    // asked the API and the API answered" is.
    await expect.poll(() => productResponses.length, { timeout: 20_000 }).toBeGreaterThan(0);
    expect(productResponses.every(status => status < 400)).toBe(true);
  });

  test('a signed-in buyer can open the cart', async ({ page }) => {
    await signIn(page, 'buyer');
    await page.goto('/cart');
    await expect(page).toHaveURL(/\/cart/);
    // The cart is reachable and rendered something — an empty cart is a valid
    // state, so the assertion is on arrival, not on contents.
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('no console error on the buyer entry path', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(`pageerror: ${error.message}`));

    await signIn(page, 'buyer');
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    expect(errors, errors.join(' | ')).toEqual([]);
  });
});
