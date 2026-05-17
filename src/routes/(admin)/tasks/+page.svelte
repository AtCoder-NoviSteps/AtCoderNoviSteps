<script lang="ts">
  import { enhance } from '$app/forms';

  import { Select, Label, Button, Pagination } from 'flowbite-svelte';

  import type { Contests } from '$lib/types/contest';

  import { importSourceEntries, type ContestTaskImportSource } from '$lib/clients';

  import HeadingOne from '$lib/components/HeadingOne.svelte';
  import TaskTableForImport from './_components/TaskTableForImport.svelte';
  import TaskSearchBox from './_components/TaskSearchBox.svelte';

  const PAGE_SIZE = 20;

  let { form } = $props();

  let selectedSource = $state<ContestTaskImportSource>('atcoder');
  let searchQuery = $state('');
  let currentPage = $state(1);

  const importContests = $derived<Contests>(form?.importContests ?? []);

  const filteredContests = $derived(
    importContests.filter((contest) => {
      if (contest.tasks.length === 0) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return contest.id.toLowerCase().includes(q) || contest.title.toLowerCase().includes(q);
    }),
  );

  const pagedContests = $derived(
    filteredContests.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
  );

  const totalPages = $derived(Math.max(1, Math.ceil(filteredContests.length / PAGE_SIZE)));

  const pages = $derived(
    Array.from({ length: totalPages }, (_, i) => ({
      name: String(i + 1),
      active: i + 1 === currentPage,
      onclick: (e: Event) => {
        e.preventDefault();
        currentPage = i + 1;
      },
    })),
  );

  const sourceOptions = importSourceEntries.map(([value, config]) => ({
    value,
    name: config.label,
  }));
</script>

<div class="container mx-auto w-5/6">
  <HeadingOne title="問題のインポート" />

  <form method="POST" action="?/fetch" use:enhance class="flex flex-col gap-4 mb-6">
    <div class="flex items-end gap-4">
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
      <Button type="submit">問題を取得</Button>
    </div>
  </form>

  {#if importContests.length >= 1}
    <div class="flex flex-col gap-4">
      <TaskSearchBox bind:value={searchQuery} />

      <TaskTableForImport importContests={pagedContests} source={selectedSource} />

      {#if totalPages > 1}
        <div class="flex justify-center">
          <Pagination {pages} />
        </div>
      {/if}
    </div>
  {:else if form !== null && form !== undefined && !('importContests' in (form ?? {}))}
    <p class="text-red-500">
      {(form as { message?: string })?.message ?? 'データ取得に失敗しました。'}
    </p>
  {/if}
</div>
