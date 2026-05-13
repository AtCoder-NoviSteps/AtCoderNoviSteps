---
description: Accessibility rules for UI components
paths:
  - 'src/**/*.svelte'
  - 'src/lib/components/**'
  - 'src/features/**/components/**'
---

# Accessibility

## Tables

Always declare header scope:

```html
<th scope="col">Grade</th>
<th scope="row">abc001</th>
```

## Color

Never use color as the sole indicator of meaning. Grade badges and status icons must
include a visible text label or `aria-label` — screen readers and users with color
vision differences depend on it.

## Interactive Elements

Every `<button>` and `<a>` must have an accessible name: visible text, `aria-label`,
or `aria-labelledby`. Icon-only buttons require `aria-label`.

## Dynamic Content

When `{#if}` reveals a modal, dialog, or focus-trap region, move focus programmatically
on open and restore it on close.

## Flowbite Svelte

Icon-only `<Button>` variants require an explicit `aria-label`; Flowbite Svelte does
not generate one automatically. Omitting `color` only applies the `'primary'` default
style — it has no effect on `aria-label`.

## Form Labels

Every `<input>`, `<select>`, and `<textarea>` must have an associated `<label>` (via
`for`/`id`) or `aria-label`. Placeholder text does not substitute for a label.
