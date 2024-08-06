<script lang="ts">
  import { get } from 'svelte/store';

  import { ButtonGroup, Button } from 'flowbite-svelte';

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

  let filteredWorkbooks: WorkbooksList;

  $: filteredWorkbooks =
    workbookType === WorkBookType.CREATED_BY_USER
      ? workbooks
      : workbooks.filter((workbook: WorkbookList) => {
          const lower = getGradeLower(workbook.id);
          return lower === selectedGrade;
        });
  $: readableWorkbooksCount = filteredWorkbooks.reduce((count, workbook: WorkbookList) => {
    const hasReadPermission = canRead(workbook.isPublished, userId, workbook.authorId);
    return count + (hasReadPermission ? 1 : 0);
  }, 0);

  function filterByGradeLower(grade: TaskGrade) {
    selectedGrade = grade;
    taskGradesByWorkBookTypeStore.updateTaskGrade(workbookType, grade);
  }

  function getGradeLower(workbookId: number): TaskGrade {
    const workbookGradeRange = workbookGradeRanges.get(workbookId);

    return workbookGradeRange?.lower ?? TaskGrade.PENDING;
  }
</script>

<!-- TODO: 6Q〜1Q?にも対応 -->
<!-- TODO: 「ユーザ作成」の問題集には、検索機能を追加 -->
{#if workbookType !== WorkBookType.CREATED_BY_USER}
  <div class="mb-6">
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
  </div>
{/if}

{#if readableWorkbooksCount}
  <WorkBookBaseTable
    {workbookType}
    workbooks={filteredWorkbooks}
    {workbookGradeRanges}
    {userId}
    {role}
    taskResults={taskResultsWithWorkBookId}
  />
{:else}
  <div>該当する問題集は見つかりませんでした。</div>
  <div>新しい問題集が追加されるまで、しばらくお待ちください。</div>
{/if}
