<!-- See: -->
<!-- https://github.com/kenkoooo/AtCoderProblems/blob/master/atcoder-problems-frontend/src/components/ProblemSearchBox.tsx -->
<script lang="ts">
  import { Input, Listgroup, ListgroupItem } from 'flowbite-svelte';

  import type { WorkBookTaskCreate } from '$lib/types/workbook';
  import type { Task, Tasks } from '$lib/types/task';
  import { getContestNameLabel } from '$lib/utils/contest';
  import { taskUrl } from '$lib/utils/task';

  export let tasks: Tasks = [];
  export let workBookTasks: WorkBookTaskCreate[] = [];

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
  $: filteredTasks = tasks.filter((task: Task) => isMatched(task, searchWordsOrURL)).slice(0, 20);

  const PENDING = -1;
  let focusingId = PENDING;

  let newWorkBookTaskId = 0;

  $: {
    if (workBookTasks.length === 0) {
      newWorkBookTaskId = 1;
    } else {
      newWorkBookTaskId = Math.max(...workBookTasks.map((task) => task.priority)) + 1;
    }
  }

  function addWorkBookTask(selectedTask: Task) {
    workBookTasks = [
      ...workBookTasks,
      {
        contestId: getContestNameLabel(selectedTask.contest_id),
        taskId: selectedTask.task_id,
        title: selectedTask.title,
        priority: newWorkBookTaskId, // 1に近いほど優先度が高い
      },
    ];
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
      const task = filteredTasks.length > focusingId ? filteredTasks[focusingId] : undefined;

      if (task) {
        addWorkBookTask(task);
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

<Listgroup>
  {#each filteredTasks as task, index}
    <ListgroupItem
      active={index === focusingId}
      key={task.task_id}
      focusClass="bg-primary-500 text-white"
    >
      <!-- HACK: <button>を設定すると、以下のバグや不具合が発生する。 -->
      <!-- 問題を検索してEnterキーを押すと、選択した問題だけでなく最初の問題まで問題集に追加されてしまう -->
      <!-- タイトルが中央揃え?になり、レイアウトが崩れる -->
      <a
        type="button"
        href={null}
        on:click={() => {
          addWorkBookTask(task);
          searchWordsOrURL = '';
          focusingId = PENDING;
        }}
      >
        <h3>
          {task.title}
        </h3>
        <div>
          {taskUrl(task.contest_id, task.task_id)}
        </div>
      </a>
    </ListgroupItem>
  {/each}
</Listgroup>
