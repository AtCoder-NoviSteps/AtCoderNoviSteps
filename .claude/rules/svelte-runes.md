---
description: Svelte 5 Runes and reactivity rules
paths:
  - 'src/**/*.svelte'
  - 'src/lib/stores/**/*.svelte.ts'
  - 'src/features/**/stores/**'
---

# Svelte Runes & Reactivity

## `SvelteMap<K, V>` — Always Provide Type Parameters

`SvelteMap` without type parameters makes `.get()` return `unknown`. Always declare with explicit types:

```typescript
// Bad: .get() returns unknown — causes type errors at call sites
const map = new SvelteMap();

// Good: .get() returns TaskResults | undefined
const map = new SvelteMap<TaskGrade, TaskResults>();
```

`$state()` wrapping is unnecessary — `SvelteMap` is already reactive (`svelte/no-unnecessary-state-wrap`). Reset with `.clear()` rather than reassigning.

## `let`/`const` — Reactive Data Requires `$derived`

Plain `let` or `const` in Svelte 5 component `<script>` executes once at component creation. Values derived from props or server data must use `$derived()`:

```typescript
// Bad: captures only the initial value — won't update when data reloads
let user = data.loggedInUser;

// Good
let user = $derived(data.loggedInUser);
```

`pnpm check` warns: "This reference only captures the initial value."

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

## `$derived` — Prefer Over `$state` + `$effect`

When a value is purely computed from other state, use `$derived` instead of initializing with `$state` and updating in `$effect`:

```typescript
// Bad: unnecessary mutation via $effect
let items = $state<Item[]>([]);
$effect(() => {
  items = source.filter(isActive);
});

// Good: $derived — reactive, no mutation needed
let items = $derived(source.filter(isActive));
```

**Do not pass an arrow function to `$derived`**: `$derived(() => fn(x))` stores the arrow function itself as the derived value — `fn` is never called and `x` is not tracked as a dependency. Use `$derived(fn(x))` for single expressions, or `$derived.by(() => { ... })` when multiple statements are needed. `$derived(expr)` is equivalent to `$derived.by(() => expr)` — the `.by` variant exists solely to allow a multi-statement function body.

## Async Rollback: Capture State Before `await`

Capture `$state` values before the first `await` for safe rollback. A concurrent update can overwrite the variable while awaiting:

```typescript
const previous = items; // capture before await
try {
  await saveToServer(items);
} catch {
  items = previous;
}
```

## Optimistic Updates

Derive computed fields (flags, labels, etc.) from the canonical data source — don't re-implement the derivation inline. Divergence causes a "works after reload" bug where the server state is correct but the client-side update is wrong.

**Diagnostic**: "Not reflected live, but fixed after reload" → suspect the optimistic update payload, not the reactivity system.
