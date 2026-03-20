# Phase 8: `WorkBookList.svelte` + `+page.svelte` 改修

**レイヤー:** `src/routes/workbooks/` + `src/features/workbooks/components/list/` | **リスク:** 中-高

---

## Task 8-A: `WorkBookList.svelte` に SOLUTION ルーティングを追加

**Files:**

- Modify: `src/features/workbooks/components/list/WorkBookList.svelte`

- [ ] **Step 1: ファイルを読んで現在の Props / ルーティングを確認**

- [ ] **Step 2: 新しい Props を追加**

```typescript
import { type SolutionCategory } from '$features/workbooks/types/workbook_placement';
import SolutionWorkBookList from './SolutionWorkBookList.svelte';

interface Props {
  // 既存 props はそのまま
  workbookType: WorkBookType;
  workbooks: WorkbooksList;
  workbookGradeModes: Map<number, TaskGrade>;
  taskResultsWithWorkBookId: Map<number, TaskResults>;
  loggedInUser: { id: string; role: Roles } | null;
  // 追加
  currentGrade?: TaskGrade;
  onGradeChange?: (grade: TaskGrade) => void;
  currentCategory?: SolutionCategory;
  onCategoryChange?: (category: SolutionCategory) => void;
}
```

- [ ] **Step 3: SOLUTION 分岐を追加**

```svelte
{:else if workbookType === WorkBookType.SOLUTION}
  <SolutionWorkBookList
    {workbooks}
    {workbookGradeModes}
    {taskResultsWithWorkBookId}
    userId={loggedInUser?.id ?? ''}
    role={loggedInUser?.role as Roles}
    currentCategory={currentCategory ?? SolutionCategory.SEARCH_SIMULATION}
    onCategoryChange={onCategoryChange ?? (() => {})}
  />
```

- [ ] **Step 4: 型チェック**

```bash
pnpm check
```

- [ ] **Step 5: コミット**

```bash
git add src/features/workbooks/components/list/WorkBookList.svelte
git commit -m "feat(workbooks/components): WorkBookList routes SOLUTION to SolutionWorkBookList"
```

---

## Task 8-B: `+page.svelte` 改修

**Files:**

- Modify: `src/routes/workbooks/+page.svelte`

- [ ] **Step 1: スクリプトブロックを書き換え**

```svelte
<script lang="ts">
  import { goto } from '$app/navigation';
  import { Button, Tabs } from 'flowbite-svelte';

  import { Roles } from '$lib/types/user';
  import { isAdmin } from '$lib/utils/authorship';
  import { type Task, TaskGrade, type TaskResult } from '$lib/types/task';
  import {
    type WorkbooksList,
    WorkBookType,
    type WorkBookTab,
  } from '$features/workbooks/types/workbook';
  import { type SolutionCategory } from '$features/workbooks/types/workbook_placement';

  import HeadingOne from '$lib/components/HeadingOne.svelte';
  import WorkbookTabItem from '$features/workbooks/components/list/WorkbookTabItem.svelte';
  import WorkBookList from '$features/workbooks/components/list/WorkBookList.svelte';

  import {
    calcWorkBookGradeModes,
    buildTaskResultsByWorkBookId,
  } from '$features/workbooks/utils/workbooks';
  import { buildWorkbooksUrl } from '$features/workbooks/utils/workbook_url_params';

  let { data } = $props();

  let workbooks = $derived(data.workbooks as WorkbooksList);
  let userCreatedWorkbooks = $derived(data.userCreatedWorkbooks as WorkbooksList);
  let loggedInUser = data.loggedInUser;
  let role = loggedInUser?.role as Roles;

  const tasksMapByIds: Map<string, Task> = data.tasksMapByIds;
  let taskResultsByTaskId = data.taskResultsByTaskId as Map<string, TaskResult>;

  // CREATED_BY_USER workbooks も含めてグレードモードを計算する
  const allWorkbooks = $derived([...workbooks, ...userCreatedWorkbooks] as WorkbooksList);
  const workbookGradeModes = $derived(calcWorkBookGradeModes(allWorkbooks, tasksMapByIds));

  // CREATED_BY_USER タブは URL を変えずローカル状態で管理
  let isCreatedByUserTabOpen = $state(false);

  function handleTabChange(tab: WorkBookTab) {
    isCreatedByUserTabOpen = false;

    if (tab === 'curriculum') {
      goto(buildWorkbooksUrl('curriculum', data.selectedGrade));
    } else {
      goto(buildWorkbooksUrl('solution', undefined, data.selectedCategory));
    }
  }

  function handleGradeChange(grade: TaskGrade) {
    goto(buildWorkbooksUrl('curriculum', grade));
  }

  function handleCategoryChange(category: SolutionCategory) {
    goto(buildWorkbooksUrl('solution', undefined, category));
  }

  function handleCreatedByUserTabClick() {
    isCreatedByUserTabOpen = true;
  }
</script>
```

