<script lang="ts">
  import { DragDropProvider } from '@dnd-kit/svelte';
  import { move } from '@dnd-kit/helpers';
  import type { DragDropManager, Draggable, Droppable } from '@dnd-kit/dom';
  import type { DragDropEvents } from '@dnd-kit/abstract';

  type DndEvents = DragDropEvents<Draggable, Droppable, DragDropManager>;
  type DragOverEventArg = Parameters<DndEvents['dragover']>[0];
  type DragEndEventArg = Parameters<DndEvents['dragend']>[0];

  import { page } from '$app/stores';
  import { replaceState } from '$app/navigation';

  import { TabItem, Tabs, Toast } from 'flowbite-svelte';
  import CircleX from '@lucide/svelte/icons/circle-x';

  import KanbanColumn from './KanbanColumn.svelte';
  import ColumnSelector from './ColumnSelector.svelte';

  import {
    SolutionCategory,
    SOLUTION_LABELS,
    type WorkbookWithPlacement,
  } from '$features/workbooks/types/workbook_placement';
  import { TaskGrade } from '$lib/types/task';
  import type { CardData } from '../_types/kanban';

  import { getTaskGradeLabel } from '$lib/utils/task';

  const SOLUTION_CATEGORY_OPTIONS = Object.entries(SolutionCategory)
    .filter(([category]) => category !== 'PENDING')
    .map(([category]) => ({ value: category, label: SOLUTION_LABELS[category] ?? category }));

  const GRADE_OPTIONS = Object.keys(TaskGrade)
    .filter((key) => key !== 'PENDING')
    .map((key) => ({ value: key, label: getTaskGradeLabel(key) }));

  interface Props {
    workbooks: WorkbookWithPlacement[];
  }

  let { workbooks }: Props = $props();

  // URL parameter state management
  function getParam(key: string) {
    return $page.url.searchParams.get(key);
  }

  let activeTab = $state(getParam('tab') === 'curriculum' ? 'curriculum' : 'solution');
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

  // Placement state
  function buildInitialCards(): CardData[] {
    return workbooks
      .filter((wb) => wb.placement !== null)
      .map((wb) => ({
        id: wb.placement!.id,
        workBookId: wb.id,
        title: wb.title,
        isPublished: wb.isPublished,
        solutionCategory: wb.placement!.solutionCategory,
        taskGrade: wb.placement!.taskGrade,
        priority: wb.placement!.priority,
      }))
      .sort((a, b) => a.priority - b.priority);
  }

  let items = $state<CardData[]>(buildInitialCards());
  let snapshot: CardData[] | null = null;
  let errorMessage = $state<string | null>(null);

  // Drag-and-drop handlers
  function onDragStart() {
    snapshot = structuredClone($state.snapshot(items));
  }

  function onDragOver(event: DragOverEventArg) {
    items = move(items, event);
  }

  async function onDragEnd(event: DragEndEventArg) {
    const source = event.operation?.source;
    const target = event.operation?.target;
    if (!source || !target) return;

    // Update the dragged card's column assignment
    const srcCard = items.find((card) => card.id === source.id);

    if (srcCard && typeof target.id === 'string') {
      if (activeTab === 'solution') {
        srcCard.solutionCategory = target.id;
      } else {
        srcCard.taskGrade = target.id;
      }
    }

    // Determine source and destination columns for priority recalculation
    const affectedCategories = new Set<string | null>();
    const affectedGrades = new Set<string | null>();

    if (activeTab === 'solution') {
      if (srcCard) affectedCategories.add(srcCard.solutionCategory);
      if (typeof target.id === 'string') affectedCategories.add(target.id);
    } else {
      if (srcCard) affectedGrades.add(srcCard.taskGrade);
      if (typeof target.id === 'string') affectedGrades.add(target.id);
    }

    // Reassign sequential priorities
    const updates: Array<{
      id: number;
      priority: number;
      solutionCategory: string | null;
      taskGrade: string | null;
    }> = [];

    if (activeTab === 'solution') {
      for (const cat of affectedCategories) {
        const inCol = items.filter((card) => card.solutionCategory === cat);
        inCol.forEach((card, i) => {
          updates.push({ id: card.id, priority: i + 1, solutionCategory: cat, taskGrade: null });
        });
      }
    } else {
      for (const grade of affectedGrades) {
        const inCol = items.filter((card) => card.taskGrade === grade);
        inCol.forEach((card, i) => {
          updates.push({ id: card.id, priority: i + 1, solutionCategory: null, taskGrade: grade });
        });
      }
    }

    if (updates.length === 0) return;

    try {
      const res = await fetch('/workbooks/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      });

      if (!res.ok) {
        throw new Error('Failed to save');
      }
    } catch {
      // Roll back on error
      if (snapshot) {
        items = snapshot;
      }
      errorMessage = '保存に失敗しました';
    } finally {
      snapshot = null;
    }
  }

  // Cards by column
  function getCardsForSolutionCol(cat: string): CardData[] {
    return items.filter((card) => card.solutionCategory === cat).sort(() => 0); // Preserve items order
  }

  function getCardsForGradeCol(grade: string): CardData[] {
    return items.filter((card) => card.taskGrade === grade).sort(() => 0);
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
  <Tabs style="underline" class="mb-4">
    <TabItem
      open={activeTab === 'solution'}
      title="解法別"
      onclick={() => {
        activeTab = 'solution';
        updateUrl();
      }}
    >
      <div class="mb-3">
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">表示カテゴリ（2つ以上選択）:</p>
        <ColumnSelector
          options={SOLUTION_CATEGORY_OPTIONS}
          selected={selectedSolutionCols.filter((category) => category !== 'PENDING')}
          onchange={(sel) => {
            selectedSolutionCols = sel;
            updateUrl();
          }}
          minRequired={1}
        />
      </div>

      <div class="flex gap-3 overflow-x-auto pb-4">
        {#each displayedSolutionCols as cat}
          <KanbanColumn
            columnId={cat}
            label={SOLUTION_LABELS[cat] ?? cat}
            cards={getCardsForSolutionCol(cat).map((card) => ({
              id: card.id,
              workBookId: card.workBookId,
              title: card.title,
              isPublished: card.isPublished,
            }))}
            group="solution"
          />
        {/each}
      </div>
    </TabItem>

    <TabItem
      open={activeTab === 'curriculum'}
      title="カリキュラム"
      onclick={() => {
        activeTab = 'curriculum';
        updateUrl();
      }}
    >
      <div class="mb-3">
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">表示グレード（2つ以上選択）:</p>
        <ColumnSelector
          options={GRADE_OPTIONS}
          selected={selectedGrades}
          onchange={(sel) => {
            selectedGrades = sel;
            updateUrl();
          }}
        />
      </div>

      <div class="flex gap-3 overflow-x-auto pb-4">
        {#each selectedGrades as grade}
          <KanbanColumn
            columnId={grade}
            label={getTaskGradeLabel(grade)}
            cards={getCardsForGradeCol(grade).map((card) => ({
              id: card.id,
              workBookId: card.workBookId,
              title: card.title,
              isPublished: card.isPublished,
            }))}
            group="curriculum"
          />
        {/each}
      </div>
    </TabItem>
  </Tabs>
</DragDropProvider>
