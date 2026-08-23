import { test, expect } from '@playwright/test';

/**
 * The catalogue must not scroll sideways on a phone.
 *
 * The product grid's tracks were `1fr`, which resolves to `minmax(auto, 1fr)`,
 * and that `auto` floor is the widest card's min-content width. Two of those
 * floors add up to more than a phone's viewport, so the document grew wider
 * than the screen while the sticky header — sized to the viewport — did not:
 * scrolling right ran past the end of the header onto bare background.
 *
 * Neither existing suite can see this. jsdom has no layout engine, so a vitest
 * render of the grid reports every box as zero-sized; the API tests never draw
 * anything. Only a real browser measures it.
 */

// 320 is the narrowest phone still in use, 360 and 412 the common Android
// widths. Set explicitly so the assertion means the same thing under both the
// desktop and the mobile-chrome project.
const WIDTHS = [320, 360, 412];

test.describe('home page layout', () => {
  for (const width of WIDTHS) {
    test(`the catalogue fits the viewport at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 780 });
      await page.goto('/');

      // The overflow came from the rendered cards, so an empty grid would pass
      // this vacuously. Located by MUI's class rather than by copy: every label
      // on the card is i18n and would make this a translation test.
      await expect(page.locator('.MuiCard-root').first()).toBeVisible({ timeout: 20_000 });

      const layout = await page.evaluate(() => {
        const doc = document.documentElement;
        return {
          overflow: doc.scrollWidth - doc.clientWidth,
          // The reported symptom: a header narrower than the document it sits
          // on, so it stops short once the page is scrolled right.
          headers: [...document.querySelectorAll('header')].map(header => ({
            width: Math.round(header.getBoundingClientRect().width),
            documentWidth: doc.scrollWidth,
          })),
        };
      });

      // A sub-pixel viewport width can round to a 1px difference on its own.
      expect(layout.overflow).toBeLessThanOrEqual(1);
      expect(layout.headers.length).toBeGreaterThan(0);
      for (const header of layout.headers) {
        expect(header.width).toBeGreaterThanOrEqual(header.documentWidth - 1);
      }
    });
  }
});
