<script lang="ts">
  import { Button, Tabs } from 'flowbite-svelte';

  export let data;

  $: workbooks = data.workbooks;
  let loggedInUser = data.loggedInUser;

  import HeadingOne from '$lib/components/HeadingOne.svelte';
  import TabItemWrapper from '$lib/components/TabItemWrapper.svelte';
  import WorkBookList from '$lib/components/WorkBooks/WorkBookList.svelte';
  import { getTaskGradeOrder } from '$lib/utils/task';
  import { type Task, TaskGrade, type TaskGrades, type TaskGradeRange } from '$lib/types/task';
  import {
    type WorkbookList,
    type WorkbooksList,
    type WorkBookTaskBase,
    WorkBookType,
  } from '$lib/types/workbook';
  import { Roles } from '$lib/types/user';

  const getWorkBooksByType = (workbooks: WorkbooksList, workBookType: WorkBookType) => {
    const filteredWorkbooks = workbooks.filter(
      (workbook: WorkbookList) => workbook.workBookType === workBookType,
    );
    return filteredWorkbooks;
  };

  // FIXME: 各問題集の説明文を推敲
  const workBookTabs = [
    {
      title: '教科書',
      workBookType: WorkBookType.TEXTBOOK,
      isOpen: true,
      tooltipContent: '特定のグレードの問題を挑戦するのに必要な基礎知識が学べます。',
    },
    {
      title: '解法別',
      workBookType: WorkBookType.SOLUTION,
      isOpen: false,
      tooltipContent:
        '特定のアルゴリズム・データ構造を応用する力や競技プログラミング特有の考え方を身につけられます。',
    },
    {
      title: 'ジャンル別',
      workBookType: WorkBookType.GENRE,
      isOpen: false,
      tooltipContent:
        '特定のジャンル (グラフ理論・文字列など) を重点的に練習できます。解法に直接言及するようなネタバレはありません。',
    },
    {
      title: 'その他',
      workBookType: WorkBookType.OTHERS,
      isOpen: false,
    },
    {
      title: 'ユーザ作成',
      workBookType: WorkBookType.CREATED_BY_USER,
      isOpen: false,
    },
  ];

  const tasksByTaskId: Map<string, Task> = data.tasksByTaskId;

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

  const workbookGradeRanges = getWorkBookGradeRanges(data.workbooks);
</script>

<div class="container mx-auto w-5/6">
  <HeadingOne title="問題集" />

  <!-- TODO: フィルタリング機能などが実装できたら、一般ユーザも問題集を作成できるようにする -->
  {#if loggedInUser?.role === Roles.ADMIN}
    <Button href="/workbooks/create" type="submit" class="mt-4 mb-4">新規作成</Button>
  {/if}

  <!-- TODO: adminが作成私した問題集は、下限グレードで選択できるように -->
  <!-- TODO: 回答状況を実際のデータに置き換える -->
  <!-- TODO: ページネーションを追加 -->
  <div>
    <Tabs tabStyle="underline" contentClass="bg-white">
      {#each workBookTabs as workBookTab}
        <TabItemWrapper
          isOpen={workBookTab.isOpen}
          title={workBookTab.title}
          tooltipContent={workBookTab.tooltipContent}
        >
          <div class="mt-6">
            <WorkBookList
              workbookType={workBookTab.workBookType}
              workbooks={getWorkBooksByType(workbooks, workBookTab.workBookType)}
              {workbookGradeRanges}
              {loggedInUser}
            />
          </div>
        </TabItemWrapper>
      {/each}
    </Tabs>
  </div>
</div>
