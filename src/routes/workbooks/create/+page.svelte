<script lang="ts">
  import { superForm } from 'sveltekit-superforms/client';
  import { Breadcrumb, BreadcrumbItem } from 'flowbite-svelte';

  import {
    WorkBookType,
    type WorkBookTasksBase,
    type WorkBookTaskCreate,
  } from '$lib/types/workbook';
  import type { Task } from '$lib/types/task';

  import { preventEnterKey } from '$lib/actions/prevent_enter_key';
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
    workBookTasks: [] as WorkBookTasksBase,
  };
  const { form, message, errors, enhance } = superForm(initialData, {
    dataType: 'json',
  });

  $form.authorId = data.author.id;
  $form.isOfficial = data.isAdmin;
  $form.workBookType = $form.isOfficial ? WorkBookType.CURRICULUM : WorkBookType.CREATED_BY_USER;

  $: workBookTasksForTable = [] as WorkBookTaskCreate[];

  const tasksMapByIds: Map<string, Task> = data.tasksMapByIds;
</script>

<!-- TODO: 問題集の編集ページのコンポーネントとほぼ共通しているのでリファクタリング -->
<div class="container mx-auto w-5/6">
  <form method="post" use:enhance use:preventEnterKey class="space-y-4">
    <HeadingOne title="問題集を作成" />

    <Breadcrumb aria-label="">
      <BreadcrumbItem href="/workbooks" home>問題集</BreadcrumbItem>
      <BreadcrumbItem>
        <div class="min-w-[96px] max-w-[120px] truncate">問題集を作成</div>
      </BreadcrumbItem>
    </Breadcrumb>

    <WorkBookInputFields
      bind:authorId={$form.authorId}
      bind:workBookTitle={$form.title}
      bind:description={$form.description}
      bind:editorialUrl={$form.editorialUrl}
      bind:isPublished={$form.isPublished}
      bind:isOfficial={$form.isOfficial}
      bind:isReplenished={$form.isReplenished}
      bind:workBookType={$form.workBookType}
      isAdmin={data.isAdmin}
      message={$message}
      errors={$errors}
    />

    <!-- 問題を検索 -->
    <!-- HACK: 属性が微妙に異なるため、やむなくデータベースへの保存用と問題集作成・編集用で分けている。 -->
    <div class="space-y-2">
      <TaskSearchBox
        tasks={Array.from(tasksMapByIds.values())}
        bind:workBookTasks={$form.workBookTasks}
        bind:workBookTasksForTable
      />
      <InputFieldWrapper
        inputFieldType="hidden"
        inputFieldName="workBookTasks"
        inputValue={$form.workBookTasks}
        message={$errors.workBookTasks?._errors}
      />
    </div>

    <!-- 問題一覧 -->
    <WorkBookTasksTable
      {tasksMapByIds}
      bind:workBookTasks={$form.workBookTasks}
      bind:workBookTasksForTable
    />

    <!-- 作成ボタンを追加 -->
    <div class="flex flex-wrap md:justify-center md:items-center">
      <SubmissionButton width="w-full md:max-w-md mt-4" labelName="作成" />
    </div>
  </form>
</div>
