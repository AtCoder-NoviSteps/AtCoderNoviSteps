<script lang="ts">
  import { page } from '$app/stores';
  import { replaceState } from '$app/navigation';
  import { untrack } from 'svelte';

  import type { Snippet } from 'svelte';

  import { TabItem, Tabs, Toast } from 'flowbite-svelte';
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

  import KanbanColumn from './KanbanColumn.svelte';
  import ColumnSelector from './ColumnSelector.svelte';

  import { getTaskGradeLabel } from '$lib/utils/task';
  import { buildKanbanItems, calcPriorityUpdates, saveUpdates } from '../_utils/kanban';

  const SOLUTION_CATEGORY_OPTIONS = Object.entries(SolutionCategory)
    .filter(([category]) => category !== 'PENDING')
    .map(([category]) => ({ value: category, label: SOLUTION_LABELS[category] ?? category }));

  const GRADE_OPTIONS = Object.keys(TaskGrade)
    .filter((key) => key !== 'PENDING')
    .map((key) => ({ value: key, label: getTaskGradeLabel(key) }));

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
  <Tabs style="underline" class="mb-4" contentClass="">
    {@render tabItem('解法別', 'solution', solutionContent)}
    {@render tabItem('カリキュラム', 'curriculum', curriculumContent)}
  </Tabs>
</DragDropProvider>

{#snippet tabItem(title: string, key: string, content: Snippet)}
  <TabItem
    open={activeTab === key}
    {title}
    activeClass="text-lg font-semibold text-primary-700 border-b-2 border-primary-700 dark:text-primary-500 dark:border-primary-500"
    inactiveClass="text-lg font-semibold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
    onclick={() => {
      activeTab = key as ActiveTab;
      updateUrl();
    }}
  >
    {@render content()}
  </TabItem>
{/snippet}

{#snippet solutionContent()}
  {@render tabHeader(
    '表示カテゴリ（2つ以上選択）:',
    SOLUTION_CATEGORY_OPTIONS,
    selectedSolutionCols.filter((category) => category !== 'PENDING'),
    (selected) => {
      selectedSolutionCols = selected;
      updateUrl();
    },
    1,
  )}

  {@render kanbanColumns(
    displayedSolutionCols,
    allItems['solution'],
    tabConfigs['solution'].labelFn,
    'solution',
  )}
{/snippet}

{#snippet curriculumContent()}
  {@render tabHeader('表示グレード（2つ以上選択）:', GRADE_OPTIONS, selectedGrades, (selected) => {
    selectedGrades = selected;
    updateUrl();
  })}

  {@render kanbanColumns(
    selectedGrades,
    allItems['curriculum'],
    tabConfigs['curriculum'].labelFn,
    'curriculum',
  )}
{/snippet}

{#snippet tabHeader(
  label: string,
  options: { value: string; label: string }[],
  selected: string[],
  onchange: (selected: string[]) => void,
  minRequired?: number,
)}
  <div class="mb-4">
    <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">{label}</p>
    <ColumnSelector {options} {selected} {onchange} {minRequired} />
  </div>
{/snippet}

{#snippet kanbanColumns(
  columns: string[],
  items: KanbanColumns,
  labelFn: (column: string) => string,
  group: string,
)}
  <div class="flex gap-3 overflow-x-auto pb-4">
    {#each columns as column}
      <KanbanColumn columnId={column} label={labelFn(column)} cards={items[column] ?? []} {group} />
    {/each}
  </div>
{/snippet}
