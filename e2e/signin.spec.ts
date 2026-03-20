import { test, expect, Page } from '@playwright/test';
import { PRODUCT_CATCH_PHRASE } from '../src/lib/constants/product-info.ts';

// Set timeout limit
const UP_TO_ONE_MINUTE = 60 * 1000; // 60 sec * 1000 ms
// Sample username and password for testing
const USERNAME = 'guest';
const PASSWORD = 'Ch0kuda1';

// TODO: Make available in global.setup.ts
async function login(page: Page, username: string, password: string): Promise<void> {
  // Navigate to login page
  const loginUrl = '/login';
  await page.goto(loginUrl);
  await expect(page).toHaveURL(loginUrl, { timeout: UP_TO_ONE_MINUTE });

  // Fill in user credentials and click login button
  // TODO: Want to login with users created in global.setup.ts
  // await page.locator('input[name="username"]').fill('guest_user');
  await page.locator('input[name="username"]').fill(username);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole('button', { name: 'ログイン' }).nth(1).click();

  // After successful login, home page should be displayed
  await expect(page).toHaveURL('/', { timeout: UP_TO_ONE_MINUTE });
}

async function logout(page: Page, username: string): Promise<void> {
  // Step 1: Click user button to display dropdown
  // Use ID selector because role="presentation" due to Flowbite-Svelte NavLi + Dropdown
  const userButton = page.locator('button[id="nav-user-page"]');
  await userButton.waitFor({ state: 'visible' });
  await userButton.click();

  // Step 2: Click "ログアウト" in dropdown
  // Use text selector to find DropdownItem text
  const logoutDropdownItem = page.getByText('ログアウト').first();
  await logoutDropdownItem.waitFor({ state: 'visible' });
  await logoutDropdownItem.click();

  // Step 3: Click "ログアウト" button in modal confirmation dialog
  // Select the last button since there are "キャンセル" and "ログアウト" buttons
  const logoutButton = page.getByRole('button', { name: 'ログアウト' }).last();
  await logoutButton.waitFor({ state: 'visible' });
  await logoutButton.click();

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
