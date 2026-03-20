# Phase 10: E2Eテスト更新

**レイヤー:** `e2e/` | **リスク:** 低

---

**Files:**

- Modify: `e2e/workbooks_list.spec.ts`

- [ ] **Step 1: ファイルを読んで削除対象を確認**

`activeWorkbookTabStore` / `task_grades_by_workbook_type` を前提としたテストを特定して削除する。

- [ ] **Step 2: URLパラメータ関連テストを追加**

> ラベル文字列（`'10Q'`, `'グラフ'` など）は `GRADE_LABELS` / `SOLUTION_LABELS` 定数と一致させること。実装前に `src/lib/types/task.ts` と `src/features/workbooks/types/workbook_placement.ts` を確認すること。

```typescript
import { test, expect } from '@playwright/test';
import { TaskGrade } from '$lib/types/task';
import { SolutionCategory } from '$features/workbooks/types/workbook_placement';

test('defaults to curriculum tab', async ({ page }) => {
  await page.goto('/workbooks');
  await expect(page.getByRole('tab', { name: 'カリキュラム' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
});

test('clicking solution tab updates URL to tab=solution', async ({ page }) => {
  await page.goto('/workbooks');
  await page.getByRole('tab', { name: '解法別' }).click();
  await expect(page).toHaveURL(/tab=solution/);
});

test('direct URL access to solution tab selects correct tab', async ({ page }) => {
  await page.goto('/workbooks?tab=solution&categories=GRAPH');
  await expect(page.getByRole('tab', { name: '解法別' })).toHaveAttribute('aria-selected', 'true');
});

test('invalid tab param falls back to curriculum tab', async ({ page }) => {
  await page.goto('/workbooks?tab=invalid');
  await expect(page.getByRole('tab', { name: 'カリキュラム' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
});

// カリキュラム グレードボタン → URL 更新
const CURRICULUM_GRADE_CASES: { grade: TaskGrade; label: string }[] = [
  { grade: TaskGrade.Q10, label: '10Q' },
  { grade: TaskGrade.Q9, label: '9Q' },
  { grade: TaskGrade.Q8, label: '8Q' },
];

for (const { grade, label } of CURRICULUM_GRADE_CASES) {
  test(`curriculum grade button "${label}" updates URL to grades=${grade}`, async ({ page }) => {
    await page.goto('/workbooks?tab=curriculum');
    await page.getByRole('button', { name: label }).click();
    await expect(page).toHaveURL(new RegExp(`grades=${grade}`));
  });
}

// 解法別 カテゴリボタン → URL 更新
const SOLUTION_CATEGORY_CASES: { category: SolutionCategory; label: string }[] = [
  { category: SolutionCategory.GRAPH, label: 'グラフ' },
  { category: SolutionCategory.DYNAMIC_PROGRAMMING, label: 'DP' },
  { category: SolutionCategory.SEARCH_SIMULATION, label: '探索・シミュレーション' },
];

for (const { category, label } of SOLUTION_CATEGORY_CASES) {
  test(`solution category button "${label}" updates URL to categories=${category}`, async ({
    page,
  }) => {
    await page.goto('/workbooks?tab=solution');
    await page.getByRole('button', { name: label }).click();
    await expect(page).toHaveURL(new RegExp(`categories=${category}`));
  });
}
```

- [ ] **Step 3: E2Eテスト実行**

```bash
pnpm test:e2e -- --grep "workbooks"
```

- [ ] **Step 4: コミット**

```bash
git add e2e/workbooks_list.spec.ts
git commit -m "test(e2e/workbooks): Update tests for URL param-driven filtering"
```
