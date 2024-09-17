<script lang="ts">
  import {
    Breadcrumb,
    BreadcrumbItem,
    Table,
    TableBody,
    TableBodyCell,
    TableBodyRow,
    Select,
    Label,
    Button,
  } from 'flowbite-svelte';

  import { addContestNameToTaskIndex } from '$lib/utils/contest';
  import { taskGradeValues, type Task } from '$lib/types/task';
  import { getTaskGradeLabel, removeTaskIndexFromTitle } from '$lib/utils/task';

  export let task: Task;
  //export const isAdmin: boolean; // Admin権限がある場合は、編集リンクを表示する

  let grades = taskGradeValues.map((taskGradeValue) => {
    return { value: taskGradeValue, name: getTaskGradeLabel(taskGradeValue) };
  });
</script>

<form method="POST" action="/tasks?/update" class="space-y-4">
  <Breadcrumb aria-label="">
    <BreadcrumbItem href="/problems" home>問題一覧</BreadcrumbItem>
    <BreadcrumbItem>
      <div class="min-w-[96px] max-w-[120px] sm:max-w-[300px] truncate">{task.title}</div>
    </BreadcrumbItem>
  </Breadcrumb>

  <!-- task_id、contest_idを変える可能性は低い -->
  <!-- 主に、gradeと、tasktagsを変えることになると思う -->
  <Table shadow hoverable={true} class="text-md">
    <TableBody tableBodyClass="divide-y">
      <TableBodyRow>
        <TableBodyCell>タイトル</TableBodyCell>
        <TableBodyCell>
          {removeTaskIndexFromTitle(task.title, task.task_table_index)}
        </TableBodyCell>
      </TableBodyRow>
      <TableBodyRow>
        <TableBodyCell>出典</TableBodyCell>
        <TableBodyCell>
          {addContestNameToTaskIndex(task.contest_id, task.task_table_index)}
        </TableBodyCell>
      </TableBodyRow>
      <TableBodyRow>
        <TableBodyCell>グレード</TableBodyCell>
        <TableBodyCell>
          <Label>
            <Select name="task_grade" class="mt-2" items={grades} bind:value={task.grade} />
          </Label>
        </TableBodyCell>
      </TableBodyRow>
    </TableBody>
  </Table>

  <div class="flex justify-center">
    <Button type="submit" class="w-full sm:w-5/6 m-4">更新</Button>
  </div>

  <input type="hidden" name="task_id" value={task.task_id} />
</form>

<div class="dark:text-gray-300">TODO: 以下に、タグ（taskTag）を追加/編集するUIを作る予定</div>
