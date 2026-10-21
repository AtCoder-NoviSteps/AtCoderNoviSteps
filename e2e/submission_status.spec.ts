import { test, expect, type Locator, type Page } from '@playwright/test';

import { loginAsUser } from './helpers/auth';

const PROBLEMS_URL = '/problems';
// The only ABS task in the seed, so it is the only cell in the default contest table group
const TASK_TITLE = 'Welcome to AtCoder';
const STATUS_LABELS = ['AC', '解説AC', '挑戦中', '未挑戦'] as const;

type StatusLabel = (typeof STATUS_LABELS)[number];

function statusItem(page: Page, label: StatusLabel): Locator {
  return page.getByRole('button', { name: label, exact: true });
}

async function openStatusDropdown(page: Page): Promise<void> {
  const taskCell = page
    .getByRole('cell')
    .filter({ has: page.getByRole('link', { name: TASK_TITLE }) });

  await taskCell.getByRole('button', { name: 'Update submission status' }).click();
  await expect(statusItem(page, 'AC')).toBeVisible();
}

// The cell shows the status only as a background color, so read the check icon in the dropdown
async function readCheckedStatus(page: Page): Promise<StatusLabel> {
  await openStatusDropdown(page);

  for (const label of STATUS_LABELS) {
    if ((await statusItem(page, label).locator('svg').count()) > 0) {
      return label;
    }
  }

  throw new Error('No submission status is checked');
}

async function selectStatus(page: Page, label: StatusLabel): Promise<void> {
  const saved = page.waitForResponse(
    (response) => response.url().includes('?/update') && response.request().method() === 'POST',
  );

  await statusItem(page, label).click();
  expect((await saved).ok()).toBe(true);
}

// Reloads first so the result reflects the server, not the optimistic update in the page
async function setStatusAfterReload(page: Page, label: StatusLabel): Promise<void> {
  await page.reload();

  if ((await readCheckedStatus(page)) !== label) {
    await selectStatus(page, label);
  }
}

test.describe('submission status in the contest table', () => {
  test('keeps the updated status after reload', async ({ page }) => {
    await loginAsUser(page);
    await page.goto(PROBLEMS_URL);

    const originalStatus = await readCheckedStatus(page);
    const updatedStatus: StatusLabel = originalStatus === 'AC' ? '挑戦中' : 'AC';

    try {
      await selectStatus(page, updatedStatus);
      await page.reload();

      // The dropdown updates the page without checking the response, so only a reload proves it was saved
      expect(await readCheckedStatus(page)).toBe(updatedStatus);
    } finally {
      await setStatusAfterReload(page, originalStatus);
    }
  });
});
