<script lang="ts">
  import { enhance } from '$app/forms';
  import {
    ButtonGroup,
    Button,
    Table,
    TableBody,
    TableBodyCell,
    TableBodyRow,
    TableHead,
    TableHeadCell,
  } from 'flowbite-svelte';

  import { canRead, canEdit, canDelete } from '$lib/utils/authorship';
  import { WorkBookType, type WorkbookList, type WorkbooksList } from '$lib/types/workbook';
  import { getTaskGradeLabel } from '$lib/utils/task';
  import { TaskGrade, type TaskGradeRange } from '$lib/types/task';
  import type { Roles } from '$lib/types/user';
  import TooltipWrapper from '$lib/components/TooltipWrapper.svelte';
  import GradeLabel from '$lib/components/GradeLabel.svelte';
  import ThermometerProgressBar from '$lib/components/ThermometerProgressBar.svelte';

  export let workbookType: WorkBookType;
  export let workbooks: WorkbooksList;
  export let workbookGradeRanges: Map<number, TaskGradeRange>;
  export let loggedInUser;

  let userId = loggedInUser.id;
  let role: Roles = loggedInUser.role;

  let selectedGrade: TaskGrade = TaskGrade.Q10;
  let filteredWorkbooks: WorkbooksList;

  $: filteredWorkbooks =
    workbookType === WorkBookType.CREATED_BY_USER
      ? workbooks
      : workbooks.filter((workbook: WorkbookList) => {
          const lower = getGradeLower(workbook.id);
          return lower === selectedGrade;
        });
  $: readableWorkbooksCount = filteredWorkbooks.reduce((count, workbook: WorkbookList) => {
    const hasReadPermission = canRead(workbook.isPublished, userId, workbook.authorId);
    return count + (hasReadPermission ? 1 : 0);
  }, 0);

  function filterByGradeLower(grade: TaskGrade) {
    selectedGrade = grade;
  }

  const getPublicationStatusLabel = (isPublished: boolean) => {
    if (!isPublished) {
      return '非公開';
    }
  };
  const getPublicationStatusColor = (isPublished: boolean) => {
    if (!isPublished) {
      return 'bg-red-200';
    }
  };

  // FIXME: 実際のデータに置き換え
  const dummySubmissionRatios = (
    acRatio: number,
    acWithEditorialRatio: number,
    waRatio: number,
  ) => {
    const ratios = [
      {
        name: 'ac',
        ratioPercent: acRatio,
        color: 'bg-atcoder-ac-background',
      },
      {
        name: 'ac_with_editorial',
        ratioPercent: acWithEditorialRatio,
        color: 'bg-atcoder-ac-with_editorial-background',
      },
      {
        name: 'wa',
        ratioPercent: waRatio,
        color: 'bg-atcoder-wa-background',
      },
    ];

    return ratios;
  };

  function getGradeLower(workbookId: number): TaskGrade {
    const workbookGradeRange = workbookGradeRanges.get(workbookId);

    return workbookGradeRange?.lower ?? TaskGrade.PENDING;
  }

  function getGradeUpper(workbookId: number): TaskGrade {
    const workbookGradeRange = workbookGradeRanges.get(workbookId);

    return workbookGradeRange?.upper ?? TaskGrade.PENDING;
  }
</script>

<!-- TODO: 6Q〜1Q?にも対応 -->
<!-- TODO: スタイルを整える -->
<!-- TODO: 「ユーザ作成」の問題集には、検索機能を追加 -->
{#if workbookType !== WorkBookType.CREATED_BY_USER}
  <div class="mb-6">
    <div class="flex items-center space-x-4">
      <ButtonGroup>
        {#each [TaskGrade.Q10, TaskGrade.Q9, TaskGrade.Q8, TaskGrade.Q7] as grade}
          <Button on:click={() => filterByGradeLower(grade)}>
            {getTaskGradeLabel(grade)}
          </Button>
        {/each}
      </ButtonGroup>

      <TooltipWrapper tooltipContent="問題集のグレード（下限）を指定します" />
    </div>
  </div>
{/if}

{#if readableWorkbooksCount >= 1}
  <div class="overflow-auto rounded-md border">
    <Table shadow class="text-md">
      <TableHead class="text-sm bg-gray-100">
        {#if workbookType === WorkBookType.CREATED_BY_USER}
          <TableHeadCell>作者</TableHeadCell>
        {:else}
          <TableHeadCell>
            <div>グレード</div>
            <div>（下限）</div>
          </TableHeadCell>
          <TableHeadCell>
            <div>グレード</div>
            <div>（上限）</div>
          </TableHeadCell>
        {/if}
        <TableHeadCell>タイトル</TableHeadCell>
        <TableHeadCell>回答状況</TableHeadCell>
        <TableHeadCell></TableHeadCell>
      </TableHead>

      <TableBody tableBodyClass="divide-y">
        {#each filteredWorkbooks as workbook}
          {#if canRead(workbook.isPublished, userId, workbook.authorId)}
            <TableBodyRow>
              {#if workbookType === WorkBookType.CREATED_BY_USER}
                <TableBodyCell>
                  <div class="truncate min-w-[96px] max-w-[120px]">
                    {workbook.authorName}
                  </div>
                </TableBodyCell>
              {:else}
                <TableBodyCell>
                  <div class="flex items-center justify-center min-w-[54px] max-w-[54px]">
                    <GradeLabel taskGrade={getGradeLower(workbook.id)} />
                  </div>
                </TableBodyCell>
                <TableBodyCell>
                  <div class="flex items-center justify-center min-w-[54px] max-w-[54px]">
                    <GradeLabel taskGrade={getGradeUpper(workbook.id)} />
                  </div>
                </TableBodyCell>
              {/if}
              <TableBodyCell>
                <div class="flex items-center space-x-2 truncate min-w-[120px] max-w-[180px]">
                  {#if !workbook.isPublished}
                    <span class="p-1 rounded-lg {getPublicationStatusColor(workbook.isPublished)}">
                      {getPublicationStatusLabel(workbook.isPublished)}
                    </span>
                  {/if}
                  <a
                    href="/workbooks/{workbook.id}"
                    class="font-medium text-primary-600 hover:underline dark:text-primary-500 truncate"
                  >
                    {workbook.title}
                  </a>
                </div>
              </TableBodyCell>
              <TableBodyCell>
                <div class="min-w-[240px]">
                  <ThermometerProgressBar
                    submissionRatios={dummySubmissionRatios(80, 5, 5)}
                    width="w-full"
                  />
                </div>
              </TableBodyCell>
              <TableBodyCell>
                <div class="flex justify-center items-center space-x-3 min-w-[96px] max-w-[120px]">
                  {#if canEdit(userId, workbook.authorId, role, workbook.isPublished)}
                    <a href="/workbooks/edit/{workbook.id}">編集</a>
                  {/if}

                  {#if canDelete(userId, workbook.authorId)}
                    <form method="POST" action="?/delete&slug={workbook.id}" use:enhance>
                      <button>削除</button>
                    </form>
                  {/if}
                </div>
              </TableBodyCell>
            </TableBodyRow>
          {/if}
        {/each}
      </TableBody>
    </Table>
  </div>
{:else}
  <div>該当する問題集は見つかりませんでした。</div>
  <div>新しい問題集が追加されるまで、しばらくお待ちください。</div>
{/if}
