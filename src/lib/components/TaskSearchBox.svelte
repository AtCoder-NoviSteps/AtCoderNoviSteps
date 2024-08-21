<!-- See: -->
<!-- https://github.com/kenkoooo/AtCoderProblems/blob/master/atcoder-problems-frontend/src/components/ProblemSearchBox.tsx -->
<script lang="ts">
  import { Input, Listgroup, ListgroupItem } from 'flowbite-svelte';

  import type {
    WorkBookTaskBase,
    WorkBookTasksBase,
    WorkBookTaskCreate,
    WorkBookTasksCreate,
    WorkBookTaskEdit,
    WorkBookTasksEdit,
  } from '$lib/types/workbook';
  import type { Task, Tasks } from '$lib/types/task';
  import { getContestNameLabel } from '$lib/utils/contest';
  import { taskUrl } from '$lib/utils/task';

  export let tasks: Tasks = [];
  // HACK: やむなくデータベースへの保存用と問題集作成・編集用で分けている。
  export let workBookTasks: WorkBookTasksBase = [];
  export let workBookTasksForTable: WorkBookTasksCreate | WorkBookTasksEdit = [];

  const isMatched = (task: Task, searchWords: string): boolean => {
    if (searchWords === undefined || searchWords.length === 0) {
      return false;
    }

    return searchWords
      .split(/\s/)
      .every(
        (word) =>
          (word.trim().length > 0 && task.title.toLowerCase().includes(word.toLowerCase())) ||
          taskUrl(task.contest_id, task.task_id).toLowerCase().includes(word.toLowerCase()),
      );
  };

  $: searchWordsOrURL = '';
  $: filteredTasks = tasks
    .filter((task: Task) => isMatched(task, searchWordsOrURL))
    .slice(0, 30)
    .sort((firstTask: Task, secondTask: Task) =>
      firstTask.task_table_index.localeCompare(secondTask.task_table_index),
    );

  const PENDING = -1;
  let focusingId = PENDING;

  // Note: 初期値として、便宜的に割り当てている。随時、変更可能。
  const NO_COMMENT = '';

  // TODO: utilsとして切り出し、テストを追加
  function addWorkBookTask(
    selectedTask: Task,
    workBookTasks: WorkBookTasksBase,
    workBookTasksForTable: WorkBookTasksCreate | WorkBookTasksEdit,
    selectedIndex: number = 2,
  ) {
    // TODO: ユーザが追加する位置を指定できるように修正
    // TODO: 範囲外を指定された場合のエラーハンドリングを追加
    // 負の値: 先頭に追加
    // 元の配列よりも大きな値: 末尾に追加
    // let selectedIndex = 2;

    // データベース用
    const updatedWorkBookTasks = updateWorkBookTasks(workBookTasks, selectedIndex, selectedTask);

    // アプリの表示用
    const updatedWorkBookTasksForTable: WorkBookTasksCreate | WorkBookTasksEdit =
      updateWorkBookTaskForTable(workBookTasksForTable, selectedIndex, selectedTask);

    return { updatedWorkBookTasks, updatedWorkBookTasksForTable };
  }

  function updateWorkBookTasks(
    workBookTasks: WorkBookTasksBase,
    selectedIndex: number,
    selectedTask: Task,
  ): WorkBookTasksBase {
    const newWorkBookTask: WorkBookTaskBase = {
      taskId: selectedTask.task_id,
      priority: PENDING, // 1に近いほど優先度が高い
      comment: NO_COMMENT,
    };
    let updatedWorkBookTasks: WorkBookTasksBase = insertWorkBookTask(
      workBookTasks,
      selectedIndex,
      newWorkBookTask,
    );
    updatedWorkBookTasks = reCalcTaskPriority(updatedWorkBookTasks);

    return updatedWorkBookTasks;
  }

  function updateWorkBookTaskForTable(
    workBookTasksForTable: WorkBookTasksCreate | WorkBookTasksEdit,
    selectedIndex: number,
    selectedTask: Task,
  ): WorkBookTasksCreate | WorkBookTasksEdit {
    const newWorkBookTaskForTable: WorkBookTaskCreate | WorkBookTaskEdit = {
      contestId: getContestNameLabel(selectedTask.contest_id),
      taskId: selectedTask.task_id,
      title: selectedTask.title,
      priority: PENDING,
      comment: NO_COMMENT,
    };
    // HACK: オーバーロードを定義しているにもかかわらず戻り値の型がWorkBookTasksBaseになってしまうため、やむを得ずキャスト
    let updatedWorkBookTasksForTable: WorkBookTasksCreate | WorkBookTasksEdit = insertWorkBookTask(
      workBookTasksForTable,
      selectedIndex,
      newWorkBookTaskForTable,
    ) as WorkBookTasksCreate | WorkBookTasksEdit;
    updatedWorkBookTasksForTable = reCalcTaskPriority(updatedWorkBookTasksForTable) as
      | WorkBookTasksCreate
      | WorkBookTasksEdit;

    return updatedWorkBookTasksForTable;
  }

  $: console.log('workBookTasks: ', workBookTasks);
  $: console.log('workBookTasksForTable: ', workBookTasksForTable);

  // 関数のオーバーロードを定義
  function insertWorkBookTask(
    workBookTasks: WorkBookTasksBase,
    selectedIndex: number,
    newWorkBookTask: WorkBookTaskBase,
  ): WorkBookTasksBase;
  function insertWorkBookTask(
    workBookTasks: WorkBookTasksCreate,
    selectedIndex: number,
    newWorkBookTask: WorkBookTaskCreate,
  ): WorkBookTasksCreate;
  function insertWorkBookTask(
    workBookTasks: WorkBookTasksEdit,
    selectedIndex: number,
    newWorkBookTask: WorkBookTaskEdit,
  ): WorkBookTasksEdit;
  function insertWorkBookTask(
    workBookTasks: WorkBookTasksBase | WorkBookTasksCreate | WorkBookTasksEdit,
    selectedIndex: number,
    newWorkBookTask: WorkBookTaskBase | WorkBookTaskCreate | WorkBookTaskEdit,
  ): WorkBookTasksBase | WorkBookTasksCreate | WorkBookTasksEdit {
    const newWorkBookTasks = [
      // TODO: 範囲外のインデックスを指定された場合への対処
      ...workBookTasks.slice(0, selectedIndex),
      newWorkBookTask,
      ...workBookTasks.slice(selectedIndex),
    ];

    return newWorkBookTasks;
  }

  function reCalcTaskPriority(workBookTasks: WorkBookTasksBase): WorkBookTasksBase;
  function reCalcTaskPriority(workBookTasks: WorkBookTasksCreate): WorkBookTasksCreate;
  function reCalcTaskPriority(workBookTasks: WorkBookTasksEdit): WorkBookTasksEdit;
  function reCalcTaskPriority(
    workBookTasks: WorkBookTasksBase | WorkBookTasksCreate | WorkBookTasksEdit,
  ): WorkBookTasksBase | WorkBookTasksCreate | WorkBookTasksEdit {
    const newWorkBookTasks = workBookTasks.map((task, index) => ({
      ...task,
      priority: index + 1,
    }));

    return newWorkBookTasks;
  }
