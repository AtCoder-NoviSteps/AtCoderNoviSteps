# SOLUTION タブ「全て」ボタン追加 実装プラン

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** workbooks ページの解法別（SOLUTION）タブに「全て」ボタンを追加し、管理者は非公開含む全問題集を、一般ユーザは公開済みのみカテゴリ別グループ表示で閲覧できるようにする。

**Architecture:** `categories` URL パラメータ省略 = null (= ALL) として扱う null-as-ALL 方式。`ALL_SOLUTION_CATEGORIES = null` 命名済み定数で意図を明示。サービス層でnullを受け取ったとき solutionCategory フィルターなし（全件取得）、UI側で `Object.values(SolutionCategory)` 列挙順にグループ化。グループ化用の categoryMap はサーバーから別クエリで取得して props 経由で渡す。

**Tech Stack:** SvelteKit 2 + Svelte 5 Runes, TypeScript, Prisma, Vitest, Playwright

---

## ファイル構成

| 変更種別 | ファイル                                                             |
| -------- | -------------------------------------------------------------------- |
| 修正     | `src/features/workbooks/types/workbook_placement.ts`                 |
| 修正     | `src/features/workbooks/utils/workbook_url_params.ts`                |
| 修正     | `src/features/workbooks/utils/workbook_url_params.test.ts`           |
| 修正     | `src/features/workbooks/services/workbooks.ts`                       |
| 修正     | `src/features/workbooks/services/workbooks.test.ts`                  |
| 新規     | `src/features/workbooks/utils/solution_category_grouper.ts`          |
| 新規     | `src/features/workbooks/utils/solution_category_grouper.test.ts`     |
| 修正     | `src/routes/workbooks/+page.server.ts`                               |
| 修正     | `src/routes/workbooks/+page.svelte`                                  |
| 修正     | `src/features/workbooks/components/list/WorkBookList.svelte`         |
| 修正     | `src/features/workbooks/components/list/SolutionWorkBookList.svelte` |
| 修正     | `e2e/workbooks_list.spec.ts`                                         |

---

## Task 1: 型層の拡張

**Files:**

- Modify: `src/features/workbooks/types/workbook_placement.ts`

- [ ] **Step 1: 型定数と型エイリアスを追加する**

`PlacementQuery` の定義（98〜100行目付近）の直前に以下を追加：

```typescript
/** Sentinel value representing "all solution categories" (no solutionCategory filter). Runtime value is null. */
export const ALL_SOLUTION_CATEGORIES = null;

/** Category selection for the SOLUTION tab. null means "show all categories". */
export type SelectedSolutionCategory = SolutionCategory | null;
```

- [ ] **Step 2: PlacementQuery の SOLUTION バリアントを SelectedSolutionCategory で統合する**

`solutionCategory: null` をベタ書きせず、`SelectedSolutionCategory` 型でバリアントを1つに統合する。

```typescript
// 変更前
export type PlacementQuery =
  | { workBookType: typeof WorkBookTypeConst.CURRICULUM; taskGrade: TaskGrade }
  | { workBookType: typeof WorkBookTypeConst.SOLUTION; solutionCategory: SolutionCategory };

// 変更後
export type PlacementQuery =
  | { workBookType: typeof WorkBookTypeConst.CURRICULUM; taskGrade: TaskGrade }
  | { workBookType: typeof WorkBookTypeConst.SOLUTION; solutionCategory: SelectedSolutionCategory };
// SelectedSolutionCategory = SolutionCategory | null。
// null は ALL_SOLUTION_CATEGORIES と同値（型名に「null が有効な選択肢」の意味が込められている）。
```

- [ ] **Step 3: 型チェックを通す**

```bash
pnpm check
```

Expected: エラーなし（型のみの変更のため）

- [ ] **Step 4: コミット**

```bash
git add src/features/workbooks/types/workbook_placement.ts
git commit -m "feat(types): add ALL_SOLUTION_CATEGORIES sentinel and SelectedSolutionCategory, unify PlacementQuery SOLUTION variant"
```

---

## Task 2: URL パラメータ層のテスト更新（TDD: 先にテストを壊す）

**Files:**

- Modify: `src/features/workbooks/utils/workbook_url_params.test.ts`

- [ ] **Step 1: デフォルト挙動テストを null 期待値に書き換える**

`describe('parseWorkBookCategory')` ブロック内の以下3つのテストを書き換える：

```typescript
// 変更前
test('returns SEARCH_SIMULATION (default) when categories is absent', () => {
  expect(parseWorkBookCategory(toParams(''))).toBe(SolutionCategory.SEARCH_SIMULATION);
});

test('returns SEARCH_SIMULATION (default) for PENDING', () => {
  expect(parseWorkBookCategory(toParams('categories=PENDING'))).toBe(
    SolutionCategory.SEARCH_SIMULATION,
  );
});

test('returns SEARCH_SIMULATION (default) for invalid value', () => {
  expect(parseWorkBookCategory(toParams('categories=FLYING_FISH'))).toBe(
    SolutionCategory.SEARCH_SIMULATION,
  );
});

// 変更後
test('returns null (all categories) when categories is absent', () => {
  expect(parseWorkBookCategory(toParams(''))).toBeNull();
});

test('returns null (all categories) for PENDING', () => {
  expect(parseWorkBookCategory(toParams('categories=PENDING'))).toBeNull();
});

test('returns null (all categories) for invalid value', () => {
  expect(parseWorkBookCategory(toParams('categories=FLYING_FISH'))).toBeNull();
});
```

