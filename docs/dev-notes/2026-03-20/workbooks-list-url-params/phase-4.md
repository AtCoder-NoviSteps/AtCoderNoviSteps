# Phase 4: `+page.server.ts` 修正

**レイヤー:** `src/routes/workbooks/` | **リスク:** 中

URLパラメータを解析し、`getPublishedWorkbooksByPlacement()` を呼び出す。`buildPlacementQuery()` をファイルスコープのヘルパーとして抽出することで、`load()` 内の条件分岐を排除する。管理者の場合のみ `getWorkBooksCreatedByUsers()` を並列実行する。

---

**Files:**

- Modify: `src/routes/workbooks/+page.server.ts`

- [ ] **Step 1: インポートを更新**

追加:

```typescript
import { Roles } from '$lib/types/user';
import { isAdmin } from '$lib/utils/authorship';
import { WorkBookType, type WorkBookTab } from '$features/workbooks/types/workbook';
import {
  type PlacementQuery,
  getPublishedWorkbooksByPlacement,
  getWorkBooksCreatedByUsers,
} from '$features/workbooks/services/workbooks';
import {
  parseWorkBookTab,
  parseWorkBookGrade,
  parseWorkBookCategory,
} from '$features/workbooks/utils/workbook_url_params';
```

削除: `workBooksCrud.getWorkBooksWithAuthors` の呼び出し（`load()` 内）

- [ ] **Step 2: `load()` を書き換え**

```typescript
export async function load({ locals, url }) {
  const loggedInUser = await getLoggedInUser(locals);
  const params = url.searchParams;

  const tab = parseWorkBookTab(params);
  const selectedGrade = parseWorkBookGrade(params);
  const selectedCategory = parseWorkBookCategory(params);
  const query = buildPlacementQuery(tab, selectedGrade, selectedCategory);

  try {
    const [workbooks, tasksMapByIds, taskResultsByTaskId, userCreatedWorkbooks] = await Promise.all(
      [
        workBooksCrud.getPublishedWorkbooksByPlacement(query),
        taskCrud.getTasksByTaskId(),
        taskResultsCrud.getTaskResultsOnlyResultExists(loggedInUser?.id as string, true),
        isAdmin(loggedInUser?.role as Roles)
          ? workBooksCrud.getWorkBooksCreatedByUsers()
          : Promise.resolve([]),
      ],
    );

    return {
      workbooks,
      userCreatedWorkbooks,
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

- [ ] **Step 3: `buildPlacementQuery()` を `load()` の後（ファイル末尾）に追加**

```typescript
function buildPlacementQuery(
  tab: WorkBookTab,
  grade: ReturnType<typeof parseWorkBookGrade>,
  category: ReturnType<typeof parseWorkBookCategory>,
): PlacementQuery {
  if (tab === 'curriculum') {
    return { workBookType: WorkBookType.CURRICULUM, taskGrade: grade };
  }

  return { workBookType: WorkBookType.SOLUTION, solutionCategory: category };
}
```

- [ ] **Step 4: 型チェック**

```bash
pnpm check
```

- [ ] **Step 5: コミット**

```bash
git add src/routes/workbooks/+page.server.ts
git commit -m "feat(workbooks/server): Load workbooks from URL params via getPublishedWorkbooksByPlacement"
```
