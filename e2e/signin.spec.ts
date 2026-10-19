import { test, expect, Page } from '@playwright/test';
import { PRODUCT_CATCH_PHRASE } from '../src/lib/constants/product-info.ts';
import { BAD_REQUEST } from '../src/lib/constants/http-response-status-codes.ts';

// Set timeout limit
const UP_TO_ONE_MINUTE = 60 * 1000; // 60 sec * 1000 ms
// Sample username and password for testing
const USERNAME = 'guest';
const PASSWORD = 'Ch0kuda1';
const WRONG_PASSWORD = 'Wr0ngPassword';
const LOGIN_FAILURE_MESSAGE =
  'ログインできませんでした。登録したユーザ名 / パスワードとなるように修正してください。';
const SESSION_COOKIE_NAME = 'auth_session';

// Mirrors SvelteKit's ActionResult — $app/forms is not resolvable in Playwright.
type ActionFailure = { type: 'failure'; status: number };
type ActionResultLike = ActionFailure | { type: 'success' | 'redirect' | 'error' };

function deserializeActionResult(text: string): ActionResultLike {
  return JSON.parse(text) as ActionResultLike;
}

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

async function logout(page: Page, _username: string): Promise<void> {
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

test('redirects to home when logging out without a session', async ({ page }) => {
  await login(page, USERNAME, PASSWORD);
  await page.goto('/workbooks');
  await expect(page).toHaveURL(/\/workbooks/, { timeout: UP_TO_ONE_MINUTE });
  // Without a session the logout action fails; the form posts to another page, so SvelteKit 3 navigates there
  await page.context().clearCookies();

  await logout(page, USERNAME);
});

test('keeps the session cookie attributes after login', async ({ page }) => {
  await login(page, USERNAME, PASSWORD);

  const sessionCookie = (await page.context().cookies()).find(
    (cookie) => cookie.name === SESSION_COOKIE_NAME,
  );
  expect(sessionCookie).toMatchObject({ path: '/', httpOnly: true, secure: true, sameSite: 'Lax' });

  // The session must survive a navigation to a page that requires it
  await page.goto('/users/edit');
  await expect(page).toHaveURL('/users/edit', { timeout: UP_TO_ONE_MINUTE });
});

test.describe('login failure', () => {
  test('keeps form values after a failed enhanced submission', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[name="username"]').fill(USERNAME);
    await page.locator('input[name="password"]').fill(WRONG_PASSWORD);
    await page.getByRole('button', { name: 'ログイン', exact: true }).click();

    await expect(page.getByText(LOGIN_FAILURE_MESSAGE)).toBeVisible({ timeout: UP_TO_ONE_MINUTE });
    await expect(page).toHaveURL('/login');
    await expect(page.locator('input[name="username"]')).toHaveValue(USERNAME);
  });

  test('returns the fail status for an enhanced submission', async ({ page }) => {
    await page.goto('/login');

    const result = await page.evaluate(
      async ({ username, password }) => {
        const body = new FormData();
        body.set('username', username);
        body.set('password', password);
        // Same headers as use:enhance, so SvelteKit answers with an ActionResult
        const response = await fetch('/login', {
          method: 'POST',
          headers: { accept: 'application/json', 'x-sveltekit-action': 'true' },
          body,
        });

        return { status: response.status, body: await response.text() };
      },
      { username: USERNAME, password: WRONG_PASSWORD },
    );

    // SvelteKit 2 answered 200 here; SvelteKit 3 uses the status passed to fail()
    expect(result.status).toBe(BAD_REQUEST);
    expect(deserializeActionResult(result.body)).toMatchObject({
      type: 'failure',
      status: BAD_REQUEST,
    });
  });
});
