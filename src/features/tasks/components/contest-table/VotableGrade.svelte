<script lang="ts">
  import { enhance } from '$app/forms';

  import { Dropdown, DropdownItem, DropdownDivider } from 'flowbite-svelte';

  import { taskGradeValues, TaskGrade, type TaskResult } from '$lib/types/task';
  import { getTaskGradeLabel } from '$lib/utils/task';
  import { SIGNUP_PAGE, LOGIN_PAGE } from '$lib/constants/navbar-links';
  import { errorMessageStore } from '$lib/stores/error_message';

  import GradeLabel from '$lib/components/GradeLabel.svelte';
  import InputFieldWrapper from '$lib/components/InputFieldWrapper.svelte';
  
  interface Props {
    taskResult: TaskResult
    isLoggedIn: boolean;
  }

  let { taskResult, isLoggedIn }: Props = $props();

  const componentId = Math.random().toString(36).substring(2);
  const nonPendingGrades = taskGradeValues.filter((g) => g !== TaskGrade.PENDING);
  const nonPendingGradeNames = nonPendingGrades.map((g) => getTaskGradeLabel(g));

  let selectedVoteGrade = $state<string>();
  let showForm = $state(false);

  function handleClick(voteGrade: string): void {
    selectedVoteGrade = voteGrade;
    showForm = true;

    // Submit after the form is rendered.
    setTimeout(() => {
      const submitButton = document.querySelector(
        '#voteGradeForm button[type="submit"]',
      ) as HTMLButtonElement;

      if (submitButton) {
        // Submit the form via the enhance directive by clicking the button.
        submitButton.click();
      }
    }, 10);
  }

  type EnhanceForVote = {
    formData: FormData;
    action: URL;
    cancel: () => void;
  };

  const FAILED_TO_UPDATE_VOTE_STATUS =
    '投票状況の更新に失敗しました。もう一度試してください。';

  const handleSubmit = () => {
    return ({ formData, action, cancel }: EnhanceForVote) => {
      // Cancel the default form submission.
      cancel();

      // Submit data manually using fetch API.
      fetch(action, {
        method: 'POST',
        body: formData,
        headers: {
          Accept: 'application/json',
        },
      })
        .then((response) => response.json())
        .catch((error) => {
          console.error('Failed to update submission status: ', error);
          errorMessageStore.setAndClearAfterTimeout(FAILED_TO_UPDATE_VOTE_STATUS, 10000);
        })
        .finally(() => {
          resetDropdown();
        });

      // Do not change anything in SvelteKit.
      return () => {};
    };
  };

  function resetDropdown(): void {
    showForm = false;
  }
</script>

<!-- Grade Icon -->
<div
  id={`update-grade-dropdown-trigger-${componentId}`}
  class="relative group shrink-0 cursor-pointer"
  role="button"
  tabindex="0"
  aria-label="Vote grade"
>
  <GradeLabel
    taskGrade={taskResult.grade}
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
      <DropdownItem onclick={() => handleClick(grade)} class="rounded-md">
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

{#if showForm && selectedVoteGrade}
  {@render voteGradeForm(taskResult, selectedVoteGrade)}
{/if}

{#snippet voteGradeForm(selectedTaskResult: TaskResult, voteGrade: string)}
  <form
    id="voteGradeForm"
    method="POST"
    action="?/voteAbsoluteGrade"
    style="display:none;"
    use:enhance={handleSubmit()}
  >
    <!-- Task id -->
    <InputFieldWrapper
      inputFieldType="hidden"
      inputFieldName="taskId"
      inputValue={selectedTaskResult.task_id}
    />

    <!-- Submission status -->
    <InputFieldWrapper
      inputFieldType="hidden"
      inputFieldName="grade"
      inputValue={voteGrade}
    />

    <button type="submit">Submit</button>
  </form>
{/snippet}