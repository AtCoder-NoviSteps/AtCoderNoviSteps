# UI・コンポーネントガイド

## 概要

AtCoder-NoviStepsのフロントエンド設計とSvelte 5 + Flowbite UIを活用したコンポーネント開発

## 技術スタック詳細

| 技術            | バージョン | 用途                            |
| --------------- | ---------- | ------------------------------- |
| Svelte          | 5.38.2     | フレームワーク（最新Runes API） |
| SvelteKit       | 2.36.1     | フルスタックフレームワーク      |
| svelte-5-ui-lib | 0.12.2     | UIコンポーネントライブラリ      |
| Flowbite        | 2.5.2      | デザインシステム                |
| Tailwind CSS    | 3.4.17     | CSSフレームワーク               |
| tailwind-merge  | 2.6.0      | クラス結合ユーティリティ        |
| Lucide Svelte   | 0.541.0    | アイコンライブラリ              |

## Svelte 5 Runes API活用

### 基本的なReactivity

```typescript
// lib/components/problem/ProblemCard.svelte
<script lang="ts">
  import type { Problem } from '$lib/types/problem';

  interface Props {
    problem: Problem;
    showDifficulty?: boolean;
  }

  let { problem, showDifficulty = true }: Props = $props();

  // Runes APIを使ったリアクティブな計算
  const difficultyColor = $derived(() => {
    if (!problem.atcoder_problems_difficulty) return 'gray';
    return getDifficultyColor(problem.atcoder_problems_difficulty);
  });

  const isAtCoderProblem = $derived(() => {
    return problem.contest_type !== 'AOJ_COURSES';
  });
</script>

<div class="card bg-white shadow-md rounded-lg p-4 hover:shadow-lg transition-shadow">
  <div class="flex justify-between items-start mb-3">
    <h3 class="text-lg font-semibold text-gray-900">
      {problem.title}
    </h3>

    {#if showDifficulty && problem.atcoder_problems_difficulty !== 'PENDING'}
      <span
        class="px-2 py-1 rounded text-xs font-medium"
        style="background-color: {difficultyColor}; color: white;"
      >
        {problem.atcoder_problems_difficulty}
      </span>
    {/if}
  </div>

  <div class="flex items-center gap-2 text-sm text-gray-600">
    <span class="font-mono">{problem.task_id}</span>
    <span>•</span>
    <span>{problem.contest_id.toUpperCase()}</span>
  </div>

  {#if isAtCoderProblem}
    <a
      href="https://atcoder.jp/contests/{problem.contest_id}/tasks/{problem.task_id}"
      target="_blank"
      class="text-blue-600 hover:text-blue-800 text-sm mt-2 inline-block"
    >
      AtCoderで開く →
    </a>
  {/if}
</div>
```

### Store with Runes

```typescript
// lib/stores/problemStore.svelte.ts
import type { Problem, ProblemFilters } from '$lib/types/problem';

class ProblemStore {
  private _problems = $state<Problem[]>([]);
  private _filters = $state<ProblemFilters>({
    difficulty: { min: 0, max: 4000 },
    contestTypes: [],
    searchQuery: '',
  });

  get problems() {
    return this._problems;
  }

  get filters() {
    return this._filters;
  }

  get filteredProblems() {
    return $derived(() => {
      return this._problems.filter((problem) => {
        // 難易度フィルタ
        const difficulty = problem.atcoder_problems_difficulty_value || 0;
        if (
          difficulty < this._filters.difficulty.min ||
          difficulty > this._filters.difficulty.max
        ) {
          return false;
        }

        // コンテストタイプフィルタ
        if (
          this._filters.contestTypes.length > 0 &&
          !this._filters.contestTypes.includes(problem.contest_type)
        ) {
          return false;
        }

        // 検索クエリフィルタ
        if (this._filters.searchQuery) {
          const query = this._filters.searchQuery.toLowerCase();
          return (
            problem.title.toLowerCase().includes(query) ||
            problem.task_id.toLowerCase().includes(query)
          );
        }

        return true;
      });
    });
  }

  setProblems(problems: Problem[]) {
    this._problems = problems;
  }

  updateFilters(newFilters: Partial<ProblemFilters>) {
    this._filters = { ...this._filters, ...newFilters };
  }

  resetFilters() {
    this._filters = {
      difficulty: { min: 0, max: 4000 },
      contestTypes: [],
      searchQuery: '',
    };
  }
}

export const problemStore = new ProblemStore();
```

