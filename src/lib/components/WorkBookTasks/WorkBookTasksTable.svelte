<script lang="ts">
  import xss from 'xss';
  import {
    Label,
    Table,
    TableBody,
    TableBodyCell,
    TableBodyRow,
    TableHead,
    TableHeadCell,
  } from 'flowbite-svelte';
  import Trash2 from '@lucide/svelte/icons/trash-2';

  import GradeLabel from '$lib/components/GradeLabel.svelte';
  import ExternalLinkWrapper from '$lib/components/ExternalLinkWrapper.svelte';

  import { addContestNameToTaskIndex } from '$lib/utils/contest';
  import { getTaskUrl, removeTaskIndexFromTitle } from '$lib/utils/task';

  import type {
    WorkBookTasksBase,
    WorkBookTaskBase,
    WorkBookTasksCreate,
    WorkBookTaskCreate,
    WorkBookTasksEdit,
    WorkBookTaskEdit,
  } from '$lib/types/workbook';
  import type { Task } from '$lib/types/task';

  interface Props {
    tasksMapByIds: Map<string, Task>;
    workBookTasks?: WorkBookTasksBase;
    workBookTasksForTable?: WorkBookTasksCreate | WorkBookTasksEdit;
  }

  let {
    tasksMapByIds,
    workBookTasks = $bindable([] as WorkBookTasksBase),
    workBookTasksForTable = $bindable([] as WorkBookTasksCreate | WorkBookTasksEdit),
  }: Props = $props();

  // HACK: $errorsからcommentに関する内容が安定的に取り出せない。
  //       (Zodのスキーマで入れ子になっている場合に、子要素のエラーの取り出し方が調べても分からないため)
  //
  // 1. 一言（コメント）に関するものは問題のインデックス?であるのに対して、なぜか問題数に関するものは_errorsとなっている。
  // 2. 存在するインデックスを参照しても、なぜか undefined になっている場合がある。
  function updateComment(index: number, event: Event) {
    const target = event.target as HTMLElement;

    if (target && target instanceof HTMLElement) {
      const newComment = xss(target.textContent as string);

      // HACK: 代替手段として、50文字以下の場合のみ更新
      if (newComment.length <= 50) {
        workBookTasks = updateWorkBookTasks(workBookTasks, index, newComment);
        workBookTasksForTable = updateWorkBookTasks(workBookTasksForTable, index, newComment);
      } else {
        target.textContent = workBookTasks[index].comment;
      }
    }
  }

  // WHY: コメントの変更を親コンポーネントに確実に反映させるため、新しい配列を返す。
  function updateWorkBookTasks<T extends WorkBookTaskBase>(
    workBookTasks: T[],
    index: number,
    newComment: string,
  ): T[] {
    const newWorkBookTasks = [
      ...workBookTasks.slice(0, index),
      { ...workBookTasks[index], comment: newComment },
      ...workBookTasks.slice(index + 1),
    ];

    return newWorkBookTasks;
  }

  function removeWorkBookTask(task: WorkBookTaskCreate | WorkBookTaskEdit) {
    workBookTasks = workBookTasks.filter(
      (workBookTask: WorkBookTaskBase) => workBookTask.taskId !== task.taskId,
    );
    workBookTasksForTable = workBookTasksForTable.filter(
      (workBookTask: WorkBookTaskCreate | WorkBookTaskEdit) => workBookTask.taskId !== task.taskId,
    );
  }

  let placeholderForComment = 'ヒント・注意点などを入力してください。';

  function handleFocus(event: Event) {
    if (!event.target) {
      return;
    }

    const target = event.target as HTMLElement;

    if (target && target instanceof HTMLElement && target.textContent === placeholderForComment) {
      (event.target as HTMLElement).textContent = '';
      (event.target as HTMLElement).classList.remove('placeholder');
    }
  }

  function handleBlur(event: Event) {
    if (!event.target) {
      return;
    }

    const target = event.target as HTMLElement;

    if (target && target instanceof HTMLElement && target.textContent?.trim() === '') {
      (event.target as HTMLElement).textContent = placeholderForComment;
      (event.target as HTMLElement).classList.add('placeholder');
    }
  }

  function getTaskTableIndex(tasksMapByIds: Map<string, Task>, taskId: string): string {
    const task = getTask(tasksMapByIds, taskId);

    return task?.task_table_index !== undefined ? task.task_table_index : '';
  }

  function getTaskGrade(tasksMapByIds: Map<string, Task>, taskId: string): string {
    const task = getTask(tasksMapByIds, taskId);

    return task?.grade !== undefined ? task.grade : '';
  }

  function getTask(tasksMapByIds: Map<string, Task>, taskId: string): Task | undefined {
    if (!taskId) {
      console.debug('Not found taskId:', taskId);
      return undefined;
    }

    const task = tasksMapByIds.get(taskId);

    if (!task) {
      console.debug('Not found task:', taskId);
    }

    return task;
  }

  let isDeleting = $state(false);
