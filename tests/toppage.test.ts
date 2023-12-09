import { expect, test } from '@playwright/test';

test('index page has expected h1', async ({ page }) => {
  await page.goto('/');
  // nameの中身を一時的なものに変更
  await expect(
    page.getByRole('heading', { name: 'TODO: サービスのキャッチフレーズを書く' }),
  ).toBeVisible();
});
