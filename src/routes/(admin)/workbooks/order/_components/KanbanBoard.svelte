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

  import { SolutionCategory, type WorkBookPlacement } from '$features/workbooks/types/workbook';

  // --- ラベルマップ ---
  const SOLUTION_LABELS: Record<string, string> = {
    PENDING: '未分類',
    SEARCH_SIMULATION: '探索・シミュレーション・実装',
    DYNAMIC_PROGRAMMING: '動的計画法',
    DATA_STRUCTURE: 'データ構造',
    GRAPH: 'グラフ',
    TREE: '木',
    NUMBER_THEORY: '数学（整数論）',
    ALGEBRA: '数学（代数）',
    COMBINATORICS: '数え上げ・確率・期待値',
    GAME: 'ゲーム',
    STRING: '文字列',
    GEOMETRY: '幾何',
    OPTIMIZATION: '最適化',
    OTHERS: 'その他',
    ANALYSIS: '考察テクニック',
  };

  const GRADE_LABELS: Record<string, string> = {
    Q11: '11Q',
    Q10: '10Q',
    Q9: '9Q',
    Q8: '8Q',
    Q7: '7Q',
    Q6: '6Q',
    Q5: '5Q',
    Q4: '4Q',
    Q3: '3Q',
    Q2: '2Q',
    Q1: '1Q',
    D1: '1D',
    D2: '2D',
    D3: '3D',
    D4: '4D',
    D5: '5D',
    D6: '6D',
  };

  const SOLUTION_CATEGORY_OPTIONS = Object.entries(SolutionCategory)
    .filter(([k]) => k !== 'PENDING')
    .map(([k]) => ({ value: k, label: SOLUTION_LABELS[k] ?? k }));

  const GRADE_OPTIONS = Object.keys(GRADE_LABELS).map((k) => ({
    value: k,
    label: GRADE_LABELS[k],
  }));

  // --- Props ---
  interface WorkbookWithPlacement {
    id: number;
    title: string;
    isPublished: boolean;
    workBookType: string;
    placement: WorkBookPlacement | null;
  }

  interface Props {
    workbooks: WorkbookWithPlacement[];
  }

  let { workbooks }: Props = $props();

  // --- URL パラメータで状態管理 ---
  function getParam(key: string) {
    return $page.url.searchParams.get(key);
  }

  let activeTab = $state(getParam('tab') === 'curriculum' ? 'curriculum' : 'solution');
  let selectedSolutionCols = $state(
    (getParam('categories')?.split(',').filter(Boolean) ?? ['PENDING', 'GRAPH']).filter(
      (c) => c in SolutionCategory,
    ),
  );
  let selectedGrades = $state(
    (getParam('grades')?.split(',').filter(Boolean) ?? ['Q10', 'Q9']).filter(
      (g) => g in GRADE_LABELS,
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

  // --- placement state ---
  type CardData = {
    id: number; // placement.id
    workBookId: number;
    title: string;
    isPublished: boolean;
    solutionCategory: string | null;
    taskGrade: string | null;
    priority: number;
  };

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

  // --- DnD handlers ---
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

    // ドラッグされたカードのカラム割り当てを更新
    const srcCard = items.find((c) => c.id === source.id);

    if (srcCard && typeof target.id === 'string') {
      if (activeTab === 'solution') {
        srcCard.solutionCategory = target.id;
      } else {
        srcCard.taskGrade = target.id;
      }
    }

    // 移動元・移動先カラムを特定して priority 再計算
    const affectedCategories = new Set<string | null>();
    const affectedGrades = new Set<string | null>();

    if (activeTab === 'solution') {
      if (srcCard) affectedCategories.add(srcCard.solutionCategory);
      // target が column id (string) の場合
      if (typeof target.id === 'string') affectedCategories.add(target.id);
    } else {
      if (srcCard) affectedGrades.add(srcCard.taskGrade);
      if (typeof target.id === 'string') affectedGrades.add(target.id);
    }

    // priority 連番振り直し
    const updates: Array<{
      id: number;
      priority: number;
      solutionCategory: string | null;
      taskGrade: string | null;
    }> = [];

    if (activeTab === 'solution') {
      for (const cat of affectedCategories) {
        const inCol = items.filter((c) => c.solutionCategory === cat);
        inCol.forEach((card, i) => {
          updates.push({ id: card.id, priority: i + 1, solutionCategory: cat, taskGrade: null });
        });
      }
    } else {
      for (const grade of affectedGrades) {
        const inCol = items.filter((c) => c.taskGrade === grade);
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
        throw new Error('保存に失敗しました');
      }
    } catch {
      // ロールバック
      if (snapshot) {
        items = snapshot;
      }
      errorMessage = '保存に失敗しました';
    } finally {
      snapshot = null;
    }
  }

  // --- カラム別カード取得 ---
  function getCardsForSolutionCol(cat: string): CardData[] {
    return items.filter((c) => c.solutionCategory === cat).sort(() => 0); // items の順序を保持
  }

  function getCardsForGradeCol(grade: string): CardData[] {
    return items.filter((c) => c.taskGrade === grade).sort(() => 0);
  }

  // PENDING は常時表示するため選択中カラムから除外しない
  let displayedSolutionCols = $derived([
    'PENDING',
    ...selectedSolutionCols.filter((c) => c !== 'PENDING'),
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
          selected={selectedSolutionCols.filter((c) => c !== 'PENDING')}
          onchange={(sel) => {
            selectedSolutionCols = sel;
            updateUrl();
          }}
          minSelect={1}
        />
      </div>

      <div class="flex gap-3 overflow-x-auto pb-4">
        {#each displayedSolutionCols as cat}
          <KanbanColumn
            columnId={cat}
            label={SOLUTION_LABELS[cat] ?? cat}
            cards={getCardsForSolutionCol(cat).map((c) => ({
              id: c.id,
              workBookId: c.workBookId,
              title: c.title,
              isPublished: c.isPublished,
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
            label={GRADE_LABELS[grade] ?? grade}
            cards={getCardsForGradeCol(grade).map((c) => ({
              id: c.id,
              workBookId: c.workBookId,
              title: c.title,
              isPublished: c.isPublished,
            }))}
            group="curriculum"
          />
        {/each}
      </div>
    </TabItem>
  </Tabs>
</DragDropProvider>
