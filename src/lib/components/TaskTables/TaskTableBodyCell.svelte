<script lang="ts">
  import { getStores } from '$app/stores';
  import { enhance } from '$app/forms';

  import { Dropdown, DropdownUl, DropdownLi, uiHelpers } from 'svelte-5-ui-lib';
  import EllipsisVertical from 'lucide-svelte/icons/ellipsis-vertical';

  import type { TaskResult } from '$lib/types/task';

  import GradeLabel from '$lib/components/GradeLabel.svelte';
  import ExternalLinkWrapper from '$lib/components/ExternalLinkWrapper.svelte';
  import InputFieldWrapper from '$lib/components/InputFieldWrapper.svelte';

  import { submission_statuses } from '$lib/services/submission_status';

  import { getTaskUrl, removeTaskIndexFromTitle } from '$lib/utils/task';

  interface Props {
    taskResult: TaskResult;
    isLoggedIn: boolean;
    onupdate?: (updatedTask: TaskResult) => void;
  }

  let { taskResult, isLoggedIn, onupdate = () => {} }: Props = $props();

  const { page } = getStores();
  let activeUrl = $state($page.url.pathname);

  let dropdown = uiHelpers();
  let dropdownStatus = $state(false);
  let closeDropdown = dropdown.close;

  $effect(() => {
    activeUrl = $page.url.pathname;
    dropdownStatus = dropdown.isOpen;
  });

  let selectedSubmissionStatus = $state<{
    innerId: string;
    innerName: string;
    labelName: string;
  }>();
  let showForm = $state(false);

  function handleSubmit(submissionStatus: {
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

  // FIXME: When customizing submission status, implement DB fetching for status options.
  const submissionStatusOptions = submission_statuses.map((status) => {
    const option = {
      innerId: status.id,
      innerName: status.status_name,
      labelName: status.label_name,
    };
    return option;
  });
</script>

<div class="flex items-center w-full space-x-1 text-left text-sm sm:text-md">
  {@render taskGradeLabel(taskResult)}

  <div class="flex justify-between w-full min-w-0">
    {@render taskTitleAndExternalLink(taskResult)}

    {#if isLoggedIn}
      {@render submissionUpdaterAndLinksOfTaskDetailPage(taskResult)}
    {/if}
  </div>
</div>

{#snippet taskGradeLabel(taskResult: TaskResult)}
  <div class="flex-shrink-0">
    <GradeLabel
      taskGrade={taskResult.grade}
      defaultPadding={0.25}
      defaultWidth={6}
      reducedWidth={6}
    />
  </div>
{/snippet}

{#snippet taskTitleAndExternalLink(taskResult: TaskResult)}
  <div class="max-w-[calc(100%-2rem)] truncate">
    <ExternalLinkWrapper
      url={getTaskUrl(taskResult.contest_id, taskResult.task_id)}
      description={removeTaskIndexFromTitle(taskResult.title, taskResult.task_table_index)}
      textSize="xs:text-md"
      textColorInDarkMode="dark:text-gray-300"
      iconSize={0}
    />
  </div>
{/snippet}

<!-- See: -->
<!-- https://svelte-5-ui-lib.codewithshin.com/components/dropdown -->
{#snippet submissionUpdaterAndLinksOfTaskDetailPage(selectedTaskResult: TaskResult)}
  <div class="flex items-start justify-center">
    <button
      type="button"
      class="flex-shrink-0 w-6 ml-auto"
      onclick={dropdown.toggle}
      aria-label="Update submission for {selectedTaskResult.title}"
    >
      <EllipsisVertical class="w-4 h-4 mx-auto" />
    </button>

    {@render dropdownList(selectedTaskResult)}
  </div>
{/snippet}

{#snippet dropdownList(selectedTaskResult: TaskResult)}
  <div class="relative">
    <Dropdown
      {activeUrl}
      {dropdownStatus}
      {closeDropdown}
      class="absolute w-24 z-20 left-auto right-0 mt-8"
    >
      <DropdownUl>
        {#each submissionStatusOptions as submissionStatus}
          <DropdownLi href="javascript:void(0)" onclick={() => handleSubmit(submissionStatus)}>
            {submissionStatus.labelName}
          </DropdownLi>
        {/each}
      </DropdownUl>
    </Dropdown>

    {#if showForm && selectedSubmissionStatus}
      {@render submissionStatusForm(selectedTaskResult, selectedSubmissionStatus)}
    {/if}
  </div>
{/snippet}

{#snippet submissionStatusForm(
  selectedTaskResult: TaskResult,
  submissionStatus: { innerId: string; innerName: string; labelName: string },
)}
  <form
    id="submissionStatusForm"
    method="POST"
    action="?/update"
    style="display:none;"
    use:enhance={({ formData, action, cancel }) => {
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
        .then(() => {
          const updatedTaskResult = {
            ...taskResult,
            status_name: submissionStatus.innerName,
            status_id: submissionStatus.innerId,
            submission_status_label_name: submissionStatus.labelName,
            is_ac: submissionStatus.innerName === 'ac',
            updated_at: new Date(),
          };

          onupdate(updatedTaskResult);
        })
        .catch((error) => {
          console.error('Failed to submit task status:', error);
        })
        .finally(() => {
          closeDropdown();
          showForm = false;
        });

      // Do not change anything in SvelteKit.
      return () => {};
    }}
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
