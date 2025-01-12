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

  import { type TaskResults, TaskGrade } from '$lib/types/task';

  import ThermometerProgressBar from '$lib/components/ThermometerProgressBar.svelte';
  import UpdatingModal from '$lib/components/SubmissionStatus/UpdatingModal.svelte';
  import SubmissionStatusImage from '$lib/components/SubmissionStatus/SubmissionStatusImage.svelte';
  import ExternalLinkWrapper from '$lib/components/ExternalLinkWrapper.svelte';
  import AcceptedCounter from '$lib/components/SubmissionStatus/AcceptedCounter.svelte';
  import { getBackgroundColorFrom } from '$lib/services/submission_status';
  import { addContestNameToTaskIndex } from '$lib/utils/contest';
  import { toWhiteTextIfNeeds, getTaskUrl, removeTaskIndexFromTitle } from '$lib/utils/task';

  export let grade: string;
  export let gradeColor: string;
  export let taskResults: TaskResults;
  export let isAdmin: boolean;
  export let isLoggedIn: boolean;

  let updatingModal: UpdatingModal;
</script>

<Accordion flush class="mt-4 mb-2">
  <AccordionItem>
    <span slot="header" class="flex justify-around w-full place-items-center">
      <div
        class="text-sm xs:text-xl w-9 xs:w-12 p-0.5 text-center rounded-lg {toWhiteTextIfNeeds(
          grade,
        )} {gradeColor}"
      >
        {#if grade !== TaskGrade.PENDING}
          {grade}
        {:else}
          ??
        {/if}
      </div>

      <ThermometerProgressBar {taskResults} />
      <AcceptedCounter {taskResults} />
    </span>

    <!-- FIXME: clickを1回実行するとactionsが2回実行されてしまう。原因と修正方法が分かっていない。 -->
    <!-- TODO: 問題が多くなってきたら、ページネーションを導入する -->
    <!-- TODO: 回答状況に応じて、フィルタリングできるようにする -->
    <div class="overflow-auto rounded-md border">
      <Table shadow id={grade} class="text-md table-fixed w-full">
        <TableHead class="text-sm bg-gray-100">
          <TableHeadCell class="w-20 sm:w-24 min-w-[5rem]">回答</TableHeadCell>
          <TableHeadCell class="w-1/2 text-left pl-0 sm:pl-6 truncate overflow-ellipsis">
            問題名
          </TableHeadCell>
          <TableHeadCell class="w-1/3 hidden sm:table-cell text-left pl-0 truncate">
            出典
          </TableHeadCell>
          <TableHeadCell class="w-6 text-center">
            <span class="sr-only">編集</span>
          </TableHeadCell>
        </TableHead>
        <TableBody tableBodyClass="divide-y">
          {#each taskResults as taskResult}
            <TableBodyRow
              id={taskResult.contest_id + '-' + taskResult.task_id}
              class={getBackgroundColorFrom(taskResult.status_name)}
            >
              <TableBodyCell
                class="justify-center w-20 px-1 sm:px-3 pt-1 sm:pt-3 pb-0.5 sm:pb-1"
                onclick={() => updatingModal.openModal(taskResult)}
              >
                <div class="flex items-center justify-center w-full h-full">
                  <SubmissionStatusImage {taskResult} {isLoggedIn} />
                </div>
              </TableBodyCell>
              <TableBodyCell class="w-1/2 text-left truncate pl-0 sm:pl-6">
                <ExternalLinkWrapper
                  url={getTaskUrl(taskResult.contest_id, taskResult.task_id)}
                  description={removeTaskIndexFromTitle(
                    taskResult.title,
                    taskResult.task_table_index,
                  )}
                  textSize="xs:text-lg"
                  textColorInDarkMode="dark:text-gray-300"
                />
              </TableBodyCell>
              <TableBodyCell
                class="w-1/3 hidden sm:table-cell text-left truncate pl-0 xs:text-lg text-gray-700 dark:text-gray-300"
              >
                {addContestNameToTaskIndex(taskResult.contest_id, taskResult.task_table_index)}
              </TableBodyCell>
              <TableBodyCell class="w-6 px-0">
                {#if isAdmin}
                  <div class="flex justify-center items-center px-0">
                    <a
                      href="/tasks/{taskResult.task_id}"
                      class="font-medium text-primary-600 hover:underline dark:text-gray-300"
                    >
                      編集
                    </a>
                  </div>
                {:else}
                  <!-- TODO: 解説を閲覧できるようにする -->
                {/if}
              </TableBodyCell>
            </TableBodyRow>
          {/each}
        </TableBody>
      </Table>
    </div>
  </AccordionItem>
</Accordion>

<UpdatingModal bind:this={updatingModal} {isLoggedIn} />
