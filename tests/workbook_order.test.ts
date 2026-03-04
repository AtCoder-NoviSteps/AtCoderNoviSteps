import { test, expect, Page } from '@playwright/test';

const TIMEOUT = 60 * 1000;
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'Ch0kuda1';
const ORDER_URL = '/workbooks/order';

async function loginAsAdmin(page: Page): Promise<void> {
  await page.goto('/login');
  await expect(page).toHaveURL('/login', { timeout: TIMEOUT });
  await page.locator('input[name="username"]').fill(ADMIN_USERNAME);
  await page.locator('input[name="password"]').fill(ADMIN_PASSWORD);
  await page.getByRole('button', { name: 'ログイン' }).nth(1).click();
  await expect(page).toHaveURL('/', { timeout: TIMEOUT });
}

function getColumn(page: Page, label: string) {
  return page
    .locator('div')
    .filter({ has: page.getByRole('heading', { name: label }) })
    .first();
}

async function getCardsInColumn(
  page: Page,
  label: string,
): Promise<{ title: string; placementId: number }[]> {
  const col = getColumn(page, label);
  const cards = col.locator('[data-placement-id]');
  const count = await cards.count();
  const result: { title: string; placementId: number }[] = [];
  for (let i = 0; i < count; i++) {
    const card = cards.nth(i);
    const title = (await card.textContent()) ?? '';
    const id = await card.getAttribute('data-placement-id');
    result.push({ title: title.trim(), placementId: Number(id) });
  }
  return result;
}

async function postUpdates(
  page: Page,
  updates: {
    id: number;
    priority: number;
    solutionCategory: string | null;
    taskGrade: string | null;
  }[],
): Promise<void> {
  const status = await page.evaluate(
    async ({ url, body }) => {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      return res.status;
    },
    { url: ORDER_URL, body: { updates } },
  );
  expect(status).toBe(200);
}

test.describe('workbook order page', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('reordering within the same column persists after reload', async ({ page }) => {
    await page.goto(`${ORDER_URL}?tab=solution&cols=PENDING`);
    await expect(page.getByRole('heading', { name: '未分類' })).toBeVisible({ timeout: TIMEOUT });

    const cards = await getCardsInColumn(page, '未分類');
    if (cards.length < 2) {
      test.skip();
      return;
    }

    const [first, second] = cards;

    // Swap the first two cards via API
    await postUpdates(page, [
      { id: first.placementId, priority: 2, solutionCategory: 'PENDING', taskGrade: null },
      { id: second.placementId, priority: 1, solutionCategory: 'PENDING', taskGrade: null },
    ]);

    await page.reload();
    await expect(page.getByRole('heading', { name: '未分類' })).toBeVisible({ timeout: TIMEOUT });

    const reloaded = await getCardsInColumn(page, '未分類');
    expect(reloaded[0].placementId).toBe(second.placementId);
    expect(reloaded[1].placementId).toBe(first.placementId);

    // Restore
    await postUpdates(page, [
      { id: first.placementId, priority: 1, solutionCategory: 'PENDING', taskGrade: null },
      { id: second.placementId, priority: 2, solutionCategory: 'PENDING', taskGrade: null },
    ]);
  });

  test('moving a card to a different column persists after reload', async ({ page }) => {
    await page.goto(`${ORDER_URL}?tab=solution&cols=PENDING,GRAPH`);
    await expect(page.getByRole('heading', { name: '未分類' })).toBeVisible({ timeout: TIMEOUT });

    const pendingCards = await getCardsInColumn(page, '未分類');
    if (pendingCards.length === 0) {
      test.skip();
      return;
    }

    const card = pendingCards[0];

    // Move card to GRAPH via API
    await postUpdates(page, [
      { id: card.placementId, priority: 1, solutionCategory: 'GRAPH', taskGrade: null },
    ]);

    await page.reload();
    await expect(page.getByRole('heading', { name: 'グラフ' })).toBeVisible({ timeout: TIMEOUT });

    const graphCards = await getCardsInColumn(page, 'グラフ');
    expect(graphCards.some((c) => c.placementId === card.placementId)).toBe(true);

    // Restore
    await postUpdates(page, [
      { id: card.placementId, priority: 1, solutionCategory: 'PENDING', taskGrade: null },
    ]);
  });

  test('reordering in curriculum tab persists after reload', async ({ page }) => {
    await page.goto(`${ORDER_URL}?tab=curriculum&grades=Q10,Q9`);
    await expect(page.getByRole('heading', { name: '10Q' })).toBeVisible({ timeout: TIMEOUT });

    const cards = await getCardsInColumn(page, '10Q');
    if (cards.length < 2) {
      test.skip();
      return;
    }

    const [first, second] = cards;

    // Swap via API
    await postUpdates(page, [
      { id: first.placementId, priority: 2, solutionCategory: null, taskGrade: 'Q10' },
      { id: second.placementId, priority: 1, solutionCategory: null, taskGrade: 'Q10' },
    ]);

    await page.reload();
    await expect(page.getByRole('heading', { name: '10Q' })).toBeVisible({ timeout: TIMEOUT });

    const reloaded = await getCardsInColumn(page, '10Q');
    expect(reloaded[0].placementId).toBe(second.placementId);
    expect(reloaded[1].placementId).toBe(first.placementId);

    // Restore
    await postUpdates(page, [
      { id: first.placementId, priority: 1, solutionCategory: null, taskGrade: 'Q10' },
      { id: second.placementId, priority: 2, solutionCategory: null, taskGrade: 'Q10' },
    ]);
  });

  test('switching from solution to curriculum tab removes cols from URL', async ({ page }) => {
    await page.goto(`${ORDER_URL}?tab=solution&cols=PENDING,GRAPH&grades=Q10,Q9`);
    await expect(page.getByRole('heading', { name: '未分類' })).toBeVisible({ timeout: TIMEOUT });

    await page.getByRole('tab', { name: 'カリキュラム' }).click();

    const url = new URL(page.url());
    expect(url.searchParams.has('cols')).toBe(false);
    expect(url.searchParams.get('tab')).toBe('curriculum');
  });

  test('switching from curriculum to solution tab removes grades from URL', async ({ page }) => {
    await page.goto(`${ORDER_URL}?tab=curriculum&cols=PENDING,GRAPH&grades=Q10,Q9`);
    await expect(page.getByRole('heading', { name: '10Q' })).toBeVisible({ timeout: TIMEOUT });

    await page.getByRole('tab', { name: '解法別' }).click();

    const url = new URL(page.url());
    expect(url.searchParams.has('grades')).toBe(false);
    expect(url.searchParams.get('tab')).toBe('solution');
  });
});
