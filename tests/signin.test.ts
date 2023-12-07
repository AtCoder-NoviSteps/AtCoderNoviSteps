import { test, expect } from '@playwright/test';
test('login logout', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '問題を解く' }).click();
  await page.locator('input[name="username"]').fill('guest');
  //await page.locator('input[name="username"]').fill('guest_user');//TODO: global.setup.tsで作ったユーザでログインできるようにしたい。
  await page.locator('input[name="password"]').fill('Ch0kuda1');
  await page.getByRole('button', { name: 'ログイン' }).click();
  await page.getByRole('button', { name: 'Log out' }).click();
  await expect(
    page.getByRole('heading', { name: 'TODO: サービスのキャッチフレーズを書く' }),
  ).toBeVisible();
});
