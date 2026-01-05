<!-- See: -->
<!-- https://github.com/kenkoooo/AtCoderProblems/blob/master/atcoder-problems-frontend/src/components/ProblemSearchBox.tsx -->
<script lang="ts">
  import { Input, Listgroup } from 'flowbite-svelte';

  import SelectWrapper from '$lib/components/SelectWrapper.svelte';
  import LabelWithTooltips from '$lib/components/LabelWithTooltips.svelte';
  import GradeLabel from '$lib/components/GradeLabel.svelte';

  import type {
    WorkBookTasksBase,
    WorkBookTasksCreate,
    WorkBookTasksEdit,
  } from '$lib/types/workbook';
  import type { Task, Tasks } from '$lib/types/task';

  import {
    generateWorkBookTaskOrders,
    addTaskToWorkBook,
    PENDING,
  } from '$lib/utils/workbook_tasks';
  import { getTaskUrl } from '$lib/utils/task';

  interface Props {
    tasks?: Tasks;
    // HACK: やむなくデータベースへの保存用と問題集作成・編集用で分けている。
    workBookTasks?: WorkBookTasksBase;
    workBookTasksForTable?: WorkBookTasksCreate | WorkBookTasksEdit;
  }

  let {
    tasks = $bindable([]),
    workBookTasks = $bindable([]),
    workBookTasksForTable = $bindable([]),
  }: Props = $props();

  // TODO: utilsへ移動させる
  const isMatched = (task: Task, searchWords: string): boolean => {
    if (searchWords === undefined || searchWords.length === 0) {
      return false;
    }

    return searchWords
      .split(/\s/)
      .every(
        (word) =>
          (word.trim().length > 0 && task.title.toLowerCase().includes(word.toLowerCase())) ||
          getTaskUrl(task.contest_id, task.task_id).toLowerCase().includes(word.toLowerCase()),
      );
  };

  let searchQueryOrURL = $state('');
  let filteredTasks = $derived(
    tasks
      .filter((task: Task) => isMatched(task, searchQueryOrURL))
      .slice(0, 30)
      .sort((firstTask: Task, secondTask: Task) =>
        firstTask.task_table_index.localeCompare(secondTask.task_table_index),
      ),
  );
  let focusingId = $state(PENDING);

  // Note: 問題を末尾に追加するのをデフォルトとする
  let selectedIndex: number = $state(workBookTasksForTable.length);
  let workBookTaskMaxForTable = $state(workBookTasksForTable.length);

  let workBookTaskOrders = $derived(generateWorkBookTaskOrders(workBookTasksForTable.length));

  function handleSelectClick(event: Event) {
    if (event.target instanceof HTMLSelectElement) {
      selectedIndex = Number(event.target.value);
    }
  }

  // HACK: 問題を追加する順番の指定と、問題の追加 / 削除に伴う順番の動的な更新を両立させるための苦肉の策
  //       1. 問題を追加 / 削除したときだけ、次の問題を末尾に追加する状態に（デフォルトと同じ、変更も可能）
  //       2. 問題を追加する順番を選択しているときは「問題数が増減しない」ことから、デフォルトの設定に更新しないようにする
  $effect(() => {
    // HACK: 問題の削除を別のコンポーネントで行っており、確実に同期させるため
    // （以下の2行がないと、削除してから別の問題を追加するまで、問題を追加する順番を指定できなくなる）
    workBookTaskMaxForTable = workBookTasksForTable.length;
    selectedIndex = Math.min(selectedIndex, workBookTaskMaxForTable);

    if (workBookTasksForTable.length !== workBookTaskMaxForTable) {
      selectedIndex = workBookTasksForTable.length;
    }
  });
</script>

