import { expect, test } from '@playwright/test';

import { NOT_FOUND, INTERNAL_SERVER_ERROR } from '../src/lib/constants/http-response-status-codes';

test('robots.txt is accessible and valid', async ({ page }) => {
  const response = await page.goto('/robots.txt', { timeout: 30000 });

  if (!response) {
    throw new Error(
      'No response received from /robots.txt. This might indicate a server error or network issue.',
    );
  }

  const status = response.status();
  expect(status, `Expected robots.txt to return 200 OK but got ${status}`).toBe(200);

  const contentType = response.headers()['content-type'];
  expect(contentType, 'Content-Type header should be text/plain').toBe('text/plain');

  const robotsText = await response.text();

  // Check for the correct sitemap URL
  expect(robotsText).toContain('Sitemap: https://atcoder-novisteps.vercel.app/sitemap.xml');

  // Check for valid User-agent and Allow directives
  expect(robotsText).toContain('User-agent: *');
  expect(robotsText).toContain('Allow: /');
});

test('handles internal server errors gracefully', async ({ page }) => {
  await handleErrors({
    page,
    statusCode: INTERNAL_SERVER_ERROR,
    bodyText: 'Internal Server Error',
  });
});

test('handles not found errors gracefully', async ({ page }) => {
  await handleErrors({ page, statusCode: NOT_FOUND, bodyText: 'Not Found' });
});

async function handleErrors({ page, statusCode, bodyText }) {
  // Mock error response
  await page.route('/robots.txt', (route) =>
    route.fulfill({
      status: statusCode,
      contentType: 'text/plain',
      body: bodyText,
    }),
  );

  const response = await page.goto('/robots.txt');

  if (!response) {
    throw new Error(
      'No response received from /robots.txt. This might indicate a server error or network issue.',
    );
  }

  expect(response.status()).toBe(statusCode);

  const responseBody = await response.text();
  expect(responseBody).toContain(bodyText);
}
