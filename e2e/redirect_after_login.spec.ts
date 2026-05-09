import { test, expect, type Page } from '@playwright/test';
import { submitLoginForm, submitSignupForm } from './helpers/auth';

/**
 * Opens the submission status dropdown for a given task on the /problems page.
 *
 * Steps:
 *  1. Click the contest table tab (in case it is not the default)
 *  2. Click the contest group button identified by contestGroupAriaLabel
 *  3. Click the dropdown trigger inside the cell identified by contestId and taskIndex
 *
 * The dropdown items are not in the DOM until the trigger is clicked (Flowbite renders them lazily).
 *
 * @param contestGroupAriaLabel - aria-label of the contest group button (e.g. 'Filter contests from ABC 319 onwards')
 * @param contestId - contest ID portion of the cell ID (e.g. 'abc422')
 * @param taskIndex - task column index (e.g. 'A')
 */
async function openProblemSubmissionDropdown(
  page: Page,
  contestGroupAriaLabel: string,
  contestId: string,
  taskIndex: string,
): Promise<void> {
  await page.getByRole('tab', { name: 'コンテスト別（アルファ版）' }).click();
  await page.getByLabel(contestGroupAriaLabel).click();
  await page.locator(`#${contestId}-${taskIndex}`).getByLabel('Update submission status').click();
}

test.describe('redirect with redirectTo parameter', () => {
  test.describe('login', () => {
    test.describe('redirectTo preserved in login links', () => {
      test.describe('server-side (protected routes)', () => {
        test.describe('workbooks', () => {
          const workbookRoutes = [
            '/workbooks',
            '/workbooks/bfs',
            '/workbooks/create',
            '/workbooks/edit/bfs',
          ];

          for (const route of workbookRoutes) {
            test(`redirects to login for ${route}`, async ({ page }) => {
              await page.goto(route);
              await expect(page).toHaveURL(
                new RegExp(`/login\\?redirectTo=${encodeURIComponent(route)}`),
              );
            });
          }
        });

        test.describe('users', () => {
          test('edit page redirects without login', async ({ page }) => {
            await page.goto('/users/edit');
            await expect(page).toHaveURL(/\/login\?redirectTo=%2Fusers%2Fedit/);
          });
        });

        test.describe('admin', () => {
          const adminRoutes = [
            '/account_transfer',
            '/tasks',
            '/tasks/1',
            '/tags',
            '/tags/1',
            '/vote_management',
            '/workbooks/order',
          ];

          for (const route of adminRoutes) {
            test(`redirects to login for ${route}`, async ({ page }) => {
              await page.goto(route);
              await expect(page).toHaveURL(
                new RegExp(`/login\\?redirectTo=${encodeURIComponent(route)}`),
              );
            });
          }
        });
      });

      test.describe('client-side (action pages)', () => {
        test.describe('problems', () => {
          test('login dropdown item includes redirectTo parameter', async ({ page }) => {
            await page.goto('/problems');
            await openProblemSubmissionDropdown(
              page,
              'Filter contests from ABC 319 onwards',
              'abc422',
              'A',
            );
            // Href pattern distinguishes dropdown (/login?redirectTo=*) from navbar (/login)
            const href = await page.locator('a[href^="/login?redirectTo"]').getAttribute('href');
            expect(href).toMatch(/^\/login\?redirectTo=%2Fproblems/);
          });
        });

        test.describe('votes', () => {
          test('login link includes redirectTo parameter', async ({ page }) => {
            await page.goto('/votes/abc422_a');
            const href = await page.locator('a[href^="/login?redirectTo"]').getAttribute('href');
            expect(href).toMatch(/^\/login\?redirectTo=%2Fvotes%2Fabc422_a/);
          });
        });
      });
    });

    test.describe('redirects back to original page after login', () => {
      // Note: Representative paths only: one user route and one admin route.
      // The redirect mechanism is shared, so exhaustive per-route coverage adds no value over
      // the redirect-to-login tests above.
      test('user can login and be redirected to /workbooks/bfs', async ({ page }) => {
        await page.goto('/workbooks/bfs');
        await expect(page).toHaveURL(/\/login\?redirectTo=%2Fworkbooks%2Fbfs/);
        await submitLoginForm(page, 'guest');
        await expect(page).toHaveURL('/workbooks/bfs');
      });

      test('admin can login and be redirected to admin page', async ({ page }) => {
        await page.goto('/tags');
        await expect(page).toHaveURL(/\/login\?redirectTo=%2Ftags/);
        await submitLoginForm(page, 'admin');
        await expect(page).toHaveURL('/tags');
      });
    });
  });

  test.describe('signup', () => {
    test.describe('redirectTo preserved in signup links', () => {
      test.describe('client-side (action pages)', () => {
        test.describe('problems', () => {
          test('signup dropdown item includes redirectTo parameter', async ({ page }) => {
            await page.goto('/problems');
            await openProblemSubmissionDropdown(
              page,
              'Filter contests from ABC 319 onwards',
              'abc422',
              'A',
            );
            // Href pattern distinguishes dropdown (/signup?redirectTo=*) from navbar (/signup)
            const href = await page.locator('a[href^="/signup?redirectTo"]').getAttribute('href');
            expect(href).toMatch(/^\/signup\?redirectTo=%2Fproblems/);
          });
        });

        test.describe('votes', () => {
          test('signup link includes redirectTo parameter', async ({ page }) => {
            await page.goto('/votes/abc422_a');
            const href = await page.locator('a[href^="/signup?redirectTo"]').getAttribute('href');
            expect(href).toMatch(/^\/signup\?redirectTo=%2Fvotes%2Fabc422_a/);
          });
        });
      });
    });

    test.describe('redirects back to original page after signup', () => {
      test('user can signup via login page link and be redirected to /workbooks/bfs', async ({
        page,
      }) => {
        await page.goto('/workbooks/bfs');
        await expect(page).toHaveURL(/\/login\?redirectTo=%2Fworkbooks%2Fbfs/);

        await page.getByRole('link', { name: 'アカウントを作成' }).click();
        await expect(page).toHaveURL(/\/signup/);

        await submitSignupForm(page);
        await expect(page).toHaveURL('/workbooks/bfs', { timeout: 60 * 1000 });
      });

      test('preserves redirectTo from votes page through signup link', async ({ page }) => {
        await page.goto('/votes/abc422_a');
        const href = await page.locator('a[href^="/signup?redirectTo"]').getAttribute('href');
        await page.goto(href!);
        await expect(page).toHaveURL(
          new RegExp(`/signup\\?redirectTo=${encodeURIComponent('/votes/abc422_a')}`),
        );

        await submitSignupForm(page);
        await expect(page).toHaveURL('/votes/abc422_a', { timeout: 60 * 1000 });
      });

      test('defaults to home page when no redirectTo', async ({ page }) => {
        await page.goto('/signup');
        await submitSignupForm(page);
        await expect(page).toHaveURL('/', { timeout: 60 * 1000 });
      });
    });
  });

  test.describe('open redirect prevention', () => {
    const maliciousRedirects = [
      { label: 'external domain', redirectTo: 'https://danger.com' },
      { label: 'protocol-relative URL', redirectTo: '%2F%2Fdanger.com' },
      { label: 'javascript: URL', redirectTo: 'javascript%3Aalert()' },
    ];

    for (const { label, redirectTo } of maliciousRedirects) {
      test(`prevents redirect to ${label}`, async ({ page }) => {
        await page.goto(`/login?redirectTo=${redirectTo}`);
        await submitLoginForm(page, 'guest');
        await expect(page).toHaveURL('/');
      });
    }
  });
});
