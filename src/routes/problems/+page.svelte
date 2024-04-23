<script lang="ts">
  import { Tabs } from 'flowbite-svelte';

  import { getContestPriority } from '$lib/utils/contest';
  import HeadingOne from '$lib/components/HeadingOne.svelte';
  import TabItemWrapper from '$lib/components/TabItemWrapper.svelte';
  import type { TaskResult, TaskResults } from '$lib/types/task';
  import TaskGradeList from '$lib/components/TaskGradeList.svelte';

  export let data;

  let taskResults: TaskResults = data.taskResults.sort(compareByContestIdAndTaskId);
  let isAdmin: boolean = data.isAdmin;

  // See:
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort
  function compareByContestIdAndTaskId(first: TaskResult, second: TaskResult) {
    const firstContestPriority = getContestPriority(first.contest_id);
    const secondContestPriority = getContestPriority(second.contest_id);
    const diffContestPriority = firstContestPriority - secondContestPriority;

    // If the contests have the same priority, they will be in descending order by task_id
    if (diffContestPriority === 0) {
      return second.task_id.localeCompare(first.task_id);
    }

    return diffContestPriority;
  }
</script>

<!-- TODO: Searchを追加 -->
<div class="container mx-auto w-5/6">
  <HeadingOne title="問題一覧" />

  <!-- See: -->
  <!-- https://flowbite-svelte.com/docs/components/tabs -->
  <Tabs tabStyle="underline" contentClass="bg-white">
    <!-- Grades -->
    <TabItemWrapper isOpen={true} title="グレード">
      <TaskGradeList {taskResults} {isAdmin}></TaskGradeList>
    </TabItemWrapper>

    <!-- HACK: 以下、各テーブルを実装するまで非表示 -->
    <!-- Tags -->
    <!-- <TabItemWrapper title="Tags">
      <div class="m-4">Comming Soon.</div>
    </TabItemWrapper> -->

    <!-- Latest -->
    <!-- <TabItemWrapper title="Latest">
      <div class="m-4">Comming Soon.</div>
    </TabItemWrapper> -->

    <!-- Table -->
    <!-- TODO: コンテスト種類をトグルボタンで切り替えられるようにする -->
    <!-- <TabItemWrapper title="Table"> -->
    <!-- <TaskTable {taskResults} /> -->
    <!-- <div class="m-4">Comming Soon.</div>
    </TabItemWrapper> -->
  </Tabs>
</div>
