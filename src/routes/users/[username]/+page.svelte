<script lang="ts">
  import UserProfile from '$lib/components/UserProfile.svelte';
  import HeadingOne from '$lib/components/HeadingOne.svelte';
  import TaskListSorted from '$lib/components/TaskListSorted.svelte';

  export let data;

  let username = data.username;
  let atcoder_username = data.atcoder_username;
  let isLoggedIn = data.isLoggedIn;
  let taskResults = data.taskResults;
</script>

<div class="container mx-auto w-1/4">
  <UserProfile {username} {atcoder_username} {isLoggedIn} />
</div>

<div class="container mx-auto w-5/6">
  {#if taskResults}
    <HeadingOne title="">
      <a href="/problems">Problems</a>
    </HeadingOne>
    <TaskListSorted {taskResults} />
  {/if}
</div>
