<script lang="ts">
  import type { Snippet } from 'svelte';

  import { Tabs } from 'flowbite-svelte';

  import type { TaskResults } from '$lib/types/task';

  import { compareByContestIdAndTaskId } from '$lib/utils/task';

  import HeadingOne from '$lib/components/HeadingOne.svelte';
  import TabItemWrapper from '$lib/components/TabItemWrapper.svelte';
  import TaskTable from '$lib/components/TaskTables/TaskTable.svelte';
  import TaskGradeList from '$lib/components/TaskGradeList.svelte';
  import GradeGuidelineTable from '$lib/components/TaskGrades/GradeGuidelineTable.svelte';

  import {
    activeProblemListTabStore,
    type ActiveProblemListTab,
  } from '$lib/stores/active_problem_list_tab.svelte';

  let { data } = $props();

  let taskResults: TaskResults = $derived(data.taskResults.sort(compareByContestIdAndTaskId));

  let isAdmin: boolean = data.isAdmin;
  let isLoggedIn: boolean = data.isLoggedIn;

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
  <TabItemWrapper {title} activeProblemList={tab} isOpen={isActiveTab(tab)}>
    {@render children()}
  </TabItemWrapper>
{/snippet}

{#snippet contestTable()}
  <TaskTable {taskResults} {isLoggedIn} />
{/snippet}

{#snippet listByGrade()}
  <TaskGradeList {taskResults} {isAdmin} {isLoggedIn}></TaskGradeList>
{/snippet}

{#snippet gradeGuidelineTable()}
  <GradeGuidelineTable />
{/snippet}
