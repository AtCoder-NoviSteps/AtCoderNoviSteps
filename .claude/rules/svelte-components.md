---
description: Svelte component development rules
paths:
  - 'src/**/*.svelte'
  - 'src/lib/components/**'
  - 'src/lib/stores/**/*.svelte.ts'
---

# Svelte Components

## Runes (Required)

Use `$props()`, `$state()`, `$derived()`, `$effect()` in all components:

```svelte
<script lang="ts">
  interface Props {
    title: string;
    count?: number;
  }
  let { title, count = 0 }: Props = $props();
</script>
```

## File Naming

- Components: `PascalCase.svelte`
- Stores: `snake_case.svelte.ts`; class-based with `$state()`, singleton export

## Props & Reactivity

- Pass **model objects**, not individual fields; derive computed values inside
- For `data.*` in `+page.svelte`: use `$derived` to sync after `load()` re-runs
- Use `$derived` for computed values over `$state` + `$effect`
- Capture state **before** first `await` for safe rollback

## `{#each}` Patterns

- Always key: `(item.id)` or `(i)`
- **Key MUST be unique per iteration** — if domain allows duplicates, use composite key (e.g. `contest_id + task_id`)
- Filter **before**, not inside with `{#if}`
- Use `{:else}` for empty lists

```svelte
{#each visibleItems as item (item.id)}
  <Row {item} />
{:else}
  <p>No items.</p>
{/each}
```

**Common Trap:** `task_id` alone is NOT unique when same task appears in multiple contests. Use `contest_id + '-' + task_id` as composite key (see issue #3460 & PR #3442).

## Snippets vs Components

- **Snippet**: needs `$state` access, pure display, same-file; params require explicit type `{#snippet label(item: Item)}`
- **Component**: independent logic, >30 lines, multi-file reuse
- Define snippets at **top level** (outside tags)

## Async/Abort Handling

When user can trigger same action multiple times, use `AbortController`:

1. New abort on each submission: `voteAbortController?.abort(); voteAbortController = new AbortController()`
2. Pass signal to fetches: `fetchMedian(taskId, signal)`
3. Validate `signal?.aborted` in `.then()` to silently drop intentional aborts

## SSR Safety

- No `crypto.randomUUID()` or `Math.random()` at component init (hydration mismatch)
- Derive IDs deterministically: `const id = item.task_id`
- Browser APIs: check `globalThis.location?.origin` before `browser` flag; warn only as last resort

## Flowbite Svelte

Import from `flowbite-svelte`. Use Tailwind v4 `dark:` prefix. When copying button styles, check `color`, `size`, `class`. Omitting `color` applies Flowbite's filled blue default.

`ButtonGroup` uses `flex` internally (no wrap). For wrapping, use `<div class="flex flex-wrap gap-1">` with individual `Button` components.

## Component Structure

- Extract conditional logic to private functions: `function isCrossRouteNavigation() { ... }`
- Move business logic to `_utils/` or `utils/` with tests
- Keep components thin: one responsibility

## Reactive Data Pitfalls

- `let` captures initial value only; use `$derived` for derived/prop data
- Inside `$effect`, use `$store` syntax, not `get(store)` (bypasses reactivity)
- `$derived.by(() => { ... })` for multi-statement logic
