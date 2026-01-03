import { test as base, expect, devices, Page } from '@playwright/test';

// Mobile device config
const iPhone = devices['iPhone 12'];
const Desktop = { ...devices['Desktop Chrome'], viewport: { width: 1024, height: 768 } };

// Helper function to navigate to home
const goToHome = async (page: Page) => {
  await page.goto('/');
};

// Custom fixture for device-specific pages with automatic context cleanup
const test = base.extend<{ iPhonePage: Page; desktopPage: Page }>({
  iPhonePage: async ({ browser }, use) => {
    const context = await browser.newContext(iPhone);
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
  desktopPage: async ({ browser }, use) => {
    const context = await browser.newContext(Desktop);
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});

test.describe('Dark mode - Regression from v3->v4 migration', () => {
  /**
   * Preconditions:
   * - Development server started with pnpm dev
   */

  test('dark toggle button is visible', async ({ page }) => {
    await goToHome(page);

    const darkToggle = page.locator('button[aria-label="Dark mode"]');
    await expect(darkToggle).toBeVisible();
  });

  test('dark mode button exists on mobile', async ({ iPhonePage }) => {
    await goToHome(iPhonePage);

    // Verify button exists
    const darkModeButton = iPhonePage.locator('button[aria-label="Dark mode"]');
    await expect(darkModeButton).toHaveCount(1);
  });

  test('dark mode button exists on lg', async ({ desktopPage }) => {
    await goToHome(desktopPage);

    // Verify button exists
    const darkModeButton = desktopPage.locator('button[aria-label="Dark mode"]');
    await expect(darkModeButton).toBeVisible();

    // Verify SVG exists
    const svgs = darkModeButton.locator('svg');
    const svgCount = await svgs.count();
    expect(svgCount).toBeGreaterThan(0);
  });

  test('dark mode toggle switches theme', async ({ page }) => {
    await goToHome(page);

    const html = page.locator('html');
    const initialClass = await html.getAttribute('class');

    // Click toggle button
    const darkToggle = page.locator('button[aria-label="Dark mode"]');
    await darkToggle.click();

    // Verify class changed (dark class toggled)
    const afterClass = await html.getAttribute('class');
    expect(initialClass).not.toBe(afterClass);
  });
});
