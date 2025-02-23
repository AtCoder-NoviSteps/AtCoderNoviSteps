<script lang="ts">
  import { enhance } from '$app/forms';

  import { Button, Modal, Select, uiHelpers } from 'svelte-5-ui-lib';

  import type { TaskResult } from '$lib/types/task';

  import { submission_statuses } from '$lib/services/submission_status';
  import { errorMessageStore } from '$lib/stores/error_message';

  import { getContestNameLabel } from '$lib/utils/contest';
  import InputFieldWrapper from '$lib/components/InputFieldWrapper.svelte';

  interface Props {
    isLoggedIn: boolean;
  }

  let { isLoggedIn }: Props = $props();

  const modal = uiHelpers();
  let modalStatus = $state(false);
  const closeModal = () => {
    modal.close();
  };

  $effect(() => {
    modalStatus = modal.isOpen;
  });

  let selectedTaskResult = $state<TaskResult | null>(null);
  let selectedSubmissionStatus: string = $state('');

  export function openModal(taskResult: TaskResult): void {
    modal.open();
    selectedTaskResult = taskResult;
    selectedSubmissionStatus = taskResult.status_name;
  }

  // FIXME: When customizing submission status, implement DB fetching for status options.
  const submissionStatusOptions = submission_statuses.map((status) => {
    const option = {
      value: status.status_name,
      name: status.label_name,
    };
    return option;
  });

  const FAILED_TO_UPDATE_SUBMISSION_STATUS =
    '回答状況の更新に失敗しました。もう一度試してください。';

  async function handleSubmit(event: Event) {
    event.preventDefault();

    try {
      const response = await fetch('?/update', {
        method: 'POST',
        body: new FormData(event.target as HTMLFormElement),
      });

      if (!response.ok) {
        errorMessageStore.setAndClearAfterTimeout(FAILED_TO_UPDATE_SUBMISSION_STATUS, 10000);
        return;
      }

      errorMessageStore.setAndClearAfterTimeout(null);
      closeModal();
    } catch (error) {
      console.error('Failed to update submission status: ', error);
      errorMessageStore.setAndClearAfterTimeout(FAILED_TO_UPDATE_SUBMISSION_STATUS, 10000);
    }
  }
</script>

{#if isLoggedIn && selectedTaskResult}
  <Modal
    title="{getContestNameLabel(selectedTaskResult.contest_id)} - {selectedTaskResult.title}"
    size="sm"
    {modalStatus}
    {closeModal}
    outsideClose
  >
    <form method="POST" action="?/update" onsubmit={handleSubmit} use:enhance>
      <!-- 問題名-->
      <InputFieldWrapper
        inputFieldType="hidden"
        inputFieldName="taskId"
        bind:inputValue={selectedTaskResult.task_id}
      />

      <!-- 指定した問題の回答状況の候補 -->
      <Select
        placeholder=""
        name="submissionStatus"
        items={submissionStatusOptions}
        class="mb-4"
        bind:value={selectedSubmissionStatus}
      />

      <Button type="submit" class="w-full">回答を更新</Button>
    </form>
  </Modal>
{/if}
