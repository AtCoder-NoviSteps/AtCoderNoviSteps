<!-- Usage
// Script
<script lang="ts">
  import type { TaskResult } from '$lib/types/task';

  import UpdatingDropdown from '$lib/components/SubmissionStatus/UpdatingDropdown.svelte';

  interface Props {
    taskResult: TaskResult;
    isLoggedIn: boolean;
    onupdate?: (updatedTask: TaskResult) => void;
  }

  let { taskResult, isLoggedIn, onupdate = () => {} }: Props = $props();
</script>


// Component
<UpdatingDropdown {taskResult} {isLoggedIn} {onupdate} />
-->
<script lang="ts">
  import { enhance } from '$app/forms';

  import { Dropdown, DropdownItem, DropdownDivider } from 'flowbite-svelte';
  import Check from '@lucide/svelte/icons/check';
  import ChevronDown from '@lucide/svelte/icons/chevron-down';

  import type { TaskResult } from '$lib/types/task';

  import InputFieldWrapper from '$lib/components/InputFieldWrapper.svelte';

  import { submission_statuses } from '$lib/services/submission_status';
  import { errorMessageStore } from '$lib/stores/error_message';

  import { SIGNUP_PAGE, LOGIN_PAGE } from '$lib/constants/navbar-links';

  interface Props {
    taskResult: TaskResult;
    isLoggedIn: boolean;
    onupdate: (updatedTask: TaskResult) => void; // Ensure to update task result in parent component.
  }

  let { taskResult, isLoggedIn, onupdate }: Props = $props();

  const componentId = Math.random().toString(36).substring(2);
  let isInBottomHalf = $state(false);

  function calculateDropdownPlacement(trigger: HTMLElement): void {
    const rect = trigger.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    // Placement near the bottom of the viewport places it above
    isInBottomHalf = rect.top > windowHeight / 2;
  }

  $effect(() => {
    const triggerElement = document.getElementById(`update-dropdown-trigger-${componentId}`);

    if (triggerElement) {
      calculateDropdownPlacement(triggerElement);
      // Recalculate on window resize
      const handleResize = () => calculateDropdownPlacement(triggerElement);
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  });

  let selectedSubmissionStatus = $state<SubmissionStatus>();
  let showForm = $state(false);

  function handleClick(submissionStatus: {
    innerId: string;
    innerName: string;
    labelName: string;
  }): void {
    selectedSubmissionStatus = submissionStatus;
    showForm = true;

    // Submit after the form is rendered.
    setTimeout(() => {
      const submitButton = document.querySelector(
        '#submissionStatusForm button[type="submit"]',
      ) as HTMLButtonElement;

      if (submitButton) {
        // Submit the form via the enhance directive by clicking the button.
        submitButton.click();
      }
    }, 10);
  }

  type SubmissionStatus = {
    innerId: string;
    innerName: string;
    labelName: string;
  };

  type EnhanceForSubmit = {
    formData: FormData;
    action: URL;
    cancel: () => void;
  };

  const FAILED_TO_UPDATE_SUBMISSION_STATUS =
    '回答状況の更新に失敗しました。もう一度試してください。';

  const handleSubmit = (submissionStatus: SubmissionStatus) => {
    return ({ formData, action, cancel }: EnhanceForSubmit) => {
      // Cancel the default form submission.
      cancel();

      if (isSame(submissionStatus, taskResult)) {
        console.log('Skipping: Submission status already set to', submissionStatus.labelName);

        resetDropdown();
        return () => {};
      }

      // Submit data manually using fetch API.
      fetch(action, {
        method: 'POST',
        body: formData,
        headers: {
          Accept: 'application/json',
        },
      })
        .then((response) => response.json())
        .then(() => {
          const updatedTaskResult = updateTaskResult(taskResult, submissionStatus);
          onupdate(updatedTaskResult);
        })
        .catch((error) => {
          console.error('Failed to update submission status: ', error);
          errorMessageStore.setAndClearAfterTimeout(FAILED_TO_UPDATE_SUBMISSION_STATUS, 10000);
        })
        .finally(() => {
          resetDropdown();
        });

      // Do not change anything in SvelteKit.
      return () => {};
    };
  };

  function isSame(submissionStatus: SubmissionStatus, taskResult: TaskResult): boolean {
    return submissionStatus.innerName === taskResult.status_name;
  }

  function resetDropdown(): void {
    showForm = false;
  }

  function updateTaskResult(
    taskResult: TaskResult,
    submissionStatus: SubmissionStatus,
  ): TaskResult {
    return {
      ...taskResult,
      status_name: submissionStatus.innerName,
      status_id: submissionStatus.innerId,
      submission_status_label_name: submissionStatus.labelName,
      is_ac: submissionStatus.innerName === 'ac',
      updated_at: new Date(),
    };
  }

  // TODO: When customizing submission status, implement DB fetching for status options.
  const submissionStatusOptions = submission_statuses.map((status) => {
    const option = {
      innerId: status.id,
      innerName: status.status_name,
      labelName: status.label_name,
    };
    return option;
  });
</script>

<div class="flex items-center gap-1">
  <!-- Trigger Button -->
  <div
    id={`update-dropdown-trigger-${componentId}`}
    class="shrink-0 w-6 ml-auto cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 rounded-sm p-1 transition text-gray-700 dark:text-gray-400"
    role="button"
    tabindex="0"
    aria-label="Update submission status"
  >
    <ChevronDown class="w-4 h-4 mx-auto" />
  </div>
</div>

<!-- Dropdown Menu -->
<!-- Note: Split outside div for better control, auto-linked with triggeredBy -->
<Dropdown
  triggeredBy={`#update-dropdown-trigger-${componentId}`}
  placement={isInBottomHalf ? 'top' : 'bottom'}
  class="w-32 z-50"
>
  {#if isLoggedIn}
    {#each submissionStatusOptions as submissionStatus}
      <DropdownItem onclick={() => handleClick(submissionStatus)} class="rounded-md">
        <div
          class="flex items-center justify-between w-full text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
        >
          <span>{submissionStatus.labelName}</span>
          {#if taskResult.status_name === submissionStatus.innerName}
            <Check class="w-4 h-4 text-primary-600 dark:text-gray-300" strokeWidth={3} />
          {/if}
        </div>
      </DropdownItem>
    {/each}
  {:else}
    <DropdownItem href={SIGNUP_PAGE} class="rounded-lg">アカウント作成</DropdownItem>
    <DropdownDivider />
    <DropdownItem href={LOGIN_PAGE} class="rounded-lg">ログイン</DropdownItem>
  {/if}
</Dropdown>

{#if showForm && selectedSubmissionStatus}
  {@render submissionStatusForm(taskResult, selectedSubmissionStatus)}
{/if}

{#snippet submissionStatusForm(selectedTaskResult: TaskResult, submissionStatus: SubmissionStatus)}
  <form
    id="submissionStatusForm"
    method="POST"
    action="?/update"
    style="display:none;"
    use:enhance={handleSubmit(submissionStatus)}
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
      inputFieldName="submissionStatus"
      inputValue={submissionStatus.innerName}
    />

    <button type="submit">Submit</button>
  </form>
{/snippet}
