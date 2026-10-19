import { test, expect, type Page } from '@playwright/test';

import { loginAsAdmin, loginAsUser } from './helpers/auth';

const TIMEOUT = 60 * 1000;
const ACCOUNT_TRANSFER_URL = '/account_transfer';
// Users that do not exist, so even a broken guard could not copy real answers
const MISSING_SOURCE_USER = 'e2e_missing_source';
const MISSING_DESTINATION_USER = 'e2e_missing_destination';

// Mirrors SvelteKit's ActionResult — $app/forms is not resolvable in Playwright.
type ActionRedirect = { type: 'redirect'; status: number; location: string };
type ActionResultLike = ActionRedirect | { type: 'success' | 'failure' | 'error' };

async function postAccountTransfer(
  page: Page,
  sourceUserName: string,
  destinationUserName: string,
): Promise<ActionResultLike> {
  const text = await page.evaluate(
    async ({ url, body }) => {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });

      return response.text();
    },
    {
      url: ACCOUNT_TRANSFER_URL,
      body: new URLSearchParams({ sourceUserName, destinationUserName }).toString(),
    },
  );

  return JSON.parse(text) as ActionResultLike;
}

test.describe('access control', () => {
  test('rejects account transfer by a non-admin user', async ({ page }) => {
    await loginAsUser(page);

    await page.goto(ACCOUNT_TRANSFER_URL);
    await expect(page).not.toHaveURL(new RegExp(`${ACCOUNT_TRANSFER_URL}$`), { timeout: TIMEOUT });

    const result = await postAccountTransfer(page, MISSING_SOURCE_USER, MISSING_DESTINATION_USER);
    expect(result.type).toBe('redirect');
    expect(result).toHaveProperty('location', expect.stringMatching(/\/login/));
  });
});

test.describe('admin', () => {
  test('shows a validation message when the account names are the same', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(ACCOUNT_TRANSFER_URL);

    await page.getByLabel('旧アカウント名').fill(MISSING_SOURCE_USER);
    await page.getByLabel('新アカウント名').fill(MISSING_SOURCE_USER);
    await page.getByRole('button', { name: 'コピー', exact: true }).click();

    await expect(
      page.getByText('新アカウント名は、旧アカウント名とは異なるものを指定してください'),
    ).toBeVisible({ timeout: TIMEOUT });
    await expect(page.getByLabel('旧アカウント名')).toHaveValue(MISSING_SOURCE_USER);
  });
});
