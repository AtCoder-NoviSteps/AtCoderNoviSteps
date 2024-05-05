<script lang="ts">
  import { enhance } from '$app/forms';
  import { superForm } from 'sveltekit-superforms/client';
  import {
    Breadcrumb,
    BreadcrumbItem,
    Label,
    Table,
    TableBody,
    TableBodyCell,
    TableBodyRow,
    TableHead,
    TableHeadCell,
  } from 'flowbite-svelte';

  import HeadingOne from '$lib/components/HeadingOne.svelte';
  import WorkBookInputFields from '$lib/components/WorkBooks/WorkBookInputFields.svelte';
  import TaskSearchBox from '$lib/components/TaskSearchBox.svelte';
  import SubmissionButton from '$lib/components/SubmissionButton.svelte';
  import { WorkBookType } from '$lib/types/workbook.js';

  export let data;

  const { form } = superForm(data.form);

  $form.userId = data.author.id;
  $form.isOfficial = data.isAdmin;
  $form.workBookType = $form.isOfficial ? WorkBookType.TEXTBOOK : WorkBookType.CREATED_BY_USER;

  // TODO: 検索したデータと置き換え
  $: workBookTasks = [
    { id: 1, contestId: 'ABC350', taskId: 'abc351_a', title: 'A. foo' },
    { id: 2, contestId: 'ABC350', taskId: 'abc351_b', title: 'B. bar' },
    { id: 3, contestId: 'ABC350', taskId: 'abc351_c', title: 'C. hoge' },
  ];

  // TODO: DBから問題を取得できるようにする
  const dummyTasks = [
    {
      contest_id: 'ABC351',
      task_table_index: 'A',
      task_id: 'abc351_a',
      title: 'A. hoge',
      grade: '',
    },
    {
      contest_id: 'ABC351',
      task_table_index: 'B',
      task_id: 'abc351_b',
      title: 'B. fuga',
      grade: '',
    },
    {
      contest_id: 'ABC351',
      task_table_index: 'C',
      task_id: 'abc351_c',
      title: 'C. piyo',
      grade: '',
    },
    {
      contest_id: 'ABC351',
      task_table_index: 'D',
      task_id: 'abc351_d',
      title: 'D. foo',
      grade: '',
    },
    {
      contest_id: 'ABC351',
      task_table_index: 'E',
      task_id: 'abc351_e',
      title: 'E. bar',
      grade: '',
    },
    {
      contest_id: 'ABC351',
      task_table_index: 'F',
      task_id: 'abc351_f',
      title: 'F. bizz',
      grade: '',
    },
    {
      contest_id: 'ABC351',
      task_table_index: 'G',
      task_id: 'abc351_g',
      title: 'G. buzz',
      grade: '',
    },
  ];
</script>

<!-- TODO: パンくずリストを用意 -->
<div class="container mx-auto w-5/6">
  <form method="post" use:enhance>
    <HeadingOne title="問題集を作成" />

    <!-- TODO: 問題集の詳細ページのコンポーネントとほぼ共通しているので再利用する -->
    <Breadcrumb aria-label="">
      <BreadcrumbItem href="/workbooks" home>問題集一覧</BreadcrumbItem>
    </Breadcrumb>

    <WorkBookInputFields
      authorId={$form.userId}
      title={$form.title}
      description={$form.description}
      isPublished={$form.isPublished}
      isOfficial={$form.isOfficial}
      workBookType={$form.workBookType}
    />

    <!-- 問題一覧 -->
    <Label class="space-y-2">
      <span>問題一覧</span>
    </Label>

    TODO: 指定した問題を表示できるようにする
    <!-- TODO: コンポーネントとして切り出す -->
    <Table shadow class="text-md">
      <TableHead class="text-sm bg-gray-100">
        <TableHeadCell class="w-1/6">コンテスト名</TableHeadCell>
        <TableHeadCell class="w-7/12">問題名</TableHeadCell>
        <TableHeadCell class="w-1/12">
          <span class="sr-only">編集</span>
        </TableHeadCell>
      </TableHead>

      <TableBody tableBodyClass="divide-y">
        <!-- TODO: コンテスト名、問題名にリンクを付ける -->
        <!-- TODO: 編集にリンクを付ける -->
        <!-- TODO: 削除にゴミ箱マークを付ける -->
        {#each workBookTasks as task}
          <TableBodyRow>
            <TableBodyCell>{task.contestId}</TableBodyCell>
            <TableBodyCell>{task.title}</TableBodyCell>
            <TableBodyCell>編集 / 削除</TableBodyCell>
          </TableBodyRow>
        {:else}
          問題を1問以上登録してください。
        {/each}
      </TableBody>
    </Table>

    <!-- 問題を検索 -->
    <TaskSearchBox tasks={dummyTasks} bind:workBookTasks />

    <!-- 作成ボタンを追加 -->
    <div class="flex flex-wrap md:justify-center md:items-center">
      <SubmissionButton width="w-full md:max-w-md " labelName="作成" />
    </div>
  </form>
</div>
