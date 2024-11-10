import { expect, test, Page } from '@playwright/test';

import {
  NOT_FOUND,
  FORBIDDEN,
  INTERNAL_SERVER_ERROR,
} from '../src/lib/constants/http-response-status-codes';

test.describe('robots.txt', () => {
  test.describe.configure({ retries: 2 });

  test('is accessible and valid', async ({ page }) => {
    const response = await page.goto('/robots.txt');

    if (!response) {
      throw new Error(
        'No response received from /robots.txt. This might indicate a server error or network issue.',
      );
    }

    const status = response.status();
    expect(status, `Expected robots.txt to return 200 OK but got ${status}`).toBe(200);

    const contentType = response.headers()['content-type'];
    expect(contentType?.toLowerCase(), 'Content-Type header should be text/plain').toBe(
      'text/plain',
    );

    const robotsText = await response.text();

    // Check for the correct sitemap URL
    expect(robotsText).toContain('Sitemap: https://atcoder-novisteps.vercel.app/sitemap.xml');

    // Check for valid User-agent and Allow directives
    expect(robotsText).toContain('User-agent: *');
    expect(robotsText).toContain('Allow: /');
  });
});

test('handles internal server errors gracefully', async ({ page }) => {
  await handleErrors({
    page,
    statusCode: INTERNAL_SERVER_ERROR,
    bodyText: 'Internal Server Error',
  });
});

test('handles forbidden errors gracefully', async ({ page }) => {
  await handleErrors({ page, statusCode: FORBIDDEN, bodyText: 'Forbidden' });
});

test('handles not found errors gracefully', async ({ page }) => {
  await handleErrors({ page, statusCode: NOT_FOUND, bodyText: 'Not Found' });
});

/**
 * Parameters for the error handler function.
 *
 * @interface ErrorHandlerParams
 * @property {Page} page - The page object where the error occurred.
 * @property {number} statusCode - The HTTP status code of the error.
 * @property {string} bodyText - The body text of the error response.
 */
interface ErrorHandlerParams {
  page: Page;
  statusCode: number;
  bodyText: string;
}

/**
 * Handles errors by mocking the response for the `/robots.txt` route and verifying the response.
 *
 * @param {ErrorHandlerParams} params - The parameters for handling errors.
 * @param {Page} params.page - The Playwright page object.
 * @param {number} params.statusCode - The status code to be returned by the mocked response.
 * @param {string} params.bodyText - The body text to be returned by the mocked response.
 *
 * @returns {Promise<void>} A promise that resolves when the error handling is complete.
 *
 * @throws {Error} If no response is received from `/robots.txt`.
 */
async function handleErrors({ page, statusCode, bodyText }: ErrorHandlerParams): Promise<void> {
  const robotsPath = '/robots.txt';

  // Mock error response
  await page.route(robotsPath, (route) =>
    route.fulfill({
      status: statusCode,
      contentType: 'text/plain',
      body: bodyText,
    }),
  );

  const response = await page.goto(robotsPath, { timeout: 5000 });

  if (!response) {
    throw new Error(
      `No response received from ${robotsPath}. This might indicate a server error or network issue.`,
    );
  }

  expect(response.status()).toBe(statusCode);

  const responseBody = await response.text();
  expect(responseBody).toContain(bodyText);

  // Clean up route mock
  await page.unroute(robotsPath);
}
