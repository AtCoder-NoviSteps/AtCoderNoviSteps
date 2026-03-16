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
// Before: untestable — mixes URL construction (pure logic) with replaceState() (side effect)
function updateUrl() {
  const url = new URL($page.url);
  url.searchParams.set('tab', activeTab);
  replaceState(url, {});
}

// After: pure function in _utils/, side effect in caller
export function buildUpdatedUrl(url: URL, activeTab: ActiveTab): URL { ... }
// Caller: replaceState(buildUpdatedUrl($page.url, activeTab), {})
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
