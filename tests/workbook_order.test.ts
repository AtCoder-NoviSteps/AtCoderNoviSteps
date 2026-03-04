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

async function goToOrderPage(page: Page): Promise<void> {
  await page.goto(ORDER_URL);
  await expect(page).toHaveURL(ORDER_URL, { timeout: TIMEOUT });
  // Wait for board to render
  await page.waitForSelector('[data-testid="kanban-column"]', { timeout: TIMEOUT });
}

async function dragCard(page: Page, sourceTitle: string, targetTitle: string): Promise<void> {
  const source = page.locator('[data-testid="kanban-card"]').filter({ hasText: sourceTitle });
  const target = page.locator('[data-testid="kanban-card"]').filter({ hasText: targetTitle });

  const sourceBox = await source.first().boundingBox();
  const targetBox = await target.first().boundingBox();

  if (!sourceBox || !targetBox) {
    throw new Error(`Card not found: source="${sourceTitle}" target="${targetTitle}"`);
  }

  const sx = sourceBox.x + sourceBox.width / 2;
  const sy = sourceBox.y + sourceBox.height / 2;
  const tx = targetBox.x + targetBox.width / 2;
  const ty = targetBox.y + targetBox.height / 2 - 5; // drop above target

  await page.mouse.move(sx, sy);
  await page.mouse.down();
  // Move slowly to trigger dnd-kit events
  const steps = 20;
  for (let i = 1; i <= steps; i++) {
    await page.mouse.move(sx + ((tx - sx) * i) / steps, sy + ((ty - sy) * i) / steps);
    await page.waitForTimeout(10);
  }
  await page.mouse.up();
  // Wait for fetch to complete
  await page.waitForTimeout(500);
}

async function dragCardToColumn(page: Page, sourceTitle: string, columnLabel: string): Promise<void> {
  const source = page.locator('[data-testid="kanban-card"]').filter({ hasText: sourceTitle });
  const targetCol = page.locator('[data-testid="kanban-column"]').filter({ hasText: columnLabel });

  const sourceBox = await source.first().boundingBox();
  const targetBox = await targetCol.first().boundingBox();

  if (!sourceBox || !targetBox) {
    throw new Error(`Element not found: card="${sourceTitle}" column="${columnLabel}"`);
  }

  const sx = sourceBox.x + sourceBox.width / 2;
  const sy = sourceBox.y + sourceBox.height / 2;
  const tx = targetBox.x + targetBox.width / 2;
  const ty = targetBox.y + 80; // drop near top of column

  await page.mouse.move(sx, sy);
  await page.mouse.down();
  const steps = 20;
  for (let i = 1; i <= steps; i++) {
    await page.mouse.move(sx + ((tx - sx) * i) / steps, sy + ((ty - sy) * i) / steps);
    await page.waitForTimeout(10);
  }
  await page.mouse.up();
  await page.waitForTimeout(500);
}

// Helper: get card titles in a column in order
async function getCardTitlesInColumn(page: Page, columnLabel: string): Promise<string[]> {
  const col = page.locator('[data-testid="kanban-column"]').filter({ hasText: columnLabel });
  const cards = col.locator('[data-testid="kanban-card"]');
  return cards.allTextContents();
}

