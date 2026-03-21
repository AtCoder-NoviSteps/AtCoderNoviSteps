# Phase 4: `+page.server.ts` 修正

**レイヤー:** `src/routes/workbooks/` | **リスク:** 中

URLパラメータを解析し、タブに応じてサービス関数を呼び分ける。`CREATED_BY_USER` タブは管理者専用であり、非管理者は `redirect(FOUND, '/workbooks')` でリダイレクトする。全タブとも単一 `workbooks` を返し、`userCreatedWorkbooks` は廃止（パフォーマンス改善）。

**設計方針:**

- タブ判定には `WorkBookTab.CURRICULUM` 等の定数を使う（ハードコード文字列禁止）
- 3タブの呼び出し分けは if/else で十分（strategy pattern は YAGNI）
- `buildPlacementQuery()` は `+page.server.ts` 内のプライベートヘルパーとして維持（重複なし）
- `availableCategories` をページデータに追加（Phase 5 の `SolutionWorkBookList` で使用）

---

**Files:**

- Modify: `src/routes/workbooks/+page.server.ts`

- [x] **Step 1: インポートを更新**

追加:

```typescript
import { Roles } from '$lib/types/user';
import {
  WorkBookTab,
  type WorkBookTab as WorkBookTabType,
} from '$features/workbooks/types/workbook';

import {
  type PlacementQuery,
  getPublishedWorkbooksByPlacement,
  getWorkBooksCreatedByUsers,
  getAvailableSolutionCategories,
} from '$features/workbooks/services/workbooks';

import { isAdmin } from '$lib/utils/authorship';
import {
  parseWorkBookTab,
  parseWorkBookGrade,
  parseWorkBookCategory,
} from '$features/workbooks/utils/workbook_url_params';

import { FOUND } from '$lib/constants/http-response-status-codes';
```

削除: `workBooksCrud.getWorkBooksWithAuthors` の呼び出し（`load()` 内）

- [x] **Step 2: `load()` を書き換え**

```typescript
export async function load({ locals, url }) {
  const loggedInUser = await getLoggedInUser(locals);
  const params = url.searchParams;

  const tab = parseWorkBookTab(params);

  // CREATED_BY_USER は管理者専用
  if (tab === WorkBookTab.CREATED_BY_USER && (!loggedInUser || !isAdmin(loggedInUser.role as Roles))) {
    redirect(FOUND, '/workbooks');
  }

  const selectedGrade = parseWorkBookGrade(params);
  const selectedCategory = parseWorkBookCategory(params);

  try {
    const [workbooks, availableCategories, tasksMapByIds, taskResultsByTaskId] = await Promise.all([
      fetchWorkbooksByTab(tab, selectedGrade, selectedCategory),
      getAvailableSolutionCategories(),
      taskCrud.getTasksByTaskId(),
      taskResultsCrud.getTaskResultsOnlyResultExists(loggedInUser?.id as string, true),
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
  } catch (e) {
    console.error('Failed to fetch workbooks, tasks or task results: ', e);
    error(
      INTERNAL_SERVER_ERROR,
      '問題もしくは回答の取得に失敗しました。しばらくしてから、もう一度試してください。',
    );
  }
}
```

`actions.delete` は変更しない。

- [x] **Step 3: `fetchWorkbooksByTab()` と `buildPlacementQuery()` を `load()` の後（ファイル末尾）に追加**

```typescript
function fetchWorkbooksByTab(
  tab: WorkBookTabType,
  grade: ReturnType<typeof parseWorkBookGrade>,
  category: ReturnType<typeof parseWorkBookCategory>,
) {
  if (tab === WorkBookTab.CREATED_BY_USER) {
    return getWorkBooksCreatedByUsers();
  }

  return getPublishedWorkbooksByPlacement(buildPlacementQuery(tab, grade, category));
}

function buildPlacementQuery(
  tab: WorkBookTabType,
  grade: ReturnType<typeof parseWorkBookGrade>,
  category: ReturnType<typeof parseWorkBookCategory>,
): PlacementQuery {
  if (tab === WorkBookTab.CURRICULUM) {
    return { workBookType: WorkBookType.CURRICULUM, taskGrade: grade };
  }

  return { workBookType: WorkBookType.SOLUTION, solutionCategory: category };
}
```

- [x] **Step 4: 型チェック**

```bash
pnpm check
```

- [x] **Step 5: コミット**

```bash
git add src/routes/workbooks/+page.server.ts
git commit -m "feat(workbooks/server): Load workbooks from URL params; add CREATED_BY_USER admin guard"
```
