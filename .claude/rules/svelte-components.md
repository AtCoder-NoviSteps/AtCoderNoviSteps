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

## Empty-list Fallback in `{#each}`

Use `{:else}` to render a placeholder when the list is empty — no wrapper conditional needed:

```svelte
{#each items as item (item.id)}
  <Card {item} />
{:else}
  <p>No items yet.</p>
{/each}
```

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
