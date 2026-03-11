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
