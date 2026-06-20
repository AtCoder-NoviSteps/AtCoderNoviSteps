<script lang="ts">
  import { Tabs } from 'flowbite-svelte';

  import type { TaskResults } from '$lib/types/task';

  import { compareByContestIdAndTaskId } from '$lib/utils/task';

  import HeadingOne from '$lib/components/HeadingOne.svelte';
  import ProblemListTabItem from '$lib/components/Tabs/ProblemListTabItem.svelte';
  import TaskTable from '$features/tasks/components/contest-table/TaskTable.svelte';
  import TaskGradeList from '$lib/components/TaskGradeList.svelte';
  import GradeGuidelineTable from '$lib/components/TaskGrades/GradeGuidelineTable.svelte';

  import {
    activeProblemListTabStore,
    type ActiveProblemListTab,
  } from '$lib/stores/active_problem_list_tab.svelte';

  let { data } = $props();

  let taskResults: TaskResults = $derived(data.taskResults.sort(compareByContestIdAndTaskId));

  const isLoggedIn = $derived(data.isLoggedIn);
  const isAtCoderVerified = $derived(data.isAtCoderVerified);
  const voteResults = $derived(data.voteResults);

  function isActiveTab(currentTab: ActiveProblemListTab): boolean {
    return currentTab === activeProblemListTabStore.get();
  }
</script>

<!-- TODO: Searchを追加 -->
<div class="container mx-auto w-5/6">
  <HeadingOne title="一覧表" />

  <!-- See: -->
  <!-- https://flowbite-svelte.com/docs/components/tabs -->
  <Tabs
    tabStyle="underline"
    contentClass="bg-white dark:bg-gray-800 mt-0 p-0"
    ulClass="flex flex-wrap md:flex-nowrap md:gap-2 rtl:space-x-reverse items-start"
  >
    <!-- Contest table -->
    <ProblemListTabItem
      title="コンテスト別（アルファ版）"
      activeProblemList="contestTable"
      isOpen={isActiveTab('contestTable')}
    >
      <TaskTable {taskResults} {isLoggedIn} {isAtCoderVerified} {voteResults} />
    </ProblemListTabItem>

    <!-- Grades -->
    <ProblemListTabItem
      title="グレード別"
      activeProblemList="listByGrade"
      isOpen={isActiveTab('listByGrade')}
    >
      <TaskGradeList {taskResults} {isLoggedIn}></TaskGradeList>
    </ProblemListTabItem>

    <!-- Grade guidelines -->
    <ProblemListTabItem
      title="グレードの目安"
      activeProblemList="gradeGuidelineTable"
      isOpen={isActiveTab('gradeGuidelineTable')}
    >
      <GradeGuidelineTable />
    </ProblemListTabItem>
  </Tabs>
</div>
