<script lang="ts">
  import type { Snippet } from 'svelte';

  import { TabItem, Tabs } from 'flowbite-svelte';

  import { TaskGrade } from '$lib/types/task';
  import { SolutionCategory, SOLUTION_LABELS } from '$features/workbooks/types/workbook_placement';
  import type { ActiveTab } from '../_types/kanban';

  import ColumnSelector from './ColumnSelector.svelte';

  import { getTaskGradeLabel } from '$lib/utils/task';

  const SOLUTION_CATEGORY_OPTIONS = Object.entries(SolutionCategory)
    .filter(([category]) => category !== 'PENDING')
    .map(([category]) => ({ value: category, label: SOLUTION_LABELS[category] ?? category }));

  const GRADE_OPTIONS = Object.keys(TaskGrade)
    .filter((key) => key !== 'PENDING')
    .map((key) => ({ value: key, label: getTaskGradeLabel(key) }));

  interface Props {
    activeTab: ActiveTab;
    selectedSolutionCols: string[];
    selectedGrades: string[];
    onTabChange: (tab: ActiveTab) => void;
    onSolutionColsChange: (cols: string[]) => void;
    onGradesChange: (grades: string[]) => void;
    solutionBoard: Snippet;
    curriculumBoard: Snippet;
  }

  let {
    activeTab,
    selectedSolutionCols,
    selectedGrades,
    onTabChange,
    onSolutionColsChange,
    onGradesChange,
    solutionBoard,
    curriculumBoard,
  }: Props = $props();
</script>

<Tabs style="underline" class="mb-4" contentClass="">
  {@render tabItem('解法別', 'solution', solutionContent)}
  {@render tabItem('カリキュラム', 'curriculum', curriculumContent)}
</Tabs>

{#snippet tabItem(title: string, key: string, content: Snippet)}
  <TabItem
    open={activeTab === key}
    {title}
    activeClass="text-lg font-semibold text-primary-700 border-b-2 border-primary-700 dark:text-primary-500 dark:border-primary-500"
    inactiveClass="text-lg font-semibold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
    onclick={() => onTabChange(key as ActiveTab)}
  >
    {@render content()}
  </TabItem>
{/snippet}

{#snippet solutionContent()}
  <div class="mb-4">
    <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">表示カテゴリ（2つ以上選択）:</p>
    <ColumnSelector
      options={SOLUTION_CATEGORY_OPTIONS}
      selected={selectedSolutionCols.filter((category) => category !== 'PENDING')}
      onchange={onSolutionColsChange}
      minRequired={1}
    />
  </div>

  {@render solutionBoard()}
{/snippet}

{#snippet curriculumContent()}
  <div class="mb-4">
    <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">表示グレード（2つ以上選択）:</p>
    <ColumnSelector options={GRADE_OPTIONS} selected={selectedGrades} onchange={onGradesChange} />
  </div>

  {@render curriculumBoard()}
{/snippet}