test.describe('workbook order page', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('1. 同一カラム内ドラッグ→リロード→順序が保持される', async ({ page }) => {
    await goToOrderPage(page);

    // PENDING カラムのカードを取得
    const col = page.locator('[data-testid="kanban-column"]').filter({ hasText: '未分類' });
    const cards = col.locator('[data-testid="kanban-card"]');
    const count = await cards.count();

    if (count < 2) {
      test.skip();
      return;
    }

    const firstTitle = (await cards.nth(0).textContent()) ?? '';
    const secondTitle = (await cards.nth(1).textContent()) ?? '';

    // 1番目を2番目の下にドラッグ
    await dragCard(page, firstTitle.trim(), secondTitle.trim());

    const titlesAfterDrag = await getCardTitlesInColumn(page, '未分類');

    // リロード
    await page.reload();
    await page.waitForSelector('[data-testid="kanban-column"]', { timeout: TIMEOUT });

    const titlesAfterReload = await getCardTitlesInColumn(page, '未分類');
    expect(titlesAfterReload).toEqual(titlesAfterDrag);
  });

  test('2. 異なるカラム間ドラッグ→リロード→列が保持される', async ({ page }) => {
    // PENDING → GRAPH への移動
    await page.goto(`${ORDER_URL}?tab=solution&cols=PENDING,GRAPH`);
    await page.waitForSelector('[data-testid="kanban-column"]', { timeout: TIMEOUT });

    const pendingCol = page.locator('[data-testid="kanban-column"]').filter({ hasText: '未分類' });
    const cardInPending = pendingCol.locator('[data-testid="kanban-card"]').first();
    const cardCount = await pendingCol.locator('[data-testid="kanban-card"]').count();

    if (cardCount === 0) {
      test.skip();
      return;
    }

    const cardTitle = ((await cardInPending.textContent()) ?? '').trim();

    await dragCardToColumn(page, cardTitle, 'グラフ');

    // Verify card moved to GRAPH column
    const graphCol = page.locator('[data-testid="kanban-column"]').filter({ hasText: 'グラフ' });
    await expect(graphCol.locator('[data-testid="kanban-card"]').filter({ hasText: cardTitle })).toBeVisible();

    // Reload and verify persisted
    await page.reload();
    await page.waitForSelector('[data-testid="kanban-column"]', { timeout: TIMEOUT });

    const graphColAfter = page.locator('[data-testid="kanban-column"]').filter({ hasText: 'グラフ' });
    await expect(graphColAfter.locator('[data-testid="kanban-card"]').filter({ hasText: cardTitle })).toBeVisible();

    // Restore: move back to PENDING
    await dragCardToColumn(page, cardTitle, '未分類');
  });

  test('3. カリキュラムタブでドラッグ→リロード→位置が保持される', async ({ page }) => {
    await page.goto(`${ORDER_URL}?tab=curriculum&grades=Q10,Q9`);
    await page.waitForSelector('[data-testid="kanban-column"]', { timeout: TIMEOUT });

    const col = page.locator('[data-testid="kanban-column"]').filter({ hasText: '10Q' });
    const cards = col.locator('[data-testid="kanban-card"]');
    const count = await cards.count();

    if (count < 2) {
      test.skip();
      return;
    }

    const firstTitle = ((await cards.nth(0).textContent()) ?? '').trim();
    const secondTitle = ((await cards.nth(1).textContent()) ?? '').trim();

    await dragCard(page, firstTitle, secondTitle);

    const titlesAfterDrag = await getCardTitlesInColumn(page, '10Q');

    await page.reload();
    await page.waitForSelector('[data-testid="kanban-column"]', { timeout: TIMEOUT });

    const titlesAfterReload = await getCardTitlesInColumn(page, '10Q');
    expect(titlesAfterReload).toEqual(titlesAfterDrag);
  });

  test('4. 解法別→カリキュラム切り替え → URLに cols が含まれない', async ({ page }) => {
    await page.goto(`${ORDER_URL}?tab=solution&cols=PENDING,GRAPH&grades=Q10,Q9`);
    await page.waitForSelector('[data-testid="kanban-column"]', { timeout: TIMEOUT });

    await page.getByRole('tab', { name: 'カリキュラム' }).click();

    const url = new URL(page.url());
    expect(url.searchParams.has('cols')).toBe(false);
    expect(url.searchParams.get('tab')).toBe('curriculum');
  });

  test('5. カリキュラム→解法別切り替え → URLに grades が含まれない', async ({ page }) => {
    await page.goto(`${ORDER_URL}?tab=curriculum&cols=PENDING,GRAPH&grades=Q10,Q9`);
    await page.waitForSelector('[data-testid="kanban-column"]', { timeout: TIMEOUT });

    await page.getByRole('tab', { name: '解法別' }).click();

    const url = new URL(page.url());
    expect(url.searchParams.has('grades')).toBe(false);
    expect(url.searchParams.get('tab')).toBe('solution');
  });
});
