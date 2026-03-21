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

  const gradeModesEachWorkbook = $derived(calcWorkBookGradeModes(workbooks, tasksMapByIds));
  const taskResultsWithWorkBookId = $derived(
    buildTaskResultsByWorkBookId(workbooks, taskResultsByTaskId),
  );

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
              {gradeModesEachWorkbook}
              {taskResultsWithWorkBookId}
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
              {taskResultsWithWorkBookId}
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
                {taskResultsWithWorkBookId}
                loggedInUser={loggedInUser as { id: string; role: Roles }}
              />
            </div>
          </WorkbookTabItem>
        {/if}
      {/if}
    </Tabs>
  </div>
</div>
