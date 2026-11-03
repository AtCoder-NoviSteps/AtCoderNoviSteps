import { expect, test } from '@playwright/test';

const XDPC_GROUP_ARIA_LABEL = 'xDPC and x 24 contests';
const XDPC_GROUP_TABLE_TITLES = [
  'Educational DP Contest / DP まとめコンテスト',
  'Typical DP Contest',
  'Next DP Contest',
  'FPS 24 題',
  '組合せゲーム 24 題',
  "AAL Contest 001: Let's use segtree!",
];
const ABC319_ONWARDS_GROUP_ARIA_LABEL = 'Filter contests from ABC 319 onwards';
const ABC319_ONWARDS_TABLE_TITLES = ['AtCoder Beginner Contest 319 〜（7 問制）'];

test.describe('PCK groups in contest table', () => {
  for (const { roundName, roundLabel, ariaLabel, years } of [
    {
      roundName: 'preliminary',
      roundLabel: '予選',
      ariaLabel: 'Filter PCK Preliminary',
      years: [
        2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015, 2014, 2013, 2012,
        2011, 2010, 2009, 2008, 2007, 2006, 2005, 2004,
      ],
    },
    {
      roundName: 'final',
      roundLabel: '本選',
      ariaLabel: 'Filter PCK Final',
      years: [
        2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015, 2014, 2013, 2012, 2011,
        2010, 2009, 2008, 2007, 2006, 2005, 2004, 2003,
      ],
    },
  ]) {
    test(`shows ${roundName} tables newest first and preserves the selection after reload`, async ({
      page,
    }) => {
      await page.goto('/problems');
      await page.getByRole('button', { name: ariaLabel }).click();

      const titles = years.map((year) => `PCK ${year} ${roundLabel}`);
      await expect(page.getByRole('heading', { level: 2 })).toHaveText(titles);
      await page.reload();
      await expect(page.getByRole('heading', { level: 2 })).toHaveText(titles);
    });
  }
});

test.describe('xDPC group in contest table', () => {
  test('shows Game 24 and AAL Contest 001 tables after FPS 24 in the xDPC group', async ({
    page,
  }) => {
    await page.goto('/problems');

    await page.getByRole('button', { name: XDPC_GROUP_ARIA_LABEL }).click();

    // Headings render even when the seed has no tasks for a provider, so this stays seed-independent.
    await expect(page.getByRole('heading', { level: 2 })).toHaveText(XDPC_GROUP_TABLE_TITLES);
  });
});

test.describe('contest type selection', () => {
  // ABC 319 onwards is the group most users open
  test('keeps the selected contest type after reload', async ({ page }) => {
    await page.goto('/problems');

    await page.getByRole('button', { name: ABC319_ONWARDS_GROUP_ARIA_LABEL }).click();
    await expect(page.getByRole('heading', { level: 2 })).toHaveText(ABC319_ONWARDS_TABLE_TITLES);

    await page.reload();

    // The default group is ABS, so these headings only appear when the choice was saved
    await expect(page.getByRole('heading', { level: 2 })).toHaveText(ABC319_ONWARDS_TABLE_TITLES);
  });
});
