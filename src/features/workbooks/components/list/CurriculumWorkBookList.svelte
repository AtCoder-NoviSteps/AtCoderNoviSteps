<script lang="ts">
  import { get } from 'svelte/store';

  import { ButtonGroup, Button, Toggle } from 'flowbite-svelte';

  import type { Roles } from '$lib/types/user';
  import { TaskGrade, type TaskResults } from '$lib/types/task';
  import {
    WorkBookType,
    type WorkbookList,
    type WorkbooksList,
  } from '$features/workbooks/types/workbook';

  import { taskGradesByWorkBookTypeStore } from '$features/workbooks/stores/task_grades_by_workbook_type';
  import { replenishmentWorkBooksStore } from '$features/workbooks/stores/replenishment_workbook.svelte';

  import { getTaskGradeLabel } from '$lib/utils/task';
  import { countReadableWorkbooks, getGradeMode } from '$features/workbooks/utils/workbooks';

  import TooltipWrapper from '$lib/components/TooltipWrapper.svelte';
  import LabelWithTooltips from '$lib/components/LabelWithTooltips.svelte';
  import CurriculumTable from '$features/workbooks/components/list/CurriculumTable.svelte';
  import EmptyWorkbookList from '$features/workbooks/components/list/EmptyWorkbookList.svelte';

  interface Props {
    workbooks: WorkbooksList;
    workbookGradeModes: Map<number, TaskGrade>;
    taskResultsWithWorkBookId: Map<number, TaskResults>;
    userId: string;
    role: Roles;
  }

  let { workbooks, workbookGradeModes, taskResultsWithWorkBookId, userId, role }: Props = $props();

  const AVAILABLE_GRADES = [
    TaskGrade.Q10,
    TaskGrade.Q9,
    TaskGrade.Q8,
    TaskGrade.Q7,
    TaskGrade.Q6,
  ] as const;

  let selectedGrade: TaskGrade = $state(
    get(taskGradesByWorkBookTypeStore).get(WorkBookType.CURRICULUM) || TaskGrade.Q10,
  );

  let showReplenishmentWorkbooks = $state(replenishmentWorkBooksStore.canView());

  function handleReplenishmentWorkbooks() {
    showReplenishmentWorkbooks = !showReplenishmentWorkbooks;
    replenishmentWorkBooksStore.toggleView();
  }

  function filterByGradeMode(grade: TaskGrade) {
    selectedGrade = grade;
    taskGradesByWorkBookTypeStore.updateTaskGrade(WorkBookType.CURRICULUM, grade);
  }

  $effect(() => {
    const grade = get(taskGradesByWorkBookTypeStore).get(WorkBookType.CURRICULUM) || TaskGrade.Q10;

    if (grade) {
      selectedGrade = grade;
    }
  });

  let mainWorkbooks: WorkbooksList = $derived(
    workbooks.filter((workbook: WorkbookList) => {
      const gradeMode = getGradeMode(workbook.id, workbookGradeModes);
      return gradeMode === selectedGrade && !workbook.isReplenished;
    }),
  );

  let replenishedWorkbooks: WorkbooksList = $derived(
    workbooks.filter((workbook: WorkbookList) => {
      const gradeMode = getGradeMode(workbook.id, workbookGradeModes);
      return gradeMode === selectedGrade && workbook.isReplenished;
    }),
  );

  let readableMainWorkbooksCount = $derived(countReadableWorkbooks(mainWorkbooks, userId));
  let readableReplenishedWorkbooksCount = $derived(
    countReadableWorkbooks(replenishedWorkbooks, userId),
  );
</script>

<!-- TODO: 5Q〜1Qにも対応 -->
<div class="mb-6">
  <div class="flex items-center space-x-4">
    <ButtonGroup>
      {#each AVAILABLE_GRADES as grade}
        <Button
          onclick={() => filterByGradeMode(grade)}
          class={selectedGrade === grade
            ? 'text-primary-700  dark:!text-primary-500'
            : 'text-gray-900'}
        >
          {getTaskGradeLabel(grade)}
        </Button>
      {/each}
    </ButtonGroup>

    <TooltipWrapper
      tooltipContent="問題集のグレードを指定します（最頻値。2つ以上ある場合は、最も易しいグレードに掲載）"
    />
  </div>
</div>

{#if readableMainWorkbooksCount}
  {@render mainSection()}

  {#if readableReplenishedWorkbooksCount}
    {@render replenishedSection()}
  {/if}
{:else}
  <EmptyWorkbookList />
{/if}

{#snippet mainSection()}
  <div>
    <div class="text-2xl pb-4 dark:text-white">手引き</div>

    <CurriculumTable
      workbooks={mainWorkbooks}
      {workbookGradeModes}
      {userId}
      {role}
      taskResults={taskResultsWithWorkBookId}
    />
  </div>
{/snippet}

{#snippet replenishedSection()}
  <div class="mt-12">
    <div class="flex flex-col md:flex-row items-start md:items-center md:space-x-6">
      <div class="flex items-center space-x-1 pb-0 md:pb-4">
        <div class="text-2xl dark:text-white">補充</div>

        <LabelWithTooltips
          labelName=""
          tooltipId="tooltip-for-replenished-workbooks"
          tooltipContents={[
            '（任意）',
            '特定の課題（数学的素養や実装力など）を持つ人向けの問題集です。',
            '苦手意識があれば、挑戦してみましょう。',
          ]}
        />
      </div>

      <div class="mt-4 md:mt-0 pb-4">
        <Toggle
          checked={showReplenishmentWorkbooks}
          onchange={handleReplenishmentWorkbooks}
          aria-label="Toggle visibility of replenishment workbooks for curriculum"
        >
          問題集を表示
        </Toggle>
      </div>
    </div>

    {#if showReplenishmentWorkbooks}
      <CurriculumTable
        workbooks={replenishedWorkbooks}
        {workbookGradeModes}
        {userId}
        {role}
        taskResults={taskResultsWithWorkBookId}
      />
    {/if}
  </div>
{/snippet}
