<script lang="ts">
  import type { Snippet } from 'svelte';

  import { Tabs } from 'flowbite-svelte';

  import { TaskGrade } from '$lib/types/task';
  import { SolutionCategory, SOLUTION_LABELS } from '$features/workbooks/types/workbook_placement';
  import type { ActiveTab } from '../_types/kanban';

  import TabItemWrapper from '$lib/components/Tabs/TabItemWrapper.svelte';
  import ColumnSelector from './ColumnSelector.svelte';

  import { getTaskGradeLabel } from '$lib/utils/task';

  const SOLUTION_CATEGORY_OPTIONS = Object.entries(SolutionCategory)
    .filter(([category]) => category !== SolutionCategory.PENDING)
    .map(([category]) => ({ value: category, label: SOLUTION_LABELS[category] ?? category }));

  const GRADE_OPTIONS = Object.keys(TaskGrade)
    .filter((key) => key !== TaskGrade.PENDING)
    .map((key) => ({ value: key, label: getTaskGradeLabel(key) }));

  interface Props {
    activeTab: ActiveTab;
    selectedSolutionCategories: string[];
    selectedGrades: string[];
    onTabChange: (tab: ActiveTab) => void;
    onSolutionCategoriesChange: (columns: string[]) => void;
    onGradesChange: (grades: string[]) => void;
    solutionBoard: Snippet;
    curriculumBoard: Snippet;
  }

  let {
    activeTab,
    selectedSolutionCategories,
    selectedGrades,
    onTabChange,
    onSolutionCategoriesChange,
    onGradesChange,
    solutionBoard,
    curriculumBoard,
  }: Props = $props();
</script>

<Tabs tabStyle="underline" class="mb-0" contentClass="bg-white dark:bg-gray-800">
  <TabItemWrapper
    isOpen={activeTab === 'solution'}
    title="解法別"
    onclick={() => onTabChange('solution')}
  >
    {@render solutionContent()}
  </TabItemWrapper>

  <TabItemWrapper
    isOpen={activeTab === 'curriculum'}
    title="カリキュラム"
    onclick={() => onTabChange('curriculum')}
  >
    {@render curriculumContent()}
  </TabItemWrapper>
</Tabs>

{#snippet solutionContent()}
  <div class="mb-4">
    <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
      表示カテゴリ（1つ以上選択。「未分類」は常に表示）:
    </p>
    <ColumnSelector
      options={SOLUTION_CATEGORY_OPTIONS}
      selected={selectedSolutionCategories.filter(
        (category) => category !== SolutionCategory.PENDING,
      )}
      onchange={onSolutionCategoriesChange}
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
