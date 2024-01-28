<script lang="ts">
  //Tagを修正するためのフォームを用意する

  import {
    Table,
    TableBody,
    TableBodyCell,
    TableBodyRow,
    Label,
    Button,
    TableHead,
    TableHeadCell,
  } from 'flowbite-svelte';
  import type { Tag } from '$lib/types/tag';
  import type { Task } from '../types/task';
  import { getContestNameLabel } from '$lib/utils/contest';
  import { ATCODER_BASE_CONTEST_URL } from '$lib/constants/urls';

  export let tag: Tag;
  export let tasks: Task[];
  let id: string = tag.id;
  let name: string = tag.name;

  //export const isAdmin: boolean; // Admin権限がある場合は、編集リンクを表示する
</script>

<form method="POST" action="/tags?/update">
  <Table shadow hoverable={true} class="text-md">
    <TableBody tableBodyClass="divide-y">
      <TableBodyRow>
        <TableBodyCell class="w-1/6">tagId</TableBodyCell>
        <TableBodyCell class="w-5/6">{id}</TableBodyCell>
      </TableBodyRow>
      <TableBodyRow>
        <TableBodyCell>tagTitle</TableBodyCell>
        <TableBodyCell>
          <input name="tag_title" type="text" bind:value={name} />
        </TableBodyCell>
      </TableBodyRow>
      <TableBodyRow>
        <TableBodyCell>is_official</TableBodyCell>
        <TableBodyCell>
          <Label>
            <input name="is_official" class="mt-2" type="checkbox" bind:checked={tag.is_official} />
          </Label>
        </TableBodyCell>
      </TableBodyRow>
      <TableBodyRow>
        <TableBodyCell>is_published</TableBodyCell>
        <TableBodyCell>
          <Label>
            <input
              name="is_published"
              class="mt-2"
              type="checkbox"
              bind:checked={tag.is_published}
            />
          </Label>
        </TableBodyCell>
      </TableBodyRow>
    </TableBody>
  </Table>
  <Button type="submit">Update</Button>
  <input type="hidden" name="tag_id" value={tag.id} />
</form>

このタグがつけられている問題一覧

<Table shadow hoverable={true} class="text-md">
  <TableHead class="text-md">
    <TableHeadCell class="w-1/6">コンテストID</TableHeadCell>
    <TableHeadCell class="w-5/6">問題名</TableHeadCell>
  </TableHead>
  <TableBody tableBodyClass="divide-y">
    {#each tasks as task}
      <TableBodyRow>
        <TableBodyCell>
          <a
            href="{ATCODER_BASE_CONTEST_URL}/{task.contest_id}"
            class="font-medium text-primary-600 hover:underline dark:text-primary-500"
            target="_blank"
            rel="noreferrer"
          >
            {getContestNameLabel(task.contest_id)}
          </a>
        </TableBodyCell>
        <TableBodyCell>
          <a
            href="/problems/{task.task_id}"
            class="font-medium text-primary-600 hover:underline dark:text-primary-500"
          >
            {task.title}
          </a>
        </TableBodyCell>
      </TableBodyRow>
    {/each}
  </TableBody>
</Table>
