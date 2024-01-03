<script lang="ts">
  export let data;
  let username = data.username;
  let isLoggedIn = data.isLoggedIn;
  let taskResults = data.taskResults;
  import UserProfile from '$lib/components/UserProfile.svelte';
  import TaskListSorted from '$lib/components/TaskListSorted.svelte';
</script>

<div class="container mx-auto w-1/2">
  <UserProfile {username} {isLoggedIn} />
</div>

<div class="container mx-auto w-5/6">
  {#if taskResults}
    <h1 class="text-3xl">Problems</h1>
    <TaskListSorted {taskResults} />
  {/if}
</div>
