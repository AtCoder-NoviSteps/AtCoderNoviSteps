<script lang="ts">
  import { page } from '$app/stores';
  import { replaceState } from '$app/navigation';
  import { untrack } from 'svelte';

  import { Toast } from 'flowbite-svelte';
  import CircleX from '@lucide/svelte/icons/circle-x';

  import { DragDropProvider } from '@dnd-kit/svelte';
  import { move } from '@dnd-kit/helpers';

  import {
    SolutionCategory,
    type WorkbooksWithPlacement,
  } from '$features/workbooks/types/workbook_placement';
  import { TaskGrade } from '$lib/types/task';
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
    buildUpdatedUrl,
    parseInitialCategories,
    parseInitialGrades,
    parseTab,
    reCalcPriorities,
    saveUpdates,
    TAB_CONFIGS,
  } from '../_utils/kanban';

  interface Props {
    workbooks: WorkbooksWithPlacement;
  }

  let { workbooks }: Props = $props();

  const { searchParams } = $page.url;
  let activeTab = $state<ActiveTab>(parseTab(searchParams.get('tab')));
  let selectedSolutionCategories = $state(parseInitialCategories(searchParams));
  let selectedGrades = $state(parseInitialGrades(searchParams));

  // PENDING is always shown, so keep it separate from the selectable columns
  let displayedSolutionCategories = $derived([
    SolutionCategory.PENDING,
    ...selectedSolutionCategories.filter((category) => category !== SolutionCategory.PENDING),
  ]);

  function updateUrl() {
    const updatedUrl = buildUpdatedUrl(
      $page.url,
      activeTab,
      selectedSolutionCategories,
      selectedGrades,
    );
    replaceState(updatedUrl, {});
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

    const capturedTab = activeTab;
    const capturedSnapshot = snapshot;

    const updates = reCalcPriorities(
      capturedSnapshot ?? {},
      allItems[capturedTab],
      TAB_CONFIGS[capturedTab].columnKey,
    );

    if (updates.length === 0) {
      snapshot = null;
      return;
    }

    try {
      await saveUpdates(updates);
    } catch {
      if (capturedSnapshot) {
        allItems[capturedTab] = capturedSnapshot;
      }

      errorMessage = '保存に失敗しました';
    } finally {
      snapshot = null;
    }
  }
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
    <!-- Note: Snippets are intentional: extracting these as components would require passing too many props. -->
    {#snippet solutionBoard()}
      <div class="flex gap-3 overflow-x-auto pb-4">
        {#each displayedSolutionCategories as column (column)}
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
        {#each selectedGrades as column (column)}
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
