import { test, expect } from '@playwright/test';
import { PRODUCT_CATCH_PHRASE } from '../src/lib/constants/product-info.ts';

const UP_TO_ONE_MINUTE = 60 * 1000; // 60 sec * 1000 ms
const USERNAME = 'guest';
const PASSWORD = 'Ch0kuda1';

// TODO: global.setup.tsで利用できるようにする。
async function login(page, username, password) {
  // ログインページをクリック
  await page.goto('/login');
  await expect(page).toHaveURL('/login', { timeout: UP_TO_ONE_MINUTE });

  // ユーザ情報を入力してログインボタンを押す
  // TODO: global.setup.tsで作ったユーザでログインできるようにしたい。
  // await page.locator('input[name="username"]').fill('guest_user');
  await page.locator('input[name="username"]').fill(username);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole('button', { name: 'ログイン' }).click();

  // ログインに成功すると、問題一覧ページが表示される。
  await expect(page).toHaveURL('/problems', { timeout: UP_TO_ONE_MINUTE });
}

async function logout(page) {
  // ユーザ名をクリックしてドロップダウンを表示し、ログアウトボタン（確認用）を選択
  await page.getByRole('link', { name: 'guest' }).click();
  await page.locator('button[name="logout_helper"]').click();

  // 確認用画面（モーダル）のログアウトボタンを押すと、ホーム画面に戻る。
  await page.locator('button[name="logout"]').click();

  await expect(page).toHaveURL('/', { timeout: UP_TO_ONE_MINUTE });
  await expect(page.getByRole('heading', { name: PRODUCT_CATCH_PHRASE })).toBeVisible();
}

test('login', async ({ page }) => {
  await login(page, USERNAME, PASSWORD);
});

test('logout', async ({ page }) => {
  await login(page, USERNAME, PASSWORD);
  await logout(page);
});
