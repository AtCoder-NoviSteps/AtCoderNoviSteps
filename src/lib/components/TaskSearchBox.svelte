<!-- See: -->
<!-- https://github.com/kenkoooo/AtCoderProblems/blob/master/atcoder-problems-frontend/src/components/ProblemSearchBox.tsx -->
<script lang="ts">
  import { Input, Listgroup, ListgroupItem } from 'flowbite-svelte';

  import type { WorkBookTasksBase, WorkBookTasksCreate } from '$lib/types/workbook';
  import type { Task, Tasks } from '$lib/types/task';
  import { getContestNameLabel } from '$lib/utils/contest';
  import { taskUrl } from '$lib/utils/task';

  export let tasks: Tasks = [];
  // HACK: やむなくデータベースへの保存用と問題集作成・編集用で分けている。
  export let workBookTasks: WorkBookTasksBase = [];
  export let workBookTasksForTable: WorkBookTasksCreate = [];

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

  let newWorkBookTaskId = 0;

  // Note: 初期値として、便宜的に割り当てている。随時、変更可能。
  const NO_COMMENT = '';

  $: {
    if (workBookTasks.length === 0) {
      newWorkBookTaskId = 1;
    } else {
      newWorkBookTaskId = Math.max(...workBookTasks.map((task) => task.priority)) + 1;
    }
  }

  // TODO: utilsとして切り出し、テストを追加
  function addWorkBookTask(
    selectedTask: Task,
    workBookTasks: WorkBookTasksBase,
    workBookTasksForTable: WorkBookTasksCreate,
  ) {
    const newWorkBookTasks = [
      ...workBookTasks,
      {
        taskId: selectedTask.task_id,
        priority: newWorkBookTaskId, // 1に近いほど優先度が高い
        comment: NO_COMMENT,
      },
    ];
    const newWorkBookTasksForTable = [
      ...workBookTasksForTable,
      {
        contestId: getContestNameLabel(selectedTask.contest_id),
        taskId: selectedTask.task_id,
        title: selectedTask.title,
        priority: newWorkBookTaskId,
        comment: NO_COMMENT,
      },
    ];

    return { newWorkBookTasks, newWorkBookTasksForTable };
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
        workBookTasks = results.newWorkBookTasks;
        workBookTasksForTable = results.newWorkBookTasksForTable;

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
            workBookTasks = results.newWorkBookTasks;
            workBookTasksForTable = results.newWorkBookTasksForTable;

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