</script>

{#if workBookTasksForTable.length}
  <Label class="space-y-2">
    <span>問題一覧（{workBookTasksForTable.length} 問）</span>
  </Label>

  <div class="rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden">
    <Table shadow class="text-md table-fixed w-full" aria-label="Workbook tasks">
      <caption class="sr-only">List of workbook tasks with their grades and comments</caption>
      <TableHead class="text-sm bg-gray-100">
        <TableHeadCell class="w-10 pl-3 pr-3 text-center">#</TableHeadCell>
        <TableHeadCell class="w-16 xs:w-20 text-center px-0" aria-label="Task grade">
          グレード
        </TableHeadCell>
        <TableHeadCell class="w-1/2 pl-0 truncate">問題名</TableHeadCell>
        <TableHeadCell class="w-1/3 hidden sm:table-cell truncate">出典</TableHeadCell>
        <TableHeadCell class="w-24 md:w-64 hidden sm:table-cell px-0 truncate">
          一言（50文字以下）
        </TableHeadCell>
        <TableHeadCell class="w-12 xs:w-16 text-center">
          <span class="sr-only">編集</span>
        </TableHeadCell>
      </TableHead>

      <TableBody class="divide-y divide-gray-200 dark:divide-gray-700">
        {#each workBookTasksForTable as task, index}
          <TableBodyRow>
            <!-- ID -->
            <TableBodyCell class="xs:text-lg text-gray-700 dark:text-gray-300 truncate pl-6 pr-3">
              <div class="flex justify-center items-center h-full">
                <!-- HACK: 1-indexedにしているが、0-indexedで揃えた方がいい? -->
                {index + 1}
              </div>
            </TableBodyCell>

            <!-- グレード -->
            <TableBodyCell>
              <div class="flex items-center justify-center">
                <GradeLabel taskGrade={getTaskGrade(tasksMapByIds, task.taskId)} />
              </div>
            </TableBodyCell>

            <!-- 問題名 -->
            <TableBodyCell class="xs:text-lg pl-0 truncate">
              <ExternalLinkWrapper
                url={getTaskUrl(task.contestId, task.taskId)}
                description={removeTaskIndexFromTitle(
                  task.title,
                  getTaskTableIndex(tasksMapByIds, task.taskId),
                )}
              />
            </TableBodyCell>

            <!-- 出典 -->
            <TableBodyCell
              class="xs:text-lg hidden sm:table-cell text-gray-700 dark:text-gray-300 truncate"
              aria-hidden={true}
            >
              {addContestNameToTaskIndex(
                task.contestId,
                getTaskTableIndex(tasksMapByIds, task.taskId),
              )}
            </TableBodyCell>

            <!-- 一言（コメント・ヒント） -->
            <!-- See: -->
            <!-- https://svelte.dev/docs/svelte/v5-migration-guide#Other-breaking-changes-contenteditable-behavior-change -->
            <td
              contenteditable="true"
              class="xs:text-lg hidden sm:table-cell text-gray-700 dark:text-gray-300 truncate"
              oninput={(event) => updateComment(index, event)}
              onfocus={handleFocus}
              onblur={handleBlur}
              class:placeholder={!task.comment}
            >
              <span>
                {task.comment || placeholderForComment}
              </span>
            </td>

            <!-- 削除 -->
            <TableBodyCell class="w-12 xs:w-16">
              <button
                type="button"
                class="flex justify-center items-center"
                onclick={() => {
                  if (confirm('本当に削除しますか?')) {
                    try {
                      isDeleting = true;
                      removeWorkBookTask(task);
                    } finally {
                      isDeleting = false;
                    }
                  }
                }}
                disabled={isDeleting}
              >
                <Trash2 class="w-5 h-5 xs:w-6 xs:h-6" />
                <span class="sr-only">削除</span>
              </button>
            </TableBodyCell>
          </TableBodyRow>
        {/each}
      </TableBody>
    </Table>
  </div>
{/if}

<style>
  .placeholder {
    font-size: 0.875rem; /* Tailwind CSSのtext-smに相当 */
  }
</style>
