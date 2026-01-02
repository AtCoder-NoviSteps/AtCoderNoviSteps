import { test, expect, Page } from '@playwright/test';

// Helper function to navigate to home
const goToHome = async (page: Page) => {
  await page.goto('http://localhost:5174/');
};

test.describe('Navbar - Regression from v3->v4 migration', () => {
  /**
   * Preconditions:
   * - Development server started with pnpm dev
   */

  test('navbar is visible on lg (1024px)', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await goToHome(page);

    const navbar = page.locator('nav');
    await expect(navbar).toBeVisible();
  });

  test('navbar menu items align properly on lg', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await goToHome(page);

    const navItems = page.locator('nav ul li a');
    const count = await navItems.count();
    expect(count).toBeGreaterThan(0);

    // Verify menu items position (check for layout corruption)
    for (let i = 0; i < Math.min(count, 3); i++) {
      const item = navItems.nth(i);
      const bbox = await item.boundingBox();
      expect(bbox?.width).toBeGreaterThan(0);
      expect(bbox?.height).toBeGreaterThan(0);
      // Verify items fit within navbar viewport
      expect(bbox?.x || 0).toBeGreaterThanOrEqual(0);
    }
  });

  test('navbar is visible and functional on mobile (375px)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await goToHome(page);

    const navbar = page.locator('nav');
    await expect(navbar).toBeVisible();

    // Verify hamburger menu exists on mobile
    const hamburger = page.locator('nav button:not([aria-label])');
    await expect(hamburger).toBeVisible();

    // Verify menu is hidden (hidden class)
    const menuContainer = page.locator('div[role="none"] ul');
    await expect(menuContainer).not.toBeVisible();
  });
});
