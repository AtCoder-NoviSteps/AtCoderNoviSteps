import { test, expect } from '@playwright/test';
import { PRODUCT_CATCH_PHRASE } from '../src/lib/constants/product-info.ts';

// タイムアップの上限を設定
const UP_TO_ONE_MINUTE = 60 * 1000; // 60 sec * 1000 ms
// テスト用のサンプルユーザ名とパスワード
const USERNAME = 'guest';
const PASSWORD = 'Ch0kuda1';

// TODO: global.setup.tsで利用できるようにする。
async function login(page, username, password) {
  // ログインページをクリック。
  const loginUrl = '/login';
  await page.goto(loginUrl);
  await expect(page).toHaveURL(loginUrl, { timeout: UP_TO_ONE_MINUTE });

  // ユーザ情報を入力してログインボタンを押す。
  // TODO: global.setup.tsで作ったユーザでログインできるようにしたい。
  // await page.locator('input[name="username"]').fill('guest_user');
  await page.locator('input[name="username"]').fill(username);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole('button', { name: 'ログイン' }).nth(1).click();

  // ログインに成功すると、ホームページが表示される。
  await expect(page).toHaveURL('/', { timeout: UP_TO_ONE_MINUTE });
}

async function logout(page, username) {
  // ユーザ名をクリックしてドロップダウンを表示し、ログアウトボタン（確認用）を選択。
  await page.getByRole('link', { name: username }).click();
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
  await logout(page, USERNAME);
});
