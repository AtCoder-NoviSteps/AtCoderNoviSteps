<script lang="ts">
  import { superForm } from 'sveltekit-superforms/client';

  import WorkBookForm from '$lib/components/WorkBook/WorkBookForm.svelte';

  import { WorkBookType, type WorkBookTasksBase } from '$lib/types/workbook';
  import type { Task } from '$lib/types/task';

  let { data } = $props();

  // See:
  // https://superforms.rocks/concepts/nested-data
  const initialData = {
    ...data.form,
    workBookTasks: [] as WorkBookTasksBase,
  };
  const superFormObject = superForm(initialData, {
    dataType: 'json',
  });
  const { form } = superFormObject;

  $form.authorId = data.author.id;
  $form.isOfficial = data.isAdmin;
  $form.workBookType = $form.isOfficial ? WorkBookType.CURRICULUM : WorkBookType.CREATED_BY_USER;

  const tasksMapByIds: Map<string, Task> = data.tasksMapByIds;
</script>

<WorkBookForm
  pageTitle="問題集を作成"
  breadcrumbTitle={'問題集を作成'}
  isAdmin={data.isAdmin}
  {superFormObject}
  {tasksMapByIds}
  submitButtonLabel="作成"
/>
