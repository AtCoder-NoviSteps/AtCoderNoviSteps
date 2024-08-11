<script lang="ts">
  import { Tabs } from 'flowbite-svelte';

  import { compareByContestIdAndTaskId } from '$lib/utils/task.js';
  import HeadingOne from '$lib/components/HeadingOne.svelte';
  import TabItemWrapper from '$lib/components/TabItemWrapper.svelte';
  import type { TaskResults } from '$lib/types/task';
  import TaskGradeList from '$lib/components/TaskGradeList.svelte';

  export let data;

  let taskResults: TaskResults;
  $: taskResults = data.taskResults.sort(compareByContestIdAndTaskId);
  let isAdmin: boolean = data.isAdmin;
  let isLoggedIn: boolean = data.isLoggedIn;
</script>

<!-- TODO: Searchを追加 -->
<div class="container mx-auto w-5/6">
  <HeadingOne title="問題一覧" />

  <!-- See: -->
  <!-- https://flowbite-svelte.com/docs/components/tabs -->
  <Tabs tabStyle="underline" contentClass="bg-white dark:bg-gray-800">
    <!-- Grades -->
    <TabItemWrapper workbookType={null} isOpen={true} title="グレード">
      <TaskGradeList {taskResults} {isAdmin} {isLoggedIn}></TaskGradeList>
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
