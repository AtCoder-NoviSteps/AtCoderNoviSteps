<!-- See: -->
<!-- https://github.com/kenkoooo/AtCoderProblems/blob/master/atcoder-problems-frontend/src/components/ProblemSearchBox.tsx -->
<script lang="ts">
  import { Input, Listgroup, ListgroupItem } from 'flowbite-svelte';

  import type { WorkBookTaskCreate } from '$lib/types/workbook';
  import type { Task } from '$lib/types/task';
  import { taskUrl } from '$lib/utils/task';

  export let workBookTasks: WorkBookTaskCreate[];

  // TODO: DBから問題を取得できるようにする
  let filteredTasks = [
    {
      contest_id: 'ABC351',
      task_table_index: 'A',
      task_id: 'abc351_a',
      title: 'A. hoge',
      grade: '',
    },
    {
      contest_id: 'ABC351',
      task_table_index: 'B',
      task_id: 'abc351_b',
      title: 'B. fuga',
      grade: '',
    },
    {
      contest_id: 'ABC351',
      task_table_index: 'C',
      task_id: 'abc351_c',
      title: 'C. piyo',
      grade: '',
    },
    {
      contest_id: 'ABC351',
      task_table_index: 'D',
      task_id: 'abc351_d',
      title: 'D. foo',
      grade: '',
    },
    {
      contest_id: 'ABC351',
      task_table_index: 'E',
      task_id: 'abc351_e',
      title: 'E. bar',
      grade: '',
    },
    {
      contest_id: 'ABC351',
      task_table_index: 'F',
      task_id: 'abc351_f',
      title: 'F. bizz',
      grade: '',
    },
    {
      contest_id: 'ABC351',
      task_table_index: 'G',
      task_id: 'abc351_g',
      title: 'G. buzz',
      grade: '',
    },
  ];

  $: searchWordsOrURL = '';

  const PENDING = -1;
  let focusingId = PENDING;

  let newWorkBookTaskId = 0;

  $: {
    if (workBookTasks.length === 0) {
      newWorkBookTaskId = 1;
    } else {
      newWorkBookTaskId = Math.max(...workBookTasks.map((task) => task.id)) + 1;
    }
  }

  function addWorkBookTask(selectedTask: Task) {
    workBookTasks = [
      ...workBookTasks,
      {
        id: newWorkBookTaskId,
        contestId: selectedTask.contest_id,
        taskId: selectedTask.task_id,
        title: selectedTask.title,
      },
    ];
  }
</script>

<Input
  type="search"
  placeholder="問題の名称かURLを入力してください。"
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
