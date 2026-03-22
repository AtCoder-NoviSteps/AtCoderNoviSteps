<script lang="ts">
  import { Roles } from '$lib/types/user';
  import { TaskGrade, type TaskResults } from '$lib/types/task';
  import { WorkBookType, type WorkbooksList } from '$features/workbooks/types/workbook';
  import {
    type SolutionCategory,
    type SolutionCategories,
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
        currentCategory: SolutionCategory;
        availableCategories: SolutionCategories;
        onCategoryChange: (category: SolutionCategory) => void;
      }
    | { workbookType: typeof WorkBookType.CREATED_BY_USER };

  type Props = CommonProps & SpecificProps;

  let props: Props = $props();
</script>

<!-- TODO: 「ユーザ作成」の問題集には、検索機能を追加 -->
{#if props.workbookType === WorkBookType.CURRICULUM}
  <CurriculumWorkBookList
    workbooks={props.workbooks}
    gradeModesEachWorkbook={props.gradeModesEachWorkbook}
    taskResultsWithWorkBookId={props.taskResultsWithWorkBookId}
    userId={props.loggedInUser?.id ?? ''}
    role={props.loggedInUser?.role ?? Roles.USER}
    currentGrade={props.currentGrade}
    onGradeChange={props.onGradeChange}
  />
{:else if props.workbookType === WorkBookType.SOLUTION}
  <SolutionWorkBookList
    workbooks={props.workbooks}
    taskResultsWithWorkBookId={props.taskResultsWithWorkBookId}
    userId={props.loggedInUser?.id ?? ''}
    role={props.loggedInUser?.role ?? Roles.USER}
    availableCategories={props.availableCategories}
    currentCategory={props.currentCategory}
    onCategoryChange={props.onCategoryChange}
  />
{:else}
  <CreatedByUserTable
    workbooks={props.workbooks}
    taskResults={props.taskResultsWithWorkBookId}
    userId={props.loggedInUser?.id ?? ''}
    role={props.loggedInUser?.role ?? Roles.USER}
  />
{/if}
