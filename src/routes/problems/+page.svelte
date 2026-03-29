<script lang="ts">
  import type { Snippet } from 'svelte';

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

  const isAdmin = $derived(data.isAdmin);
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
    {@render problemListTab('コンテスト別（アルファ版）', 'contestTable', contestTable)}

    <!-- Grades -->
    {@render problemListTab('グレード別', 'listByGrade', listByGrade)}

    <!-- Grade guidelines -->
    {@render problemListTab('グレードの目安', 'gradeGuidelineTable', gradeGuidelineTable)}
  </Tabs>
</div>

{#snippet problemListTab(title: string, tab: ActiveProblemListTab, children: Snippet)}
  <ProblemListTabItem {title} activeProblemList={tab} isOpen={isActiveTab(tab)}>
    {@render children()}
  </ProblemListTabItem>
{/snippet}

{#snippet contestTable()}
  <TaskTable {taskResults} {isLoggedIn} {isAtCoderVerified} {voteResults} />
{/snippet}

{#snippet listByGrade()}
  <TaskGradeList {taskResults} {isAdmin} {isLoggedIn}></TaskGradeList>
{/snippet}

{#snippet gradeGuidelineTable()}
  <GradeGuidelineTable />
{/snippet}