- [ ] **Step 2: テンプレートブロックを書き換え**

```svelte
<div class="container mx-auto w-5/6">
  <HeadingOne title="問題集" />

  <!-- TODO: フィルタリング機能などが実装できたら、一般ユーザも問題集を作成できるようにする -->
  {#if role === Roles.ADMIN}
    <div class="ml-2">
      <Button href="/workbooks/create" type="submit" class="mt-4 mb-4">新規作成</Button>
    </div>
  {/if}

  <!-- TODO: ページネーションを追加 -->
  <div>
    <Tabs
      tabStyle="underline"
      contentClass="bg-white dark:bg-gray-800 mt-0 p-0"
      ulClass="flex flex-wrap md:flex-nowrap md:gap-2 rtl:space-x-reverse items-start"
    >
      {#if loggedInUser}
        <WorkbookTabItem
          isOpen={data.tab === 'curriculum'}
          title="カリキュラム"
          tooltipContent="問題を解くのに必要な知識を一つずつ学ぶことができます。問題集を順番に取り組むことも、興味があるトピックを優先することもできます。"
          onclick={() => handleTabChange('curriculum')}
        >
          <div class="mt-6">
            <WorkBookList
              workbookType={WorkBookType.CURRICULUM}
              {workbooks}
              {workbookGradeModes}
              taskResultsWithWorkBookId={buildTaskResultsByWorkBookId(workbooks, taskResultsByTaskId)}
              loggedInUser={loggedInUser as { id: string; role: Roles }}
              currentGrade={data.selectedGrade}
              onGradeChange={handleGradeChange}
            />
          </div>
        </WorkbookTabItem>

        <WorkbookTabItem
          isOpen={data.tab === 'solution'}
          title="解法別"
          tooltipContent="特定のアルゴリズム・データ構造の基礎から応用問題まで挑戦できます。"
          onclick={() => handleTabChange('solution')}
        >
          <div class="mt-6">
            <WorkBookList
              workbookType={WorkBookType.SOLUTION}
              {workbooks}
              {workbookGradeModes}
              taskResultsWithWorkBookId={buildTaskResultsByWorkBookId(workbooks, taskResultsByTaskId)}
              loggedInUser={loggedInUser as { id: string; role: Roles }}
              currentCategory={data.selectedCategory}
              onCategoryChange={handleCategoryChange}
            />
          </div>
        </WorkbookTabItem>

        {#if isAdmin(role)}
          <WorkbookTabItem
            isOpen={isCreatedByUserTabOpen}
            title="ユーザ作成"
            onclick={handleCreatedByUserTabClick}
          >
            <div class="mt-6">
              <WorkBookList
                workbookType={WorkBookType.CREATED_BY_USER}
                workbooks={userCreatedWorkbooks}
                {workbookGradeModes}
                taskResultsWithWorkBookId={buildTaskResultsByWorkBookId(
                  userCreatedWorkbooks,
                  taskResultsByTaskId,
                )}
                loggedInUser={loggedInUser as { id: string; role: Roles }}
              />
            </div>
          </WorkbookTabItem>
        {/if}
      {/if}
    </Tabs>
  </div>
</div>
```

- [ ] **Step 3: 型チェック**

```bash
pnpm check
# エラーゼロを確認
```

- [ ] **Step 4: 開発サーバーで動作確認**

```bash
pnpm dev
# 確認項目:
# - /workbooks → カリキュラムタブ・Q10 が表示される
# - グレードボタンクリック → URL が ?tab=curriculum&grades=Q9 に変わる（画面リロードなし）
# - 解法別タブクリック → URL が ?tab=solution&categories=SEARCH_SIMULATION に変わる
# - カテゴリボタンクリック → URL 更新・対応する問題集が表示される
# - /workbooks?tab=solution&categories=GRAPH に直アクセス → 正しく表示
# - 管理者: ユーザ作成タブが表示される（URL 変更なし）
# - 一般ユーザ: ユーザ作成タブが表示されない
# - 補充教材トグルが引き続き動作する
```

- [ ] **Step 5: コミット**

```bash
git add src/routes/workbooks/+page.svelte
git commit -m "feat(workbooks): URL-driven tab/filter navigation with admin-only CREATED_BY_USER tab"
```
