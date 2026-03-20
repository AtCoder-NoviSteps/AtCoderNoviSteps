import { expect, test } from '@playwright/test';

test('about page is expected to have an h1 tag', async ({ page }) => {
  await page.goto('/about');
  await expect(page.getByRole('heading', { name: 'サービスの説明' })).toBeVisible();
});
