<script lang="ts">
  export let data;

  import { get } from 'svelte/store';
  import { Button, Tabs } from 'flowbite-svelte';

  import HeadingOne from '$lib/components/HeadingOne.svelte';
  import TabItemWrapper from '$lib/components/TabItemWrapper.svelte';
  import { activeWorkbookTabStore } from '$lib/stores/active_workbook_tab';
  import WorkBookList from '$lib/components/WorkBooks/WorkBookList.svelte';
  import { getTaskGradeOrder } from '$lib/utils/task';
  import { type Task, TaskGrade, type TaskGrades, type TaskGradeRange } from '$lib/types/task';
  import type { TaskResult, TaskResults } from '$lib/types/task';
  import {
    type WorkbookList,
    type WorkbooksList,
    type WorkBookTaskBase,
    WorkBookType,
  } from '$lib/types/workbook';
  import { Roles } from '$lib/types/user';
  import { canViewWorkBook } from '$lib/utils/workbooks';

  $: workbooks = data.workbooks as WorkbooksList;
  let loggedInUser = data.loggedInUser;
  // loggedInUser.roleで比較すると、@prisma/clientと型が異なるため、やむを得ずasでキャスト
  let role = loggedInUser?.role as Roles;

  const getWorkBooksByType = (workbooks: WorkbooksList, workBookType: WorkBookType) => {
    const filteredWorkbooks = workbooks.filter(
      (workbook: WorkbookList) => workbook.workBookType === workBookType,
    );
    return filteredWorkbooks;
  };

  const workBookTabs = [
    // Note: カリキュラムは、旧 教科書。スキーマの属性を変更していないのは、名称の変更の可能性があるため。
    {
      title: 'カリキュラム',
      workBookType: WorkBookType.TEXTBOOK,
      tooltipContent:
        '問題を解くのに必要な知識を一つずつ学ぶことができます。問題集を順番に取り組むことも、興味があるトピックを優先することもできます。',
      canUsersView: true,
    },
    {
      title: '解法別',
      workBookType: WorkBookType.SOLUTION,
      tooltipContent: '特定のアルゴリズム・データ構造の習熟度を確認できます。',
      canUsersView: false,
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

  const tasksByTaskId: Map<string, Task> = data.tasksByTaskId;
  let taskResultsByTaskId = data.taskResultsByTaskId as Map<string, TaskResult>;

  // 計算量: 問題集の数をN、各問題集の問題の数をMとすると、O(N * M)
  const getWorkBookGradeRanges = (workbooks: WorkbooksList): Map<number, TaskGradeRange> => {
    const gradeRanges: Map<number, TaskGradeRange> = new Map();

    workbooks.forEach((workbook: WorkbookList) => {
      const taskGrades = workbook.workBookTasks.reduce(
        (results: TaskGrades, workBookTask: WorkBookTaskBase) => {
          const task = tasksByTaskId.get(workBookTask.taskId);

          if (task && task.grade !== TaskGrade.PENDING) {
            results.push(task.grade as TaskGrade);
          }
          return results;
        },
        [],
      );

      const { lower, upper } = calcGradeLowerAndUpper(taskGrades as TaskGrades);
      gradeRanges.set(workbook.id, { lower, upper });
    });

    return gradeRanges;
  };

  function calcGradeLowerAndUpper(taskGrades: TaskGrades): TaskGradeRange {
    if (taskGrades.length === 0) {
      return { lower: TaskGrade.PENDING, upper: TaskGrade.PENDING };
    }

    const gradeOrders = taskGrades.map(getGradeOrder).filter((order) => order !== undefined);

    if (gradeOrders.length === 0) {
      return { lower: TaskGrade.PENDING, upper: TaskGrade.PENDING };
    }

    const lowerOrder = Math.min(...gradeOrders);
    const upperOrder = Math.max(...gradeOrders);

    const gradeLower = taskGrades.find(
      (grade: TaskGrade) => getGradeOrder(grade) === lowerOrder,
    ) as TaskGrade;
    const gradeUpper = taskGrades.find(
      (grade: TaskGrade) => getGradeOrder(grade) === upperOrder,
    ) as TaskGrade;

    return { lower: gradeLower, upper: gradeUpper };
  }

  function getGradeOrder(grade: TaskGrade) {
    return getTaskGradeOrder.get(grade);
  }

  const workbookGradeRanges = getWorkBookGradeRanges(data.workbooks as WorkbooksList);

  // 計算量: 問題集の数をN、各問題集の問題の数をMとすると、O(N * M)
  function fetchTaskResultsWithWorkBookId(workbooks: WorkbooksList, workBookType: WorkBookType) {
    const workbooksByType = getWorkBooksByType(workbooks, workBookType);
    const taskResultsWithWorkBookId = new Map();

    workbooksByType.forEach((workbook: WorkbookList) => {
      const taskResults: TaskResults = workbook.workBookTasks.reduce(
        (array: TaskResults, workBookTask: WorkBookTaskBase) => {
          const taskResult = taskResultsByTaskId.get(workBookTask.taskId);

          if (taskResult !== undefined) {
            array.push(taskResult);
          }

          return array;
        },
        [],
      );

      if (taskResults.length > 0) {
        taskResultsWithWorkBookId.set(workbook.id, taskResults);
      }
    });

    return taskResultsWithWorkBookId;
  }
</script>

<div class="container mx-auto w-5/6">
  <HeadingOne title="問題集（アルファ版）" />

  <!-- TODO: フィルタリング機能などが実装できたら、一般ユーザも問題集を作成できるようにする -->
  {#if role === Roles.ADMIN}
    <div class="ml-2">
      <Button href="/workbooks/create" type="submit" class="mt-4 mb-4">新規作成</Button>
    </div>
  {/if}

  <!-- TODO: ページネーションを追加 -->
  <div>
    <Tabs tabStyle="underline" contentClass="bg-white">
      {#each workBookTabs as workBookTab}
        {#if loggedInUser && canViewWorkBook(role, workBookTab.canUsersView)}
          <TabItemWrapper
            workbookType={workBookTab.workBookType}
            isOpen={getActiveWorkBookTab(workBookTab.workBookType)}
            title={workBookTab.title}
            tooltipContent={workBookTab.tooltipContent}
          >
            <div class="mt-6">
              <WorkBookList
                workbookType={workBookTab.workBookType}
                workbooks={getWorkBooksByType(workbooks, workBookTab.workBookType)}
                {workbookGradeRanges}
                taskResultsWithWorkBookId={fetchTaskResultsWithWorkBookId(
                  workbooks,
                  workBookTab.workBookType,
                )}
                {loggedInUser}
              />
            </div>
          </TabItemWrapper>
        {/if}
      {/each}
    </Tabs>
  </div>
</div>