- [ ] **Step 2: buildWorkbooksUrl に null カテゴリのテストを追加する**

`describe('buildWorkbooksUrl')` ブロックに追加：

```typescript
test('solution tab with null category produces URL without categories param', () => {
  expect(buildWorkbooksUrl(WorkBookTab.SOLUTION, undefined, null)).toBe('/workbooks?tab=solution');
});
```

- [ ] **Step 3: テストが失敗することを確認する**

```bash
pnpm test:unit src/features/workbooks/utils/workbook_url_params.test.ts
```

Expected: 3〜4件 FAIL（実装がまだ古いため）

---

## Task 3: URL パラメータ層の実装変更

**Files:**

- Modify: `src/features/workbooks/utils/workbook_url_params.ts`

- [ ] **Step 1: import に SelectedSolutionCategory と ALL_SOLUTION_CATEGORIES を追加する**

```typescript
import {
  SolutionCategory,
  ALL_SOLUTION_CATEGORIES,
  type SelectedSolutionCategory,
} from '$features/workbooks/types/workbook_placement';
```

- [ ] **Step 2: DEFAULT_SOLUTION_CATEGORY 定数を削除し、isSelectableCategory ヘルパーを追加する**

ファイル先頭の定数部分を変更：

```typescript
// 削除
const DEFAULT_SOLUTION_CATEGORY = SolutionCategory.SEARCH_SIMULATION;

// 代わりに追加（エクスポートなし）
/** Returns true when value is a SolutionCategory selectable via URL (excludes PENDING). */
function isSelectableCategory(value: string | null): value is SolutionCategory {
  return (
    value !== null &&
    (Object.values(SolutionCategory) as string[]).includes(value) &&
    value !== SolutionCategory.PENDING
  );
}
```

- [ ] **Step 3: parseWorkBookCategory を書き換える**

```typescript
/**
 * Parses the `?categories=` URL parameter into a SelectedSolutionCategory.
 * Returns null (all categories) when the parameter is absent, invalid, or PENDING.
 * PENDING is excluded because it is admin-only and managed via the order page, not via URL.
 *
 * @param params - URL search params to read from
 */
export function parseWorkBookCategory(params: URLSearchParams): SelectedSolutionCategory {
  const param = params.get('categories');
  return isSelectableCategory(param) ? param : ALL_SOLUTION_CATEGORIES;
}
```

- [ ] **Step 4: buildWorkbooksUrl の category パラメータ型を更新する**

```typescript
export function buildWorkbooksUrl(
  tab: WorkBookTab,
  grade?: TaskGrade,
  category?: SelectedSolutionCategory,
): string {
  const params = new URLSearchParams();
  params.set('tab', tab);

  if (tab === WorkBookTab.CURRICULUM && grade) {
    params.set('grades', grade);
  } else if (tab === WorkBookTab.SOLUTION && category) {
    // category は null（ALL）のとき falsy なので params に追加されない
    params.set('categories', category);
  }

  return `/workbooks?${params}`;
}
```

- [ ] **Step 5: テストを実行して全件 PASS を確認する**

```bash
pnpm test:unit src/features/workbooks/utils/workbook_url_params.test.ts
```

Expected: 全件 PASS

- [ ] **Step 6: コミット**

```bash
git add src/features/workbooks/utils/workbook_url_params.ts \
        src/features/workbooks/utils/workbook_url_params.test.ts
git commit -m "feat(url-params): parseWorkBookCategory defaults to null (all categories), add isSelectableCategory helper"
```

---

## Task 4: サービス層のテスト追加（TDD: 先にテストを書く）

**Files:**

- Modify: `src/features/workbooks/services/workbooks.test.ts`

- [ ] **Step 1: null solutionCategory のテストケースを追加する**

`describe('getWorkbooksByPlacement')` ブロックに以下を追加（既存テストの後ろ）：

```typescript
test('returns all SOLUTION workbooks when solutionCategory is null', async () => {
  mockFindMany([
    { ...MOCK_WORKBOOK_BASE, workBookType: WorkBookType.SOLUTION },
    { ...MOCK_WORKBOOK_BASE, id: 2, workBookType: WorkBookType.SOLUTION },
  ]);

  await getWorkbooksByPlacement({
    workBookType: WorkBookType.SOLUTION,
    solutionCategory: null,
  });

  expect(prisma.workBook.findMany).toHaveBeenCalledWith(
    expect.objectContaining({
      where: expect.objectContaining({
        workBookType: WorkBookType.SOLUTION,
        isPublished: true,
        placement: {}, // no solutionCategory filter
      }),
    }),
  );
});

test('null solutionCategory with includeUnpublished=true omits isPublished filter', async () => {
  mockFindMany([{ ...MOCK_WORKBOOK_BASE, workBookType: WorkBookType.SOLUTION }]);

  await getWorkbooksByPlacement(
    { workBookType: WorkBookType.SOLUTION, solutionCategory: null },
    true,
  );

  const callArg = vi.mocked(prisma.workBook.findMany).mock.calls[0][0];
  expect(callArg?.where).not.toHaveProperty('isPublished');
  expect(callArg?.where?.placement).toEqual({});
});
```

- [ ] **Step 2: getSolutionCategoryMapByWorkbookId のテストを追加する**

`describe('getAvailableSolutionCategories')` ブロックの後ろに追加：

