<script lang="ts">
  import {
    Table,
    TableBody,
    TableBodyCell,
    TableBodyRow,
    TableHead,
    TableHeadCell,
  } from 'flowbite-svelte';

  import { gradeGuidelineTableData } from '$lib/components/TaskGrades/grade_guideline_table_data';
  import GradeLabel from '$lib/components/GradeLabel.svelte';
</script>

<div class="container w-full lg:w-2/3 mx-auto mt-6 lg:mt-10 overflow-auto rounded-md border">
  <Table shadow id="grade-guideline" class="text-md table-fixed w-full">
    <TableHead class="text-sm bg-gray-100">
      <TableHeadCell class="w-28 xs:w-32 text-center">ABCの配点</TableHeadCell>
      <TableHeadCell class="w-40 hidden sm:table-cell text-center">問題</TableHeadCell>
      <TableHeadCell class="w-40 text-center">対応グレード</TableHeadCell>
    </TableHead>

    <TableBody tableBodyClass="divide-y">
      {#each gradeGuidelineTableData as { point, task, lowerGrade, upperGrade }}
        <TableBodyRow>
          <TableBodyCell class="text-sm xs:text-md text-center py-3">{point}</TableBodyCell>
          <TableBodyCell class="text-center py-3 hidden sm:table-cell">{task}</TableBodyCell>

          {#if upperGrade === lowerGrade}
            <TableBodyCell class="flex items-center justify-center space-x-3 py-3">
              <GradeLabel taskGrade={upperGrade} />
            </TableBodyCell>
          {:else}
            <TableBodyCell class="flex items-center justify-center space-x-3 py-3">
              <GradeLabel taskGrade={lowerGrade} />
              <p>〜</p>
              <GradeLabel taskGrade={upperGrade} />
            </TableBodyCell>
          {/if}
        </TableBodyRow>
      {/each}
    </TableBody>
  </Table>
</div>
