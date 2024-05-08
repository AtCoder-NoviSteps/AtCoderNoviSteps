<script lang="ts">
  import { superForm } from 'sveltekit-superforms/client';
  import { Breadcrumb, BreadcrumbItem } from 'flowbite-svelte';

  import {
    WorkBookType,
    type WorkBookTaskBase,
    type WorkBookTaskCreate,
  } from '$lib/types/workbook';
  import type { Tasks } from '$lib/types/task';

  import HeadingOne from '$lib/components/HeadingOne.svelte';
  import WorkBookInputFields from '$lib/components/WorkBooks/WorkBookInputFields.svelte';
  import WorkBookTasksTable from '$lib/components/WorkBookTasks/WorkBookTasksTable.svelte';
  import TaskSearchBox from '$lib/components/TaskSearchBox.svelte';
  import InputFieldWrapper from '$lib/components/InputFieldWrapper.svelte';
  import SubmissionButton from '$lib/components/SubmissionButton.svelte';

  export let data;

  // See:
  // https://superforms.rocks/concepts/nested-data
  const initialData = {
    ...data.form,
    workBookTasks: [] as WorkBookTaskBase[],
  };
  const { form, enhance } = superForm(initialData, {
    dataType: 'json',
  });

  $form.userId = data.author.id;
  $form.isOfficial = data.isAdmin;
  $form.workBookType = $form.isOfficial ? WorkBookType.TEXTBOOK : WorkBookType.CREATED_BY_USER;

  $: workBookTasksForTable = [] as WorkBookTaskCreate[];

  const tasks: Tasks = data.tasks;
</script>

<!-- TODO: 問題集の編集ページのコンポーネントとほぼ共通しているのでリファクタリング -->
<div class="container mx-auto w-5/6">
  <form method="post" use:enhance>
    <HeadingOne title="問題集を作成" />

    <Breadcrumb aria-label="">
      <BreadcrumbItem href="/workbooks" home>問題集一覧</BreadcrumbItem>
    </Breadcrumb>

    <WorkBookInputFields
      bind:authorId={$form.userId}
      bind:workBookTitle={$form.title}
      bind:description={$form.description}
      bind:isPublished={$form.isPublished}
      bind:isOfficial={$form.isOfficial}
      bind:workBookType={$form.workBookType}
    />

    <!-- 問題一覧 -->
    <WorkBookTasksTable bind:workBookTasks={$form.workBookTasks} bind:workBookTasksForTable />

    <!-- 問題を検索 -->
    <!-- HACK: 属性が微妙に異なるため、やむなくデータベースへの保存用と問題集作成・編集用で分けている。 -->
    <TaskSearchBox {tasks} bind:workBookTasks={$form.workBookTasks} bind:workBookTasksForTable />
    <InputFieldWrapper
      inputFieldType="hidden"
      inputFieldName="workBookTasks"
      inputValue={$form.workBookTasks}
    />

    <!-- 作成ボタンを追加 -->
    <div class="flex flex-wrap md:justify-center md:items-center">
      <SubmissionButton width="w-full md:max-w-md " labelName="作成" />
    </div>
  </form>
</div>
