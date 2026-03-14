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

function getColumn(page: Page, columnId: string) {
  return page.locator(`[data-testid="column-${columnId}"]`);
}

async function getCardsInColumn(
  page: Page,
  columnId: string,
): Promise<{ title: string; placementId: number }[]> {
  const column = getColumn(page, columnId);
  const cards = column.locator('[data-placement-id]');
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

test.describe('access control', () => {
  test('unauthenticated user is redirected to /login', async ({ page }) => {
    await page.goto(ORDER_URL);
    await expect(page).toHaveURL('/login', { timeout: TIMEOUT });
  });
});

test.describe('workbook order page', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('reordering within the same column persists after reload', async ({ page }) => {
    await page.goto(`${ORDER_URL}?tab=solution&categories=PENDING`);
    await expect(page.getByRole('heading', { name: '未分類' })).toBeVisible({ timeout: TIMEOUT });

    const cards = await getCardsInColumn(page, 'PENDING');

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

    try {
      await page.reload();
      await expect(page.getByRole('heading', { name: '未分類' })).toBeVisible({ timeout: TIMEOUT });

      const reloaded = await getCardsInColumn(page, 'PENDING');
      expect(reloaded[0].placementId).toBe(second.placementId);
      expect(reloaded[1].placementId).toBe(first.placementId);
    } finally {
      // Restore
      await postUpdates(page, [
        { id: first.placementId, priority: 1, solutionCategory: 'PENDING', taskGrade: null },
        { id: second.placementId, priority: 2, solutionCategory: 'PENDING', taskGrade: null },
      ]);
    }
  });

  test('moving a card to a different column persists after reload', async ({ page }) => {
    await page.goto(`${ORDER_URL}?tab=solution&categories=PENDING,GRAPH`);
    await expect(page.getByRole('heading', { name: '未分類' })).toBeVisible({ timeout: TIMEOUT });

    const pendingCards = await getCardsInColumn(page, 'PENDING');
    if (pendingCards.length === 0) {
      test.skip();
      return;
    }

    const card = pendingCards[0];

    // Move card to GRAPH via API
    await postUpdates(page, [
      { id: card.placementId, priority: 1, solutionCategory: 'GRAPH', taskGrade: null },
    ]);

    try {
      await page.reload();
      await expect(page.getByRole('heading', { name: 'グラフ' })).toBeVisible({ timeout: TIMEOUT });

      const graphCards = await getCardsInColumn(page, 'GRAPH');
      expect(graphCards.some((c) => c.placementId === card.placementId)).toBe(true);
    } finally {
      // Restore to original PENDING column
      await postUpdates(page, [
        { id: card.placementId, priority: 1, solutionCategory: 'PENDING', taskGrade: null },
      ]);
    }
  });

  test('reordering in curriculum tab persists after reload', async ({ page }) => {
    await page.goto(`${ORDER_URL}?tab=curriculum&grades=Q10,Q9`);
    await expect(page.getByRole('heading', { name: '10Q' })).toBeVisible({ timeout: TIMEOUT });

    const cards = await getCardsInColumn(page, 'Q10');

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

    try {
      await page.reload();
      await expect(page.getByRole('heading', { name: '10Q' })).toBeVisible({ timeout: TIMEOUT });

      const reloaded = await getCardsInColumn(page, 'Q10');
      expect(reloaded[0].placementId).toBe(second.placementId);
      expect(reloaded[1].placementId).toBe(first.placementId);
    } finally {
      // Restore
      await postUpdates(page, [
        { id: first.placementId, priority: 1, solutionCategory: null, taskGrade: 'Q10' },
        { id: second.placementId, priority: 2, solutionCategory: null, taskGrade: 'Q10' },
      ]);
    }
  });

  test('switching from solution to curriculum tab removes categories from URL', async ({
    page,
  }) => {
    await page.goto(`${ORDER_URL}?tab=solution&categories=PENDING,GRAPH&grades=Q10,Q9`);
    await expect(page.getByRole('heading', { name: '未分類' })).toBeVisible({ timeout: TIMEOUT });

    await page.getByRole('tab', { name: 'カリキュラム' }).click();

    const url = new URL(page.url());
    expect(url.searchParams.has('categories')).toBe(false);
    expect(url.searchParams.get('tab')).toBe('curriculum');
  });

  test('switching from curriculum to solution tab removes grades from URL', async ({ page }) => {
    await page.goto(`${ORDER_URL}?tab=curriculum&categories=PENDING,GRAPH&grades=Q10,Q9`);
    await expect(page.getByRole('heading', { name: '10Q' })).toBeVisible({ timeout: TIMEOUT });

    await page.getByRole('tab', { name: '解法別' }).click();

    const url = new URL(page.url());
    expect(url.searchParams.has('grades')).toBe(false);
    expect(url.searchParams.get('tab')).toBe('solution');
  });

  test('renders solution tab with PENDING and GRAPH columns by default when accessing without query string', async ({
    page,
  }) => {
    await page.goto(ORDER_URL);
    // Default state: solution tab active, PENDING (未分類) and GRAPH (グラフ) columns visible
    await expect(page.getByRole('heading', { name: '未分類' })).toBeVisible({ timeout: TIMEOUT });
    await expect(page.getByRole('heading', { name: 'グラフ' })).toBeVisible({ timeout: TIMEOUT });
  });

  test('clicking a category button toggles the column and updates URL', async ({ page }) => {
    // Start with two selectable columns (GRAPH + DATA_STRUCTURE) so minRequired=1 allows deselection
    await page.goto(`${ORDER_URL}?tab=solution&categories=PENDING,GRAPH,DATA_STRUCTURE`);
    await expect(page.getByRole('heading', { name: 'グラフ' })).toBeVisible({ timeout: TIMEOUT });
    await expect(page.getByRole('heading', { name: 'データ構造' })).toBeVisible({
      timeout: TIMEOUT,
    });

    // Deselect DATA_STRUCTURE — GRAPH remains so minRequired is satisfied
    await page.getByRole('button', { name: 'データ構造' }).click();

    // データ構造 column should disappear
    await expect(page.getByRole('heading', { name: 'データ構造' })).not.toBeVisible();

    // URL should reflect the new selection
    const url = new URL(page.url());
    const categories = url.searchParams.get('categories') ?? '';
    expect(categories.split(',')).not.toContain('DATA_STRUCTURE');
    expect(categories.split(',')).toContain('GRAPH');
  });
});

