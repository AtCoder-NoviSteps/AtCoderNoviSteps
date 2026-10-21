import { test, expect } from '@playwright/test';

const PROBLEMS_URL = '/problems';
const GRADE_TAB_TITLE = 'グレード別';
const CONTEST_TABLE_TAB_TITLE = 'コンテスト別（アルファ版）';

test.describe('problem list tabs', () => {
  test('keeps the selected problem list tab after reload', async ({ page }) => {
    await page.goto(PROBLEMS_URL);

    await page.getByRole('tab', { name: GRADE_TAB_TITLE }).click();
    await expect(page.getByRole('tab', { name: GRADE_TAB_TITLE })).toHaveAttribute(
      'aria-selected',
      'true',
    );

    await page.reload();

    await expect(page.getByRole('tab', { name: GRADE_TAB_TITLE })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await expect(page.getByRole('tab', { name: CONTEST_TABLE_TAB_TITLE })).toHaveAttribute(
      'aria-selected',
      'false',
    );
  });
});
