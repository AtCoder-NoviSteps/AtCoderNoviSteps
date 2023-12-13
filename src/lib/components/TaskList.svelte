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
  import type { TaskResults } from '$lib/types/task';
  import { ATCODER_BASE_CONTEST_URL } from '$lib/constants/urls';
  import { getContestNameLabel } from '$lib/utils/contest';

  export let grade: string;
  export let gradeColor: string;
  export let taskResults: TaskResults;

  // TODO: ユーザの設定に応じて、ACかどうかの判定を変更できるようにする
  // TODO: 別ファイルに切り出す
  const accepted = 'ac';
  let acceptedCount = taskResults.filter(
    (taskResult) => taskResult.submission_status === accepted,
  ).length;
  let acceptedRatioPercent = (acceptedCount / taskResults.length) * 100;
</script>

<Accordion flush class="mt-4 mb-2">
  <AccordionItem>
    <span slot="header" class="text-xl flex justify-around w-full place-items-center">
      <div class="w-1/12 text-center">{grade}</div>
      <!-- TODO: 配色を修正 -->
      <ThermometerProgressBar {gradeColor} {acceptedRatioPercent} />
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
    <Table shadow hoverable={true} class="text-md">
      <TableHead class="text-md">
        <TableHeadCell class="w-1/6">提出状況</TableHeadCell>
        <TableHeadCell class="w-1/6">コンテスト名</TableHeadCell>
        <TableHeadCell class="w-1/2">問題名</TableHeadCell>
        <TableHeadCell class="w-1/6">
          <span class="sr-only">編集</span>
        </TableHeadCell>
      </TableHead>
      <TableBody tableBodyClass="divide-y">
        {#each taskResults as taskResult}
          <TableBodyRow>
            <TableBodyCell class="p-3">
              <Img
                src="../../{taskResult.submission_status}.png"
                alt={taskResult.submission_status}
                class="md:h-16 md:w-16"
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
                href="/problems/{taskResult.task_id}"
                class="font-medium text-primary-600 hover:underline dark:text-primary-500"
              >
                {taskResult.title}
              </a>
            </TableBodyCell>
            <TableBodyCell>編集</TableBodyCell>
          </TableBodyRow>
        {/each}
      </TableBody>
    </Table>
  </AccordionItem>
</Accordion>