## Flowbite UI統合

### コンポーネントベースの設計

```typescript
// lib/components/ui/Button.svelte
<script lang="ts">
  import { Button as FlowbiteButton } from 'flowbite-svelte';
  import type { ButtonProps } from 'flowbite-svelte';

  interface Props extends ButtonProps {
    variant?: 'primary' | 'secondary' | 'danger' | 'success';
    loading?: boolean;
  }

  let {
    variant = 'primary',
    loading = false,
    disabled = false,
    children,
    ...restProps
  }: Props = $props();

  const variantStyles = {
    primary: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-300',
    secondary: 'bg-gray-600 hover:bg-gray-700 focus:ring-gray-300',
    danger: 'bg-red-600 hover:bg-red-700 focus:ring-red-300',
    success: 'bg-green-600 hover:bg-green-700 focus:ring-green-300'
  };
</script>

<FlowbiteButton
  color={variant === 'primary' ? 'blue' : variant === 'danger' ? 'red' : 'alternative'}
  disabled={disabled || loading}
  class="relative {variantStyles[variant]}"
  {...restProps}
>
  {#if loading}
    <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    処理中...
  {:else}
    {@render children?.()}
  {/if}
</FlowbiteButton>
```

### フォームコンポーネント（Superforms統合）

```typescript
// lib/components/forms/ProblemFilterForm.svelte
<script lang="ts">
  import { superForm } from 'sveltekit-superforms';
  import { zod } from 'sveltekit-superforms/adapters';
  import { Label, Input, Select, Button, Range } from 'flowbite-svelte';
  import { problemFilterSchema } from '$lib/validators/problem';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  const { form, enhance, errors, constraints } = superForm(data.form, {
    validators: zod(problemFilterSchema),
    resetForm: false,
    onUpdated: ({ form }) => {
      if (form.valid) {
        // フィルタ適用
        problemStore.updateFilters(form.data);
      }
    }
  });

  const contestTypeOptions = [
    { value: 'ABC', label: 'AtCoder Beginner Contest' },
    { value: 'ARC', label: 'AtCoder Regular Contest' },
    { value: 'AGC', label: 'AtCoder Grand Contest' },
    { value: 'TYPICAL90', label: '競プロ典型90問' },
    { value: 'TESSOKU_BOOK', label: '競技プログラミングの鉄則' }
  ];
</script>

<form method="POST" use:enhance class="space-y-6 bg-white p-6 rounded-lg shadow">
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    <!-- 検索クエリ -->
    <div>
      <Label for="searchQuery">問題検索</Label>
      <Input
        id="searchQuery"
        name="searchQuery"
        placeholder="問題名またはIDを入力"
        bind:value={$form.searchQuery}
        invalid={!!$errors.searchQuery}
        {...$constraints.searchQuery}
      />
      {#if $errors.searchQuery}
        <p class="text-red-600 text-sm mt-1">{$errors.searchQuery}</p>
      {/if}
    </div>

    <!-- 難易度範囲 -->
    <div>
      <Label>難易度範囲: {$form.difficultyMin} - {$form.difficultyMax}</Label>
      <div class="mt-2 space-y-2">
        <Range
          id="difficultyMin"
          min={0}
          max={4000}
          step={100}
          bind:value={$form.difficultyMin}
        />
        <Range
          id="difficultyMax"
          min={0}
          max={4000}
          step={100}
          bind:value={$form.difficultyMax}
        />
      </div>
    </div>

    <!-- コンテストタイプ -->
    <div>
      <Label for="contestTypes">コンテストタイプ</Label>
      <Select
        id="contestTypes"
        multiple
        bind:value={$form.contestTypes}
        items={contestTypeOptions}
      />
    </div>
  </div>

  <div class="flex justify-between">
    <Button type="button" color="alternative" on:click={() => problemStore.resetFilters()}>
      リセット
    </Button>
    <Button type="submit" color="blue">
      フィルタ適用
    </Button>
  </div>
</form>
```

## データ表示コンポーネント

### 問題一覧テーブル

