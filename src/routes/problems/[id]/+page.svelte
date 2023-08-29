<script>
  import { Card, Button } from 'flowbite-svelte';
  import { ATCODER_BASE_CONTEST_URL } from '$lib/constants/urls';

  export let data;
  let task = data.task;

  const taskUrl = `${ATCODER_BASE_CONTEST_URL}/${task.contest_id}/tasks/${task.id}`;
</script>

<!-- TODO: Add styles -->
<h1 class="text-2xl">Problems details</h1>

<!-- <p>{task.submission_result}</p> -->

<Card img="../../favicon.png" href={taskUrl} horizontal class="mb-10 mx-auto" size="md">
  <h4 class="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
    {task.grade.replace('Kyu', '級').replace('Dan', '段')}
  </h4>
  <h5 class="mb-2 text-3xl tracking-tight text-gray-900 dark:text-white">
    {task.title}
  </h5>
</Card>

<!-- TODO: Add face icons. -->
<!-- HACK: flowbite-svelte-icons has few face icon. -->
<!-- TODO: Add tooltips to buttons for submission results -->
<div class="flex flex-col items-center">
  <Button class="w-screen max-w-lg md:max-w-xl m-3">No Sub</Button>
  <Button class="w-screen max-w-lg md:max-w-xl m-3">AC</Button>
  <Button class="w-screen max-w-lg md:max-w-xl m-3">WA</Button>
</div>
