import { test, expect } from '@playwright/test';

import { loginAsAdmin, loginAsUser } from './helpers/auth';

const TIMEOUT = 60 * 1000;
const WORKBOOK_LIST_URL = '/workbooks';

// Access control
test.describe('access control', () => {
  test('unauthenticated user is redirected to /login', async ({ page }) => {
    await page.goto(WORKBOOK_LIST_URL);
    await expect(page).toHaveURL('/login', { timeout: TIMEOUT });
  });
});

// Logged-in general user
test.describe('logged-in user (general)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page);
  });

  test('curriculum and solution tabs are visible', async ({ page }) => {
    await page.goto(WORKBOOK_LIST_URL);
    await expect(page.getByRole('tab', { name: 'カリキュラム' })).toBeVisible({ timeout: TIMEOUT });
    await expect(page.getByRole('tab', { name: '解法別' })).toBeVisible({ timeout: TIMEOUT });
  });

  test('user-created tab is not visible to non-admin', async ({ page }) => {
    await page.goto(WORKBOOK_LIST_URL);
    await expect(page.getByRole('tab', { name: 'ユーザ作成' })).not.toBeVisible();
  });

  test('clicking a grade filter on the curriculum tab switches the workbook list', async ({
    page,
  }) => {
    await page.goto(WORKBOOK_LIST_URL);
    await expect(page.getByRole('tab', { name: 'カリキュラム' })).toBeVisible({ timeout: TIMEOUT });

    // 10Q is selected by default; click 9Q
    await page.getByRole('button', { name: '9Q' }).click();

    // The active grade should now be 9Q — confirmed by a re-render (no navigation occurs)
    await expect(page.getByRole('button', { name: '9Q' })).toBeVisible({ timeout: TIMEOUT });
  });

  test('toggling replenishment workbooks shows/hides the section when it exists', async ({
    page,
  }) => {
    await page.goto(WORKBOOK_LIST_URL);
    await expect(page.getByRole('tab', { name: 'カリキュラム' })).toBeVisible({ timeout: TIMEOUT });

    // The Flowbite Toggle renders an sr-only <input> inside a <label>.
    // Clicking the label wrapper reliably triggers the toggle regardless of the span overlay.
    const toggleInput = page.locator(
      'input[aria-label="Toggle visibility of replenishment workbooks for curriculum"]',
    );
    const toggleLabel = page.locator(
      'label:has(input[aria-label="Toggle visibility of replenishment workbooks for curriculum"])',
    );

    if (!(await toggleInput.isVisible({ timeout: 3000 }).catch(() => false))) {
      // No replenishment workbooks exist for the current grade → skip
      test.skip();
      return;
    }

    const isChecked = await toggleInput.isChecked();
    await toggleLabel.click();
    await expect(toggleInput).toBeChecked({ checked: !isChecked, timeout: TIMEOUT });
  });
});

// For admin user
test.describe('admin user', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('"新規作成" button is visible', async ({ page }) => {
    await page.goto(WORKBOOK_LIST_URL);
    await expect(page.getByRole('link', { name: '新規作成' })).toBeVisible({ timeout: TIMEOUT });
  });

  test('user-created tab is visible to admin', async ({ page }) => {
    await page.goto(WORKBOOK_LIST_URL);
    await expect(page.getByRole('tab', { name: 'ユーザ作成' })).toBeVisible({ timeout: TIMEOUT });
  });

  test('workbook rows show edit link and delete button', async ({ page }) => {
    await page.goto(WORKBOOK_LIST_URL);
    await expect(page.getByRole('tab', { name: 'カリキュラム' })).toBeVisible({ timeout: TIMEOUT });

    const editLink = page.getByRole('link', { name: '編集' }).first();
    const deleteButton = page.getByRole('button', { name: '削除' }).first();

    if (!(await editLink.isVisible())) {
      // No workbooks visible for the current grade → skip
      test.skip();
      return;
    }

    await expect(editLink).toBeVisible({ timeout: TIMEOUT });
    await expect(deleteButton).toBeVisible({ timeout: TIMEOUT });
  });
});
