<script lang="ts">
  import { superForm } from 'sveltekit-superforms/client';
  import { Heading, Button } from 'svelte-5-ui-lib';

  import HeadingOne from '$lib/components/HeadingOne.svelte';
  import WorkBookForm from '$lib/components/WorkBook/WorkBookForm.svelte';

  import type { WorkBookTasksBase } from '$lib/types/workbook';
  import type { Task } from '$lib/types/task.js';

  import { FORBIDDEN } from '$lib/constants/http-response-status-codes.js';
  import { WORKBOOKS_PAGE } from '$lib/constants/navbar-links';

  let { data } = $props();
  let canView = $derived(data.status === FORBIDDEN ? false : true);

  let workBook = data.workBook;

  // See:
  // https://superforms.rocks/concepts/nested-data
  const initialData = {
    ...data.form,
    workBookTasks: workBook.workBookTasks as WorkBookTasksBase,
  };
  const superFormObject = superForm(initialData, {
    dataType: 'json',
  });

  // Create data of workbook for edit based on database.
  const tasksMapByIds: Map<string, Task> = data.tasksMapByIds;
</script>

{#if canView}
  <WorkBookForm
    pageTitle="問題集を編集"
    breadcrumbTitle={workBook.title}
    isAdmin={data.loggedInAsAdmin}
    {superFormObject}
    {tasksMapByIds}
    submitButtonLabel="更新"
  />
{:else}
  <!-- TODO: コンポーネントとして抽出 -->
  <div
    class="container mx-auto md:w-4/5 lg:w-2/3 py-4 md:py-8 px-3 md:px-0 flex flex-col items-center"
  >
    <HeadingOne title="エラーが発生しました" />

    <Heading tag="h2" class="text-3xl mb-3 text-gray-900 dark:text-gray-300">
      {data.status}
    </Heading>

    <p class="dark:text-gray-300">{data.message}</p>

    <div class="flex justify-center mt-6">
      <Button href={WORKBOOKS_PAGE} color="primary" class="px-6">
        {'問題集に戻る'}
      </Button>
    </div>
  </div>
{/if}
