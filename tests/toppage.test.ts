import { expect, test } from '@playwright/test';

import { PRODUCT_CATCH_PHRASE } from '../src/lib/constants/product-info.ts';

test('index page has expected h1', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: PRODUCT_CATCH_PHRASE })).toBeVisible();
});
