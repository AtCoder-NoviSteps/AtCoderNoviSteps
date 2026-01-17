<script lang="ts">
  import {
    Table,
    TableBody,
    TableBodyCell,
    TableBodyRow,
    TableHead,
    TableHeadCell,
    Label,
  } from 'flowbite-svelte';
  import type { Tag } from '$lib/types/tag';
  //import { ATCODER_BASE_CONTEST_URL } from '$lib/constants/urls';
  import { newline } from '$lib/utils/newline';
  //import { tasks } from '../server/sample_data';

  //gradeでソート済みのTaskのリストと、APIから取得したtasklistを表示する
  //xport let tasks: Task[];

  interface Props {
    //APIから取得したリストで、データベースに追加していないTaskのリストにする
    tags: Tag[];
  }

  let { tags }: Props = $props();
</script>

<!-- TODO: 問題が多くなってきたら、ページネーションを導入する -->
<!-- TODO: 回答状況に応じて、フィルタリングできるようにする -->
<Table shadow hoverable={true} class="text-md" divClass="">
  <TableHead class="text-md bg-gray-100">
    <!--<TableHeadCell class="w-1/8">tagId</TableHeadCell>-->
    <TableHeadCell class="w-1/3">タグ名</TableHeadCell>
    <TableHeadCell class="w-1/8">公式</TableHeadCell>
    <TableHeadCell class="w-1/8">公開中</TableHeadCell>
    <TableHeadCell class="w-1/8"></TableHeadCell>
  </TableHead>
  <TableBody class="divide-y divide-gray-200 dark:divide-gray-700">
    {#each tags as tag}
      <TableBodyRow>
        <TableBodyCell class="p-3">
          <Label>
            {#each newline(tag.name, 10) as line}
              {line}<br />
            {/each}
          </Label>
        </TableBodyCell>
        <TableBodyCell>
          <Label>
            {tag.is_official}
          </Label>
        </TableBodyCell>

        <TableBodyCell>
          <Label>
            {tag.is_published}
          </Label>
        </TableBodyCell>
        <TableBodyCell>
          {#if tag.id !== 'undefined'}
            <a href="/tags/{tag.id}">編集</a>
          {:else}
            未登録
          {/if}
        </TableBodyCell>
      </TableBodyRow>
    {/each}
  </TableBody>
</Table>
