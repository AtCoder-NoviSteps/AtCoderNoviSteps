// See:
// Reference: https://github.com/jasongitmail/super-sitemap?tab=readme-ov-file#playwright-test
// This test follows the recommended approach for validating sitemap.xml using Playwright
import { expect, test } from '@playwright/test';

interface SitemapUrl {
  loc: string | null | undefined;
  changefreq: string | null | undefined;
  priority: string | null | undefined;
}

const MIN_EXPECTED_URLS = 5;
const MAX_URL_LENGTH = 2048; // Common browser limit
const EXPECTED_CHANGE_FREQ = 'daily';
const EXPECTED_PRIORITY = '0.8';

test('/sitemap.xml is valid', async ({ page }) => {
  const response = await page.goto('/sitemap.xml');

  if (!response) {
    throw new Error(
      'No response received from /sitemap.xml. This might indicate a server error or network issue.',
    );
  }

  const status = response.status();
  expect(status).toBe(200);

  const contentType = response.headers()['content-type'];
  expect(contentType).toBeDefined();
  expect(contentType).toMatch(/^application\/xml(;\s*charset=([^;]+))?$/i);

  // Ensure XML is valid. Playwright parses the XML here and will error if it
  // cannot be parsed.
  const urls = await page.$$eval('url', (urls) =>
    urls.map(
      (url): SitemapUrl => ({
        loc: url.querySelector('loc')?.textContent,
        changefreq: url.querySelector('changefreq')?.textContent, // if you enabled in your sitemap
        priority: url.querySelector('priority')?.textContent,
      }),
    ),
  );

  // Sanity check
  expect(urls.length).toBeGreaterThan(MIN_EXPECTED_URLS);

  // Ensure entries are in a valid format.
  for (const url of urls) {
    expect(url.loc).toBeTruthy();

    if (!url.loc) {
      throw new Error('URL location is required');
    }

    const parsedUrl = new URL(url.loc);

    expect(parsedUrl.protocol).toBe('https:');
    expect(url.loc.length).toBeLessThanOrEqual(MAX_URL_LENGTH);
    expect(url.loc).toBe(parsedUrl.href); // Ensure URL is absolute and properly formatted

    // Validate URL structure
    expect(parsedUrl.hostname).toBeTruthy();
    expect(parsedUrl.pathname).toBeTruthy();

    // Ensure no URL parameters or fragments
    expect(parsedUrl.search).toBe('');
    expect(parsedUrl.hash).toBe('');

    expect(url.changefreq).toBe(EXPECTED_CHANGE_FREQ);
    expect(url.priority).toBe(EXPECTED_PRIORITY);
  }
});
