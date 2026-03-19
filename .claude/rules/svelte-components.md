---
description: Svelte component development rules
paths:
  - 'src/**/*.svelte'
  - 'src/lib/components/**'
  - 'src/lib/stores/**/*.svelte.ts'
---

# Svelte Components

## Runes Mode (Required)

Use `$props()`, `$state()`, `$derived()`, `$effect()` in all components. Props pattern:

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
- Stores: `snake_case.svelte.ts` in `src/lib/stores/`, class-based with `$state()`, export singleton. Pre-Runes stores (using `writable()`, `.ts` extension) must be migrated to this pattern before adding features or extending them.

## Flowbite Svelte

Import from `flowbite-svelte`. Use Tailwind CSS v4 utility classes. Dark mode: `dark:` prefix.

## `$state()` Initialization with `$props()`

Referencing `$props()` inside `$state()` initializer triggers "This reference only captures the initial value". Wrap with `untrack` if intentional:

```svelte
let count = $state(untrack(() => initialCount)); // intentional: prop is initial seed only
```

## `$effect` — Store Reading

Inside `$effect`, use `$store` syntax, not `get(store)`. `get()` bypasses the signal graph — the effect will not re-run when the store updates:

```svelte
// Bad: get() takes a snapshot; effect won't react to store changes
$effect(() => {
  const grade = get(myStore).get(key) ?? fallback;
});

// Good: $store subscribes and re-runs the effect on updates
$effect(() => {
  const grade = $myStore.get(key) ?? fallback;
});
```

## `$derived` — No Arrow Wrapper

Use `$derived(expr)`, not `$derived(() => expr)`. The arrow form makes the derived value a _function_, not a reactive value — dependencies may not be tracked and the template call site is confusing.

## `{@const}` Placement

`{@const}` must be an **immediate child** of a block statement (`{#if}`, `{#each}`, `{:else}`, `{#snippet}`, etc.). Placing it inside an HTML element is a compile error:

## `{#snippet}` Placement

Define snippets at the **top level**, outside component tags. Inside a tag = named slot = type error:

```svelte
<!-- Good -->
{#snippet footer()}...{/snippet}
<Dialog {footer} />

<!-- Bad: named slot, not a snippet prop -->
<Dialog>{#snippet footer()}...{/snippet}</Dialog>
```

## Snippet vs Component

Prefer `{#snippet}` when: (1) needs direct `$state` access, (2) pure display only, (3) same-file DRY.
Promote to component when: independent state/lifecycle needed, exceeds ~30 lines, or reused across files.

**Sibling consistency** — when one sibling block warrants snippet extraction, extract its parallel siblings too, even if they are short. A parent template that mixes inline markup with `{@render}` calls is harder to scan than one where every top-level section is a named snippet.

## Component Boundaries

- One component, one responsibility: don't mix display, state management, and data fetching
- Extract `$derived`/`$effect` logic exceeding ~5 lines to a custom store
- Extract repeated UI patterns (2+ uses) to a snippet or component (see Snippet vs Component)

## Keep Components Thin

Business logic and pure utilities belong outside `<script>` blocks — in the nearest `utils/` (or `_utils/` for routes), with adjacent unit tests. See `docs/guides/architecture.md` for layer-specific placement.

## Pure Functions and Side Effect Separation

Extract business logic as pure functions to `utils/` (or `_utils/` for routes); keep side effects in the caller:

```typescript
// Pure function in _utils/ — testable, no side effects
export function buildUpdatedUrl(url: URL, activeTab: ActiveTab): URL { ... }

// Side effect stays in the caller
replaceState(buildUpdatedUrl($page.url, activeTab), {});
```

## `{#each}` — Keys and Empty-list Fallback

Always provide a key expression when the list or its items may change dynamically. This is especially critical when the block contains an inner `{#if}` — without a key, Svelte reuses DOM nodes by position, so filtering can silently bind data to the wrong element:

```svelte
{#each workbooks as workbook (workbook.id)}
  {#if canRead(workbook)}
    <Row {workbook} />
  {/if}
{/each}
```

Use `{:else}` to render a placeholder when the list is empty — no wrapper conditional needed:

```svelte
{#each items as item (item.id)}
  <Card {item} />
{:else}
  <p>No items yet.</p>
{/each}
```

## Directory Structure: `list/` Subdirectories

Consider introducing a `list/` subdirectory (or other domain-scoped subdirectory) when the component count in a directory starts to feel unwieldy — roughly 20 files is a reasonable prompt to reconsider. Below that threshold, flat organization is preferred — subdirectories add navigation cost without proportional benefit.

## Eliminate Branching with Records

Replace `if`/ternary chains with `Record<EnumType, T>`:

```typescript
const TAB_CONFIGS: Record<ActiveTab, TabConfig> = {
  curriculum: { label: 'Curriculum', ... },
  solution:   { label: 'Solution',   ... },
};
```

Use the enum type as the key type, not `string`.

When not all enum keys need an entry, use `Partial<Record<K, V>>` as a **type annotation** — not `satisfies`. `as const satisfies Partial<Record<K, V>>` preserves the narrowed literal type, so indexing with other enum values causes a type error:

```typescript
// NG: satisfies narrows the type — obj[key] errors for keys not in the literal
const map = { [WorkBookType.SOLUTION]: SolutionTable }
  as const satisfies Partial<Record<WorkBookType, Component<Props>>>;

// OK: type annotation makes map[key] return Component<Props> | undefined
const map: Partial<Record<WorkBookType, Component<Props>>> = {
  [WorkBookType.SOLUTION]: SolutionTable,
};
// Safe to guard with: {#if map[type]} or if (map[type])
```
