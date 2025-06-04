<script lang="ts">
  import { superForm } from 'sveltekit-superforms/client';

  import WorkBookForm from '$lib/components/WorkBook/WorkBookForm.svelte';
  import ErrorMessageAndReturnButton from '$lib/components/Messages/ErrorMessageAndReturnButton.svelte';

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
  <ErrorMessageAndReturnButton
    errorStatus={data.status}
    errorMessage={data.message}
    returnUrl={WORKBOOKS_PAGE}
    returnButtonLabel="問題集に戻る"
  />
{/if}
