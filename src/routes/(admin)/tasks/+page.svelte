<script lang="ts">
  import type { SubmitFunction } from '@sveltejs/kit';
  import { enhance } from '$app/forms';

  import { Select, Label, Button, PaginationNav } from 'flowbite-svelte';

  import type { Contests } from '$lib/types/contest';

  import { importSourceEntries, type ContestTaskImportSource } from '$lib/clients';

  import HeadingOne from '$lib/components/HeadingOne.svelte';
  import SpinnerWrapper from '$lib/components/SpinnerWrapper.svelte';
  import TaskTableForImport from './_components/TaskTableForImport.svelte';
  import TaskSearchBox from './_components/TaskSearchBox.svelte';

  import { filterContests } from './_utils/contests';

  // -- source dropdown --
  const sourceOptions = importSourceEntries.map(([value, config]) => ({
    value,
    name: config.label,
  }));
  let selectedSource = $state<ContestTaskImportSource>('atcoder');
  let isFetching = $state(false);
  let fetchError = $state<string | null>(null);

  // Note: result.data is applied directly to avoid calling update() / applyAction(),
  // both of which trigger invalidateAll() and reset Flowbite Select's displayed value.
  const handleFetch: SubmitFunction = () => {
    isFetching = true;
    fetchError = null;

    return async ({ result }) => {
      isFetching = false;

      if (result.type === 'success' && result.data?.importContests) {
        importContests = result.data.importContests as Contests;
        searchQuery = '';
      } else if (result.type === 'failure') {
        fetchError = (result.data as { message?: string })?.message ?? 'データ取得に失敗しました。';
      } else {
        fetchError = 'データ取得に失敗しました。';
      }
    };
  };

  // -- filtering --
  let importContests = $state<Contests>([]);
  let searchQuery = $state('');

  const filteredContests = $derived(filterContests(importContests, searchQuery));

  function handleImportSuccess(contestId: string) {
    importContests = importContests.filter((contest) => contest.id !== contestId);
  }

  // -- pagination --
  const PAGE_SIZE = 20;
  let currentPage = $state(1);

  // Note: Reset to page 1 whenever the filtered set changes (new search or new data).
  $effect(() => {
    filteredContests;
    currentPage = 1;
  });

  const pagedContests = $derived(
    filteredContests.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
  );
  const totalPages = $derived(Math.max(1, Math.ceil(filteredContests.length / PAGE_SIZE)));
</script>

<div class="container mx-auto w-5/6">
  <HeadingOne title="問題のインポート" />

  <section class="mb-10">
    <div class="w-2/3">
      <form method="POST" action="?/fetch" use:enhance={handleFetch}>
        <Label for="source-select">コンテストサイト・種別</Label>

        <div class="mt-2 flex items-center gap-4">
          <div class="flex-1">
            <Select
              id="source-select"
              name="source"
              bind:value={selectedSource}
              items={sourceOptions}
              onchange={() => {
                currentPage = 1;
              }}
            />
          </div>

          <Button type="submit" disabled={isFetching}>問題を取得</Button>
        </div>
      </form>
    </div>
  </section>

  {#if isFetching}
    <div class="flex flex-col items-center">
      <SpinnerWrapper size="8" />
    </div>
  {:else if importContests.length >= 1}
    <div class="flex flex-col gap-4">
      <div class="flex items-center justify-between">
        <TaskSearchBox bind:value={searchQuery} />
        {@render paginationNav()}
      </div>

      <TaskTableForImport
        importContests={pagedContests}
        source={selectedSource}
        onImportSuccess={handleImportSuccess}
      />

      <div class="flex justify-end">
        {@render paginationNav()}
      </div>
    </div>
  {:else if fetchError !== null}
    <p class="text-red-500">{fetchError}</p>
  {/if}
</div>

{#snippet paginationNav()}
  <PaginationNav
    {currentPage}
    {totalPages}
    onPageChange={(page) => {
      currentPage = page;
    }}
  />
{/snippet}
