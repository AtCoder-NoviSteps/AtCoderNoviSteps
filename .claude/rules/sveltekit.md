---
description: SvelteKit routing and navigation patterns
paths:
  - 'src/routes/**'
  - 'src/**/*.svelte'
---

# SvelteKit Patterns

## Routes vs API Endpoints

- Page routes: use `redirect()` to navigate
- API routes (`+server.ts`): use `error()` — `redirect()` returns 3xx; `fetch` follows and gets HTML not JSON

## User-Provided Redirect Destinations

**SvelteKit's `redirect()` does NOT validate origin.** If the redirect destination comes from user input (URL query params, form data), always validate with `isSameOriginRedirect(redirectTo, url.origin)` from `src/lib/utils/url.ts` before redirecting.

## Internal Navigation: `resolve()`

All internal navigation must use `resolve()` from `$app/paths`:

- **Parameterized** (preferred): `resolve('/workbooks/[slug]', { slug: workbook.slug })`
- **Static**: `resolve('/')` + `@ts-expect-error` (AppTypes merging quirk)
- **With search/hash**: `resolve(pathname + search + hash)` (concatenate inside, not outside)
- **External**: no `resolve()`, use `rel="noreferrer external"`

## HTTP Cache Headers (`setHeaders`)

**Never set `s-maxage` / `stale-while-revalidate` on a route whose content varies by session.**
Shared caches key on URL + method + the headers named by `Vary` (RFC 9111), so without
`Vary: Cookie` an anonymous response is served to logged-in users (#3862).

- Setting the header only when logged out controls the write side, not delivery of an
  already-cached entry to a request with a session cookie.
- `Vary: Cookie` matches the whole header; with `_ga` present every returning visitor gets a
  unique key and the cache barely hits.
- No `s-maxage` means no CDN caching, so `private` / `no-store` are unnecessary (YAGNI).
- Estimate the saved invocations first. At this site's traffic the `/problems` header saved
  single-digit dollars a month and cost two weeks of a production bug.

## Form Data Validation

`formData.get()` returns `string | File | null`. Always validate before casting:

```typescript
// Bad: unsafe cast, null reaches DB layer
const taskId = data.get('taskId') as string;

// Good: validate first
const taskId = data.get('taskId');

if (typeof taskId !== 'string' || !taskId) return fail(...);
```

For enum fields:

```typescript
const gradeRaw = data.get('grade');

if (!(Object.values(TaskGrade) as string[]).includes(gradeRaw)) {
  return fail(BAD_REQUEST, { message: 'Invalid grade.' });
}

const grade = gradeRaw as TaskGrade; // Safe now
```

## Form Actions: `url` Parameter

Form action handlers receive the full `RequestEvent`, including `url`. Destructure it directly:

```typescript
export const actions = {
  default: async ({ request, locals, url }) => {
    const redirectTo = url.searchParams.get('redirectTo');
  },
};
```

`url` is guaranteed non-null. `new URL(request.url)` is an equivalent alternative but unnecessary when `url` is already available.

## Page Component Props

`+page.svelte` accepts only `data` and `form` props (`svelte/valid-prop-names-in-kit-pages`).

## load() Return Structure

Group domain model fields as objects with defaults absorbed at boundary:

```typescript
// Bad: scattered fields
export async function load() {
  return {
    username: user?.name ?? '',
    atcoderHandle: user?.atCoder?.handle ?? '',
    isValidated: user?.atCoder?.isValidated ?? false,
  };
}

// Good: grouped by model
export async function load() {
  return {
    username: user?.name ?? '',
    atCoderAccount: {
      handle: user?.atCoder?.handle ?? '',
      isValidated: user?.atCoder?.isValidated ?? false,
    },
  };
}
```

Consume with `$derived` in `+page.svelte` to sync after `load()` re-runs.

## Error Handling in load()

All async operations must be inside the try-catch block, not before it. Errors from async calls outside propagate unhandled.

**Exception:** Functions that throw `redirect()` or `error()` as control flow must be placed **before** the try-catch. A bare `catch` swallows them, silently disabling redirects and error responses.

## Auth Audit

When protecting one action (in `load()` or form actions), audit all others. Asymmetric guards are a critical vulnerability.

## success Flag & message Consistency

When action returns `success: false`, `message` and `message_type` must reflect failure. Contradicting flags are silent bugs:

```typescript
// Bad: success contradicts message
return { success: true, message: 'Failed to save' };

// Good
return { success: false, message: 'Failed to save' };
```

## navigating State

`navigating` from `$app/state` always exists (never null). Check idle: `navigating.from === null`. For cross-route navigation only: compare `navigating.from.route.id` with `navigating.to?.route.id` (same-route param changes have equal ids).
