import { expect, test } from '@playwright/test';

const XDPC_GROUP_ARIA_LABEL = 'xDPC and x 24 contests';
const XDPC_GROUP_TABLE_TITLES = [
  'Educational DP Contest / DP まとめコンテスト',
  'Typical DP Contest',
  'Next DP Contest',
  'FPS 24 題',
  '組合せゲーム 24 題',
];

test.describe('xDPC group in contest table', () => {
  test('shows Game 24 table right after FPS 24 in the xDPC group', async ({ page }) => {
    await page.goto('/problems');

    await page.getByRole('button', { name: XDPC_GROUP_ARIA_LABEL }).click();

    // Headings render even when the seed has no tasks for a provider, so this stays seed-independent.
    await expect(page.getByRole('heading', { level: 2 })).toHaveText(XDPC_GROUP_TABLE_TITLES);
  });
});
