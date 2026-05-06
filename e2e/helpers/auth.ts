import { expect, type Page } from '@playwright/test';

const TIMEOUT = 60 * 1000;
const SHARED_PASSWORD = 'Ch0kuda1';

/** Fills and submits the signup form with a unique username. */
export async function submitSignupForm(page: Page): Promise<void> {
  await page.locator('input[name="username"]').fill(`testuser_${Date.now()}`);
  await page.locator('input[name="password"]').fill('TestPass123');
  await page.getByRole('button', { name: 'アカウントを作成', exact: true }).click();
}

/** Logs in as the admin user and waits for redirect to home. */
export async function loginAsAdmin(page: Page): Promise<void> {
  await loginAs(page, 'admin');
}

/** Logs in as a general (non-admin) user and waits for redirect to home. */
export async function loginAsUser(page: Page): Promise<void> {
  await loginAs(page, 'guest');
}

/**
 * Fills and submits the login form without navigating first.
 * Use when already on /login?redirectTo=... to preserve the redirect destination.
 */
export async function submitLoginForm(page: Page, username: 'admin' | 'guest'): Promise<void> {
  await fillLoginForm(page, username);
}

async function loginAs(page: Page, username: string): Promise<void> {
  await page.goto('/login');
  await expect(page).toHaveURL('/login', { timeout: TIMEOUT });
  await fillLoginForm(page, username);
  await expect(page).toHaveURL('/', { timeout: TIMEOUT });
}

async function fillLoginForm(page: Page, username: string): Promise<void> {
  await page.locator('input[name="username"]').fill(username);
  await page.locator('input[name="password"]').fill(SHARED_PASSWORD);
  await page.getByRole('button', { name: 'ログイン', exact: true }).click();
}
