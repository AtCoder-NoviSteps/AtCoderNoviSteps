import { test, expect } from '@playwright/test';
import { loginAsUser } from './helpers/auth';

const TIMEOUT = 60 * 1000;
const SHORT_TIMEOUT = 5000;

// Mirrors /users/edit route
const EDIT_PAGE_URL = '/users/edit';

test.describe('user edit page (/users/edit)', () => {
  test('unauthenticated user is redirected to /login', async ({ page }) => {
    await page.goto(EDIT_PAGE_URL);
    await expect(page).toHaveURL(/\/login/, { timeout: TIMEOUT });
  });

  test.describe('logged-in user (guest)', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsUser(page);
      await page.goto(EDIT_PAGE_URL);
      // Wait for page to stabilize before running assertions
      await expect(page.getByRole('tab', { name: '基本情報' })).toBeVisible({ timeout: TIMEOUT });
    });

    test('基本情報 tab is active by default', async ({ page }) => {
      // Tab visibility already asserted in beforeEach; check active state only
      await expect(page.getByRole('tab', { name: '基本情報' })).toHaveAttribute(
        'aria-selected',
        'true',
        { timeout: SHORT_TIMEOUT },
      );
    });

    test('username is displayed in the 基本情報 tab', async ({ page }) => {
      // Assert the username label input shows the logged-in user's name
      await expect(page.getByRole('textbox', { name: 'ユーザ名' })).toHaveValue('guest', {
        timeout: SHORT_TIMEOUT,
      });
    });

    test('アカウント削除 tab is not shown for the guest user', async ({ page }) => {
      // guest is excluded from account deletion (isGeneralUser returns false for username 'guest')
      await expect(page.getByRole('tab', { name: 'アカウント削除' })).not.toBeVisible({
        timeout: SHORT_TIMEOUT,
      });
    });
  });
});
