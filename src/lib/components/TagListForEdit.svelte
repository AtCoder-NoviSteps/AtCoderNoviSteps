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
  //APIから取得したリストで、データベースに追加していないTaskのリストにする
  export let tags: Tag[];
</script>

<!-- TODO: 問題が多くなってきたら、ページネーションを導入する -->
<!-- TODO: 回答状況に応じて、フィルタリングできるようにする -->
<Table shadow hoverable={true} class="text-md" divClass="">
  <TableHead class="text-md">
    <!--<TableHeadCell class="w-1/8">tagId</TableHeadCell>-->
    <TableHeadCell class="w-1/3">タグ名</TableHeadCell>
    <TableHeadCell class="w-1/8">公式</TableHeadCell>
    <TableHeadCell class="w-1/8">公開中</TableHeadCell>
    <TableHeadCell class="w-1/8">問題数</TableHeadCell>
    <TableHeadCell class="w-1/8"><!--操作--></TableHeadCell>
  </TableHead>
  <TableBody tableBodyClass="divide-y">
    {#each tags as tag}
      <TableBodyRow height="40px">
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
          <a href="/tags/{tag.id}">編集</a>
        </TableBodyCell>
      </TableBodyRow>
    {/each}
  </TableBody>
</Table>
