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

  import type { TaskResult, TaskResults } from '$lib/types/task';
  import type { SubmissionRatios } from '$lib/types/submission';

  import ThermometerProgressBar from '$lib/components/ThermometerProgressBar.svelte';
  import UpdatingModal from '$lib/components/SubmissionStatus/UpdatingModal.svelte';
  import SubmissionStatusImage from '$lib/components/SubmissionStatus/SubmissionStatusImage.svelte';
  import { getBackgroundColorFrom, submission_statuses } from '$lib/services/submission_status';
  import { ATCODER_BASE_CONTEST_URL } from '$lib/constants/urls';
  import { getContestNameLabel } from '$lib/utils/contest';
  import { taskUrl, toWhiteTextIfNeeds } from '$lib/utils/task';

  export let grade: string;
  export let gradeColor: string;
  export let taskResults: TaskResults;
  export let isAdmin: boolean;
  export let isLoggedIn: boolean;

  // TODO: ユーザの設定に応じて、ACかどうかの判定を変更できるようにする
  // TODO: 別ファイルに切り出す
  let acceptedCount: number;
  let acceptedRatioPercent: number;
  let submissionRatios: SubmissionRatios;

  const getRatioPercent = (taskResults: TaskResults, statusName: string) => {
    const count = taskResults.filter((taskResult) => taskResult.status_name === statusName).length;
    const ratioPercent = (count / taskResults.length) * 100;

    return ratioPercent;
  };

  $: {
    acceptedCount = taskResults.filter((taskResult: TaskResult) => taskResult.is_ac).length;
    acceptedRatioPercent = (acceptedCount / taskResults.length) * 100;

    submissionRatios = submission_statuses
      .filter((status) => status.status_name !== 'ns')
      .map((status) => {
        const name = status.status_name;
        const results = {
          name: name,
          ratioPercent: getRatioPercent(taskResults, name),
          color: status.background_color,
        };

        return results;
      });
  }

  let updatingModal: UpdatingModal;
</script>

<Accordion flush class="mt-4 mb-2">
  <AccordionItem>
    <span slot="header" class="text-xl flex justify-around w-full place-items-center">
      <div class="w-1/12 text-center rounded-lg {toWhiteTextIfNeeds(grade)} {gradeColor}">
        {grade}
      </div>

      <ThermometerProgressBar {submissionRatios} />

      <!-- See: -->
      <!-- https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Number/toFixed -->
      <div class="text-sm w-1/12 text-center">
        <div>
          {acceptedCount} / {taskResults.length}
        </div>
        <div>
          {`(${acceptedRatioPercent.toFixed(1)}%)`}
        </div>
      </div>
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