```typescript
// lib/components/problem/ProblemTable.svelte
<script lang="ts">
  import { Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell, Badge } from 'flowbite-svelte';
  import { ChevronUp, ChevronDown, ExternalLink } from 'lucide-svelte';
  import type { Problem } from '$lib/types/problem';

  interface Props {
    problems: Problem[];
    sortable?: boolean;
  }

  let { problems, sortable = true }: Props = $props();

  let sortField = $state<keyof Problem>('task_id');
  let sortDirection = $state<'asc' | 'desc'>('asc');

  const sortedProblems = $derived(() => {
    if (!sortable) return problems;

    return [...problems].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];

      let comparison = 0;
      if (aVal < bVal) comparison = -1;
      if (aVal > bVal) comparison = 1;

      return sortDirection === 'desc' ? -comparison : comparison;
    });
  });

  function handleSort(field: keyof Problem) {
    if (sortField === field) {
      sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      sortField = field;
      sortDirection = 'asc';
    }
  }

  function getDifficultyColor(difficulty: string): string {
    const colorMap = {
      'GRAY': '#808080',
      'BROWN': '#8B4513',
      'GREEN': '#008000',
      'CYAN': '#00FFFF',
      'BLUE': '#0000FF',
      'YELLOW': '#FFD700',
      'ORANGE': '#FFA500',
      'RED': '#FF0000'
    };
    return colorMap[difficulty] || '#808080';
  }
</script>

<div class="overflow-x-auto">
  <Table hoverable>
    <TableHead>
      {#if sortable}
        <TableHeadCell on:click={() => handleSort('task_id')} class="cursor-pointer">
          <div class="flex items-center gap-1">
            問題ID
            {#if sortField === 'task_id'}
              {sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            {/if}
          </div>
        </TableHeadCell>
      {:else}
        <TableHeadCell>問題ID</TableHeadCell>
      {/if}

      <TableHeadCell>タイトル</TableHeadCell>
      <TableHeadCell>コンテスト</TableHeadCell>
      <TableHeadCell>難易度</TableHeadCell>
      <TableHeadCell>リンク</TableHeadCell>
    </TableHead>

    <TableBody>
      {#each sortedProblems as problem (problem.task_id)}
        <TableBodyRow>
          <TableBodyCell>
            <code class="font-mono text-sm">{problem.task_id}</code>
          </TableBodyCell>

          <TableBodyCell>
            <div class="font-medium">{problem.title}</div>
          </TableBodyCell>

          <TableBodyCell>
            <Badge color="blue">{problem.contest_id.toUpperCase()}</Badge>
          </TableBodyCell>

          <TableBodyCell>
            {#if problem.atcoder_problems_difficulty !== 'PENDING'}
              <Badge
                color="none"
                style="background-color: {getDifficultyColor(problem.atcoder_problems_difficulty)}; color: white;"
              >
                {problem.atcoder_problems_difficulty}
              </Badge>
            {:else}
              <Badge color="gray">未確定</Badge>
            {/if}
          </TableBodyCell>

          <TableBodyCell>
            <a
              href="https://atcoder.jp/contests/{problem.contest_id}/tasks/{problem.task_id}"
              target="_blank"
              class="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
            >
              <ExternalLink size={16} />
              AtCoder
            </a>
          </TableBodyCell>
        </TableBodyRow>
      {/each}
    </TableBody>
  </Table>
</div>

{#if sortedProblems.length === 0}
  <div class="text-center py-8 text-gray-500">
    条件に一致する問題が見つかりませんでした。
  </div>
{/if}
```

## レイアウト・ナビゲーション

### メインレイアウト

