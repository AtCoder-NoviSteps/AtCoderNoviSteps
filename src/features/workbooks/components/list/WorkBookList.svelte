<script lang="ts">
  import { Roles } from '$lib/types/user';
  import { TaskGrade, type TaskResults } from '$lib/types/task';
  import { WorkBookType, type WorkbooksList } from '$features/workbooks/types/workbook';
  import {
    type SolutionCategory,
    type SolutionCategories,
    type SelectedSolutionCategory,
  } from '$features/workbooks/types/workbook_placement';

  import CurriculumWorkBookList from '$features/workbooks/components/list/CurriculumWorkBookList.svelte';
  import SolutionWorkBookList from '$features/workbooks/components/list/SolutionWorkBookList.svelte';
  import CreatedByUserTable from '$features/workbooks/components/list/CreatedByUserTable.svelte';

  type CommonProps = {
    workbooks: WorkbooksList;
    taskResultsWithWorkBookId: Map<number, TaskResults>;
    loggedInUser: { id: string; role: Roles } | null;
  };

  type SpecificProps =
    | {
        workbookType: typeof WorkBookType.CURRICULUM;
        gradeModesEachWorkbook: Map<number, TaskGrade>;
        currentGrade: TaskGrade;
        onGradeChange: (grade: TaskGrade) => void;
      }
    | {
        workbookType: typeof WorkBookType.SOLUTION;
        currentCategory: SelectedSolutionCategory;
        availableCategories: SolutionCategories;
        solutionCategoryMap: Map<number, SolutionCategory>;
        onCategoryChange: (category: SelectedSolutionCategory) => void;
      }
    | { workbookType: typeof WorkBookType.CREATED_BY_USER };

  type Props = CommonProps & SpecificProps;

  let { workbooks, taskResultsWithWorkBookId, loggedInUser, ...restProps }: Props = $props();
</script>

<!-- TODO: 「ユーザ作成」の問題集には、検索機能を追加 -->
{#if restProps.workbookType === WorkBookType.CURRICULUM}
  <CurriculumWorkBookList
    {workbooks}
    gradeModesEachWorkbook={restProps.gradeModesEachWorkbook}
    {taskResultsWithWorkBookId}
    userId={loggedInUser?.id ?? ''}
    role={loggedInUser?.role ?? Roles.USER}
    currentGrade={restProps.currentGrade}
    onGradeChange={restProps.onGradeChange}
  />
{:else if restProps.workbookType === WorkBookType.SOLUTION}
  <SolutionWorkBookList
    {workbooks}
    {taskResultsWithWorkBookId}
    userId={loggedInUser?.id ?? ''}
    role={loggedInUser?.role ?? Roles.USER}
    availableCategories={restProps.availableCategories}
    currentCategory={restProps.currentCategory}
    solutionCategoryMap={restProps.solutionCategoryMap}
    onCategoryChange={restProps.onCategoryChange}
  />
{:else}
  <CreatedByUserTable
    {workbooks}
    taskResults={taskResultsWithWorkBookId}
    userId={loggedInUser?.id ?? ''}
    role={loggedInUser?.role ?? Roles.USER}
  />
{/if}
