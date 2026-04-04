---
description: SvelteKit routing and navigation patterns
paths:
  - 'src/routes/**'
  - 'src/**/*.svelte'
---

# SvelteKit Patterns

## Routes vs API Endpoints

- Page routes (`+page.server.ts`): use `redirect()` to navigate
- API routes (`+server.ts`): use `error()` — throwing `redirect()` returns a 3xx response; `fetch` follows it by default and receives the HTML page at the redirect target instead of a JSON error

## Internal Navigation: `resolve()` Wrapping

`svelte/no-navigation-without-resolve` requires all internal navigation to use `resolve()` from `$app/paths`. Two patterns apply:

**Parameterized routes** — type-safe, preferred:

```typescript
import { resolve } from '$app/paths';
resolve('/workbooks/[slug]', { slug: workbook.slug });
```

**Static routes and computed string paths** — TypeScript declaration merging causes `ReturnType<AppTypes['RouteId']>` to resolve as `string` (the base overload in `@sveltejs/kit/types/index.d.ts` wins), making all routes require 2 arguments. Suppress with a description, and pre-compute in `<script>` when used in templates (where `@ts-expect-error` cannot be placed inline). A wrapper function does not help — the ESLint rule may not recognize `resolve()` calls inside wrappers.

```typescript
// @ts-expect-error svelte-check TS2554: AppTypes declaration merging causes RouteId to resolve as string, requiring params. Runtime behavior is correct.
const homeHref = resolve('/');
```

**External links** — add `rel="noreferrer external"` instead of wrapping with `resolve()`.

**With query string or hash** — `svelte/no-navigation-without-resolve` (eslint-plugin-svelte 3.16.0+) requires the _entire_ first argument to be a direct `resolve()` call. Concatenating `resolve(path) + search` is now rejected. Pass path, search, and hash as a single concatenated string inside `resolve()`:

```typescript
// Bad — rejected by eslint-plugin-svelte 3.16.0+
goto(resolve(url.pathname) + url.search);
replaceState(resolve(url.pathname) + url.search + url.hash, state);

// Good
goto(resolve(url.pathname + url.search));
replaceState(resolve(url.pathname + url.search + url.hash), state);
```

## Server-side Form Data Validation

`formData.get()` returns `string | File | null`. Never cast directly with `as string` or `as TaskGrade` — always validate first:

```typescript
// Bad — unsafe cast, null reaches the DB layer
const taskId = data.get('taskId') as string;
const grade = data.get('grade') as TaskGrade;

// Good — validate before use
const taskId = data.get('taskId');
const grade = data.get('grade');
if (typeof taskId !== 'string' || !taskId || typeof grade !== 'string') {
  return { success: false };
}
// taskId and grade are now string, safe to pass onward
```

For enum fields, add a membership check after the type guard:

```typescript
if (!(Object.values(TaskGrade) as string[]).includes(gradeRaw)) {
  return fail(BAD_REQUEST, { message: 'Invalid grade value.' });
}
const grade = gradeRaw as TaskGrade;
```

The same pattern applies to `url.searchParams.get()` in `+server.ts` handlers.

## `$app/state`: navigating Idle Check

`navigating` from `$app/state` always exists as an object. Use `navigating.from === null` to detect the idle state — not `navigating === null`.

To limit spinner display to cross-route navigation only, compare `navigating.from.route.id` with `navigating.to?.route.id`. Same-route query-param changes produce equal ids.

## Page Component Props

SvelteKit page components (`+page.svelte`) accept only `data` and `form` as props (`svelte/valid-prop-names-in-kit-pages`). Commented-out features that reference other props are not "dead code" — remove only the violating prop declaration, preserve the feature code.

## load() — Group Related Model Fields as Objects

When a `load()` function returns fields from the same domain model (e.g., `AtCoderAccount`),
group them as an object rather than flattening to top-level keys.
Apply default values at this boundary so the page component typically does not need to handle `undefined`.

```typescript
// Bad: flat, scattered across top-level keys
atcoder_username: user?.atCoderAccount?.handle ?? '',
atcoder_validationcode: user?.atCoderAccount?.validationCode ?? '',
is_validated: user?.atCoderAccount?.isValidated ?? false,

// Good: grouped by model, defaults absorbed here
atCoderAccount: {
  handle:         user?.atCoderAccount?.handle         ?? '',
  validationCode: user?.atCoderAccount?.validationCode ?? '',
  isValidated:    user?.atCoderAccount?.isValidated    ?? false,
},
```

When consuming in `+page.svelte`, use `$derived` to maintain reactivity across load() re-runs after form actions (see svelte-components.md).
