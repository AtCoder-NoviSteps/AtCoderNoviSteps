<script lang="ts">
  import { Button, Toggle } from 'flowbite-svelte';

  import type { Roles } from '$lib/types/user';
  import { TaskGrade, type TaskResults } from '$lib/types/task';
  import { type WorkbooksList } from '$features/workbooks/types/workbook';

  import { replenishmentWorkBooksStore } from '$features/workbooks/stores/replenishment_workbook.svelte';

  import { getTaskGradeLabel } from '$lib/utils/task';
  import {
    countReadableWorkbooks,
    partitionWorkbooksAsMainAndReplenished,
  } from '$features/workbooks/utils/workbooks';

  import TooltipWrapper from '$lib/components/TooltipWrapper.svelte';
  import LabelWithTooltips from '$lib/components/LabelWithTooltips.svelte';
  import CurriculumTable from '$features/workbooks/components/list/CurriculumTable.svelte';
  import EmptyWorkbookList from '$features/workbooks/components/list/EmptyWorkbookList.svelte';

  interface Props {
    workbooks: WorkbooksList;
    gradeModesEachWorkbook: Map<number, TaskGrade>;
    taskResultsWithWorkBookId: Map<number, TaskResults>;
    userId: string;
    role: Roles;
    currentGrade: TaskGrade;
    onGradeChange: (grade: TaskGrade) => void;
  }

  let {
    workbooks,
    gradeModesEachWorkbook,
    taskResultsWithWorkBookId,
    userId,
    role,
    currentGrade,
    onGradeChange,
  }: Props = $props();

  const AVAILABLE_GRADES = [
    TaskGrade.Q10,
    TaskGrade.Q9,
    TaskGrade.Q8,
    TaskGrade.Q7,
    TaskGrade.Q6,
  ] as const;

  let showReplenishmentWorkbooks = $state(replenishmentWorkBooksStore.canView());

  function handleReplenishmentWorkbooks() {
    showReplenishmentWorkbooks = !showReplenishmentWorkbooks;
    replenishmentWorkBooksStore.toggleView();
  }

  function filterByGradeMode(grade: TaskGrade) {
    onGradeChange(grade);
  }

  // Server-side already filters by grade; partition by isReplenished only.
  let { main: mainWorkbooks, replenished: replenishedWorkbooks } = $derived(
    partitionWorkbooksAsMainAndReplenished(workbooks),
  );

  let readableMainWorkbooksCount = $derived(countReadableWorkbooks(mainWorkbooks, userId));
  let readableReplenishedWorkbooksCount = $derived(
    countReadableWorkbooks(replenishedWorkbooks, userId),
  );
</script>

<!-- TODO: 5Q〜1Qにも対応 -->
<div class="mb-6">
  <div class="flex items-center space-x-4">
    <div class="flex flex-wrap gap-1">
      {#each AVAILABLE_GRADES as grade (grade)}
        <Button
          onclick={() => filterByGradeMode(grade)}
          color="alternative"
          size="sm"
          class={`rounded-lg dark:text-white ${currentGrade === grade ? 'text-primary-700 dark:text-primary-500!' : ''}`}
        >
          {getTaskGradeLabel(grade)}
        </Button>
      {/each}
    </div>

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
      {gradeModesEachWorkbook}
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
        {gradeModesEachWorkbook}
        {userId}
        {role}
        taskResults={taskResultsWithWorkBookId}
      />
    {/if}
  </div>
{/snippet}
