---
description: Svelte component development rules
paths:
  - 'src/**/*.svelte'
  - 'src/lib/components/**'
  - 'src/lib/stores/**/*.svelte.ts'
---

# Svelte Components

## Runes Mode (Required)

- Use `$props()` for component props
- Use `$state()` for reactive state
- Use `$derived()` for computed values
- Use `$effect()` for side effects

## Props Pattern

```svelte
<script lang="ts">
  interface Props {
    title: string;
    count?: number;
  }

  let { title, count = 0 }: Props = $props();
</script>
```

## Stores

- Place store files in `src/lib/stores/` with `.svelte.ts` extension
- Use class-based stores with `$state()` for internal state
- Export singleton instances

## Flowbite Svelte

- Import components from `flowbite-svelte`
- Use Tailwind CSS v4 utility classes
- Dark mode: Use `dark:` prefix for dark mode variants

## File Naming

- Components: `PascalCase.svelte`
- Stores: `snake_case.svelte.ts`

## Snippet vs Component

Prefer `{#snippet}` when:

1. The template needs direct access to parent `$state` (componentizing would require many props)
2. No independent state or lifecycle needed — pure display logic
3. DRY within the same file only (not reused across files)

Promote to a component when:

- Independent state management or lifecycle is needed
- Exceeds ~30 lines (cognitive load threshold)
- Reused in other files

## Keep Components Thin

- Business logic, type definitions, and pure utility functions belong in `_types/` and `_utils/`, not inside component `<script>` blocks
- Static configuration (e.g., tab configs) → `_utils/` constants
- Pure computation (e.g., URL building, priority calculation) → `_utils/` pure functions with adjacent tests

## Pure Functions and Side Effect Separation

When a function mixes side effects (URL updates, fetch, DB access) with business logic, extract the logic as a pure function to `_utils/`:

- The pure function receives its dependencies as arguments (no direct access to `$page`, stores, etc.)
- Side effects stay in the caller
- This makes the logic independently testable

```ts
// Before: untestable
function updateUrl() {
  const url = new URL($page.url);
  url.searchParams.set('tab', activeTab);
  replaceState(url, {});
}

// After: pure function in _utils/, side effect in caller
export function buildUpdatedUrl(url: URL, activeTab: ActiveTab): URL { ... }
// Caller: replaceState(buildUpdatedUrl($page.url, activeTab), {})
```

## Eliminate Branching with Records

Replace `if (activeTab === '...')` chains with `Record<ActiveTab, T>`:

```ts
// Before
const label = activeTab === 'curriculum' ? 'Curriculum' : 'Solution';

// After
const TAB_CONFIGS: Record<ActiveTab, TabConfig> = {
  curriculum: { label: 'Curriculum', ... },
  solution:   { label: 'Solution',   ... },
};
const label = TAB_CONFIGS[activeTab].label;
```

Use the enum type (e.g., `ActiveTab`) as the key type, not `string`.
