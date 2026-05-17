<script lang="ts">
  import type { SubmitFunction } from '@sveltejs/kit';
  import { enhance, applyAction } from '$app/forms';

  import { Select, Label, Button, PaginationNav } from 'flowbite-svelte';

  import type { Contests } from '$lib/types/contest';
  import { importSourceEntries, type ContestTaskImportSource } from '$lib/clients';

  import HeadingOne from '$lib/components/HeadingOne.svelte';
  import SpinnerWrapper from '$lib/components/SpinnerWrapper.svelte';
  import TaskTableForImport from './_components/TaskTableForImport.svelte';
  import TaskSearchBox from './_components/TaskSearchBox.svelte';
  import { filterContests } from './_utils/contests';

  const PAGE_SIZE = 20;

  let { form } = $props();

  let selectedSource = $state<ContestTaskImportSource>('atcoder');
  let searchQuery = $state('');
  let currentPage = $state(1);
  let importContests = $state<Contests>([]);
  let isFetching = $state(false);
  let fetchError = $state<string | null>(null);

  // Sync only when form.importContests is present.
  // After a create action, form becomes {success:true} with no importContests,
  // so this block does not fire and the displayed list is preserved.
  $effect(() => {
    if (form?.importContests) {
      importContests = form.importContests;
      currentPage = 1;
      searchQuery = '';
      fetchError = null;
    } else if (form?.message) {
      fetchError = form.message;
    }
  });

  const filteredContests = $derived(filterContests(importContests, searchQuery));

  const pagedContests = $derived(
    filteredContests.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
  );

  const totalPages = $derived(Math.max(1, Math.ceil(filteredContests.length / PAGE_SIZE)));

  const sourceOptions = importSourceEntries.map(([value, config]) => ({
    value,
    name: config.label,
  }));

  // Use applyAction() instead of update() to skip invalidateAll(),
  // preventing Flowbite Select from resetting its displayed value.
  const handleFetch: SubmitFunction = () => {
    isFetching = true;
    fetchError = null;
    return async ({ result }) => {
      isFetching = false;
      await applyAction(result); // updates form, triggering $effect
    };
  };

  function handleImportSuccess(contestId: string) {
    importContests = importContests.filter((contest) => contest.id !== contestId);
  }
</script>

<div class="container mx-auto w-5/6">
  <HeadingOne title="問題のインポート" />

  <section class="mb-10 p-6">
    <form method="POST" action="?/fetch" use:enhance={handleFetch} class="flex flex-col gap-4">
      <div class="flex items-center gap-4">
        <div class="flex-1">
          <Label for="source-select">コンテストサイト・種別</Label>
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
  </section>

  {#if isFetching}
    <div class="flex flex-col items-center">
      <SpinnerWrapper size="8" />
      <p class="text-sm text-gray-500 dark:text-gray-400">データを取得しています...</p>
    </div>
  {:else if fetchError !== null}
    <p class="text-red-500">{fetchError}</p>
  {:else if importContests.length >= 1}
    {#snippet paginationNav()}
      <PaginationNav
        {currentPage}
        {totalPages}
        onPageChange={(page) => {
          currentPage = page;
        }}
      />
    {/snippet}

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
  {/if}
</div>
