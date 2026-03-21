# Phase 3: サービス層 — `getPublishedWorkbooksByPlacement()` / `getWorkBooksCreatedByUsers()` / `getAvailableSolutionCategories()`

**レイヤー:** `src/features/workbooks/services/` | **リスク:** 中（Prismaクエリ追加。既存関数は変更しない）

`PlacementQuery` は discriminated union で定義する。`workBookType === CURRICULUM` のとき `taskGrade` が確定し、`SOLUTION` のとき `solutionCategory` が確定する。これにより呼び出し側での繰り返し条件分岐を排除できる。

`mapWithAuthorName()` はプライベートヘルパーとして切り出し、2つの関数で重複する `map()` を排除する。

> **Prisma の挙動:** `where: { placement: { taskGrade: 'Q10' } }` は placement レコードが存在しない workbook を自動的に除外する（optional one-to-one のネストフィルタは IS NOT NULL を暗黙的に含む）。

---

## Task 3-A: 失敗するテストを書く

**Files:**

- Modify: `src/features/workbooks/services/workbooks.test.ts`

- [ ] **Step 1: インポートと `describe` ブロックを追記**

既存の `vi.mock('$lib/server/database', ...)` とモック変数（`prisma`）を再利用する。

```typescript
import {
  getPublishedWorkbooksByPlacement,
  getWorkBooksCreatedByUsers,
  getAvailableSolutionCategories,
} from './workbooks';
import { WorkBookType } from '$features/workbooks/types/workbook';
import { TaskGrade } from '$lib/types/task';
import { SolutionCategory } from '$features/workbooks/types/workbook_placement';

// テスト用ベースフィクスチャ
const MOCK_WORKBOOK_BASE = {
  id: 1,
  title: 'Test workbook',
  isPublished: true,
  isReplenished: false,
  isOfficial: true,
  authorId: 'user1',
  description: '',
  editorialUrl: '',
  urlSlug: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  workBookTasks: [],
  user: { username: 'author1' },
};

/** Prisma の workBook.findMany モックを設定するヘルパー */
function mockWorkbookFindMany(workbooks: (typeof MOCK_WORKBOOK_BASE)[]) {
  prisma.workBook.findMany.mockResolvedValue(workbooks);
}

describe('getPublishedWorkbooksByPlacement', () => {
  test('filters CURRICULUM workbooks by taskGrade with priority asc order', async () => {
    mockWorkbookFindMany([
      {
        ...MOCK_WORKBOOK_BASE,
        workBookType: WorkBookType.CURRICULUM,
        placement: { priority: 1, taskGrade: TaskGrade.Q10, solutionCategory: null },
      },
    ]);

    const result = await getPublishedWorkbooksByPlacement({
      workBookType: WorkBookType.CURRICULUM,
      taskGrade: TaskGrade.Q10,
    });

    expect(prisma.workBook.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          workBookType: WorkBookType.CURRICULUM,
          isPublished: true,
          placement: { taskGrade: TaskGrade.Q10 },
        }),
        orderBy: { placement: { priority: 'asc' } },
      }),
    );
    expect(result[0].authorName).toBe('author1');
  });

  test('filters SOLUTION workbooks by solutionCategory', async () => {
    mockWorkbookFindMany([
      {
        ...MOCK_WORKBOOK_BASE,
        workBookType: WorkBookType.SOLUTION,
        placement: { priority: 1, taskGrade: null, solutionCategory: SolutionCategory.GRAPH },
      },
    ]);

    await getPublishedWorkbooksByPlacement({
      workBookType: WorkBookType.SOLUTION,
      solutionCategory: SolutionCategory.GRAPH,
    });

    expect(prisma.workBook.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          workBookType: WorkBookType.SOLUTION,
          placement: { solutionCategory: SolutionCategory.GRAPH },
        }),
      }),
    );
  });

  test('maps null user to authorName "unknown"', async () => {
    mockWorkbookFindMany([
      {
        ...MOCK_WORKBOOK_BASE,
        workBookType: WorkBookType.CURRICULUM,
        user: null,
      },
    ]);

    const result = await getPublishedWorkbooksByPlacement({
      workBookType: WorkBookType.CURRICULUM,
      taskGrade: TaskGrade.Q10,
    });

    expect(result[0].authorName).toBe('unknown');
  });
});

describe('getWorkBooksCreatedByUsers', () => {
  test('queries only CREATED_BY_USER type workbooks ordered by id asc', async () => {
    mockWorkbookFindMany([{ ...MOCK_WORKBOOK_BASE, workBookType: WorkBookType.CREATED_BY_USER }]);

    await getWorkBooksCreatedByUsers();

    expect(prisma.workBook.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { workBookType: WorkBookType.CREATED_BY_USER },
        orderBy: { id: 'asc' },
      }),
    );
  });

  test('maps null user to authorName "unknown"', async () => {
    mockWorkbookFindMany([
      { ...MOCK_WORKBOOK_BASE, workBookType: WorkBookType.CREATED_BY_USER, user: null },
    ]);

    const result = await getWorkBooksCreatedByUsers();

    expect(result[0].authorName).toBe('unknown');
  });
});

describe('getAvailableSolutionCategories', () => {
  test('returns distinct non-null solutionCategory values', async () => {
    prisma.workBookPlacement.findMany.mockResolvedValue([
      { solutionCategory: SolutionCategory.GRAPH },
      { solutionCategory: SolutionCategory.DYNAMIC_PROGRAMMING },
    ]);

    const result = await getAvailableSolutionCategories();

    expect(result).toEqual([SolutionCategory.GRAPH, SolutionCategory.DYNAMIC_PROGRAMMING]);
  });

  test('excludes null solutionCategory entries', async () => {
    prisma.workBookPlacement.findMany.mockResolvedValue([
      { solutionCategory: SolutionCategory.GRAPH },
      { solutionCategory: null },
    ]);

    const result = await getAvailableSolutionCategories();

    expect(result).toEqual([SolutionCategory.GRAPH]);
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

```bash
pnpm test:unit -- workbooks.test
# FAIL: getPublishedWorkbooksByPlacement / getWorkBooksCreatedByUsers / getAvailableSolutionCategories not found
```

---

## Task 3-B: 実装

**Files:**

- Modify: `src/features/workbooks/services/workbooks.ts`

- [ ] **Step 1: インポートを追加**

```typescript
import { TaskGrade } from '$lib/types/task';
import { SolutionCategory } from '$features/workbooks/types/workbook_placement';
```

- [ ] **Step 2: `getWorkBooksWithAuthors()` の直後に型・プライベートヘルパー・関数を追加**

```typescript
/**
 * Discriminated union representing a placement-based filter query.
 * CURRICULUM filters by taskGrade; SOLUTION filters by solutionCategory.
 */