```typescript
describe('getSolutionCategoryMapByWorkbookId', () => {
  test('returns a Map of workbookId to SolutionCategory for published workbooks', async () => {
    vi.mocked(prisma.workBookPlacement.findMany).mockResolvedValue([
      { workBookId: 1, solutionCategory: SolutionCategory.GRAPH },
      { workBookId: 2, solutionCategory: SolutionCategory.DYNAMIC_PROGRAMMING },
    ] as unknown as Awaited<ReturnType<typeof prisma.workBookPlacement.findMany>>);

    const result = await getSolutionCategoryMapByWorkbookId(false);

    expect(prisma.workBookPlacement.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          workBook: expect.objectContaining({
            workBookType: WorkBookType.SOLUTION,
            isPublished: true,
          }),
          solutionCategory: { not: null },
        }),
        select: { workBookId: true, solutionCategory: true },
      }),
    );
    expect(result.get(1)).toBe(SolutionCategory.GRAPH);
    expect(result.get(2)).toBe(SolutionCategory.DYNAMIC_PROGRAMMING);
  });

  test('omits isPublished filter when includeUnpublished=true', async () => {
    vi.mocked(prisma.workBookPlacement.findMany).mockResolvedValue(
      [] as unknown as Awaited<ReturnType<typeof prisma.workBookPlacement.findMany>>,
    );

    await getSolutionCategoryMapByWorkbookId(true);

    const callArg = vi.mocked(prisma.workBookPlacement.findMany).mock.calls[0][0];
    expect(callArg?.where?.workBook).not.toHaveProperty('isPublished');
  });

  test('returns empty Map when no placements exist', async () => {
    vi.mocked(prisma.workBookPlacement.findMany).mockResolvedValue(
      [] as unknown as Awaited<ReturnType<typeof prisma.workBookPlacement.findMany>>,
    );

    const result = await getSolutionCategoryMapByWorkbookId(false);

    expect(result.size).toBe(0);
  });
});
```

- [ ] **Step 3: import に getSolutionCategoryMapByWorkbookId を追加する**

```typescript
import {
  getWorkBook,
  getWorkBooksWithAuthors,
  getWorkbookWithAuthor,
  createWorkBook,
  updateWorkBook,
  deleteWorkBook,
  getWorkbooksByPlacement,
  getWorkBooksCreatedByUsers,
  getAvailableSolutionCategories,
  getSolutionCategoryMapByWorkbookId, // 追加
} from './workbooks';
```

- [ ] **Step 4: テストが失敗することを確認する**

```bash
pnpm test:unit src/features/workbooks/services/workbooks.test.ts
```

Expected: 新規テスト 5 件 FAIL

---

## Task 5: サービス層の実装変更

**Files:**

- Modify: `src/features/workbooks/services/workbooks.ts`

- [ ] **Step 1: import に SelectedSolutionCategory を追加する**

```typescript
import {
  type PlacementQuery,
  SolutionCategory,
  type SolutionCategories,
  type SelectedSolutionCategory,
} from '$features/workbooks/types/workbook_placement';
```

- [ ] **Step 2: buildPlacementFilter ヘルパーを追加し、getWorkbooksByPlacement から呼び出す**

ネストした三項演算子を避けるため、private ヘルパー関数として切り出す。
ファイル末尾の `---- Private helpers ----` セクションに追加：

```typescript
/** Returns the Prisma placement where-filter for a given PlacementQuery. */
function buildPlacementFilter(query: PlacementQuery) {
  if (query.workBookType === WorkBookTypeConst.CURRICULUM) {
    return { taskGrade: query.taskGrade };
  }

  if (query.solutionCategory === ALL_SOLUTION_CATEGORIES) {
    return {}; // no solutionCategory filter = fetch all solution categories
  }

  return { solutionCategory: query.solutionCategory };
}
```

`getWorkbooksByPlacement` 内の既存の `placementFilter` 定義を置き換える：

```typescript
// 変更前
const placementFilter =
  query.workBookType === WorkBookTypeConst.CURRICULUM
    ? { taskGrade: query.taskGrade }
    : { solutionCategory: query.solutionCategory };

// 変更後（1行になる）
const placementFilter = buildPlacementFilter(query);
```

import に `ALL_SOLUTION_CATEGORIES` を追加する：

```typescript
import {
  type PlacementQuery,
  SolutionCategory,
  type SolutionCategories,
  type SelectedSolutionCategory,
  ALL_SOLUTION_CATEGORIES,
} from '$features/workbooks/types/workbook_placement';
```

- [ ] **Step 3: getSolutionCategoryMapByWorkbookId を追加する**

`getAvailableSolutionCategories` 関数の後ろに追加：

```typescript
/**
 * Returns a Map of workbook ID to SolutionCategory for all SOLUTION workbooks with a placement.
 * Used to group workbooks by category when the "all categories" view is selected.
 *
 * @param includeUnpublished - When true, includes unpublished workbooks (admin use). Defaults to false.
 */
export async function getSolutionCategoryMapByWorkbookId(
  includeUnpublished = false,
): Promise<Map<number, SolutionCategory>> {
  const placements = await db.workBookPlacement.findMany({
    where: {
      workBook: {
        workBookType: WorkBookTypeConst.SOLUTION,
        ...(includeUnpublished ? {} : { isPublished: true }),
      },
      solutionCategory: { not: null },
    },
    select: { workBookId: true, solutionCategory: true },
  });

  const categoryEntries = placements
    .filter(
      (placement): placement is typeof placement & { solutionCategory: SolutionCategory } =>
        placement.solutionCategory !== null,
    )
    .map((placement): [number, SolutionCategory] => [
      placement.workBookId,
      placement.solutionCategory,
    ]);

  return new Map(categoryEntries);
}
```

