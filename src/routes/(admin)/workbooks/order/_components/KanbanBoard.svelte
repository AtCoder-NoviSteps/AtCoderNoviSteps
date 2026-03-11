<script lang="ts">
  import { page } from '$app/stores';
  import { replaceState } from '$app/navigation';
  import { untrack } from 'svelte';

  import { Toast } from 'flowbite-svelte';
  import CircleX from '@lucide/svelte/icons/circle-x';

  import { DragDropProvider } from '@dnd-kit/svelte';
  import { move } from '@dnd-kit/helpers';

  import { TaskGrade } from '$lib/types/task';
  import {
    SolutionCategory,
    SOLUTION_LABELS,
    type WorkbooksWithPlacement,
  } from '$features/workbooks/types/workbook_placement';
  import type {
    KanbanColumns,
    DragOverEventArg,
    DragEndEventArg,
    ActiveTab,
    TabConfig,
  } from '../_types/kanban';

  import KanbanTabBar from './KanbanTabBar.svelte';
  import KanbanColumn from './KanbanColumn.svelte';

  import { getTaskGradeLabel } from '$lib/utils/task';
  import { buildKanbanItems, calcPriorityUpdates, saveUpdates } from '../_utils/kanban';

  interface Props {
    workbooks: WorkbooksWithPlacement;
  }

  let { workbooks }: Props = $props();

  // URL parameter state management
  function getParam(key: string) {
    return $page.url.searchParams.get(key);
  }

  let activeTab = $state<ActiveTab>(getParam('tab') === 'curriculum' ? 'curriculum' : 'solution');
  let selectedSolutionCols = $state(
    (getParam('categories')?.split(',').filter(Boolean) ?? ['PENDING', 'GRAPH']).filter(
      (category) => category in SolutionCategory,
    ),
  );
  let selectedGrades = $state(
    (getParam('grades')?.split(',').filter(Boolean) ?? ['Q10', 'Q9']).filter(
      (grade) => grade in TaskGrade && grade !== 'PENDING',
    ),
  );

  function updateUrl() {
    const url = new URL($page.url);

    url.searchParams.set('tab', activeTab);

    if (activeTab === 'solution') {
      url.searchParams.set('categories', selectedSolutionCols.join(','));
      url.searchParams.delete('grades');
    } else {
      url.searchParams.set('grades', selectedGrades.join(','));
      url.searchParams.delete('categories');
    }

    replaceState(url, {});
  }

  // Per-tab static configuration; eliminates activeTab === 'solution' branches in DnD handlers
  const tabConfigs: Record<string, TabConfig> = {
    solution: {
      labelFn: (column) => SOLUTION_LABELS[column] ?? column,
      group: 'solution',
      columnKey: 'solutionCategory',
    },
    curriculum: {
      labelFn: getTaskGradeLabel,
      group: 'curriculum',
      columnKey: 'taskGrade',
    },
  };

  let allItems = $state<Record<string, KanbanColumns>>(
    untrack(() => ({
      solution: buildKanbanItems(
        workbooks,
        Object.keys(SolutionCategory),
        (workbook) => workbook.placement?.solutionCategory ?? null,
      ),
      curriculum: buildKanbanItems(
        workbooks,
        Object.keys(TaskGrade),
        (workbook) => workbook.placement?.taskGrade ?? null,
      ),
    })),
  );

  let snapshot: KanbanColumns | null = null;
  let errorMessage = $state<string | null>(null);

  // Drag-and-drop handlers
  function onDragStart() {
    snapshot = structuredClone($state.snapshot(allItems[activeTab]));
  }

  function onDragOver(event: DragOverEventArg) {
    allItems[activeTab] = move(allItems[activeTab], event);
  }

  async function onDragEnd(event: DragEndEventArg) {
    if (!event.operation?.source || !event.operation?.target) {
      return;
    }

    const updates = calcPriorityUpdates(
      snapshot ?? {},
      allItems[activeTab],
      tabConfigs[activeTab].columnKey,
    );

    if (updates.length === 0) {
      return;
    }

    try {
      await saveUpdates(updates);
    } catch {
      if (snapshot) allItems[activeTab] = snapshot;
      errorMessage = '保存に失敗しました';
    } finally {
      snapshot = null;
    }
  }

  // PENDING is always shown, so keep it separate from the selectable columns
  let displayedSolutionCols = $derived([
    'PENDING',
    ...selectedSolutionCols.filter((category) => category !== 'PENDING'),
  ]);
</script>

{#if errorMessage}
  <Toast color="red" class="mb-4" onclose={() => (errorMessage = null)}>
    {#snippet icon()}
      <CircleX class="w-5 h-5" />
    {/snippet}

    {errorMessage}
  </Toast>
{/if}

<DragDropProvider {onDragStart} {onDragOver} {onDragEnd}>
  <KanbanTabBar
    {activeTab}
    {selectedSolutionCols}
    {selectedGrades}
    onTabChange={(tab) => {
      activeTab = tab;
      updateUrl();
    }}
    onSolutionColsChange={(columns) => {
      selectedSolutionCols = columns;
      updateUrl();
    }}
    onGradesChange={(grades) => {
      selectedGrades = grades;
      updateUrl();
    }}
  >
    {#snippet solutionBoard()}
      <div class="flex gap-3 overflow-x-auto pb-4">
        {#each displayedSolutionCols as column}
          <KanbanColumn
            columnId={column}
            label={tabConfigs['solution'].labelFn(column)}
            cards={allItems['solution'][column] ?? []}
            group="solution"
          />
        {/each}
      </div>
    {/snippet}

    {#snippet curriculumBoard()}
      <div class="flex gap-3 overflow-x-auto pb-4">
        {#each selectedGrades as column}
          <KanbanColumn
            columnId={column}
            label={tabConfigs['curriculum'].labelFn(column)}
            cards={allItems['curriculum'][column] ?? []}
            group="curriculum"
          />
        {/each}
      </div>
    {/snippet}
  </KanbanTabBar>
</DragDropProvider>
