<script lang="ts">
  import { TableBodyCell } from 'flowbite-svelte';

  import type { TaskGrade } from '$lib/types/task';

  import GradeLabel from '$lib/components/GradeLabel.svelte';

  interface Props {
    taskGrade: TaskGrade;
  }

  let { taskGrade }: Props = $props();
</script>

<TableBodyCell class="justify-center w-14 px-4">
  <div class="flex items-center justify-center min-w-[54px] max-w-[54px]">
    <GradeLabel {taskGrade} />
  </div>
</TableBodyCell>
