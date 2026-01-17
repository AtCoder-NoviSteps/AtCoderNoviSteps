<script lang="ts">
  import { Breadcrumb, BreadcrumbItem } from 'flowbite-svelte';

  import HeadingOne from '$lib/components/HeadingOne.svelte';
  import WorkBookInputFields from '$lib/components/WorkBook/WorkBookInputFields.svelte';
  import WorkBookTasksTable from '$lib/components/WorkBookTasks/WorkBookTasksTable.svelte';
  import TaskSearchBox from '$lib/components/TaskSearchBox.svelte';
  import InputFieldWrapper from '$lib/components/InputFieldWrapper.svelte';
  import SubmissionButton from '$lib/components/SubmissionButton.svelte';

  import { preventEnterKey } from '$lib/actions/prevent_enter_key';

  import type { Task, Tasks } from '$lib/types/task';
  import type {
    WorkBookTaskCreate,
    WorkBookTasksCreate,
    WorkBookTaskEdit,
    WorkBookTasksEdit,
  } from '$lib/types/workbook';

  interface Props {
    pageTitle: string;
    breadcrumbTitle: string;
    isAdmin: boolean;
    // type is any, so we have no choice but to use it.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    superFormObject: any; // superForm object
    tasksMapByIds: Map<string, Task>;
    submitButtonLabel?: string;
  }

  let {
    pageTitle,
    breadcrumbTitle,
    isAdmin,
    superFormObject,
    tasksMapByIds,
    submitButtonLabel = '',
  }: Props = $props();

  const { form, message, errors, enhance } = superFormObject;

  let workBookTasksForTable: WorkBookTasksCreate | WorkBookTasksEdit = $derived(
    $form.workBookTasks
      .map((workBookTask: WorkBookTaskCreate | WorkBookTaskEdit) => {
        const task = tasksMapByIds.get(workBookTask.taskId);

        if (!task) {
          return null;
        }

        return {
          contestId: task.contest_id,
          title: task.title,
          taskId: workBookTask.taskId,
          priority: workBookTask.priority,
          comment: workBookTask.comment,
        };
      })
      .filter(
        (item: WorkBookTaskCreate | WorkBookTaskEdit): item is NonNullable<typeof item> =>
          item !== null,
      ),
  );

  const truncateClass = 'min-w-[96px] max-w-[120px] sm:max-w-[300px] lg:max-w-[600px] truncate';
  const tasks: Tasks = $derived(Array.from(tasksMapByIds.values()));
</script>

<div class="container mx-auto w-5/6">
  <form method="post" use:enhance use:preventEnterKey class="flex flex-col gap-4">
    <HeadingOne title={pageTitle} />

    <Breadcrumb aria-label="">
      <BreadcrumbItem href="/workbooks" home>問題集</BreadcrumbItem>

      <BreadcrumbItem>
        <div class={truncateClass}>{breadcrumbTitle}</div>
      </BreadcrumbItem>
    </Breadcrumb>

    <!-- Form for workbook -->
    <WorkBookInputFields
      bind:authorId={$form.authorId}
      bind:workBookTitle={$form.title}
      bind:description={$form.description}
      bind:editorialUrl={$form.editorialUrl}
      bind:isPublished={$form.isPublished}
      bind:isOfficial={$form.isOfficial}
      bind:isReplenished={$form.isReplenished}
      bind:urlSlug={$form.urlSlug}
      bind:workBookType={$form.workBookType}
      {isAdmin}
      message={$message}
      errors={$errors}
    />

    <!-- Search tasks -->
    <!-- HACK:
      Because the attributes are slightly different, we have no choice
      but to separate the data for storing in the database and for creating and editing workbooks.
    -->
    <div class="flex flex-col gap-3">
      <TaskSearchBox {tasks} bind:workBookTasks={$form.workBookTasks} bind:workBookTasksForTable />
      <InputFieldWrapper
        inputFieldType="hidden"
        inputFieldName="workBookTasks"
        inputValue={$form.workBookTasks}
        message={$errors.workBookTasks?._errors}
      />
    </div>

    <!-- Show tasks stored in database and added by search -->
    <WorkBookTasksTable
      {tasksMapByIds}
      bind:workBookTasks={$form.workBookTasks}
      bind:workBookTasksForTable
    />

    <!-- Create or update button  -->
    <div class="flex flex-wrap md:justify-center md:items-center">
      <SubmissionButton width="w-full md:max-w-md mt-4" labelName={submitButtonLabel} />
    </div>
  </form>
</div>
