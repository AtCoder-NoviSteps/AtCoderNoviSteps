import { test, expect, type Page } from '@playwright/test';

import { loginAsUser } from './helpers/auth';

import { FORBIDDEN } from '../src/lib/constants/http-response-status-codes';

const TIMEOUT = 60 * 1000;
// An admin-owned workbook that a regular guest user cannot edit.
const ADMIN_WORKBOOK_SLUG = 'standard-input-output-1-integer';
const WORKBOOK_EDIT_URL = `/workbooks/edit/${ADMIN_WORKBOOK_SLUG}`;

// Mirrors SvelteKit's ActionResult — $app/forms is not resolvable in Playwright.
type ActionRedirect = { type: 'redirect'; status: number; location: string };
type ActionError = { type: 'error'; status?: number; error: unknown };
type ActionResultLike = ActionRedirect | ActionError | { type: 'success' | 'failure' };

function deserializeActionResult(text: string): ActionResultLike {
  return JSON.parse(text) as ActionResultLike;
}

async function postFormAction(
  page: Page,
  url: string,
): Promise<{ status: number; url: string; body: string }> {
  return page.evaluate(async (url) => {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: '',
    });
    const text = await response.text();
    return { status: response.status, url: response.url, body: text };
  }, url);
}

test.describe('workbook edit access control', () => {
  test('unauthenticated user is redirected to /login on direct POST', async ({ page }) => {
    await page.goto('/');
    const result = await postFormAction(page, WORKBOOK_EDIT_URL);

    const data = deserializeActionResult(result.body);
    expect(data.type).toBe('redirect');
    expect(data).toHaveProperty('location', expect.stringMatching(/\/login/));
  });

  test('non-owner cannot edit workbook via direct POST', async ({ page }) => {
    await loginAsUser(page);
    const result = await postFormAction(page, WORKBOOK_EDIT_URL);
    expect(result.status).toBe(FORBIDDEN);
  });
});

test.describe('workbook edit page access control (load)', () => {
  test('unauthenticated user is redirected to /login', async ({ page }) => {
    await page.goto(WORKBOOK_EDIT_URL);
    await expect(page).toHaveURL(/\/login/, { timeout: TIMEOUT });
  });
});
