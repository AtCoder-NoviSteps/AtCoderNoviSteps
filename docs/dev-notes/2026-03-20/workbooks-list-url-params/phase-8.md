# Phase 8: `WorkBookList.svelte` + `+page.svelte` 改修

**レイヤー:** `src/routes/workbooks/` + `src/features/workbooks/components/list/` | **リスク:** 中-高

**設計方針:**

- `WorkBookList.svelte` の Props は discriminated union に変更する。optional props + `?? fallback` は型安全でない
- Svelte 5 では `let props: Props = $props()` として使い、`{#if props.workbookType === ...}` ブロックで TypeScript 型ナローイングを活用する（destructure すると narrowing が効かない）
- `workbookGradeModes` は CURRICULUM ブランチのみに配置（SOLUTION/CREATED_BY_USER では不要）。グレードフィルタリングはサーバーサイドに移るが、`CurriculumTable` のグレード列表示（`<GradeTableBodyCell>`）で引き続き使われるため削除しない（参照: phase-6 注記）
- `CREATED_BY_USER` タブは URL ドリブン（`isCreatedByUserTabOpen` ローカル `$state` は不要）
- `userCreatedWorkbooks` は廃止。全タブとも `data.workbooks` を使用する

---

## Task 8-A: `WorkBookList.svelte` に discriminated union Props と SOLUTION ルーティングを追加

**Files:**

- Modify: `src/features/workbooks/components/list/WorkBookList.svelte`

- [x] **Step 1: ファイルを読んで現在の Props / ルーティングを確認**

- [x] **Step 2: Props を discriminated union に変更し SOLUTION 分岐を追加**

```typescript
import { type SolutionCategory } from '$features/workbooks/types/workbook_placement';
import { WorkBookTab, WorkBookType } from '$features/workbooks/types/workbook';
import SolutionWorkBookList from './SolutionWorkBookList.svelte';

type CommonProps = {
  workbooks: WorkbooksList;
  taskResultsWithWorkBookId: Map<number, TaskResults>;
  loggedInUser: { id: string; role: Roles } | null;
};

type SpecificProps =
  | {
      workbookType: typeof WorkBookType.CURRICULUM;
      workbookGradeModes: Map<number, TaskGrade>;
      currentGrade: TaskGrade;
      onGradeChange: (grade: TaskGrade) => void;
    }
  | {
      workbookType: typeof WorkBookType.SOLUTION;
      currentCategory: SolutionCategory;
      availableCategories: SolutionCategory[];
      onCategoryChange: (category: SolutionCategory) => void;
    }
  | { workbookType: typeof WorkBookType.CREATED_BY_USER };

type Props = CommonProps & SpecificProps;

let props: Props = $props();
```

- [x] **Step 3: テンプレートを discriminated union に対応させる**

```svelte
{#if props.workbookType === WorkBookType.CURRICULUM}
  <CurriculumWorkBookList
    workbooks={props.workbooks}
    workbookGradeModes={props.workbookGradeModes}
    taskResultsWithWorkBookId={props.taskResultsWithWorkBookId}
    userId={props.loggedInUser?.id ?? ''}
    role={props.loggedInUser?.role as Roles}
    currentGrade={props.currentGrade}
    onGradeChange={props.onGradeChange}
  />
{:else if props.workbookType === WorkBookType.SOLUTION}
  <SolutionWorkBookList
    workbooks={props.workbooks}
    taskResultsWithWorkBookId={props.taskResultsWithWorkBookId}
    userId={props.loggedInUser?.id ?? ''}
    role={props.loggedInUser?.role as Roles}
    availableCategories={props.availableCategories}
    currentCategory={props.currentCategory}
    onCategoryChange={props.onCategoryChange}
  />
{:else}
  <CreatedByUserTable
    workbooks={props.workbooks}
    taskResultsWithWorkBookId={props.taskResultsWithWorkBookId}
    userId={props.loggedInUser?.id ?? ''}
    role={props.loggedInUser?.role as Roles}
  />
{/if}
```

- [x] **Step 4: 型チェック**

```bash
pnpm check
```

- [x] **Step 5: コミット**

```bash
git add src/features/workbooks/components/list/WorkBookList.svelte
git commit -m "refactor(workbooks/components): WorkBookList uses discriminated union Props, routes SOLUTION to SolutionWorkBookList"
```

---

## Task 8-B: `+page.svelte` 改修

**Files:**

- Modify: `src/routes/workbooks/+page.svelte`

