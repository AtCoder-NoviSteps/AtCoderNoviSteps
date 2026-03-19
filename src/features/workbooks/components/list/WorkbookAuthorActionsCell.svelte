<script lang="ts">
  import { enhance } from '$app/forms';
  import { TableBodyCell } from 'flowbite-svelte';

  import type { Roles } from '$lib/types/user';
  import type { WorkbookList } from '$features/workbooks/types/workbook';

  import { canEdit, canDelete } from '$lib/utils/authorship';
  import { getUrlSlugFrom } from '$features/workbooks/utils/workbooks';

  interface Props {
    workbook: WorkbookList;
    userId: string;
    role: Roles;
  }

  let { workbook, userId, role }: Props = $props();
</script>

<TableBodyCell class="justify-center w-24 px-0">
  <div
    class="flex justify-center items-center space-x-3 min-w-[96px] max-w-[120px] text-gray-700 dark:text-gray-300"
  >
    {#if canEdit(userId, workbook.authorId, role, workbook.isPublished)}
      <a href="/workbooks/edit/{getUrlSlugFrom(workbook)}">編集</a>
    {/if}

    {#if canDelete(userId, workbook.authorId)}
      <form method="POST" action="?/delete&slug={workbook.id}" use:enhance>
        <button>削除</button>
      </form>
    {/if}
  </div>
</TableBodyCell>
