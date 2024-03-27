<script lang="ts">
  import { Tabs } from 'flowbite-svelte';

  import HeadingOne from '$lib/components/HeadingOne.svelte';
  import TabItemWrapper from '$lib/components/TabItemWrapper.svelte';
  import type { TaskResults } from '$lib/types/task';
  import TaskGradeList from '$lib/components/TaskGradeList.svelte';

  export let data;

  let taskResults: TaskResults = data.taskResults;
  let isAdmin: boolean = data.isAdmin;
</script>

<!-- TODO: Searchを追加 -->
<div class="container mx-auto w-5/6">
  <HeadingOne title="問題一覧" />

  <!-- See: -->
  <!-- https://flowbite-svelte.com/docs/components/tabs -->
  <Tabs style="underline" contentClass="bg-white">
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
