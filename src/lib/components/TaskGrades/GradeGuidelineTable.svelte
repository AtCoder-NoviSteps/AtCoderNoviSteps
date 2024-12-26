<script lang="ts">
  import {
    Table,
    TableBody,
    TableBodyCell,
    TableBodyRow,
    TableHead,
    TableHeadCell,
  } from 'flowbite-svelte';

  import ExternalLinkWrapper from '$lib/components/ExternalLinkWrapper.svelte';
  import { gradeGuidelineTableData } from '$lib/components/TaskGrades/grade_guideline_table_data';
  import GradeLabel from '$lib/components/GradeLabel.svelte';

  import { TASK_GRADE_CRITERIA_SHEET_URL } from '$lib/constants/urls';
</script>

<div class="container mx-auto w-5/6 lg:w-2/3 mt-6 text-gray-800 dark:text-gray-300">
  <div>
    AtCoder Beginners Contest（通称、ABC）の配点・問題 IDと、対応するグレードの目安を示しています。
  </div>
  <div>
    また、各グレードの基準に関しては、
    <ExternalLinkWrapper url={TASK_GRADE_CRITERIA_SHEET_URL} description="こちら" />
    をご覧ください。
  </div>
</div>

<div class="container w-full lg:w-2/3 mx-auto mt-3 sm:mt-4 overflow-auto rounded-md border">
  <Table
    shadow
    id="grade-guideline"
    class="text-md table-fixed w-full"
    aria-label="Task grade guideline table"
  >
    <TableHead class="text-sm bg-gray-100">
      <TableHeadCell class="w-24 xs:w-32 px-3 sm:px-6 text-center">ABC の配点</TableHeadCell>
      <TableHeadCell class="w-40 hidden sm:table-cell text-center">ABC の問題 ID</TableHeadCell>
      <TableHeadCell class="w-40 text-center">対応グレード</TableHeadCell>
    </TableHead>

    <TableBody tableBodyClass="divide-y">
      {#each gradeGuidelineTableData as { point, task, lowerGrade, upperGrade }}
        <TableBodyRow>
          <TableBodyCell class="text-sm xs:text-md text-center py-3">{point}</TableBodyCell>
          <TableBodyCell class="text-center py-3 hidden sm:table-cell">{task}</TableBodyCell>

          <TableBodyCell class="flex items-center justify-center space-x-3 py-3">
            <GradeLabel taskGrade={lowerGrade} />
            <p>〜</p>
            <GradeLabel taskGrade={upperGrade} />
          </TableBodyCell>
        </TableBodyRow>
      {/each}
    </TableBody>
  </Table>
</div>
