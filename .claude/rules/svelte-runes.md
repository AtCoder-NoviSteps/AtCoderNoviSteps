---
description: Svelte 5 Runes and reactivity rules
paths:
  - 'src/**/*.svelte'
  - 'src/lib/stores/**/*.svelte.ts'
  - 'src/features/**/stores/**'
---

# Svelte Runes & Reactivity

## `$state()` & `$props()`

- `let` captures initial value only; use `$derived` for props/server data
- Referencing `$props()` in `$state()` initializer? Wrap with `untrack` if intentional (seed-only)
- `pnpm check` warns: "This reference only captures the initial value"

## `SvelteMap<K, V>` — Always Type

`SvelteMap` without type params makes `.get()` return `unknown`. Always declare:

```typescript
const map = new SvelteMap<TaskGrade, TaskResults>();
```

`$state()` wrapping unnecessary — `SvelteMap` is reactive. Reset with `.clear()` not reassign.

Inside `$derived`, plain `new Map()` suffices — reactive dependency tracked at `$derived` level.

## `$derived` & `$effect`

- Prefer `$derived` over `$state` + `$effect` for computed values
- No arrow functions: `$derived(() => fn(x))` stores the function, doesn't call it
- Use `.by()` for multi-statement: `$derived.by(() => { ... })`
- Inside `$effect`, use `$store` syntax, not `get(store)` (bypasses signal graph)

## Optimistic Updates

Derive computed fields from canonical data source, not re-implement inline. Divergence → "works after reload" bugs.

Diagnostic: "Not reflected live, but fixed after reload" → check optimistic update payload.

## Async Rollback

Capture state **before** first `await`:

```typescript
const previous = items;

try {
  await saveToServer(items);
} catch {
  items = previous;
}
```

Concurrent updates can overwrite variable while awaiting; capturing prevents data loss.
