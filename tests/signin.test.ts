import { test, expect } from '@playwright/test';
import { PRODUCT_CATCH_PHRASE } from '../src/lib/constants/product-info.ts';

test('login and logout', async ({ page }) => {
  const upToOneMinute = 60 * 1000; // 60 sec * 1000 ms

  // ログインページをクリック
  await page.goto('/login');
  await expect(page).toHaveURL('/login', { timeout: upToOneMinute });

  // ユーザ情報を入力してログインすると、問題一覧ページが表示される。
  // TODO: global.setup.tsで作ったユーザでログインできるようにしたい。
  // await page.locator('input[name="username"]').fill('guest_user');
  await page.locator('input[name="username"]').fill('guest');
  await page.locator('input[name="password"]').fill('Ch0kuda1');
  await page.getByRole('button', { name: 'ログイン' }).click();
  await expect(page).toHaveURL('/problems', { timeout: upToOneMinute });

  // ユーザ名をクリックしてドロップダウンを表示し、ログアウトボタン（確認用）を選択
  await page.getByRole('link', { name: 'guest' }).click();
  await page.locator('button[name="logout_helper"]').click();

  // 確認用画面（モーダル）のログアウトボタンを押すと、ホーム画面に戻る。
  await page.locator('button[name="logout"]').click();
  await expect(page).toHaveURL('/', { timeout: upToOneMinute });
  await expect(page.getByRole('heading', { name: PRODUCT_CATCH_PHRASE })).toBeVisible();
});