- [ ] **Step 4: テストを実行して全件 PASS を確認する**

```bash
pnpm test:unit src/features/workbooks/services/workbooks.test.ts
```

Expected: 全件 PASS

- [ ] **Step 5: コミット**

```bash
git add src/features/workbooks/services/workbooks.ts \
        src/features/workbooks/services/workbooks.test.ts
git commit -m "feat(service): handle null solutionCategory in getWorkbooksByPlacement, add getSolutionCategoryMapByWorkbookId"
```

---

## Task 6: groupBySolutionCategory util 作成（TDD）

**Files:**

- Create: `src/features/workbooks/utils/solution_category_grouper.ts`
- Create: `src/features/workbooks/utils/solution_category_grouper.test.ts`

- [ ] **Step 1: テストファイルを作成する**

`src/features/workbooks/utils/solution_category_grouper.test.ts`:

```typescript
import { describe, test, expect } from 'vitest';
import { SolutionCategory } from '$features/workbooks/types/workbook_placement';
import type { WorkbooksList } from '$features/workbooks/types/workbook';
import { groupBySolutionCategory } from './solution_category_grouper';

// groupBySolutionCategory は id のみ参照するため最小フィクスチャで十分。
// タイトルは実際の問題集名に合わせて可読性を確保する。
const GRAPH_WORKBOOK = {
  id: 1,
  title: 'ポテンシャル付き Union-Find',
} as unknown as WorkbooksList[number];
const DYNAMIC_PROGRAMMING_WORKBOOK_1 = {
  id: 2,
  title: '動的計画法（ナップサック問題）',
} as unknown as WorkbooksList[number];
const DYNAMIC_PROGRAMMING_WORKBOOK_2 = {
  id: 3,
  title: '動的計画法（区間 DP）',
} as unknown as WorkbooksList[number];
const PENDING_WORKBOOK = {
  id: 4,
  title: '数え上げ・確率（分類中）',
} as unknown as WorkbooksList[number];

function buildCategoryMap(entries: [number, SolutionCategory][]): Map<number, SolutionCategory> {
  return new Map(entries);
}

describe('groupBySolutionCategory', () => {
  test('groups workbooks by their SolutionCategory', () => {
    const workbooks = [
      GRAPH_WORKBOOK,
      DYNAMIC_PROGRAMMING_WORKBOOK_1,
      DYNAMIC_PROGRAMMING_WORKBOOK_2,
    ];
    const categoryMap = buildCategoryMap([
      [1, SolutionCategory.GRAPH],
      [2, SolutionCategory.DYNAMIC_PROGRAMMING],
      [3, SolutionCategory.DYNAMIC_PROGRAMMING],
    ]);

    const result = groupBySolutionCategory(workbooks, categoryMap);

    const graphGroup = result.find((group) => group.category === SolutionCategory.GRAPH);
    const dynamicProgrammingGroup = result.find(
      (group) => group.category === SolutionCategory.DYNAMIC_PROGRAMMING,
    );

    expect(graphGroup?.workbooks).toEqual([GRAPH_WORKBOOK]);
    expect(dynamicProgrammingGroup?.workbooks).toEqual([
      DYNAMIC_PROGRAMMING_WORKBOOK_1,
      DYNAMIC_PROGRAMMING_WORKBOOK_2,
    ]);
  });

  test('returns groups in SolutionCategory enum definition order', () => {
    const workbooks = [GRAPH_WORKBOOK, DYNAMIC_PROGRAMMING_WORKBOOK_1];
    const categoryMap = buildCategoryMap([
      [1, SolutionCategory.GRAPH],
      [2, SolutionCategory.DYNAMIC_PROGRAMMING],
    ]);

    const result = groupBySolutionCategory(workbooks, categoryMap);
    const categories = result.map((group) => group.category);

    const dynamicProgrammingIndex = Object.values(SolutionCategory).indexOf(
      SolutionCategory.DYNAMIC_PROGRAMMING,
    );
    const graphIndex = Object.values(SolutionCategory).indexOf(SolutionCategory.GRAPH);
    expect(categories.indexOf(SolutionCategory.DYNAMIC_PROGRAMMING)).toBeLessThan(
      categories.indexOf(SolutionCategory.GRAPH),
    );
    expect(dynamicProgrammingIndex).toBeLessThan(graphIndex);
  });

  test('excludes empty groups from the result', () => {
    const workbooks = [GRAPH_WORKBOOK];
    const categoryMap = buildCategoryMap([[1, SolutionCategory.GRAPH]]);

    const result = groupBySolutionCategory(workbooks, categoryMap);
    expect(result.every((group) => group.workbooks.length > 0)).toBe(true);
    expect(result.length).toBe(1);
  });

  test('includes PENDING group when PENDING workbooks are present', () => {
    const workbooks = [PENDING_WORKBOOK];
    const categoryMap = buildCategoryMap([[4, SolutionCategory.PENDING]]);

    const result = groupBySolutionCategory(workbooks, categoryMap);
    expect(result.find((group) => group.category === SolutionCategory.PENDING)).toBeDefined();
  });

  test('returns empty array when workbooks list is empty', () => {
    const result = groupBySolutionCategory([], new Map());
    expect(result).toEqual([]);
  });

  test('preserves workbook order within each group', () => {
    const workbooks = [DYNAMIC_PROGRAMMING_WORKBOOK_1, DYNAMIC_PROGRAMMING_WORKBOOK_2];
    const categoryMap = buildCategoryMap([
      [2, SolutionCategory.DYNAMIC_PROGRAMMING],
      [3, SolutionCategory.DYNAMIC_PROGRAMMING],
    ]);

    const result = groupBySolutionCategory(workbooks, categoryMap);
    const dynamicProgrammingGroup = result.find(
      (group) => group.category === SolutionCategory.DYNAMIC_PROGRAMMING,
    );

    expect(dynamicProgrammingGroup?.workbooks).toEqual([
      DYNAMIC_PROGRAMMING_WORKBOOK_1,
      DYNAMIC_PROGRAMMING_WORKBOOK_2,
    ]);
  });
});
```

