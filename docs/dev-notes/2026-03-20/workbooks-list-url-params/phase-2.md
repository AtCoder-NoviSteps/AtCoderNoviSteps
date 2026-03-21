# Phase 2: `workbook_url_params.ts` — URLパラメータ解析・組み立て

**レイヤー:** `src/features/workbooks/utils/` | **リスク:** 極低（純粋関数）

`+page.server.ts` での解析と `+page.svelte` での URL 組み立てを担う純粋関数群。order ページの `parseInitialCategories(params: URLSearchParams)` パターンに倣い、引数は `URLSearchParams` を直接受け取る（`string | null` ではない）。

**設計方針:**

- tab 値の比較は `WorkBookTab.CURRICULUM` 等の定数を使い、ハードコード文字列は禁止
- `isValidEnumValue<T>()` サブ関数で `grades`/`categories` の共通検証ロジックを切り出す
- テスト内の `new URLSearchParams('...')` は `toParams()` ヘルパーで共通化する

---

## Task 2-A: 失敗するテストを書く

**Files:**

- Create: `src/features/workbooks/utils/workbook_url_params.test.ts`

- [ ] **Step 1: テストファイルを作成**

```typescript
import { describe, test, expect } from 'vitest';
import { TaskGrade } from '$lib/types/task';
import { SolutionCategory } from '$features/workbooks/types/workbook_placement';
import { WorkBookTab } from '$features/workbooks/types/workbook';
import {
  parseWorkBookTab,
  parseWorkBookGrade,
  parseWorkBookCategory,
  buildWorkbooksUrl,
} from './workbook_url_params';

/** テスト用ヘルパー: クエリ文字列から URLSearchParams を生成する */
function toParams(query: string): URLSearchParams {
  return new URLSearchParams(query);
}

describe('parseWorkBookTab', () => {
  test('returns curriculum for tab=curriculum', () => {
    expect(parseWorkBookTab(toParams('tab=curriculum'))).toBe(WorkBookTab.CURRICULUM);
  });

  test('returns solution for tab=solution', () => {
    expect(parseWorkBookTab(toParams('tab=solution'))).toBe(WorkBookTab.SOLUTION);
  });

  test('returns created_by_user for tab=created_by_user', () => {
    expect(parseWorkBookTab(toParams('tab=created_by_user'))).toBe(WorkBookTab.CREATED_BY_USER);
  });

  test('returns curriculum (default) when tab is absent', () => {
    expect(parseWorkBookTab(toParams(''))).toBe(WorkBookTab.CURRICULUM);
  });

  test('returns curriculum (default) for invalid tab value', () => {
    expect(parseWorkBookTab(toParams('tab=invalid'))).toBe(WorkBookTab.CURRICULUM);
  });
});

describe('parseWorkBookGrade', () => {
  test('returns Q10 for grades=Q10', () => {
    expect(parseWorkBookGrade(toParams('grades=Q10'))).toBe(TaskGrade.Q10);
  });

  test('returns Q9 for grades=Q9', () => {
    expect(parseWorkBookGrade(toParams('grades=Q9'))).toBe(TaskGrade.Q9);
  });

  test('returns Q10 (default) when grades is absent', () => {
    expect(parseWorkBookGrade(toParams(''))).toBe(TaskGrade.Q10);
  });

  test('returns Q10 (default) for PENDING', () => {
    expect(parseWorkBookGrade(toParams('grades=PENDING'))).toBe(TaskGrade.Q10);
  });

  test('returns Q10 (default) for invalid value', () => {
    expect(parseWorkBookGrade(toParams('grades=Z99'))).toBe(TaskGrade.Q10);
  });
});

describe('parseWorkBookCategory', () => {
  test('returns SEARCH_SIMULATION for categories=SEARCH_SIMULATION', () => {
    expect(parseWorkBookCategory(toParams('categories=SEARCH_SIMULATION'))).toBe(
      SolutionCategory.SEARCH_SIMULATION,
    );
  });

  test('returns GRAPH for categories=GRAPH', () => {
    expect(parseWorkBookCategory(toParams('categories=GRAPH'))).toBe(SolutionCategory.GRAPH);
  });

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
});

describe('buildWorkbooksUrl', () => {
  test('curriculum tab with grade produces correct URL', () => {
    expect(buildWorkbooksUrl(WorkBookTab.CURRICULUM, TaskGrade.Q9)).toBe(
      '/workbooks?tab=curriculum&grades=Q9',
    );
  });

  test('solution tab with category produces correct URL', () => {
    expect(buildWorkbooksUrl(WorkBookTab.SOLUTION, undefined, SolutionCategory.GRAPH)).toBe(
      '/workbooks?tab=solution&categories=GRAPH',
    );
  });

  test('curriculum tab without grade produces URL with tab only', () => {
    expect(buildWorkbooksUrl(WorkBookTab.CURRICULUM)).toBe('/workbooks?tab=curriculum');
  });

  test('created_by_user tab produces URL with tab only', () => {
    expect(buildWorkbooksUrl(WorkBookTab.CREATED_BY_USER)).toBe('/workbooks?tab=created_by_user');
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

```bash
pnpm test:unit -- workbook_url_params
# FAIL: module not found
```

---

## Task 2-B: 実装

**Files:**

- Create: `src/features/workbooks/utils/workbook_url_params.ts`

- [ ] **Step 1: ファイルを作成**

```typescript
import { TaskGrade } from '$lib/types/task';
import { SolutionCategory } from '$features/workbooks/types/workbook_placement';
import { WorkBookTab, DEFAULT_WORKBOOK_TAB } from '$features/workbooks/types/workbook';

