import { expect, test } from '@playwright/test';

test('robots.txt is accessible and valid', async ({ page }) => {
  const response = await page.goto('/robots.txt');

  if (!response) {
    throw new Error(
      'No response received from /robots.txt. This might indicate a server error or network issue.',
    );
  }

  const status = response.status();
  expect(status).toBe(200);

  const contentType = response.headers()['content-type'];
  expect(contentType).toBeDefined();
  expect(contentType).toContain('text/plain');

  const robotsText = await response.text();

  // Check for the correct sitemap URL
  expect(robotsText).toContain('Sitemap: https://atcoder-novisteps.vercel.app/sitemap.xml');

  // Check for valid User-agent and Allow directives
  expect(robotsText).toContain('User-agent: *');
  expect(robotsText).toContain('Allow: /');
});
