import { expect, test } from '@playwright/test';

import { PRODUCT_CATCH_PHRASE } from '../src/lib/constants/product-info.ts';

test('index page is expected to have an h1 tag', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: PRODUCT_CATCH_PHRASE })).toBeVisible();
});
