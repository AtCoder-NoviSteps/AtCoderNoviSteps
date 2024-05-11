<script lang="ts">
  import { superForm } from 'sveltekit-superforms/client';
  import { Breadcrumb, BreadcrumbItem } from 'flowbite-svelte';

  import type { WorkBookTaskBase, WorkBookTaskEdit } from '$lib/types/workbook';
  import type { Task, Tasks } from '$lib/types/task.js';
  import HeadingOne from '$lib/components/HeadingOne.svelte';
  import WorkBookInputFields from '$lib/components/WorkBooks/WorkBookInputFields.svelte';
  import WorkBookTasksTable from '$lib/components/WorkBookTasks/WorkBookTasksTable.svelte';
  import TaskSearchBox from '$lib/components/TaskSearchBox.svelte';
  import InputFieldWrapper from '$lib/components/InputFieldWrapper.svelte';
  import SubmissionButton from '$lib/components/SubmissionButton.svelte';

  export let data;

  let workBook = data.workBook;

  // See:
  // https://superforms.rocks/concepts/nested-data
  const initialData = {
    ...data.form,
    workBookTasks: workBook.workBookTasks as WorkBookTaskBase[],
  };
  const { form, enhance } = superForm(initialData, {
    dataType: 'json',
  });

  const tasks: Tasks = data.tasks;

  // データベースに基づいて、問題集の編集用データを作成
  const tasksMapByIds: Map<string, Task> = data.tasksMapByIds;

  $: workBookTasksForTable = $form.workBookTasks.map((workBookTask) => {
    const task = tasksMapByIds.get(workBookTask.taskId);

    if (task) {
      return {
        contestId: task.contest_id,
        title: task.title,
        taskId: workBookTask.taskId,
        priority: workBookTask.priority,
      };
    }
  }) as WorkBookTaskEdit[];
</script>

<!-- TODO: 問題集の作成ページのコンポーネントとほぼ共通しているのでリファクタリング -->
<div class="container mx-auto w-5/6">
  <form method="post" use:enhance>
    <HeadingOne title="問題集を編集" />

    <!-- TODO: コンポーネントとして切り出す -->
    <Breadcrumb aria-label="">
      <BreadcrumbItem href="/workbooks" home>問題集一覧</BreadcrumbItem>
      <BreadcrumbItem>{workBook.title}</BreadcrumbItem>
    </Breadcrumb>

    <WorkBookInputFields
      bind:authorId={$form.authorId}
      bind:workBookTitle={$form.title}
      bind:description={$form.description}
      bind:isPublished={$form.isPublished}
      bind:isOfficial={$form.isOfficial}
      bind:workBookType={$form.workBookType}
    />

    <!-- データベースに保存されている問題 + 検索で追加した問題を表示 -->
    <WorkBookTasksTable bind:workBookTasks={$form.workBookTasks} bind:workBookTasksForTable />

    <!-- 問題を検索 -->
    <!-- HACK: 属性が微妙に異なるため、やむなくデータベースへの保存用と問題集作成・編集用で分けている。 -->
    <TaskSearchBox {tasks} bind:workBookTasks={$form.workBookTasks} bind:workBookTasksForTable />
    <InputFieldWrapper
      inputFieldType="hidden"
      inputFieldName="workBookTasks"
      inputValue={$form.workBookTasks}
    />

    <!-- 更新ボタン -->
    <div class="flex flex-wrap md:justify-center md:items-center">
      <SubmissionButton width="w-full md:max-w-md " labelName="更新" />
    </div>
  </form>
</div>