- [x] **Step 1: スクリプトブロックを書き換え**

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
    WorkBookTab,
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
  let loggedInUser = data.loggedInUser;
  let role = loggedInUser?.role as Roles;

  const tasksMapByIds: Map<string, Task> = data.tasksMapByIds;
  let taskResultsByTaskId = data.taskResultsByTaskId as Map<string, TaskResult>;

  const workbookGradeModes = $derived(calcWorkBookGradeModes(workbooks, tasksMapByIds));

  function handleTabChange(tab: (typeof WorkBookTab)[keyof typeof WorkBookTab]) {
    if (tab === WorkBookTab.CURRICULUM) {
      goto(buildWorkbooksUrl(WorkBookTab.CURRICULUM, data.selectedGrade));
    } else if (tab === WorkBookTab.SOLUTION) {
      goto(buildWorkbooksUrl(WorkBookTab.SOLUTION, undefined, data.selectedCategory));
    } else {
      goto(buildWorkbooksUrl(WorkBookTab.CREATED_BY_USER));
    }
  }

  function handleGradeChange(grade: TaskGrade) {
    goto(buildWorkbooksUrl(WorkBookTab.CURRICULUM, grade));
  }

  function handleCategoryChange(category: SolutionCategory) {
    goto(buildWorkbooksUrl(WorkBookTab.SOLUTION, undefined, category));
  }
</script>
```

- [x] **Step 2: テンプレートブロックを書き換え**

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
          isOpen={data.tab === WorkBookTab.CURRICULUM}
          title="カリキュラム"
          tooltipContent="問題を解くのに必要な知識を一つずつ学ぶことができます。問題集を順番に取り組むことも、興味があるトピックを優先することもできます。"
          onclick={() => handleTabChange(WorkBookTab.CURRICULUM)}
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
          isOpen={data.tab === WorkBookTab.SOLUTION}
          title="解法別"
          tooltipContent="特定のアルゴリズム・データ構造の基礎から応用問題まで挑戦できます。"
          onclick={() => handleTabChange(WorkBookTab.SOLUTION)}
        >
          <div class="mt-6">
            <WorkBookList
              workbookType={WorkBookType.SOLUTION}
              {workbooks}
              taskResultsWithWorkBookId={buildTaskResultsByWorkBookId(workbooks, taskResultsByTaskId)}
              loggedInUser={loggedInUser as { id: string; role: Roles }}
              availableCategories={data.availableCategories}
              currentCategory={data.selectedCategory}
              onCategoryChange={handleCategoryChange}
            />
          </div>
        </WorkbookTabItem>

        {#if isAdmin(role)}
          <WorkbookTabItem
            isOpen={data.tab === WorkBookTab.CREATED_BY_USER}
            title="ユーザ作成"
            onclick={() => handleTabChange(WorkBookTab.CREATED_BY_USER)}
          >
            <div class="mt-6">
              <WorkBookList
                workbookType={WorkBookType.CREATED_BY_USER}
                {workbooks}
                taskResultsWithWorkBookId={buildTaskResultsByWorkBookId(
                  workbooks,
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

- [x] **Step 3: 型チェック**

```bash
pnpm check
# エラーゼロを確認
```

- [x] **Step 4: 開発サーバーで動作確認**

```bash
pnpm dev
# 確認項目:
# - /workbooks → カリキュラムタブ・Q10 が表示される
# - グレードボタンクリック → URL が ?tab=curriculum&grades=Q9 に変わる（画面リロードなし）
# - 解法別タブクリック → URL が ?tab=solution&categories=SEARCH_SIMULATION に変わる
# - カテゴリボタンクリック → URL 更新・対応する問題集が表示される
# - 問題集が存在しないカテゴリのボタンが非表示
# - /workbooks?tab=solution&categories=GRAPH に直アクセス → 正しく表示
# - 管理者: /workbooks?tab=created_by_user → ユーザ作成タブが表示
# - 一般ユーザ: /workbooks?tab=created_by_user → /workbooks にリダイレクト
# - 補充教材トグルが引き続き動作する
```

- [x] **Step 5: コミット**

```bash
git add src/routes/workbooks/+page.svelte
git commit -m "feat(workbooks): URL-driven tab/filter navigation including CREATED_BY_USER tab for admins"
```

---

## Task 8-C: `workbookGradeModes` → `gradeModesEachWorkbook` リネーム

**Files:**

- Modify: `src/routes/workbooks/+page.svelte`
- Modify: `src/features/workbooks/components/list/WorkBookList.svelte`
- Modify: `src/features/workbooks/components/list/CurriculumWorkBookList.svelte`
- Modify: `src/features/workbooks/components/list/CurriculumTable.svelte`
- Modify: `src/features/workbooks/types/workbook.ts`

- [x] **Step 1: 一括リネーム**

```bash
# 影響ファイルを確認
grep -r "workbookGradeModes" src/
```

`workbookGradeModes` をすべて `gradeModesEachWorkbook` に置換する。

- [x] **Step 2: 型チェック**

```bash
pnpm check
```

- [x] **Step 3: コミット**

```bash
git add -p
git commit -m "refactor(workbooks): rename workbookGradeModes to gradeModesEachWorkbook"
```
