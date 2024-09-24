<script lang="ts">
  import { TableBodyCell } from 'flowbite-svelte';

  import type { WorkbookList } from '$lib/types/workbook';
  import PublicationStatusLabel from '$lib/components/WorkBooks/PublicationStatusLabel.svelte';

  export let paddingLeft: string = 'pl-2 xs:pl-4';
  export let workbook: WorkbookList;
</script>

<TableBodyCell class="w-2/5 {paddingLeft} pr-4">
  <div
    class="flex items-center space-x-2 truncate min-w-[240px] max-w-[240px] lg:max-w-[300px] xl:max-w-[380px] 2xl:max-w-[480px]"
  >
    <PublicationStatusLabel isPublished={workbook.isPublished} />
    <a
      href="/workbooks/{workbook.id}"
      class="flex-1 font-medium xs:text-lg text-primary-600 hover:underline dark:text-primary-500 truncate"
      aria-labelledby="View details for workbook: {workbook.title}"
    >
      {workbook.title}
    </a>
  </div>
</TableBodyCell>
