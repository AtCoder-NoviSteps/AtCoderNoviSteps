<script lang="ts">
  import { get } from 'svelte/store';
  import { Button, Tabs } from 'flowbite-svelte';

  import { Roles } from '$lib/types/user';
  import { type Task, type TaskResult } from '$lib/types/task';
  import { type WorkbooksList, WorkBookType } from '$features/workbooks/types/workbook';

  import { activeWorkbookTabStore } from '$features/workbooks/stores/active_workbook_tab';

  import HeadingOne from '$lib/components/HeadingOne.svelte';
  import WorkbookTabItem from '$features/workbooks/components/list/WorkbookTabItem.svelte';
  import WorkBookList from '$features/workbooks/components/list/WorkBookList.svelte';

  import {
    canViewWorkBook,
    calcWorkBookGradeModes,
    getWorkBooksByType,
    buildTaskResultsByWorkBookId,
  } from '$features/workbooks/utils/workbooks';

  let { data } = $props();

  let workbooks = $derived(data.workbooks as WorkbooksList);
  let loggedInUser = data.loggedInUser;
  // HACK: loggedInUser.roleで比較すると、@prisma/clientと型が異なるため、やむを得ずasでキャスト
  let role = loggedInUser?.role as Roles;

  const workBookTabs = [
    {
      title: 'カリキュラム',
      workBookType: WorkBookType.CURRICULUM,
      tooltipContent:
        '問題を解くのに必要な知識を一つずつ学ぶことができます。問題集を順番に取り組むことも、興味があるトピックを優先することもできます。',
      canUsersView: true,
    },
    {
      title: '解法別',
      workBookType: WorkBookType.SOLUTION,
      tooltipContent: '特定のアルゴリズム・データ構造の基礎から応用問題まで挑戦できます。',
      canUsersView: true,
    },
    {
      title: 'ユーザ作成',
      workBookType: WorkBookType.CREATED_BY_USER,
      canUsersView: false,
    },
  ];

  const getActiveWorkBookTab = (workBookType: WorkBookType) => {
    return get(activeWorkbookTabStore).get(workBookType);
  };

  const tasksMapByIds: Map<string, Task> = data.tasksMapByIds;
  let taskResultsByTaskId = data.taskResultsByTaskId as Map<string, TaskResult>;

  const workbookGradeModes = calcWorkBookGradeModes(data.workbooks as WorkbooksList, tasksMapByIds);
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
      {#each workBookTabs as workBookTab}
        {#if loggedInUser && canViewWorkBook(role, workBookTab.canUsersView)}
          <WorkbookTabItem
            workbookType={workBookTab.workBookType}
            isOpen={getActiveWorkBookTab(workBookTab.workBookType)}
            title={workBookTab.title}
            tooltipContent={workBookTab.tooltipContent}
          >
            <div class="mt-6">
              <WorkBookList
                workbookType={workBookTab.workBookType}
                workbooks={getWorkBooksByType(workbooks, workBookTab.workBookType)}
                {workbookGradeModes}
                taskResultsWithWorkBookId={buildTaskResultsByWorkBookId(
                  getWorkBooksByType(workbooks, workBookTab.workBookType),
                  taskResultsByTaskId,
                )}
                loggedInUser={loggedInUser as { id: string; role: Roles }}
              />
            </div>
          </WorkbookTabItem>
        {/if}
      {/each}
    </Tabs>
  </div>
</div>
