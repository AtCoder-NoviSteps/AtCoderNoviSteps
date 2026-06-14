import { expect, test } from '@playwright/test';

test.describe('anonymous /problems response', () => {
  test('is cache-eligible (cache-control set, no set-cookie)', async ({ page }) => {
    const response = await page.goto('/problems');

    if (!response) {
      throw new Error('No response received from /problems');
    }

    const headers = response.headers();

    // Local dev server (pnpm preview) is not behind Vercel edge, so s-maxage is visible.
    expect(headers['cache-control']).toContain('public');
    expect(headers['cache-control']).toContain('s-maxage=300');

    // set-cookie makes a response non-cacheable at the CDN; must be absent for anonymous pages.
    expect(headers['set-cookie']).toBeUndefined();
  });
});
