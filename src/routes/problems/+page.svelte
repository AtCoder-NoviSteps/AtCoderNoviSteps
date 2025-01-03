<script lang="ts">
  import { Tabs } from 'flowbite-svelte';

  import type { TaskResults } from '$lib/types/task';

  import { compareByContestIdAndTaskId } from '$lib/utils/task';

  import HeadingOne from '$lib/components/HeadingOne.svelte';
  import TabItemWrapper from '$lib/components/TabItemWrapper.svelte';
  import TaskTable from '$lib/components/TaskTables/TaskTable.svelte';
  import TaskGradeList from '$lib/components/TaskGradeList.svelte';
  import GradeGuidelineTable from '$lib/components/TaskGrades/GradeGuidelineTable.svelte';

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
    <!-- Task table -->
    <!-- WIP: UIのデザインが試行錯誤の段階であるため、管理者のみ閲覧可能 -->
    {#if isAdmin}
      <TabItemWrapper workbookType={null} isOpen={true} title="テーブル">
        <TaskTable {taskResults} {isLoggedIn} />
      </TabItemWrapper>
    {/if}

    <!-- Grades -->
    <TabItemWrapper workbookType={null} title="グレード">
      <TaskGradeList {taskResults} {isAdmin} {isLoggedIn}></TaskGradeList>
    </TabItemWrapper>

    <!-- Grade guidelines -->
    <TabItemWrapper workbookType={null} title="グレードの目安">
      <GradeGuidelineTable />
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
  </Tabs>
</div>