const DEFAULT_CURRICULUM_GRADE = TaskGrade.Q10;
const DEFAULT_SOLUTION_CATEGORY = SolutionCategory.SEARCH_SIMULATION;
const VALID_TABS = new Set<string>(Object.values(WorkBookTab));

/**
 * Returns true when `param` is a valid enum value excluding PENDING.
 * Extracted to avoid repeating the same three-condition check for grades and categories.
 */
function isValidNonPending<T extends string>(
  param: string | null,
  values: T[],
  pending: T,
): param is T {
  return param !== null && (values as string[]).includes(param) && param !== pending;
}

/**
 * Parses the `?tab=` URL parameter into a WorkBookTab.
 * Falls back to the default ('curriculum') for missing or invalid values.
 */
export function parseWorkBookTab(params: URLSearchParams): WorkBookTab {
  const param = params.get('tab');

  if (param !== null && VALID_TABS.has(param)) {
    return param as WorkBookTab;
  }

  return DEFAULT_WORKBOOK_TAB;
}

/**
 * Parses the `?grades=` URL parameter into a TaskGrade.
 * Excludes PENDING. Falls back to Q10 for missing or invalid values.
 */
export function parseWorkBookGrade(params: URLSearchParams): TaskGrade {
  const param = params.get('grades');

  if (isValidNonPending(param, Object.values(TaskGrade), TaskGrade.PENDING)) {
    return param;
  }

  return DEFAULT_CURRICULUM_GRADE;
}

/**
 * Parses the `?categories=` URL parameter into a SolutionCategory.
 * Excludes PENDING. Falls back to SEARCH_SIMULATION for missing or invalid values.
 */
export function parseWorkBookCategory(params: URLSearchParams): SolutionCategory {
  const param = params.get('categories');

  if (isValidNonPending(param, Object.values(SolutionCategory), SolutionCategory.PENDING)) {
    return param;
  }

  return DEFAULT_SOLUTION_CATEGORY;
}

/**
 * Builds the `/workbooks` URL with the given tab, grade, and category as query parameters.
 * CREATED_BY_USER tab does not append additional params.
 *
 * @param tab - Active tab
 * @param grade - Selected grade (only appended when tab === CURRICULUM)
 * @param category - Selected category (only appended when tab === SOLUTION)
 * @returns URL string suitable for use with goto()
 */
export function buildWorkbooksUrl(
  tab: WorkBookTab,
  grade?: TaskGrade,
  category?: SolutionCategory,
): string {
  const params = new URLSearchParams();
  params.set('tab', tab);

  if (tab === WorkBookTab.CURRICULUM && grade) {
    params.set('grades', grade);
  } else if (tab === WorkBookTab.SOLUTION && category) {
    params.set('categories', category);
  }

  return `/workbooks?${params}`;
}
```

- [ ] **Step 2: テストが通ることを確認**

```bash
pnpm test:unit -- workbook_url_params
# PASS: 17 tests
```

- [ ] **Step 3: コミット**

```bash
git add src/features/workbooks/utils/workbook_url_params.ts \
        src/features/workbooks/utils/workbook_url_params.test.ts
git commit -m "feat(workbooks/utils): Add URL param parsing and URL builder for workbooks list"
```