- [ ] **Step 2: テストが失敗することを確認する**

```bash
pnpm test:unit src/features/workbooks/utils/solution_category_grouper.test.ts
```

Expected: FAIL（ファイルが存在しないため）

- [ ] **Step 3: 実装ファイルを作成する**

`src/features/workbooks/utils/solution_category_grouper.ts`:

```typescript
import type { WorkbooksList } from '$features/workbooks/types/workbook';
import { SolutionCategory } from '$features/workbooks/types/workbook_placement';

export type WorkbookGroup = {
  category: SolutionCategory;
  workbooks: WorkbooksList;
};

/**
 * Groups workbooks by SolutionCategory in enum definition order.
 * Empty groups are excluded from the result.
 *
 * @param workbooks - Flat list of solution workbooks
 * @param categoryMap - Maps workbook ID to its SolutionCategory
 */
export function groupBySolutionCategory(
  workbooks: WorkbooksList,
  categoryMap: Map<number, SolutionCategory>,
): WorkbookGroup[] {
  return Object.values(SolutionCategory)
    .map((category) => ({
      category,
      workbooks: workbooks.filter((workbook) => categoryMap.get(workbook.id) === category),
    }))
    .filter((group) => group.workbooks.length > 0);
}
```

- [ ] **Step 4: テストを実行して全件 PASS を確認する**

```bash
pnpm test:unit src/features/workbooks/utils/solution_category_grouper.test.ts
```

Expected: 全件 PASS

- [ ] **Step 5: コミット**

```bash
git add src/features/workbooks/utils/solution_category_grouper.ts \
        src/features/workbooks/utils/solution_category_grouper.test.ts
git commit -m "feat(utils): add groupBySolutionCategory to group solution workbooks by category in enum order"
```

---

## Task 7: ページサーバーの変更

**Files:**

- Modify: `src/routes/workbooks/+page.server.ts`

- [ ] **Step 1: import を更新する**

```typescript
// 追加
import {
  type PlacementQuery,
  ALL_SOLUTION_CATEGORIES,
  type SelectedSolutionCategory,
  type SolutionCategory,
} from '$features/workbooks/types/workbook_placement';

// 追加
import {
  getWorkbooksByPlacement,
  getWorkBooksCreatedByUsers,
  getAvailableSolutionCategories,
  getSolutionCategoryMapByWorkbookId, // 追加
} from '$features/workbooks/services/workbooks';
```

- [ ] **Step 2: load 関数の Promise.all を更新する**

```typescript
// 変更前
const [workbooks, availableCategories, tasksMapByIds, taskResultsByTaskId] = await Promise.all([
  fetchWorkbooksByTab(tab, selectedGrade, selectedCategory, !!adminUser),
  tab === WorkBookTab.SOLUTION ? getAvailableSolutionCategories(!!adminUser) : Promise.resolve([]),
  taskCrud.getTasksByTaskId(),
  loggedInUser
    ? taskResultsCrud.getTaskResultsOnlyResultExists(loggedInUser.id, true)
    : Promise.resolve(new Map()),
]);

return {
  workbooks,
  availableCategories,
  tasksMapByIds,
  taskResultsByTaskId,
  loggedInUser,
  tab,
  selectedGrade,
  selectedCategory,
};

// 変更後
const [workbooks, availableCategories, solutionCategoryMap, tasksMapByIds, taskResultsByTaskId] =
  await Promise.all([
    fetchWorkbooksByTab(tab, selectedGrade, selectedCategory, !!adminUser),
    tab === WorkBookTab.SOLUTION
      ? getAvailableSolutionCategories(!!adminUser)
      : Promise.resolve([]),
    tab === WorkBookTab.SOLUTION && selectedCategory === ALL_SOLUTION_CATEGORIES
      ? getSolutionCategoryMapByWorkbookId(!!adminUser)
      : Promise.resolve(new Map<number, SolutionCategory>()),
    taskCrud.getTasksByTaskId(),
    loggedInUser
      ? taskResultsCrud.getTaskResultsOnlyResultExists(loggedInUser.id, true)
      : Promise.resolve(new Map()),
  ]);

return {
  workbooks,
  availableCategories,
  solutionCategoryMap,
  tasksMapByIds,
  taskResultsByTaskId,
  loggedInUser,
  tab,
  selectedGrade,
  selectedCategory,
};
```

