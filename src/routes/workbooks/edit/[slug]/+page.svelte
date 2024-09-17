<script lang="ts">
  import { superForm } from 'sveltekit-superforms/client';
  import { Breadcrumb, BreadcrumbItem } from 'flowbite-svelte';

  import type { WorkBookTasksBase, WorkBookTasksEdit } from '$lib/types/workbook';
  import type { Task, Tasks } from '$lib/types/task.js';

  import { preventEnterKey } from '$lib/actions/prevent_enter_key';
  import HeadingOne from '$lib/components/HeadingOne.svelte';
  import WorkBookInputFields from '$lib/components/WorkBooks/WorkBookInputFields.svelte';
  import WorkBookTasksTable from '$lib/components/WorkBookTasks/WorkBookTasksTable.svelte';
  import TaskSearchBox from '$lib/components/TaskSearchBox.svelte';
  import InputFieldWrapper from '$lib/components/InputFieldWrapper.svelte';
  import SubmissionButton from '$lib/components/SubmissionButton.svelte';
  import { FORBIDDEN } from '$lib/constants/http-response-status-codes.js';

  export let data;

  $: canView = data.status === FORBIDDEN ? false : true;

  let workBook = data.workBook;

  // See:
  // https://superforms.rocks/concepts/nested-data
  const initialData = {
    ...data.form,
    workBookTasks: workBook.workBookTasks as WorkBookTasksBase,
  };
  const { form, message, errors, enhance } = superForm(initialData, {
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
        comment: workBookTask.comment,
      };
    }
  }) as WorkBookTasksEdit;
</script>

{#if canView}
  <!-- TODO: 問題集の作成ページのコンポーネントとほぼ共通しているのでリファクタリング -->
  <div class="container mx-auto w-5/6">
    <form method="post" use:enhance use:preventEnterKey class="space-y-4">
      <HeadingOne title="問題集を編集" />

      <!-- TODO: コンポーネントとして切り出す -->
      <Breadcrumb aria-label="">
        <BreadcrumbItem href="/workbooks" home>問題集</BreadcrumbItem>
        <BreadcrumbItem>
          <div class="min-w-[96px] max-w-[120px] sm:max-w-[300px] lg:max-w-[600px] truncate">
            {workBook.title}
          </div>
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
        isAdmin={data.loggedInAsAdmin}
        message={$message}
        errors={$errors}
      />

      <!-- 問題を検索 -->
      <!-- HACK: 属性が微妙に異なるため、やむなくデータベースへの保存用と問題集作成・編集用で分けている。 -->
      <div class="space-y-2">
        <TaskSearchBox
          {tasks}
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

      <!-- データベースに保存されている問題 + 検索で追加した問題を表示 -->
      <WorkBookTasksTable
        {tasksMapByIds}
        bind:workBookTasks={$form.workBookTasks}
        bind:workBookTasksForTable
      />

      <!-- 更新ボタン -->
      <div class="flex flex-wrap md:justify-center md:items-center">
        <SubmissionButton width="w-full md:max-w-md mt-4" labelName="更新" />
      </div>
    </form>
  </div>
{:else}
  <!-- TODO: コンポーネントとして抽出 -->
  <h1>{data.status}</h1>
  <p>{data.message}</p>
{/if}
