import { expect, test } from '@playwright/test';

import { loginAsUser } from './helpers/auth';

test.describe('anonymous /problems response', () => {
  test('is cache-eligible (cache-control set, no set-cookie)', async ({ page }) => {
    const response = await page.goto('/problems');

    if (!response) {
      throw new Error('No response received from /problems');
    }

    const headers = response.headers();

    // Local dev server (pnpm preview) is not behind Vercel edge, so s-maxage is visible.
    expect(headers['cache-control']).toContain('public');
    expect(headers['cache-control']).toContain('max-age=0');
    expect(headers['cache-control']).toContain('s-maxage=300');
    expect(headers['cache-control']).toContain('stale-while-revalidate=600');

    // set-cookie makes a response ineligible for CDN caching.
    // The auth layer must not attach a session cookie to anonymous requests.
    // If this assertion fails, verify the session handling does not set cookies
    // on unauthenticated requests.
    expect(headers['set-cookie']).toBeUndefined();
  });
});

test.describe('logged-in /problems response', () => {
  test('is not shared-cached (no CDN cache-control directive)', async ({ page }) => {
    await loginAsUser(page);
    const response = await page.goto('/problems');

    if (!response) {
      throw new Error('No response received from /problems');
    }

    const headers = response.headers();

    // Personalized responses must never be shared-cached.
    expect(headers['cache-control'] ?? '').not.toContain('public');
    expect(headers['cache-control'] ?? '').not.toContain('s-maxage');
  });
});
