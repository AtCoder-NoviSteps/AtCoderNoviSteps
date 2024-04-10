<script lang="ts">
  import {
    AccordionItem,
    Accordion,
    Img,
    Table,
    TableBody,
    TableBodyCell,
    TableBodyRow,
    TableHead,
    TableHeadCell,
  } from 'flowbite-svelte';

  import ThermometerProgressBar from '$lib/components/ThermometerProgressBar.svelte';
  import { getBackgroundColorFrom, submission_statuses } from '$lib/services/submission_status';
  import type { TaskResults } from '$lib/types/task';
  import type { SubmissionRatios } from '$lib/types/submission';
  import { ATCODER_BASE_CONTEST_URL } from '$lib/constants/urls';
  import { getContestNameLabel } from '$lib/utils/contest';
  import { taskUrl, toWhiteTextIfNeeds } from '$lib/utils/task';

  export let grade: string;
  export let gradeColor: string;
  export let taskResults: TaskResults;
  export let isAdmin: boolean; // Admin権限がある場合は、編集リンクを表示する

  // TODO: ユーザの設定に応じて、ACかどうかの判定を変更できるようにする
  // TODO: 別ファイルに切り出す
  let acceptedCount = taskResults.filter((taskResult) => taskResult.is_ac).length;
  let acceptedRatioPercent = (acceptedCount / taskResults.length) * 100;

  const getRatioPercent = (taskResults: TaskResults, statusName: string) => {
    const count = taskResults.filter((taskResult) => taskResult.status_name === statusName).length;
    const ratioPercent = (count / taskResults.length) * 100;

    return ratioPercent;
  };

  const submissionRatios: SubmissionRatios = submission_statuses
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

    <!-- TODO: 「編集」ボタンを押したときに問題情報を更新できるようにする -->
    <!-- TODO: 問題が多くなってきたら、ページネーションを導入する -->
    <!-- TODO: 回答状況に応じて、フィルタリングできるようにする -->
    <Table shadow class="text-md">
      <TableHead class="text-sm bg-gray-100">
        <TableHeadCell class="w-1/6">提出状況</TableHeadCell>
        <TableHeadCell class="w-1/6">コンテスト名</TableHeadCell>
        <TableHeadCell class="w-1/2">問題名</TableHeadCell>
        <TableHeadCell class="w-1/6">
          <span class="sr-only">編集</span>
        </TableHeadCell>
      </TableHead>
      <TableBody tableBodyClass="divide-y">
        {#each taskResults as taskResult}
          <TableBodyRow class={getBackgroundColorFrom(taskResult.status_name)}>
            <TableBodyCell class="p-3">
              <Img
                src="../../{taskResult.submission_status_image_path}"
                alt={taskResult.submission_status_label_name}
                class="h-8 w-8"
              />
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
                href={taskUrl(taskResult)}
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
                <a
                  href="/problems/{taskResult.task_id}"
                  class="font-medium text-primary-600 hover:underline dark:text-primary-500"
                >
                  回答を更新
                </a>
              {/if}
            </TableBodyCell>
          </TableBodyRow>
        {/each}
      </TableBody>
    </Table>
  </AccordionItem>
</Accordion>
