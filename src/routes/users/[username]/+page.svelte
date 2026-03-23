<script lang="ts">
  import { resolve } from '$app/paths';

  import UserProfile from '$lib/components/UserProfile.svelte';
  import HeadingOne from '$lib/components/HeadingOne.svelte';
  import TaskListSorted from '$lib/components/TaskListSorted.svelte';
  import { PROBLEMS_PAGE } from '$lib/constants/navbar-links';

  let { data } = $props();

  let username = data.username;
  let atcoder_username = data.atcoder_username;
  let isLoggedIn = data.isLoggedIn;
  let taskResults = data.taskResults;

  // @ts-expect-error svelte-check TS2554: AppTypes declaration merging causes RouteId to resolve as string, requiring params. Runtime behavior is correct.
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
