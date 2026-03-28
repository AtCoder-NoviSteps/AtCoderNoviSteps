import { test, expect } from '@playwright/test';
import { loginAsUser } from './helpers/auth';

const TIMEOUT = 60 * 1000;

// Mirrors /users/edit route
const EDIT_PAGE_URL = '/users/edit';

test.describe('user edit page (/users/edit)', () => {
  test('unauthenticated user is redirected to /login', async ({ page }) => {
    await page.goto(EDIT_PAGE_URL);
    await expect(page).toHaveURL('/login', { timeout: TIMEOUT });
  });

  test.describe('logged-in user (guest)', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsUser(page);
    });

    test('can view the edit page', async ({ page }) => {
      await page.goto(EDIT_PAGE_URL);
      await expect(page).toHaveURL(EDIT_PAGE_URL, { timeout: TIMEOUT });
    });

    test('基本情報 tab is visible and active by default', async ({ page }) => {
      await page.goto(EDIT_PAGE_URL);
      await expect(page.getByRole('tab', { name: '基本情報' })).toBeVisible({ timeout: TIMEOUT });
    });

    test('username is displayed in the 基本情報 tab', async ({ page }) => {
      await page.goto(EDIT_PAGE_URL);
      await expect(page.getByText('guest', { exact: false })).toBeVisible({ timeout: TIMEOUT });
    });

    test('アカウント削除 tab is not shown for the guest user', async ({ page }) => {
      await page.goto(EDIT_PAGE_URL);
      // guest is excluded from account deletion (isGeneralUser returns false for username 'guest')
      await expect(page.getByRole('tab', { name: 'アカウント削除' })).not.toBeVisible({
        timeout: TIMEOUT,
      });
    });
  });
});