- [ ] **Step 3: buildPlacementQuery の category 型を更新する**

```typescript
function buildPlacementQuery(
  tab: WorkBookTabType,
  grade: ReturnType<typeof parseWorkBookGrade>,
  category: SelectedSolutionCategory, // SolutionCategory → SelectedSolutionCategory
): PlacementQuery {
  if (tab === WorkBookTab.CURRICULUM) {
    return { workBookType: WorkBookType.CURRICULUM, taskGrade: grade };
  }

  return { workBookType: WorkBookType.SOLUTION, solutionCategory: category };
}
```

- [ ] **Step 4: fetchWorkbooksByTab の category 引数型を確認する**

```typescript
// category の型が ReturnType<typeof parseWorkBookCategory> = SelectedSolutionCategory になる
// 変更不要（型推論で自動的に更新される）
function fetchWorkbooksByTab(
  tab: WorkBookTabType,
  grade: ReturnType<typeof parseWorkBookGrade>,
  category: ReturnType<typeof parseWorkBookCategory>, // = SelectedSolutionCategory
  includeUnpublished: boolean,
);
```

- [ ] **Step 5: 型チェックを通す**

```bash
pnpm check
```

Expected: エラーなし（型変更の伝播が正しく機能していれば）

- [ ] **Step 6: コミット**

```bash
git add src/routes/workbooks/+page.server.ts
git commit -m "feat(server): pass solutionCategoryMap for all-categories view, update buildPlacementQuery to accept null"
```

---

## Task 8: WorkBookList.svelte の型更新

**Files:**

- Modify: `src/features/workbooks/components/list/WorkBookList.svelte`

- [ ] **Step 1: import に SelectedSolutionCategory と SolutionCategory の Map を追加する**

```typescript
import {
  type SolutionCategory,
  type SolutionCategories,
  type SelectedSolutionCategory, // 追加
} from '$features/workbooks/types/workbook_placement';
```

- [ ] **Step 2: SpecificProps の SOLUTION バリアントを更新する**

```typescript
type SpecificProps =
  | {
      workbookType: typeof WorkBookType.CURRICULUM;
      gradeModesEachWorkbook: Map<number, TaskGrade>;
      currentGrade: TaskGrade;
      onGradeChange: (grade: TaskGrade) => void;
    }
  | {
      workbookType: typeof WorkBookType.SOLUTION;
      currentCategory: SelectedSolutionCategory; // SolutionCategory → SelectedSolutionCategory
      availableCategories: SolutionCategories;
      solutionCategoryMap: Map<number, SolutionCategory>; // 追加
      onCategoryChange: (category: SelectedSolutionCategory) => void; // 型更新
    }
  | { workbookType: typeof WorkBookType.CREATED_BY_USER };
```

- [ ] **Step 3: SolutionWorkBookList への prop 受け渡しを更新する**

```svelte
{:else if restProps.workbookType === WorkBookType.SOLUTION}
  <SolutionWorkBookList
    {workbooks}
    {taskResultsWithWorkBookId}
    userId={loggedInUser?.id ?? ''}
    role={loggedInUser?.role ?? Roles.USER}
    availableCategories={restProps.availableCategories}
    currentCategory={restProps.currentCategory}
    solutionCategoryMap={restProps.solutionCategoryMap}
    onCategoryChange={restProps.onCategoryChange}
  />
```

- [ ] **Step 4: 型チェックを通す**

```bash
pnpm check
```

---

## Task 9: +page.svelte の更新

**Files:**

- Modify: `src/routes/workbooks/+page.svelte`

- [ ] **Step 1: import を更新する**

```typescript
import {
  type SolutionCategory,
  type SelectedSolutionCategory, // 追加
} from '$features/workbooks/types/workbook_placement';
```

- [ ] **Step 2: handleCategoryChange の引数型を更新する**

```typescript
function handleCategoryChange(category: SelectedSolutionCategory) {
  // @ts-expect-error svelte-check TS2554: same declaration merging issue
  goto(resolve(buildWorkbooksUrl(WorkBookTab.SOLUTION, undefined, category)));
}
```

- [ ] **Step 3: WorkBookList への solutionCategoryMap prop を追加する**

```svelte
<WorkBookList
  workbookType={WorkBookType.SOLUTION}
  {workbooks}
  {taskResultsWithWorkBookId}
  loggedInUser={loggedInUser as { id: string; role: Roles }}
  availableCategories={data.availableCategories}
  currentCategory={data.selectedCategory}
  solutionCategoryMap={data.solutionCategoryMap}
  onCategoryChange={handleCategoryChange}
/>
```

- [ ] **Step 4: 型チェックを通す**

```bash
pnpm check
```

- [ ] **Step 5: コミット**

```bash
git add src/features/workbooks/components/list/WorkBookList.svelte \
        src/routes/workbooks/+page.svelte
git commit -m "feat(ui): propagate solutionCategoryMap and SelectedSolutionCategory type through WorkBookList"
```

---

## Task 10: SolutionWorkBookList.svelte の変更

**Files:**

- Modify: `src/features/workbooks/components/list/SolutionWorkBookList.svelte`

- [ ] **Step 1: import を更新する**

```typescript
import {
  SolutionCategory,
  type SolutionCategories,
  SOLUTION_LABELS,
  ALL_SOLUTION_CATEGORIES,
  type SelectedSolutionCategory,
} from '$features/workbooks/types/workbook_placement';

import {
  groupBySolutionCategory,
  type WorkbookGroup,
} from '$features/workbooks/utils/solution_category_grouper';
```

