<script lang="ts">
  import { resolve } from '$app/paths';

  import UserProfile from '#lib/components/UserProfile.svelte';
  import HeadingOne from '#lib/components/HeadingOne.svelte';
  import TaskListSorted from '#lib/components/TaskListSorted.svelte';
  import { PROBLEMS_PAGE } from '#lib/constants/navbar-links.js';

  let { data } = $props();

  let username = $derived(data.username);
  let atcoder_username = $derived(data.atcoder_username);
  let isLoggedIn = $derived(data.isLoggedIn);
  let taskResults = $derived(data.taskResults);

  const problemsHref = resolve(PROBLEMS_PAGE);
</script>

<div class="container mx-auto w-1/4">
  <UserProfile {username} {atcoder_username} {isLoggedIn} />
</div>

<div class="container mx-auto w-5/6">
  {#if taskResults}
    <HeadingOne title="">
      <a href={problemsHref}>Problems</a>
    </HeadingOne>
    <TaskListSorted {taskResults} />
  {/if}
</div>
