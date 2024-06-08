<script lang="ts">
  import { enhance } from '$app/forms';
  import { Button, Modal, Select } from 'flowbite-svelte';

  import type { TaskResult } from '$lib/types/task';
  import { submission_statuses } from '$lib/services/submission_status';
  import { errorMessageStore } from '$lib/stores/error_message';

  import { getContestNameLabel } from '$lib/utils/contest';
  import InputFieldWrapper from '$lib/components/InputFieldWrapper.svelte';

  export let isLoggedIn: boolean;

  let defaultModal = false;
  let selectedTaskResult: TaskResult;
  let selectedSubmissionStatus: string;

  export function openModal(taskResult: TaskResult) {
    defaultModal = true;
    selectedTaskResult = taskResult;
    selectedSubmissionStatus = taskResult.status_name;
  }

  function closeModal() {
    defaultModal = false;
  }

  // FIXME: 回答状況をカスタマイズする場合はDBから取得できるようにする。
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
      errorMessageStore.setAndClearAfterTimeout(FAILED_TO_UPDATE_SUBMISSION_STATUS, 10000);
    }
  }
</script>

{#if isLoggedIn && selectedTaskResult}
  <Modal
    title="{getContestNameLabel(selectedTaskResult.contest_id)} - {selectedTaskResult.title}"
    size="sm"
    outsideclose
    bind:open={defaultModal}
    on:close={closeModal}
  >
    <form method="POST" action="?/update" on:submit={handleSubmit} use:enhance>
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