</script>

<Input
  type="search"
  placeholder="問題名かURLを入力してください。"
  bind:value={searchWordsOrURL}
  on:change={(e) => {
    if (e.target instanceof HTMLInputElement) {
      searchWordsOrURL = e.target.value;
      focusingId = PENDING;
    }
  }}
  on:keydown={(e) => {
    if (e.key === 'Enter') {
      const selectedTask =
        filteredTasks.length > focusingId ? filteredTasks[focusingId] : undefined;

      if (selectedTask) {
        const results = addWorkBookTask(selectedTask, workBookTasks, workBookTasksForTable);
        workBookTasks = results.updatedWorkBookTasks;
        workBookTasksForTable = results.updatedWorkBookTasksForTable;

        searchWordsOrURL = '';
        focusingId = PENDING;
      }
    } else if (e.key === 'ArrowDown') {
      focusingId = Math.min(focusingId + 1, filteredTasks.length - 1); // 0-indexed
    } else if (e.key === 'ArrowUp') {
      focusingId = Math.max(focusingId - 1, PENDING);
    }
  }}
/>

{#if filteredTasks.length}
  <Listgroup>
    {#each filteredTasks as task, index}
      <ListgroupItem
        active={index === focusingId}
        key={task.task_id}
        focusClass="bg-primary-500 text-white"
      >
        <button
          type="button"
          on:click={() => {
            const results = addWorkBookTask(task, workBookTasks, workBookTasksForTable);
            workBookTasks = results.updatedWorkBookTasks;
            workBookTasksForTable = results.updatedWorkBookTasksForTable;

            searchWordsOrURL = '';
            focusingId = PENDING;
          }}
        >
          <h3 class="text-left">
            {task.title}
          </h3>
          <div>
            {taskUrl(task.contest_id, task.task_id)}
          </div>
        </button>
      </ListgroupItem>
    {/each}
  </Listgroup>
{/if}