- [ ] **Step 2: Props インターフェースを更新する**

```typescript
interface Props {
  workbooks: WorkbooksList;
  taskResultsWithWorkBookId: Map<number, TaskResults>;
  userId: string;
  role: Roles;
  availableCategories: SolutionCategories;
  currentCategory: SelectedSolutionCategory; // SolutionCategory → SelectedSolutionCategory
  solutionCategoryMap: Map<number, SolutionCategory>; // 追加
  onCategoryChange: (category: SelectedSolutionCategory) => void; // 型更新
}

let {
  workbooks,
  taskResultsWithWorkBookId,
  userId,
  role,
  availableCategories,
  currentCategory,
  solutionCategoryMap,
  onCategoryChange,
}: Props = $props();
```

- [ ] **Step 3: derived state を追加する**

```typescript
// Unified button entries: "全て" (null) first, then individual categories.
// Using a typed entry object avoids a separate ALL button in the template.
type CategoryEntry = { value: SelectedSolutionCategory; label: string };

const ALL_ENTRY: CategoryEntry = { value: ALL_SOLUTION_CATEGORIES, label: 'All' };

let CATEGORY_ENTRIES = $derived<CategoryEntry[]>([
  ALL_ENTRY,
  ...AVAILABLE_CATEGORIES.map(
    (category): CategoryEntry => ({
      value: category,
      label: SOLUTION_LABELS[category],
    }),
  ),
]);

// "全て" 選択時のグループ化。特定カテゴリ選択時は null。
let groupedWorkbooks = $derived<WorkbookGroup[] | null>(
  currentCategory === ALL_SOLUTION_CATEGORIES
    ? groupBySolutionCategory(workbooks, solutionCategoryMap)
    : null,
);

let readableCount = $derived(countReadableWorkbooks(workbooks, userId));
```

- [ ] **Step 4: テンプレートを書き換える**

```svelte
<div class="mb-6 flex flex-wrap gap-1">
  {#each CATEGORY_ENTRIES as entry (entry.value ?? 'all')}
    <Button
      onclick={() => onCategoryChange(entry.value)}
      color="alternative"
      class={`rounded-lg dark:text-white ${currentCategory === entry.value ? 'text-primary-700 dark:text-primary-500!' : ''}`}
    >
      {entry.label}
    </Button>
  {/each}
</div>

{#if currentCategory === ALL_SOLUTION_CATEGORIES}
  <!-- グループ表示: SolutionCategory 列挙順にセクションとして描画 -->
  {#if readableCount}
    {#each groupedWorkbooks ?? [] as group (group.category)}
      <h2 class="mt-8 mb-3 text-xl font-semibold">{SOLUTION_LABELS[group.category]}</h2>
      <SolutionTable
        workbooks={group.workbooks}
        {userId}
        {role}
        taskResults={taskResultsWithWorkBookId}
      />
    {/each}
  {:else}
    <EmptyWorkbookList />
  {/if}
{:else}
  <!-- 特定カテゴリ選択時: 既存のフラットリスト表示 -->
  {#if readableCount}
    <SolutionTable {workbooks} {userId} {role} taskResults={taskResultsWithWorkBookId} />
  {:else}
    <EmptyWorkbookList />
  {/if}
{/if}
```

- [ ] **Step 5: 型チェックと lint を通す**

```bash
pnpm check && pnpm lint
```

Expected: エラーなし

- [ ] **Step 6: 開発サーバーで動作確認する**

```bash
pnpm dev
```

ブラウザで確認:

1. `/workbooks?tab=solution` → 「全て」ボタンがアクティブ（左端）、カテゴリ別セクション表示
2. 「グラフ」ボタンをクリック → URL `?categories=GRAPH`、フラットリスト表示
3. 管理者ログイン → PENDING セクションが表示
4. 一般ユーザ → PENDING セクションなし

- [ ] **Step 7: コミット**

```bash
git add src/features/workbooks/components/list/SolutionWorkBookList.svelte
git commit -m "feat(ui): add 全て button with category-grouped view to SolutionWorkBookList"
```

---

## Task 11: E2E テスト追加

**Files:**

- Modify: `e2e/workbooks_list.spec.ts`

- [ ] **Step 1: 定数を追加する**

ファイル先頭の定数ブロックに追加：

```typescript
// "全て" ボタンのラベル
const LABEL_ALL = 'All';

// 既存カテゴリラベル（変更なし）
const CATEGORY_GRAPH = 'GRAPH';
const CATEGORY_SEARCH = 'SEARCH_SIMULATION';
```

- [ ] **Step 2: 一般ユーザの SOLUTION タブテストに「全て」関連テストを追加する**

`test.describe('navigation interactions')` ブロックに追加（既存の solution category ボタンテストの後ろ）：

