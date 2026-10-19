import { test, expect } from '@playwright/test';

import { loginAsUser } from './helpers/auth';

import { FORBIDDEN, NOT_FOUND } from '../src/lib/constants/http-response-status-codes';

const TIMEOUT = 60 * 1000;
const ERROR_PAGE_HEADING = 'エラーが発生しました';

test.describe('error page', () => {
  test('shows the not found error for an unknown route', async ({ page }) => {
    const response = await page.goto('/e2e-route-that-does-not-exist');

    expect(response?.status()).toBe(NOT_FOUND);
    await expect(page.getByRole('heading', { name: ERROR_PAGE_HEADING })).toBeVisible({
      timeout: TIMEOUT,
    });
    await expect(page.getByRole('heading', { name: String(NOT_FOUND) })).toBeVisible();
  });

  test('shows the forbidden error when a general user opens an admin-only page', async ({
    page,
  }) => {
    await loginAsUser(page);
    // The create page's load throws error(403) for non-admin users
    const response = await page.goto('/workbooks/create');

    expect(response?.status()).toBe(FORBIDDEN);
    await expect(page.getByRole('heading', { name: ERROR_PAGE_HEADING })).toBeVisible({
      timeout: TIMEOUT,
    });
    await expect(page.getByRole('heading', { name: String(FORBIDDEN) })).toBeVisible();
    await expect(page.getByText('アクセス権限がありません。')).toBeVisible();
  });
});
