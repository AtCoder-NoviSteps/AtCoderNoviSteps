<script lang="ts">
  import { enhance } from '$app/forms';

  import { Dropdown, DropdownItem, DropdownDivider } from 'flowbite-svelte';
  import Check from '@lucide/svelte/icons/check';
  
  import { taskGradeValues, TaskGrade, getTaskGrade, type TaskResult } from '$lib/types/task';
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

  let selectedVoteGrade = $state<TaskGrade>();
  let showForm = $state(false);

  let isOpening = $state(false);
  let votedGrade = $state<TaskGrade | null>(null);

  async function onTriggerClick() {
    if (isOpening) return;
    isOpening = true;
    try {
      // ここで先にやりたい処理（例: getMyVote フェッチ）
      const res = await fetch(`/problems/getMyVote?taskId=${encodeURIComponent(taskResult.task_id)}`, {
        headers: { Accept: 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        votedGrade = data.grade;
      }
    } catch (err) {
      console.error(err);
    } finally {
      isOpening = false;
    }
  }

  function handleClick(voteGrade: string): void {
    selectedVoteGrade = getTaskGrade(voteGrade);
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
<button
  id={`update-grade-dropdown-trigger-${componentId}`}
  class="relative group shrink-0 cursor-pointer"
  type="button"
  tabindex="0"
  aria-label="Vote grade"
  onclick={() => onTriggerClick()}
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
</button>


<!-- Dropdown Menu -->
{#if isLoggedIn}
  <Dropdown
    triggeredBy={`#update-grade-dropdown-trigger-${componentId}`}
    simple
    class="h-48 w-25 z-50 border border-gray-200 dark:border-gray-100 overflow-y-auto"
  >
    {#each nonPendingGrades as grade}
      <DropdownItem onclick={() => handleClick(grade)} class="rounded-md">
        <div
          class="flex items-center justify-between w-full text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
        >
          <span>{getTaskGradeLabel(grade)}</span>
          {#if votedGrade === grade}
            <Check class="w-4 h-4 text-primary-600 dark:text-gray-300" strokeWidth={3} />
          {/if}
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

{#snippet voteGradeForm(selectedTaskResult: TaskResult, voteGrade: TaskGrade)}
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