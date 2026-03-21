# Phase 7: `WorkbookTabItem.svelte` 簡素化

**レイヤー:** `src/features/workbooks/components/list/` | **リスク:** 低

`workbookType` prop と `activeWorkbookTabStore` への依存を除去し、タブクリック時の動作を `onclick` prop として親に委譲する。

> **ストア削除の根拠（Phase 9 への前置き）:**
> `active_workbook_tab.ts` と `task_grades_by_workbook_type.ts` はいずれも Svelte v4 の `writable()` を使った **in-memory ストアのみ**（localStorage への永続化なし）。これらは URL パラメータに置き換えられるため Phase 9 で安全に削除できる。`replenishmentWorkBooksStore` のみが localStorage を使用しており、そちらは対象外。

---

**Files:**

- Modify: `src/features/workbooks/components/list/WorkbookTabItem.svelte`

- [x] **Step 1: ファイル全体を以下に置き換え**

```svelte
<script lang="ts">
  import type { Snippet } from 'svelte';
  import TabItemWrapper from '$lib/components/Tabs/TabItemWrapper.svelte';

  interface Props {
    isOpen?: boolean;
    title: string;
    tooltipContent?: string;
    children?: Snippet;
    onclick?: () => void;
  }

  let { isOpen = false, title, tooltipContent = '', children, onclick }: Props = $props();
</script>

<TabItemWrapper {isOpen} {title} {tooltipContent} {onclick}>
  {@render children?.()}
</TabItemWrapper>
```

削除: `workbookType` prop、`activeWorkbookTabStore` インポートと呼び出し

- [x] **Step 2: 型チェック**

```bash
pnpm check
```

- [x] **Step 3: コミット**

```bash
git add src/features/workbooks/components/list/WorkbookTabItem.svelte
git commit -m "refactor(workbooks/components): WorkbookTabItem removes store, exposes onclick prop"
```
