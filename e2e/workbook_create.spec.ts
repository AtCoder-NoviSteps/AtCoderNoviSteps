import { test, expect } from '@playwright/test';

import { loginAsAdmin } from './helpers/auth';

const TIMEOUT = 60 * 1000;
const WORKBOOK_CREATE_URL = '/workbooks/create';
const ADMIN_USER_ID = '1'; // From prisma/users.ts seed data

test.describe('workbook create form (admin)', () => {
  test('pre-fills the admin as author of an official curriculum workbook', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(WORKBOOK_CREATE_URL);

    // Hidden inputs have no label, so select them by name.
    await expect(page.locator('input[name="userId"]')).toHaveValue(ADMIN_USER_ID, {
      timeout: TIMEOUT,
    });
    await expect(page.locator('input[name="isOfficial"]')).toHaveValue('true');
    await expect(page.getByLabel('問題集の種類')).toHaveValue('CURRICULUM');
  });
});
