import { expect, test } from '@playwright/test';

import { loginAsUser } from './helpers/auth';

// Regression guard for #3862. A shared cache keys on URL + method + the headers named by
// Vary (RFC 9111), so an anonymous response cached without `Vary: Cookie` is also served to
// logged-in users — showing them the signed-out page. /problems must not opt into the shared
// cache at all, for anonymous and logged-in responses alike.

test.describe('anonymous /problems response', () => {
  test('is not shared-cached (no CDN cache-control directive)', async ({ page }) => {
    const response = await page.goto('/problems');

    if (!response) {
      throw new Error('No response received from /problems');
    }

    const headers = response.headers();

    // Local dev server (pnpm preview) is not behind Vercel edge, so s-maxage would be
    // visible here if it were re-introduced.
    expect(headers['cache-control'] ?? '').not.toContain('public');
    expect(headers['cache-control'] ?? '').not.toContain('s-maxage');
    expect(headers['cache-control'] ?? '').not.toContain('stale-while-revalidate');
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

    expect(headers['cache-control'] ?? '').not.toContain('public');
    expect(headers['cache-control'] ?? '').not.toContain('s-maxage');
  });
});