async function postRaw(page: Page, body: unknown): Promise<number> {
  return page.evaluate(
    async ({ url, body }) => {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      return response.status;
    },
    { url: ORDER_URL, body },
  );
}

test.describe('API error handling', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(ORDER_URL);
    await expect(page.getByRole('heading', { name: '未分類' })).toBeVisible({ timeout: TIMEOUT });
  });

  test('non-existent placement id returns 400', async ({ page }) => {
    const status = await postRaw(page, {
      updates: [{ id: 999999999, priority: 1, solutionCategory: 'PENDING', taskGrade: null }],
    });
    expect(status).toBe(400);
  });

  test('invalid request body (missing required fields) returns 400', async ({ page }) => {
    const status = await postRaw(page, { updates: [{ id: 1 }] });
    expect(status).toBe(400);
  });

  test('invalid request body (wrong type for updates) returns 400', async ({ page }) => {
    const status = await postRaw(page, { updates: 'not-an-array' });
    expect(status).toBe(400);
  });

  test('CURRICULUM↔SOLUTION cross-type move returns 400', async ({ page }) => {
    // Find a CURRICULUM placement from the board
    await page.goto(`${ORDER_URL}?tab=curriculum&grades=Q10`);
    await expect(page.getByRole('heading', { name: '10Q' })).toBeVisible({ timeout: TIMEOUT });

    const cards = await getCardsInColumn(page, 'Q10');

    if (cards.length === 0) {
      test.skip();
      return;
    }

    // Attempt to set solutionCategory on a CURRICULUM placement → should be rejected
    const status = await postRaw(page, {
      updates: [
        { id: cards[0].placementId, priority: 1, solutionCategory: 'PENDING', taskGrade: null },
      ],
    });
    expect(status).toBe(400);
  });
});
