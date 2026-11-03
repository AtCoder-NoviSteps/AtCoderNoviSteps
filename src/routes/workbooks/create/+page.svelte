<script lang="ts">
  import { untrack } from 'svelte';
  import { superForm } from 'sveltekit-superforms/client';

  import type { Task } from '#lib/types/task.js';
  import { WorkBookType, type WorkBookTasksBase } from '#features/workbooks/types/workbook.js';

  import WorkBookForm from '#features/workbooks/components/shared/WorkBookForm.svelte';

  let { data } = $props();

  // superForm owns the form state after init, so seed it once from the load data.
  // See:
  // https://superforms.rocks/concepts/nested-data
  const initialData = untrack(() => ({
    ...data.form,
    workBookTasks: [] as WorkBookTasksBase,
  }));
  const superFormObject = superForm(initialData, {
    dataType: 'json',
  });
  const { form } = superFormObject;

  $form.authorId = untrack(() => data.author.id);
  $form.isOfficial = untrack(() => data.isAdmin);
  $form.workBookType = $form.isOfficial ? WorkBookType.CURRICULUM : WorkBookType.CREATED_BY_USER;

  const tasksMapByIds: Map<string, Task> = $derived(data.tasksMapByIds);
</script>

<WorkBookForm
  pageTitle="問題集を作成"
  breadcrumbTitle="問題集を作成"
  isAdmin={data.isAdmin}
  {superFormObject}
  {tasksMapByIds}
  submitButtonLabel="作成"
/>
