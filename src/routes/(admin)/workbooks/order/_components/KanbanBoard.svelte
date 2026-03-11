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
    type WorkbooksWithPlacement,
  } from '$features/workbooks/types/workbook_placement';
  import type {
    KanbanColumns,
    DragOverEventArg,
    DragEndEventArg,
    ActiveTab,
  } from '../_types/kanban';

  import KanbanTabBar from './KanbanTabBar.svelte';
  import KanbanColumn from './KanbanColumn.svelte';

  import {
    buildKanbanItems,
    reCalcPriorities,
    saveUpdates,
    TAB_CONFIGS,
    buildUpdatedUrl,
  } from '../_utils/kanban';

  interface Props {
    workbooks: WorkbooksWithPlacement;
  }

  let { workbooks }: Props = $props();

  // URL parameter state management
  function getParam(key: string) {
    return $page.url.searchParams.get(key);
  }

  let activeTab = $state<ActiveTab>(getParam('tab') === 'curriculum' ? 'curriculum' : 'solution');
  let selectedSolutionCategories = $state(
    (
      getParam('categories')?.split(',').filter(Boolean) ?? [
        SolutionCategory.PENDING,
        SolutionCategory.GRAPH,
      ]
    ).filter((category) => category in SolutionCategory),
  );
  let selectedGrades = $state(
    (getParam('grades')?.split(',').filter(Boolean) ?? [TaskGrade.Q10, TaskGrade.Q9]).filter(
      (grade) => grade in TaskGrade && grade !== TaskGrade.PENDING,
    ),
  );

  function updateUrl() {
    replaceState(
      buildUpdatedUrl($page.url, activeTab, selectedSolutionCategories, selectedGrades),
      {},
    );
  }

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

    const updates = reCalcPriorities(
      snapshot ?? {},
      allItems[activeTab],
      TAB_CONFIGS[activeTab].columnKey,
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
  let displayedSolutionCategories = $derived([
    SolutionCategory.PENDING,
    ...selectedSolutionCategories.filter((category) => category !== SolutionCategory.PENDING),
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
    {selectedSolutionCategories}
    {selectedGrades}
    onTabChange={(tab) => {
      activeTab = tab;
      updateUrl();
    }}
    onSolutionCategoriesChange={(columns) => {
      selectedSolutionCategories = columns;
      updateUrl();
    }}
    onGradesChange={(grades) => {
      selectedGrades = grades;
      updateUrl();
    }}
  >
    {#snippet solutionBoard()}
      <div class="flex gap-3 overflow-x-auto pb-4">
        {#each displayedSolutionCategories as column}
          <KanbanColumn
            columnId={column}
            label={TAB_CONFIGS['solution'].labelFn(column)}
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
            label={TAB_CONFIGS['curriculum'].labelFn(column)}
            cards={allItems['curriculum'][column] ?? []}
            group="curriculum"
          />
        {/each}
      </div>
    {/snippet}
  </KanbanTabBar>
</DragDropProvider>
