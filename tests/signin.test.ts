import { test, expect } from '@playwright/test';
import { PRODUCT_CATCH_PHRASE } from '../src/lib/constants/product-info.ts';

test('login logout', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '問題一覧へ' }).click();
  await page.locator('input[name="username"]').fill('guest');
  //await page.locator('input[name="username"]').fill('guest_user');//TODO: global.setup.tsで作ったユーザでログインできるようにしたい。
  await page.locator('input[name="password"]').fill('Ch0kuda1');
  await page.getByRole('button', { name: 'ログイン' }).click();
  await page.getByRole('button', { name: 'Log out' }).click();
  await expect(page.getByRole('heading', { name: PRODUCT_CATCH_PHRASE })).toBeVisible();
});
