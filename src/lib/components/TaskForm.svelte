<script lang="ts">
  //Taskを修正するためのフォームを用意する
  // task_id、contest_idを変えることは多分ない
  // 主に、gradeと、tasktagsを変えることになると思う
  import {
    Table,
    TableBody,
    TableBodyCell,
    TableBodyRow,
    Select,
    Label,
    Button,
  } from 'flowbite-svelte';

  import { taskGradeValues, type Task } from '$lib/types/task';
  export let task: Task;
  //export const isAdmin: boolean; // Admin権限がある場合は、編集リンクを表示する

  //TODO
  let grades = taskGradeValues.map((taskGradeValue) => {
    return { value: taskGradeValue, name: taskGradeValue };
  });
</script>

<a href="/tasks"> タスク一覧へもどる（パンくずリストにしたい） </a>
<br>
Edit Task
<form method="POST" action="/tasks?/update">
  <Table shadow hoverable={true} class="text-md">
    <TableBody tableBodyClass="divide-y">
      <TableBodyRow>
        <TableBodyCell>taskId</TableBodyCell>
        <TableBodyCell>
          {task.task_id}
        </TableBodyCell>
      </TableBodyRow>
      <TableBodyRow>
        <TableBodyCell>taskTitle</TableBodyCell>
        <TableBodyCell>
          {task.title}
        </TableBodyCell>
      </TableBodyRow>
      <TableBodyRow>
        <TableBodyCell>contestId</TableBodyCell>
        <TableBodyCell>
          {task.contest_id}
        </TableBodyCell>
      </TableBodyRow>
      <TableBodyRow>
        <TableBodyCell>grade</TableBodyCell>
        <TableBodyCell>
          <Label>
            Grade
            <Select name="task_grade" class="mt-2" items={grades} bind:value={task.grade} />
          </Label>
        </TableBodyCell>
      </TableBodyRow>
    </TableBody>
  </Table>
  <Button type="submit">Update</Button>
  <input type="hidden" name="task_id" value={task.task_id} />
</form>
以下に、タグ（taskTag）を追加/編集するUIを作る予定
