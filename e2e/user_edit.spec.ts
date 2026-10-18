import { test, expect, type Page } from '@playwright/test';
import { loginAsUnverifiedUser, loginAsUser } from './helpers/auth';

const TIMEOUT = 60 * 1000;
const SHORT_TIMEOUT = 5000;

// Mirrors /users/edit route
const EDIT_PAGE_URL = '/users/edit';

const BASIC_INFO_TAB_NAME = '基本情報';
const ATCODER_TAB_NAME = 'AtCoder IDを設定';

function getTab(page: Page, name: string) {
  return page.getByRole('tab', { name });
}

async function openEditPage(page: Page): Promise<void> {
  await page.goto(EDIT_PAGE_URL);
  // Wait for page to stabilize before running assertions
  await expect(getTab(page, BASIC_INFO_TAB_NAME)).toBeVisible({ timeout: TIMEOUT });
}

test.describe('user edit page (/users/edit)', () => {
  test('unauthenticated user is redirected to /login', async ({ page }) => {
    await page.goto(EDIT_PAGE_URL);
    await expect(page).toHaveURL(/\/login/, { timeout: TIMEOUT });
  });

  test.describe('logged-in user without AtCoder verification (Alice)', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsUnverifiedUser(page);
      await openEditPage(page);
    });

    test('基本情報 tab is active by default', async ({ page }) => {
      await expect(getTab(page, BASIC_INFO_TAB_NAME)).toHaveAttribute('aria-selected', 'true', {
        timeout: SHORT_TIMEOUT,
      });
      await expect(getTab(page, ATCODER_TAB_NAME)).toHaveAttribute('aria-selected', 'false');
    });
  });

  test.describe('logged-in user with AtCoder verification (guest)', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsUser(page);
      await openEditPage(page);
    });

    test('AtCoder IDを設定 tab is active by default', async ({ page }) => {
      await expect(getTab(page, ATCODER_TAB_NAME)).toHaveAttribute('aria-selected', 'true', {
        timeout: SHORT_TIMEOUT,
      });
      await expect(getTab(page, BASIC_INFO_TAB_NAME)).toHaveAttribute('aria-selected', 'false');
    });

    test('username is displayed after opening the 基本情報 tab', async ({ page }) => {
      // The AtCoder tab also renders a ユーザ名 field, so confirm the 基本情報 tab is selected first
      await getTab(page, BASIC_INFO_TAB_NAME).click();
      await expect(getTab(page, BASIC_INFO_TAB_NAME)).toHaveAttribute('aria-selected', 'true', {
        timeout: SHORT_TIMEOUT,
      });

      await expect(page.getByRole('textbox', { name: 'ユーザ名' })).toHaveValue('guest', {
        timeout: SHORT_TIMEOUT,
      });
    });

    test('アカウント削除 tab is not shown for the guest user', async ({ page }) => {
      // guest is excluded from account deletion (isGeneralUser returns false for username 'guest')
      await expect(getTab(page, 'アカウント削除')).not.toBeVisible({
        timeout: SHORT_TIMEOUT,
      });
    });
  });
});
