<script lang="ts">
  import {
    AccordionItem,
    Accordion,
    Table,
    TableBody,
    TableBodyCell,
    TableBodyRow,
    TableHead,
    TableHeadCell,
  } from 'flowbite-svelte';

  import type { TaskResults } from '$lib/types/task';

  import ThermometerProgressBar from '$lib/components/ThermometerProgressBar.svelte';
  import UpdatingModal from '$lib/components/SubmissionStatus/UpdatingModal.svelte';
  import SubmissionStatusImage from '$lib/components/SubmissionStatus/SubmissionStatusImage.svelte';
  import AcceptedCounter from '$lib/components/SubmissionStatus/AcceptedCounter.svelte';
  import { getBackgroundColorFrom } from '$lib/services/submission_status';
  import { ATCODER_BASE_CONTEST_URL } from '$lib/constants/urls';
  import { getContestNameLabel } from '$lib/utils/contest';
  import { taskUrl, toWhiteTextIfNeeds } from '$lib/utils/task';

  export let grade: string;
  export let gradeColor: string;
  export let taskResults: TaskResults;
  export let isAdmin: boolean;
  export let isLoggedIn: boolean;

  let updatingModal: UpdatingModal;
</script>

<Accordion flush class="mt-4 mb-2">
  <AccordionItem>
    <span slot="header" class="text-xl flex justify-around w-full place-items-center">
      <div class="w-1/12 text-center rounded-lg {toWhiteTextIfNeeds(grade)} {gradeColor}">
        {grade}
      </div>

      <ThermometerProgressBar {taskResults} />
      <AcceptedCounter {taskResults} />
    </span>

    <!-- FIXME: clickを1回実行するとactionsが2回実行されてしまう。原因と修正方法が分かっていない。 -->
    <!-- TODO: 「編集」ボタンを押したときに問題情報を更新できるようにする -->
    <!-- TODO: 問題が多くなってきたら、ページネーションを導入する -->
    <!-- TODO: 回答状況に応じて、フィルタリングできるようにする -->
    <Table shadow class="text-md">
      <TableHead class="text-sm bg-gray-100">
        <TableHeadCell class="w-1/6">回答</TableHeadCell>
        <TableHeadCell class="w-1/6">コンテスト名</TableHeadCell>
        <TableHeadCell class="w-1/2">問題名</TableHeadCell>
        <TableHeadCell class="w-1/6">
          <span class="sr-only">編集</span>
        </TableHeadCell>
      </TableHead>
      <TableBody tableBodyClass="divide-y">
        {#each taskResults as taskResult}
          <TableBodyRow
            key={taskResult.contest_id + taskResult.task_id}
            class={getBackgroundColorFrom(taskResult.status_name)}
          >
            <TableBodyCell
              class="p-3 pl-3 md:pl-6 flex items-center"
              on:click={() => updatingModal.openModal(taskResult)}
            >
              <SubmissionStatusImage {taskResult} {isLoggedIn} />
            </TableBodyCell>
            <TableBodyCell>
              <a
                href="{ATCODER_BASE_CONTEST_URL}/{taskResult.contest_id}"
                class="font-medium text-primary-600 hover:underline dark:text-primary-500"
                target="_blank"
                rel="noreferrer"
              >
                {getContestNameLabel(taskResult.contest_id)}
              </a>
            </TableBodyCell>
            <TableBodyCell>
              <a
                href={taskUrl(taskResult.contest_id, taskResult.task_id)}
                target="_blank"
                rel="noreferrer"
                class="font-medium text-primary-600 hover:underline dark:text-primary-500"
              >
                {taskResult.title}
              </a>
            </TableBodyCell>
            <TableBodyCell>
              {#if isAdmin}
                <a
                  href="/tasks/{taskResult.task_id}"
                  class="font-medium text-primary-600 hover:underline dark:text-primary-500"
                >
                  編集
                </a>
              {:else}
                <!-- TODO: 解説を閲覧できるようにする -->
              {/if}
            </TableBodyCell>
          </TableBodyRow>
        {/each}
      </TableBody>
    </Table>
  </AccordionItem>
</Accordion>

<UpdatingModal bind:this={updatingModal} {isLoggedIn} />
