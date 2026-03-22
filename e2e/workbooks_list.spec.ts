import { test, expect } from '@playwright/test';

import { loginAsAdmin, loginAsUser } from './helpers/auth';

const TIMEOUT = 60 * 1000;
// Short timeout used only for optional visibility checks (to decide skip, not to assert).
const VISIBILITY_CHECK_TIMEOUT = 3000;
const WORKBOOK_LIST_URL = '/workbooks';

// Tab URL parameter values (must match WorkBookTab const in src/features/workbooks/types/workbook.ts)
const TAB_CURRICULUM = 'curriculum';
const TAB_SOLUTION = 'solution';
const TAB_CREATED_BY_USER = 'created_by_user';

// Grade URL parameter values (must match TaskGrade in src/lib/types/task.ts)
const GRADE_Q10 = 'Q10';
const GRADE_Q9 = 'Q9';
const GRADE_Q8 = 'Q8';

// Category URL parameter values (must match SolutionCategory in src/features/workbooks/types/workbook_placement.ts)
const CATEGORY_GRAPH = 'GRAPH';
const CATEGORY_DP = 'DYNAMIC_PROGRAMMING';
const CATEGORY_SEARCH = 'SEARCH_SIMULATION';

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

  test.describe('tab visibility', () => {
    test('defaults to curriculum tab', async ({ page }) => {
      await page.goto(WORKBOOK_LIST_URL);
      await expect(page.getByRole('tab', { name: 'カリキュラム' })).toHaveAttribute(
        'aria-selected',
        'true',
        { timeout: TIMEOUT },
      );
    });

    test('curriculum and solution tabs are visible', async ({ page }) => {
      await page.goto(WORKBOOK_LIST_URL);
      await expect(page.getByRole('tab', { name: 'カリキュラム' })).toBeVisible({
        timeout: TIMEOUT,
      });
      await expect(page.getByRole('tab', { name: '解法別' })).toBeVisible({ timeout: TIMEOUT });
    });

    test('user-created tab is not visible to non-admin', async ({ page }) => {
      await page.goto(WORKBOOK_LIST_URL);
      await expect(page.getByRole('tab', { name: 'ユーザ作成' })).not.toBeVisible();
    });
  });

  test.describe('URL parameter handling', () => {
    test('non-admin accessing created_by_user tab is redirected to /workbooks', async ({
      page,
    }) => {
      await page.goto(`${WORKBOOK_LIST_URL}?tab=${TAB_CREATED_BY_USER}`);
      await expect(page).toHaveURL(WORKBOOK_LIST_URL, { timeout: TIMEOUT });
    });

    test('invalid tab param falls back to curriculum tab', async ({ page }) => {
      await page.goto(`${WORKBOOK_LIST_URL}?tab=invalid`);
      await expect(page.getByRole('tab', { name: 'カリキュラム' })).toHaveAttribute(
        'aria-selected',
        'true',
        { timeout: TIMEOUT },
      );
    });

    test('direct URL access to solution tab selects the solution tab', async ({ page }) => {
      await page.goto(`${WORKBOOK_LIST_URL}?tab=${TAB_SOLUTION}&categories=${CATEGORY_GRAPH}`);
      await expect(page.getByRole('tab', { name: '解法別' })).toHaveAttribute(
        'aria-selected',
        'true',
        { timeout: TIMEOUT },
      );
    });
  });

  test.describe('navigation interactions', () => {
    test('clicking solution tab updates URL to tab=solution', async ({ page }) => {
      await page.goto(WORKBOOK_LIST_URL);
      await expect(page.getByRole('tab', { name: 'カリキュラム' })).toBeVisible({
        timeout: TIMEOUT,
      });
      await page.getByRole('tab', { name: '解法別' }).click();
      await expect(page).toHaveURL(new RegExp(`tab=${TAB_SOLUTION}`), { timeout: TIMEOUT });
    });

    // Grade buttons → URL update
    const CURRICULUM_GRADE_CASES = [
      { grade: GRADE_Q10, label: '10Q' },
      { grade: GRADE_Q9, label: '9Q' },
      { grade: GRADE_Q8, label: '8Q' },
    ];

    for (const { grade, label } of CURRICULUM_GRADE_CASES) {
      test(`curriculum grade button "${label}" updates URL to grades=${grade}`, async ({
        page,
      }) => {
        await page.goto(`${WORKBOOK_LIST_URL}?tab=${TAB_CURRICULUM}`);
        await expect(page.getByRole('tab', { name: 'カリキュラム' })).toBeVisible({
          timeout: TIMEOUT,
        });
        await page.getByRole('button', { name: label }).click();
        await expect(page).toHaveURL(new RegExp(`grades=${grade}`), { timeout: TIMEOUT });
      });
    }

    // Solution category buttons → URL update
    const SOLUTION_CATEGORY_CASES = [
      { category: CATEGORY_GRAPH, label: 'グラフ' },
      { category: CATEGORY_DP, label: '動的計画法' },
      { category: CATEGORY_SEARCH, label: '探索・シミュレーション・実装' },
    ];

    for (const { category, label } of SOLUTION_CATEGORY_CASES) {
      test(`solution category button "${label}" updates URL to categories=${category}`, async ({
        page,
      }) => {
        await page.goto(`${WORKBOOK_LIST_URL}?tab=${TAB_SOLUTION}`);
        await expect(page.getByRole('tab', { name: '解法別' })).toBeVisible({ timeout: TIMEOUT });

        const button = page.getByRole('button', { name: label });
        if (!(await button.isVisible({ timeout: VISIBILITY_CHECK_TIMEOUT }).catch(() => false))) {
          // No workbooks for this category → button is hidden by availableCategories filter
          test.skip();
          return;
        }

        await button.click();
        await expect(page).toHaveURL(new RegExp(`categories=${category}`), { timeout: TIMEOUT });
      });
    }
  });

  test.describe('session state', () => {
    test('navigating away and back via nav link restores saved URL filter state', async ({
      page,
    }) => {
      const targetUrl = `${WORKBOOK_LIST_URL}?tab=${TAB_SOLUTION}&categories=${CATEGORY_GRAPH}`;
      await page.goto(targetUrl);
      await expect(page.getByRole('tab', { name: '解法別' })).toHaveAttribute(
        'aria-selected',
        'true',
        {
          timeout: TIMEOUT,
        },
      );

      // Navigate to another page
      await page.goto('/');
      await expect(page).toHaveURL('/', { timeout: TIMEOUT });

      // Return to /workbooks via nav link (no params)
      await page.goto(WORKBOOK_LIST_URL);

      // URL should be restored to the saved filter state
      await expect(page).toHaveURL(new RegExp(`tab=${TAB_SOLUTION}`), { timeout: TIMEOUT });
      await expect(page).toHaveURL(new RegExp(`categories=${CATEGORY_GRAPH}`), {
        timeout: TIMEOUT,
      });
    });
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

    if (!(await toggleInput.isVisible({ timeout: VISIBILITY_CHECK_TIMEOUT }).catch(() => false))) {
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

  test.describe('tab visibility', () => {
    test('"新規作成" button is visible', async ({ page }) => {
      await page.goto(WORKBOOK_LIST_URL);
      await expect(page.getByRole('link', { name: '新規作成' })).toBeVisible({ timeout: TIMEOUT });
    });

    test('user-created tab is visible to admin', async ({ page }) => {
      await page.goto(WORKBOOK_LIST_URL);
      await expect(page.getByRole('tab', { name: 'ユーザ作成' })).toBeVisible({
        timeout: TIMEOUT,
      });
    });

    test('admin can access created_by_user tab via URL', async ({ page }) => {
      await page.goto(`${WORKBOOK_LIST_URL}?tab=${TAB_CREATED_BY_USER}`);
      await expect(page.getByRole('tab', { name: 'ユーザ作成' })).toHaveAttribute(
        'aria-selected',
        'true',
        { timeout: TIMEOUT },
      );
    });
  });

  test.describe('workbook actions', () => {
    test('workbook rows show edit link and delete button', async ({ page }) => {
      await page.goto(WORKBOOK_LIST_URL);
      await expect(page.getByRole('tab', { name: 'カリキュラム' })).toBeVisible({
        timeout: TIMEOUT,
      });

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
});