<div class="flex flex-col md:flex-row items-start md:items-center justify-between md:space-x-4">
  <!-- 問題を検索・追加 -->
  <div class="w-full md:w-5/6 space-y-2 mb-2 md:mb-0">
    <LabelWithTooltips
      labelName="問題を検索・追加"
      tooltipId="tooltip-for-search-and-add-tasks"
      tooltipContents={[
        '検索結果から問題一覧への追加方法',
        '・問題を直接クリック',
        '・問題を↑か↓で選択し、Enterキーを押す',
      ]}
    />

    <div class="flex items-center w-full">
      <Input
        type="search"
        placeholder="問題名かURLを入力してください。"
        class="flex-grow space-y-2"
        bind:value={searchQueryOrURL}
        onchange={(e) => {
          if (e.target instanceof HTMLInputElement) {
            searchQueryOrURL = e.target.value;
            focusingId = PENDING;
          }
        }}
        onkeydown={(e) => {
          if (e.key === 'Enter') {
            const selectedTask =
              filteredTasks.length > focusingId ? filteredTasks[focusingId] : undefined;

            if (selectedTask) {
              const results = addTaskToWorkBook(
                selectedTask,
                workBookTasks,
                workBookTasksForTable,
                selectedIndex,
              );
              workBookTasks = results.updatedWorkBookTasks;
              workBookTasksForTable = results.updatedWorkBookTasksForTable;
              workBookTaskMaxForTable = results.updatedWorkBookTasksForTable.length;
              selectedIndex = results.updatedWorkBookTasksForTable.length;

              searchQueryOrURL = '';
              focusingId = PENDING;
            }
          } else if (e.key === 'ArrowDown') {
            focusingId = Math.min(focusingId + 1, filteredTasks.length - 1); // 0-indexed
          } else if (e.key === 'ArrowUp') {
            focusingId = Math.max(focusingId - 1, PENDING);
          }
        }}
      />
    </div>
  </div>

  <!-- 問題を問題一覧に追加する順番 -->
  <div class="w-full md:w-1/6 space-y-2">
    <LabelWithTooltips
      labelName="問題の順番"
      tooltipId="tooltip-for-select-task-order"
      tooltipContents={[
        '（任意）問題一覧に問題を追加する順番を指定',
        '・指定しない場合は、末尾に追加',
        '・先頭〜末尾まで選択可能 (0 〜 一覧の問題数)',
      ]}
    />

    <SelectWrapper
      labelClass=""
      labelName=""
      innerName="selectedIndex"
      items={workBookTaskOrders}
      bind:inputValue={selectedIndex}
      isEditable={true}
      onClick={handleSelectClick}
    />
  </div>
</div>

{#if filteredTasks.length}
  <Listgroup>
    {#each filteredTasks as task, index}
      <!-- See: -->
      <!-- WHY: Use a custom <li> element with conditional classes for highlighting, due not to be able to find attribute. -->
      <li
        data-name={task.task_id}
        class="cursor-pointer truncate md:truncate-none px-4 pt-3 pb-1 border-b border-gray-200 dark:border-gray-600 first:rounded-tl-lg first:rounded-tr-lg last:rounded-bl-lg last:rounded-br-lg {index ===
        focusingId
          ? 'bg-primary-500 text-white'
          : 'bg-white text-gray-700 dark:bg-gray-700 dark:text-white'}"
      >
        <button
          type="button"
          onclick={() => {
            const results = addTaskToWorkBook(
              task,
              workBookTasks,
              workBookTasksForTable,
              selectedIndex,
            );
            workBookTasks = results.updatedWorkBookTasks;
            workBookTasksForTable = results.updatedWorkBookTasksForTable;
            workBookTaskMaxForTable = results.updatedWorkBookTasksForTable.length;
            selectedIndex = results.updatedWorkBookTasksForTable.length;

            searchQueryOrURL = '';
            focusingId = PENDING;
          }}
        >
          <!-- Task name and grade -->
          <div class="flex items-start justify-start space-x-3 mb-1">
            <div class="max-w-fit shrink-0">
              <GradeLabel taskGrade={task.grade} />
            </div>
            <h3 class="text-lg xs:text-xl">
              {task.title}
            </h3>
          </div>

          <!-- Task url -->
          <div class="text-left">
            <span aria-label="Task URL: {getTaskUrl(task.contest_id, task.task_id)}">
              {getTaskUrl(task.contest_id, task.task_id)}
            </span>
          </div>
        </button>
      </li>
    {/each}
  </Listgroup>
{/if}
