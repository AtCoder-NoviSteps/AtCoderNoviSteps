// See:
// https://github.com/jasongitmail/super-sitemap?tab=readme-ov-file#playwright-test
import { expect, test } from '@playwright/test';

interface SitemapUrl {
  loc: string | null | undefined;
  changefreq: string | null | undefined;
  priority: string | null | undefined;
}

const MIN_EXPECTED_URLS = 5;
const EXPECTED_CHANGE_FREQ = 'daily';
const EXPECTED_PRIORITY = '0.8';

test('/sitemap.xml is valid', async ({ page }) => {
  const response = await page.goto('/sitemap.xml');
  expect(response?.status()).toBe(200);
  expect(response?.headers()['content-type']).toContain('application/xml');

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
    expect(url.changefreq).toBe(EXPECTED_CHANGE_FREQ);
    expect(url.priority).toBe(EXPECTED_PRIORITY);
  }
});