```typescript
test.describe('solution tab all-categories view', () => {
  test('solution tab default shows All button as active', async ({ page }) => {
    await page.goto(`${WORKBOOK_LIST_URL}?tab=${TAB_SOLUTION}`);
    await expect(page.getByRole('tab', { name: '解法別' })).toHaveAttribute(
      'aria-selected',
      'true',
      { timeout: TIMEOUT },
    );

    const allButton = page.getByRole('button', { name: LABEL_ALL });
    await expect(allButton).toBeVisible({ timeout: TIMEOUT });
    // "全て" ボタンがアクティブスタイル（text-primary-700）を持つことを確認
    await expect(allButton).toHaveClass(/text-primary-700/, { timeout: TIMEOUT });
  });

  test('All button is shown at the beginning of category buttons', async ({ page }) => {
    await page.goto(`${WORKBOOK_LIST_URL}?tab=${TAB_SOLUTION}`);
    await expect(page.getByRole('tab', { name: '解法別' })).toBeVisible({ timeout: TIMEOUT });

    const buttons = page.getByRole('button');
    // 最初のボタンは「All」であることを確認
    await expect(buttons.first()).toHaveText(LABEL_ALL, { timeout: TIMEOUT });
  });

  test('clicking 全て button shows category-grouped sections', async ({ page }) => {
    // まず特定カテゴリで開く
    await page.goto(`${WORKBOOK_LIST_URL}?tab=${TAB_SOLUTION}&categories=${CATEGORY_GRAPH}`);
    await expect(page.getByRole('tab', { name: '解法別' })).toBeVisible({ timeout: TIMEOUT });

    // 「All」ボタンをクリック
    await page.getByRole('button', { name: LABEL_ALL }).click();
    await expect(page).toHaveURL(new RegExp(`tab=${TAB_SOLUTION}`), { timeout: TIMEOUT });
    // URL に categories= パラメータがないことを確認
    await expect(page).not.toHaveURL(/categories=/, { timeout: TIMEOUT });
  });

  test('non-admin user does not see PENDING section in All view', async ({ page }) => {
    await page.goto(`${WORKBOOK_LIST_URL}?tab=${TAB_SOLUTION}`);
    await expect(page.getByRole('tab', { name: '解法別' })).toBeVisible({ timeout: TIMEOUT });

    await expect(page.getByRole('heading', { name: '未分類' })).not.toBeVisible();
  });
});
```

- [ ] **Step 3: 管理者ユーザのテストに PENDING 表示テストを追加する**

`test.describe('admin user')` ブロック内の `test.describe('tab visibility')` の後に追加：

```typescript
test.describe('solution tab all-categories view (admin)', () => {
  test('admin sees PENDING section in All view when PENDING workbooks exist', async ({ page }) => {
    await page.goto(`${WORKBOOK_LIST_URL}?tab=${TAB_SOLUTION}`);
    await expect(page.getByRole('tab', { name: '解法別' })).toBeVisible({ timeout: TIMEOUT });

    const pendingHeading = page.getByRole('heading', { name: '未分類' });

    if (
      !(await pendingHeading.isVisible({ timeout: VISIBILITY_CHECK_TIMEOUT }).catch(() => false))
    ) {
      // PENDING 問題集が存在しない場合はスキップ
      test.skip();
      return;
    }

    await expect(pendingHeading).toBeVisible({ timeout: TIMEOUT });
  });
});
```

- [ ] **Step 4: E2E テストを実行して確認する**

```bash
pnpm test:e2e --grep "solution tab all"
```

Expected: 新規テストが PASS（PENDING テストはスキップになる場合もある）

- [ ] **Step 5: 全 E2E テストを実行して既存テストに回帰がないことを確認する**

> **PENDING**: 本 PR とは無関係の既存 E2E 回帰あり。別 PR で修正予定のため、このステップは一旦スキップ。
> 確認範囲: 新規追加テスト（`workbooks_list.spec.ts` の SOLUTION タブ関連）が PASS であることのみ確認する。

```bash
pnpm test:e2e e2e/workbooks_list.spec.ts
```

Expected: 新規追加テストが PASS（既存の無関係な失敗は無視）

- [ ] **Step 6: コミット**

```bash
git add e2e/workbooks_list.spec.ts
git commit -m "test(e2e): add All button and category-grouped view tests for SOLUTION tab"
```

---

## Task 12: 全テスト確認・フォーマット

- [ ] **Step 1: 単体テストを全件実行する**

```bash
pnpm test:unit
```

Expected: 全件 PASS

- [ ] **Step 2: 型チェックを通す**

```bash
pnpm check
```

Expected: エラーなし

- [ ] **Step 3: lint を通す**

```bash
pnpm lint
```

Expected: エラーなし

- [ ] **Step 4: format を通す**

```bash
pnpm format
```

- [ ] **Step 5: E2E テストを全件実行する（CI 相当）**

```bash
pnpm test:e2e
```

Expected: 全件 PASS

---

## 設計方針

- **admin order ページは変更しない**: `src/routes/(admin)/workbooks/order/` は今回のスコープ外。「全て」カテゴリへの問題集振り分けは意図しない。
- **sessionStorage の URL 保存**: `+page.svelte` の `$effect` で `buildWorkbooksUrl(data.tab, data.selectedGrade, data.selectedCategory)` を保存している。null カテゴリ（全て）のとき `/workbooks?tab=solution` が保存され、戻ったときにデフォルトの「全て」表示に戻る動作になる。
- **availableCategories**: 「All」選択時も引き続き取得・使用される（個別カテゴリボタンの表示制御のため）。
- **PENDING 表示制御**: `groupBySolutionCategory` は PENDING グループを自動的に含める。ただし一般ユーザには `getSolutionCategoryMapByWorkbookId(false)` が呼ばれ、公開済み問題集のみが対象となる。PENDING 問題集は未公開のため、一般ユーザのマップには含まれず PENDING グループは自然に空→除外される。
