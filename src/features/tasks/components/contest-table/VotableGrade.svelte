<script lang="ts">
  import { taskGradeValues, TaskGrade } from '$lib/types/task';
  import { getTaskGradeLabel } from '$lib/utils/task';

  import { Dropdown, DropdownItem, DropdownDivider } from 'flowbite-svelte';

  import GradeLabel from '$lib/components/GradeLabel.svelte';

  import { SIGNUP_PAGE, LOGIN_PAGE } from '$lib/constants/navbar-links';

  interface Props {
    grade: string;
    isLoggedIn: boolean;
  }

  let { grade, isLoggedIn }: Props = $props();

  const componentId = Math.random().toString(36).substring(2);

  const nonPendingGrades = taskGradeValues.filter((g) => g !== TaskGrade.PENDING);
  const nonPendingGradeNames = nonPendingGrades.map((g) => getTaskGradeLabel(g));
</script>

<!-- Vote Button -->
<div
  id={`update-grade-dropdown-trigger-${componentId}`}
  class="relative group shrink-0 cursor-pointer"
  role="button"
  tabindex="0"
  aria-label="Vote grade"
>
  <GradeLabel
    taskGrade={grade}
    defaultPadding={0.25}
    defaultWidth={6}
    reducedWidth={6}
  />

  <!-- Overlay -->
  <span
    aria-hidden="true"
    class="pointer-events-none absolute inset-0 rounded-lg bg-gray-200 dark:bg-gray-700 mix-blend-multiply opacity-0 transition-opacity duration-150 group-hover:opacity-100"
  ></span>
</div>


<!-- Dropdown Menu -->
{#if isLoggedIn}
  <Dropdown
    triggeredBy={`#update-grade-dropdown-trigger-${componentId}`}
    simple
    class="h-48 w-20 z-50 border border-gray-200 dark:border-gray-100 overflow-y-auto"
  >
    {#each nonPendingGradeNames as grade}
      <DropdownItem class="rounded-md">
        <div
          class="flex items-center justify-between w-full text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
        >
          <span>{grade}</span>
        </div>
      </DropdownItem>
    {/each}
  </Dropdown>
{:else}
  <Dropdown
    triggeredBy={`#update-grade-dropdown-trigger-${componentId}`}
    simple
    class="w-32 z-50 border border-gray-200 dark:border-gray-100"
  >
      <DropdownItem href={SIGNUP_PAGE} class="rounded-md">アカウント作成</DropdownItem>
      <DropdownDivider />
      <DropdownItem href={LOGIN_PAGE} class="rounded-md">ログイン</DropdownItem>
  </Dropdown>
{/if}