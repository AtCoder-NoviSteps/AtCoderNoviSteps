<script lang="ts">
  import type { Component } from 'svelte';

  import type { Roles } from '$lib/types/user';
  import { TaskGrade, type TaskResults } from '$lib/types/task';
  import {
    WorkBookType,
    type WorkbooksList,
    type WorkbookTableProps,
  } from '$features/workbooks/types/workbook';

  import { countReadableWorkbooks } from '$features/workbooks/utils/workbooks';

  import CurriculumWorkBookList from '$features/workbooks/components/list/CurriculumWorkBookList.svelte';
  import SolutionTable from '$features/workbooks/components/list/SolutionTable.svelte';
  import CreatedByUserTable from '$features/workbooks/components/list/CreatedByUserTable.svelte';
  import EmptyWorkbookList from '$features/workbooks/components/list/EmptyWorkbookList.svelte';

  interface LoggedInUser {
    id: string;
    role: Roles;
  }

  interface Props {
    workbookType: WorkBookType;
    workbooks: WorkbooksList;
    workbookGradeModes: Map<number, TaskGrade>;
    taskResultsWithWorkBookId: Map<number, TaskResults>;
    loggedInUser: LoggedInUser;
  }

  let {
    workbookType,
    workbooks,
    workbookGradeModes,
    taskResultsWithWorkBookId,
    loggedInUser,
  }: Props = $props();

  let userId = loggedInUser.id;
  let role: Roles = loggedInUser.role;

  const tableComponents: Partial<Record<WorkBookType, Component<WorkbookTableProps>>> = {
    [WorkBookType.SOLUTION]: SolutionTable,
    [WorkBookType.CREATED_BY_USER]: CreatedByUserTable,
  };

  let readableCount = $derived(countReadableWorkbooks(workbooks, userId));
</script>

<!-- TODO: 「ユーザ作成」の問題集には、検索機能を追加 -->
{#if workbookType === WorkBookType.CURRICULUM}
  <CurriculumWorkBookList
    {workbooks}
    {workbookGradeModes}
    {taskResultsWithWorkBookId}
    {userId}
    {role}
  />
{:else}
  {@const TableComponent = tableComponents[workbookType]}

  {#if readableCount && TableComponent}
    <TableComponent
      {workbooks}
      {workbookGradeModes}
      {userId}
      {role}
      taskResults={taskResultsWithWorkBookId}
    />
  {:else}
    <EmptyWorkbookList />
  {/if}
{/if}
