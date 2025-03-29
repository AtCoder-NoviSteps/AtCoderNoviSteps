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

  let updatingDropdown: UpdatingDropdown;
</script>


// Component
<button
  type="button"
  onclick={() => updatingDropdown.toggle()} // Open / close the dropdown.
>

<UpdatingDropdown bind:this={updatingDropdown} {taskResult} {isLoggedIn} {onupdate} />
-->
<script lang="ts">
  import { getStores } from '$app/stores';
  import { enhance } from '$app/forms';

  import { Dropdown, DropdownUl, DropdownLi, uiHelpers } from 'svelte-5-ui-lib';
  import Check from 'lucide-svelte/icons/check';

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

  const { page } = getStores();
  let activeUrl = $state($page.url.pathname);

  let dropdown = uiHelpers();
  let dropdownStatus = $state(false);
  let closeDropdown = dropdown.close;

  $effect(() => {
    activeUrl = $page.url.pathname;
    dropdownStatus = dropdown.isOpen;
  });

  export function toggle(): void {
    dropdown.toggle();
  }

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
    closeDropdown();
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

<div class="relative">
  <Dropdown
    {activeUrl}
    {dropdownStatus}
    {closeDropdown}
    class="absolute w-32 z-20 left-auto right-0 mt-5"
  >
    <DropdownUl class="border rounded-lg shadow">
      {#if isLoggedIn}
        {#each submissionStatusOptions as submissionStatus}
          <DropdownLi href="javascript:void(0)" onclick={() => handleClick(submissionStatus)}>
            <div class="flex items-center justify-between">
              {submissionStatus.labelName}

              {#if taskResult.status_name === submissionStatus.innerName}
                <Check class="w-4 h-4 text-primary-600 dark:text-gray-300" strokeWidth={3} />
              {/if}
            </div>
          </DropdownLi>
        {/each}
      {:else}
        <DropdownLi href={SIGNUP_PAGE}>アカウント作成</DropdownLi>
        <DropdownLi href={LOGIN_PAGE}>ログイン</DropdownLi>
      {/if}
    </DropdownUl>
  </Dropdown>

  {#if showForm && selectedSubmissionStatus}
    {@render submissionStatusForm(taskResult, selectedSubmissionStatus)}
  {/if}
</div>

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