export type PlacementQuery =
  | { workBookType: typeof WorkBookType.CURRICULUM; taskGrade: TaskGrade }
  | { workBookType: typeof WorkBookType.SOLUTION; solutionCategory: SolutionCategory };

/**
 * Returns published workbooks filtered by WorkBookPlacement, ordered by priority ASC.
 * Workbooks without a placement record are automatically excluded by Prisma's nested where filter.
 *
 * @param query - Discriminated union: CURRICULUM uses taskGrade; SOLUTION uses solutionCategory
 */
export async function getPublishedWorkbooksByPlacement(
  query: PlacementQuery,
): Promise<WorkbooksWithAuthors> {
  const placementFilter =
    query.workBookType === WorkBookType.CURRICULUM
      ? { taskGrade: query.taskGrade }
      : { solutionCategory: query.solutionCategory };

  const workbooks = await db.workBook.findMany({
    where: {
      workBookType: query.workBookType,
      isPublished: true,
      placement: placementFilter,
    },
    orderBy: {
      placement: { priority: 'asc' },
    },
    include: {
      user: {
        select: { username: true },
      },
      workBookTasks: {
        orderBy: { priority: 'asc' },
      },
    },
  });

  return mapWithAuthorName(workbooks);
}

/**
 * Returns all CREATED_BY_USER workbooks with author names, ordered by id ASC.
 * Intended for admin-only display on the workbooks list page.
 */
export async function getWorkBooksCreatedByUsers(): Promise<WorkbooksWithAuthors> {
  const workbooks = await db.workBook.findMany({
    where: { workBookType: WorkBookType.CREATED_BY_USER },
    orderBy: { id: 'asc' },
    include: {
      user: {
        select: { username: true },
      },
      workBookTasks: {
        orderBy: { priority: 'asc' },
      },
    },
  });

  return mapWithAuthorName(workbooks);
}

/**
 * Returns the list of SolutionCategory values that have at least one published
 * SOLUTION workbook with a placement record.
 */
export async function getAvailableSolutionCategories(): Promise<SolutionCategory[]> {
  const placements = await db.workBookPlacement.findMany({
    where: {
      workBook: { isPublished: true, workBookType: WorkBookType.SOLUTION },
      solutionCategory: { not: null },
    },
    select: { solutionCategory: true },
    distinct: ['solutionCategory'],
  });

  return placements
    .map((placement) => placement.solutionCategory)
    .filter((category): category is SolutionCategory => category !== null);
}

// ---- Private helpers ----

function mapWithAuthorName<T extends { user: { username: string } | null }>(
  workbooks: T[],
): (T & { authorName: string })[] {
  return workbooks.map((workbook) => ({
    ...workbook,
    authorName: workbook.user?.username ?? 'unknown',
  }));
}
```

- [ ] **Step 3: テストが通ることを確認**

```bash
pnpm test:unit -- workbooks.test
# PASS
```

- [ ] **Step 4: コミット**

```bash
git add src/features/workbooks/services/workbooks.ts \
        src/features/workbooks/services/workbooks.test.ts
git commit -m "feat(workbooks/services): Add getPublishedWorkbooksByPlacement, getWorkBooksCreatedByUsers, getAvailableSolutionCategories"
```
