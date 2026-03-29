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

Import from `flowbite-svelte`. Use Tailwind CSS v4 utility classes. Dark mode: `dark:` prefix. Important modifier: `dark:text-xxx!` (v4 syntax) — the v3 form `dark:!text-xxx` is invalid.

### ButtonGroup: No Responsive Wrapping

`ButtonGroup` uses `flex` internally — buttons do not wrap on narrow screens. When wrapping is needed, use `<div class="flex flex-wrap gap-1">` with individual `Button` components (reference: `TaskTable.svelte`).

When copying button styles from a reference component, always check all three axes: `color`, `size`, and `class`. Omitting `color` applies Flowbite's default (filled blue).

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

Always provide a key expression on every `{#each}` block. Prefer a unique field (`id`, `name`, etc.); fall back to the index `(i)` only when no unique field exists.

```svelte
{#each items as item (item.id)}   <!-- unique field preferred -->
{#each labels as label (i)}        <!-- index fallback -->
```

**Filter before `{#each}`, not inside it.** When visibility depends on a predicate (e.g. `canRead`), derive a filtered list once and iterate over it — never repeat the predicate inside a `{#if}` within the loop. This avoids computing the condition twice and keeps the template clean:

```svelte
<!-- Bad: canRead computed twice — once for count, once in template -->
let visibleCount = $derived(items.filter((i) => canRead(i)).length);

{#each items as item (item.id)}
  {#if canRead(item)}
    <Row {item} />
  {/if}
{/each}

<!-- Good: filter once, iterate over the result -->
let visibleItems = $derived(items.filter((i) => canRead(i)));

{#each visibleItems as item (item.id)}
  <Row {item} />
{/each}
```

An inner `{#if}` inside `{#each}` is still valid for conditions unrelated to list membership (e.g. feature flags, role checks that don't affect count).

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

## Props — Pass Domain Model Objects; Derive Computed Values Internally

When a component's data comes from a domain model, pass the model object as a single prop
rather than individual fields. This keeps the call site in sync with the model automatically.

Computed values (status, labels, flags derived from multiple fields) must NOT be props —
they belong inside the component as `$derived`.

```typescript
// Bad: individual fields + derived value as prop
interface Props {
  handle: string;
  validationCode: string;
  isValidated: boolean;
  status: string;  // derived — should not be a prop
}

// Good: model object as prop; status derived inside
interface Props {
  username: string;
  atCoderAccount: { handle: string; validationCode: string; isValidated: boolean };
}
let { username, atCoderAccount }: Props = $props();
const status = $derived(atCoderAccount.isValidated ? 'validated' : ...);
```

Call site passes the object directly from `$derived(data.atCoderAccount)`.

## $derived for data.* Fields in +page.svelte

When reading fields from `data` in a `+page.svelte`, use `$derived` rather than plain assignment:

```typescript
// Bad: stale after load() re-runs following a form action
const atCoderAccount = data.atCoderAccount;

// Good: stays in sync when SvelteKit re-runs load() after an action
const atCoderAccount = $derived(data.atCoderAccount);
```

`data` is a reactive prop that SvelteKit updates after each form action. A plain assignment captures the initial value only.
