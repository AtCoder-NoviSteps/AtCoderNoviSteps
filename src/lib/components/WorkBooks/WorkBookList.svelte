<script lang="ts">
  import { get } from 'svelte/store';

  import { ButtonGroup, Button, Toggle } from 'flowbite-svelte';

  import { taskGradesByWorkBookTypeStore } from '$lib/stores/task_grades_by_workbook_type';
  import { canRead } from '$lib/utils/authorship';
  import { WorkBookType, type WorkbookList, type WorkbooksList } from '$lib/types/workbook';
  import { getTaskGradeLabel } from '$lib/utils/task';
  import { TaskGrade, type TaskGradeRange, type TaskResults } from '$lib/types/task';
  import type { Roles } from '$lib/types/user';
  import TooltipWrapper from '$lib/components/TooltipWrapper.svelte';
  import WorkBookBaseTable from '$lib/components/WorkBooks/WorkBookBaseTable.svelte';

  export let workbookType: WorkBookType;
  export let workbooks: WorkbooksList;
  export let workbookGradeRanges: Map<number, TaskGradeRange>;
  export let taskResultsWithWorkBookId: Map<number, TaskResults>;
  export let loggedInUser;

  let userId = loggedInUser.id;
  let role: Roles = loggedInUser.role;

  let selectedGrade: TaskGrade;
  // FIXME: Svelte 5では、derived storeを使う。
  $: selectedGrade = get(taskGradesByWorkBookTypeStore).get(workbookType) || TaskGrade.Q10;

  $: {
    const grade = get(taskGradesByWorkBookTypeStore).get(workbookType) || TaskGrade.Q10;

    if (grade) {
      selectedGrade = grade;
    }
  }

  // 本編
  let mainWorkbooks: WorkbooksList;

  $: mainWorkbooks =
    workbookType === WorkBookType.CREATED_BY_USER
      ? workbooks
      : workbooks.filter((workbook: WorkbookList) => {
          const lower = getGradeLower(workbook.id);
          return lower === selectedGrade && !workbook.isReplenished;
        });
  $: readableMainWorkbooksCount = () => countReadableWorkbooks(mainWorkbooks);

  // 補充
  let replenishedWorkbooks: WorkbooksList;

  $: replenishedWorkbooks = workbooks.filter((workbook: WorkbookList) => {
    const lower = getGradeLower(workbook.id);
    return lower === selectedGrade && workbook.isReplenished;
  });
  $: readableReplenishedWorkbooksCount = () => countReadableWorkbooks(replenishedWorkbooks);

  let isShowReplenishment: boolean = true;

  function countReadableWorkbooks(workbooks: WorkbooksList): number {
    const results = workbooks.reduce((count, workbook: WorkbookList) => {
      const hasReadPermission = canRead(workbook.isPublished, userId, workbook.authorId);
      return count + (hasReadPermission ? 1 : 0);
    }, 0);

    return results;
  }

  function getGradeLower(workbookId: number): TaskGrade {
    const workbookGradeRange = workbookGradeRanges.get(workbookId);

    return workbookGradeRange?.lower ?? TaskGrade.PENDING;
  }

  function filterByGradeLower(grade: TaskGrade) {
    selectedGrade = grade;
    taskGradesByWorkBookTypeStore.updateTaskGrade(workbookType, grade);
  }
</script>

<!-- TODO: 6Q〜1Q?にも対応 -->
<!-- TODO: 「ユーザ作成」の問題集には、検索機能を追加 -->
{#if workbookType !== WorkBookType.CREATED_BY_USER}
  <div class="mb-6">
    <div class="flex flex-col md:flex-row items-start md:items-center justify-between">
      <div class="flex items-center space-x-4">
        <ButtonGroup>
          {#each [TaskGrade.Q10, TaskGrade.Q9, TaskGrade.Q8, TaskGrade.Q7] as grade}
            <!-- HACK: 本来であれば、別ページからグレードを復元したときも、ボタンを選択状態にしたいが、うまく設定できていない -->
            <Button
              on:click={() => filterByGradeLower(grade)}
              class={selectedGrade === grade ? 'text-primary-700' : 'text-gray-900'}
            >
              {getTaskGradeLabel(grade)}
            </Button>
          {/each}
        </ButtonGroup>

        <TooltipWrapper tooltipContent="問題集のグレード（下限）を指定します" />
      </div>

      {#if workbookType === WorkBookType.TEXTBOOK}
        <div class="mt-4 md:mt-0">
          <Toggle bind:checked={isShowReplenishment}>「補充」があれば表示</Toggle>
        </div>
      {/if}
    </div>
  </div>
{/if}

{#if readableMainWorkbooksCount()}
  <div>
    {#if workbookType === WorkBookType.TEXTBOOK}
      <div class="text-2xl pb-4">本編</div>
    {/if}

    <WorkBookBaseTable
      {workbookType}
      workbooks={mainWorkbooks}
      {workbookGradeRanges}
      {userId}
      {role}
      taskResults={taskResultsWithWorkBookId}
    />
  </div>

  <!-- カリキュラムの場合、かつ、公開されている【補充】問題集があるときだけ表示 -->
  {#if workbookType === WorkBookType.TEXTBOOK && readableReplenishedWorkbooksCount() && isShowReplenishment}
    <div class="mt-12">
      <div class="flex items-center space-x-3 pb-4">
        <div class="text-2xl">補充</div>
        <TooltipWrapper tooltipContent="準備中" />
      </div>

      <WorkBookBaseTable
        {workbookType}
        workbooks={replenishedWorkbooks}
        {workbookGradeRanges}
        {userId}
        {role}
        taskResults={taskResultsWithWorkBookId}
      />
    </div>
  {/if}
{:else}
  <div>該当する問題集は見つかりませんでした。</div>
  <div>新しい問題集が追加されるまで、しばらくお待ちください。</div>
{/if}
