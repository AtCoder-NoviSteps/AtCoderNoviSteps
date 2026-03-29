import { test, expect, type Page } from '@playwright/test';

import { loginAsAdmin, loginAsUser } from './helpers/auth';

const TIMEOUT = 60 * 1000;
const VOTES_LIST_URL = '/votes';
const VOTE_MANAGEMENT_URL = '/vote_management';

// ---------------------------------------------------------------------------
// Votes list page (/votes)
// ---------------------------------------------------------------------------

test.describe('votes list page (/votes)', () => {
  test('unauthenticated user can view the page without redirect', async ({ page }) => {
    await page.goto(VOTES_LIST_URL);
    await expect(page).toHaveURL(VOTES_LIST_URL, { timeout: TIMEOUT });
    await expect(page.getByRole('heading', { name: 'グレード投票' })).toBeVisible({
      timeout: TIMEOUT,
    });
  });

  test('task table is visible to unauthenticated user', async ({ page }) => {
    await page.goto(VOTES_LIST_URL);
    await expect(page.getByRole('columnheader', { name: '問題' })).toBeVisible({
      timeout: TIMEOUT,
    });
    await expect(page.getByRole('columnheader', { name: 'コンテスト' })).toBeVisible({
      timeout: TIMEOUT,
    });
  });

  test('logged-in user can view the page', async ({ page }) => {
    await loginAsUser(page);
    await page.goto(VOTES_LIST_URL);
    await expect(page).toHaveURL(VOTES_LIST_URL, { timeout: TIMEOUT });
    await expect(page.getByRole('heading', { name: 'グレード投票' })).toBeVisible({
      timeout: TIMEOUT,
    });
  });

  test('search input filters tasks by title', async ({ page }) => {
    await page.goto(VOTES_LIST_URL);
    const searchInput = page.getByPlaceholder('問題名・問題ID・コンテストIDで検索');
    await expect(searchInput).toBeVisible({ timeout: TIMEOUT });

    // Type a string unlikely to match any task to get 0 results
    await searchInput.fill('__no_match_expected__');
    await expect(page.getByText('該当する問題が見つかりませんでした')).toBeVisible({
      timeout: TIMEOUT,
    });
  });
});

// ---------------------------------------------------------------------------
// Vote detail page (/votes/[slug])
// ---------------------------------------------------------------------------

test.describe('vote detail page (/votes/[slug])', () => {
  /**
   * Navigates to the first task in the vote list.
   * Assumes at least one task exists in the DB.
   */
  async function navigateToFirstVoteDetailPage(page: Page): Promise<void> {
    await page.goto(VOTES_LIST_URL);
    await expect(page.getByRole('columnheader', { name: '問題' })).toBeVisible({
      timeout: TIMEOUT,
    });
    // Click the first task title link in the table
    await page.locator('table').getByRole('link').first().click();
    await expect(page).toHaveURL(/\/votes\/.+/, { timeout: TIMEOUT });
  }

  test.describe('unauthenticated user', () => {
    test('can view the task detail page without redirect', async ({ page }) => {
      await navigateToFirstVoteDetailPage(page);
      // Should stay on /votes/[slug], not redirected
      await expect(page).toHaveURL(/\/votes\/.+/, { timeout: TIMEOUT });
    });

    test('sees login prompt instead of vote buttons', async ({ page }) => {
      await navigateToFirstVoteDetailPage(page);

      const content = page.locator('.container');

      await expect(content.getByText('投票するにはログインが必要です')).toBeVisible({
        timeout: TIMEOUT,
      });
      await expect(content.getByRole('link', { name: 'ログイン' })).toBeVisible({
        timeout: TIMEOUT,
      });
      await expect(content.getByRole('link', { name: 'アカウント作成' })).toBeVisible({
        timeout: TIMEOUT,
      });
    });

    test('does not see vote grade buttons', async ({ page }) => {
      await navigateToFirstVoteDetailPage(page);
      // Grade buttons are only rendered inside the vote form (not shown when logged out)
      await expect(page.locator('form[action="?/voteAbsoluteGrade"]')).not.toBeAttached();
    });

    test('breadcrumb link navigates back to /votes', async ({ page }) => {
      await navigateToFirstVoteDetailPage(page);
      await page
        .locator('.container')
        .locator('nav')
        .getByRole('link', { name: 'グレード投票' })
        .click();
      await expect(page).toHaveURL(VOTES_LIST_URL, { timeout: TIMEOUT });
    });
  });

  test.describe('logged-in user', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsUser(page);
    });

    test('can view the task detail page', async ({ page }) => {
      await navigateToFirstVoteDetailPage(page);
      await expect(page).toHaveURL(/\/votes\/.+/, { timeout: TIMEOUT });
    });

    test('sees vote grade buttons', async ({ page }) => {
      await navigateToFirstVoteDetailPage(page);

      // Skip if the test user is not AtCoder-verified.
      // Wait for either the vote form or the unverified message to appear before deciding.
      const voteForm = page.locator('form[action="?/voteAbsoluteGrade"]');
      const unverifiedMessage = page.getByText('AtCoderアカウントの認証が必要です');
      await expect(voteForm.or(unverifiedMessage)).toBeVisible({ timeout: TIMEOUT });
      const isUnverified = await unverifiedMessage.isVisible();
      test.skip(isUnverified, 'test user is not AtCoder-verified');

      // Explicit check: voteForm is already guaranteed visible by the or() wait above,
      // but this documents the expected state for verified users.
      await expect(voteForm).toBeVisible({
        timeout: TIMEOUT,
      });
      // The grade buttons should include Q11 (11Q)
      await expect(page.getByRole('button', { name: '11Q' })).toBeVisible({ timeout: TIMEOUT });
    });

    test('does not see login prompt', async ({ page }) => {
      await navigateToFirstVoteDetailPage(page);
      await expect(page.getByText('投票するにはログインが必要です')).not.toBeVisible();
    });
  });
});

// ---------------------------------------------------------------------------
// Vote management page (/vote_management) — admin only
// ---------------------------------------------------------------------------

test.describe('vote management page (/vote_management)', () => {
  test('unauthenticated user is redirected to /login', async ({ page }) => {
    await page.goto(VOTE_MANAGEMENT_URL);
    await expect(page).toHaveURL('/login', { timeout: TIMEOUT });
  });

  test('non-admin user is redirected to /', async ({ page }) => {
    await loginAsUser(page);
    await page.goto(VOTE_MANAGEMENT_URL);
    await expect(page).toHaveURL('/', { timeout: TIMEOUT });
  });

  test.describe('admin user', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
    });

    test('can access the page', async ({ page }) => {
      await page.goto(VOTE_MANAGEMENT_URL);
      await expect(page).toHaveURL(VOTE_MANAGEMENT_URL, { timeout: TIMEOUT });
      await expect(page.getByRole('heading', { name: '投票管理' })).toBeVisible({
        timeout: TIMEOUT,
      });
    });

    test('sees the vote management table with expected columns', async ({ page }) => {
      await page.goto(VOTE_MANAGEMENT_URL);
      await expect(page.getByRole('columnheader', { name: '問題' })).toBeVisible({
        timeout: TIMEOUT,
      });
      await expect(page.getByRole('columnheader', { name: 'DBグレード' })).toBeVisible({
        timeout: TIMEOUT,
      });
      await expect(page.getByRole('columnheader', { name: '中央値グレード' })).toBeVisible({
        timeout: TIMEOUT,
      });
      await expect(page.getByRole('columnheader', { name: '票数' })).toBeVisible({
        timeout: TIMEOUT,
      });
    });
  });
});
