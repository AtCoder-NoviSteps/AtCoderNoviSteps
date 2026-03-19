import { expect, type Page } from '@playwright/test';

const TIMEOUT = 60 * 1000;
const SHARED_PASSWORD = 'Ch0kuda1';

/** Logs in as the admin user and waits for redirect to home. */
export async function loginAsAdmin(page: Page): Promise<void> {
  await loginAs(page, 'admin');
}

/** Logs in as a general (non-admin) user and waits for redirect to home. */
export async function loginAsUser(page: Page): Promise<void> {
  await loginAs(page, 'guest');
}

async function loginAs(page: Page, username: string): Promise<void> {
  await page.goto('/login');
  await expect(page).toHaveURL('/login', { timeout: TIMEOUT });
  await page.locator('input[name="username"]').fill(username);
  await page.locator('input[name="password"]').fill(SHARED_PASSWORD);
  await page.getByRole('button', { name: 'ログイン' }).nth(1).click();
  await expect(page).toHaveURL('/', { timeout: TIMEOUT });
}
