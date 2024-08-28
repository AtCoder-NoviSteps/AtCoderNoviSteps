<script lang="ts">
  import {
    Label,
    Table,
    TableBody,
    TableBodyCell,
    TableBodyRow,
    TableHead,
    TableHeadCell,
  } from 'flowbite-svelte';

  import ExternalLinkWrapper from '$lib/components/ExternalLinkWrapper.svelte';
  import { getContestNameLabel } from '$lib/utils/contest';
  import { taskUrl } from '$lib/utils/task';
  import type { WorkBookTaskBase, WorkBookTaskCreate, WorkBookTaskEdit } from '$lib/types/workbook';

  export let workBookTasks = [] as WorkBookTaskBase[];
  export let workBookTasksForTable = [] as WorkBookTaskCreate[] | WorkBookTaskEdit[];

  // HACK: $errorsからcommentに関する内容が安定的に取り出せない。
  //       (Zodのスキーマで入れ子になっている場合に、子要素のエラーの取り出し方が調べても分からないため)
  //
  // 1. 一言（コメント）に関するものは問題のインデックス?であるのに対して、なぜか問題数に関するものは_errorsとなっている。
  // 2. 存在するインデックスを参照しても、なぜかundefineになっている場合がある。
  function updateComment(index: number, event: Event) {
    const target = event.target as HTMLElement;

    if (target && target instanceof HTMLElement) {
      const newComment = target.innerText as string;

      // HACK: 代替手段として、50文字以下の場合のみ更新
      if (newComment.length <= 50) {
        workBookTasks[index].comment = newComment;
        workBookTasksForTable[index].comment = newComment;
      } else {
        target.innerText = workBookTasks[index].comment;
      }
    }
  }

  function removeWorkBookTask(task: WorkBookTaskCreate | WorkBookTaskEdit) {
    workBookTasks = workBookTasks.filter((workBookTask) => workBookTask.taskId !== task.taskId);
    workBookTasksForTable = workBookTasksForTable.filter(
      (workBookTask) => workBookTask.taskId !== task.taskId,
    );
  }
</script>

{#if workBookTasksForTable.length}
  <Label class="space-y-2">
    <span>問題一覧</span>
  </Label>

  <Table shadow class="text-md">
    <TableHead class="text-sm bg-gray-100">
      <TableHeadCell class="min-w-[18px] pl-2 md:pl-4 pr-0 text-center">#</TableHeadCell>
      <TableHeadCell class="min-w-[240px] truncate">問題名</TableHeadCell>
      <TableHeadCell class="min-w-[120px] max-w-[150px] truncate">出典</TableHeadCell>
      <TableHeadCell class="min-w-[120px] max-w-[150px] px-0 truncate">
        一言（50文字以下）
      </TableHeadCell>
      <TableHeadCell class="min-w-[24px] px-0 text-center">
        <span class="sr-only">編集</span>
      </TableHeadCell>
    </TableHead>

    <TableBody tableBodyClass="divide-y">
      <!-- TODO: 編集にリンクを付ける -->
      <!-- TODO: 削除にゴミ箱マークを付ける -->
      {#each workBookTasksForTable as task, index}
        <TableBodyRow>
          <TableBodyCell
            class="xs:text-lg text-gray-700 dark:text-gray-300 truncate pl-2 md:pl-4 pr-0"
          >
            <div class="flex justify-center items-center">
              <!-- HACK: 1-indexedにしているが、0-indexedで揃えた方がいい? -->
              {index + 1}
            </div>
          </TableBodyCell>

          <!-- 問題名 -->
          <TableBodyCell class="xs:text-lg truncate">
            <ExternalLinkWrapper
              url={taskUrl(task.contestId, task.taskId)}
              description={task.title}
            />
          </TableBodyCell>

          <!-- 出典 -->
          <TableBodyCell class="xs:text-lg text-gray-700 dark:text-gray-300 truncate">
            {getContestNameLabel(task.contestId)}
          </TableBodyCell>

          <!-- 一言（コメント・ヒント） -->
          <!-- Note: <TableBodyCell>コンポーネントだとon:inputが動作しない -->
          <td
            contenteditable={true}
            class="xs:text-lg text-gray-700 dark:text-gray-300 truncate"
            on:input={(event) => updateComment(index, event)}
          >
            {task.comment}
          </td>

          <!-- 削除 -->
          <TableBodyCell class="px-0" on:click={() => removeWorkBookTask(task)}>
            <div class="flex justify-center items-center px-0">削除</div>
          </TableBodyCell>
        </TableBodyRow>
      {/each}
    </TableBody>
  </Table>
{/if}
