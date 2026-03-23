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

## Page Component Props

SvelteKit page components (`+page.svelte`) accept only `data` and `form` as props (`svelte/valid-prop-names-in-kit-pages`). Commented-out features that reference other props are not "dead code" — remove only the violating prop declaration, preserve the feature code.