```typescript
// src/routes/+layout.svelte
<script lang="ts">
  import { page } from '$app/stores';
  import { Navbar, NavBrand, NavLi, NavUl, NavHamburger, Sidebar, SidebarGroup, SidebarItem, SidebarWrapper } from 'flowbite-svelte';
  import { Book, Users, Trophy, Settings, Home } from 'lucide-svelte';
  import '../app.css';

  let sidebarOpen = $state(false);

  const navigation = [
    { href: '/', label: 'ホーム', icon: Home },
    { href: '/problems', label: '問題一覧', icon: Book },
    { href: '/workbooks', label: '問題集', icon: Trophy },
    { href: '/users', label: 'ユーザー', icon: Users }
  ];
</script>

<div class="min-h-screen bg-gray-50">
  <!-- ナビゲーションバー -->
  <Navbar let:hidden let:toggle fluid class="bg-white border-b">
    <NavBrand href="/">
      <span class="self-center whitespace-nowrap text-xl font-semibold">
        AtCoder NoviSteps
      </span>
    </NavBrand>

    <NavHamburger on:click={toggle} btnClass="md:hidden" />

    <NavUl {hidden}>
      {#each navigation as nav}
        <NavLi href={nav.href} active={$page.url.pathname === nav.href}>
          {nav.label}
        </NavLi>
      {/each}
    </NavUl>
  </Navbar>

  <div class="flex">
    <!-- サイドバー（デスクトップ） -->
    <aside class="hidden md:block w-64 bg-white border-r min-h-screen">
      <SidebarWrapper>
        <SidebarGroup>
          {#each navigation as nav}
            <SidebarItem
              href={nav.href}
              active={$page.url.pathname === nav.href}
              class="flex items-center gap-3"
            >
              <svelte:component this={nav.icon} size={20} />
              {nav.label}
            </SidebarItem>
          {/each}
        </SidebarGroup>
      </SidebarWrapper>
    </aside>

    <!-- メインコンテンツ -->
    <main class="flex-1 p-6">
      <slot />
    </main>
  </div>
</div>
```

## アクセシビリティ対応

### キーボードナビゲーション

```typescript
// lib/components/ui/AccessibleTable.svelte
<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  let currentRow = $state(0);
  let tableElement: HTMLTableElement;

  function handleKeydown(event: KeyboardEvent) {
    const rows = tableElement.querySelectorAll('tbody tr');

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        currentRow = Math.min(currentRow + 1, rows.length - 1);
        (rows[currentRow] as HTMLElement).focus();
        break;

      case 'ArrowUp':
        event.preventDefault();
        currentRow = Math.max(currentRow - 1, 0);
        (rows[currentRow] as HTMLElement).focus();
        break;

      case 'Enter':
      case ' ':
        event.preventDefault();
        dispatch('select', { index: currentRow });
        break;
    }
  }
</script>

<table
  bind:this={tableElement}
  on:keydown={handleKeydown}
  role="grid"
  aria-label="問題一覧"
  class="w-full"
>
  <!-- テーブル内容 -->
</table>
```

## パフォーマンス最適化

### 仮想スクロール（大量データ）

```typescript
// lib/components/ui/VirtualList.svelte
<script lang="ts" generics="T">
  interface Props {
    items: T[];
    itemHeight: number;
    containerHeight: number;
  }

  let { items, itemHeight, containerHeight }: Props = $props();

  let scrollTop = $state(0);
  let containerElement: HTMLDivElement;

  const visibleStart = $derived(() => Math.floor(scrollTop / itemHeight));
  const visibleEnd = $derived(() => Math.min(
    visibleStart + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  ));

  const visibleItems = $derived(() => items.slice(visibleStart, visibleEnd));
  const offsetY = $derived(() => visibleStart * itemHeight);
  const totalHeight = $derived(() => items.length * itemHeight);

  function handleScroll() {
    scrollTop = containerElement.scrollTop;
  }
</script>

<div
  bind:this={containerElement}
  on:scroll={handleScroll}
  style="height: {containerHeight}px; overflow-y: auto;"
>
  <div style="height: {totalHeight}px; position: relative;">
    <div style="transform: translateY({offsetY}px);">
      {#each visibleItems as item, index (visibleStart + index)}
        <slot {item} index={visibleStart + index} />
      {/each}
    </div>
  </div>
</div>
```

## モバイル対応

### レスポンシブデザイン指針

```css
/* app.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer components {
  /* モバイルファーストなコンポーネント */
  .problem-card {
    @apply bg-white rounded-lg shadow-md p-4 mb-4;
    @apply hover:shadow-lg transition-shadow duration-200;
  }

  .problem-grid {
    @apply grid grid-cols-1 gap-4;
    @apply sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4;
  }

  .responsive-table {
    @apply hidden md:table;
  }

  .mobile-card-list {
    @apply block md:hidden space-y-4;
  }
}
```
