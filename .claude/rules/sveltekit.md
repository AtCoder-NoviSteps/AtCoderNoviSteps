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

## Internal Navigation: `resolve()`

All internal navigation must use `resolve()` from `$app/paths`:

- **Parameterized** (preferred): `resolve('/workbooks/[slug]', { slug: workbook.slug })`
- **Static**: `resolve('/')` + `@ts-expect-error` (AppTypes merging quirk)
- **With search/hash**: `resolve(pathname + search + hash)` (concatenate inside, not outside)
- **External**: no `resolve()`, use `rel="noreferrer external"`

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

Wrap service calls in try-catch, return safe defaults:

```typescript
const data = await service.fetch(...).catch(() => []);
```

Prevents single service error from crashing entire page.

## Auth Audit

When adding guard to one action in `+page.server.ts`, audit all other actions. Asymmetric guards (some protected, others not) are a recurring vulnerability.

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
