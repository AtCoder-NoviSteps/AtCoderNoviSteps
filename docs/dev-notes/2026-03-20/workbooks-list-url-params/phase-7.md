# Phase 7: `WorkbookTabItem.svelte` 簡素化

**レイヤー:** `src/features/workbooks/components/list/` | **リスク:** 低

`workbookType` prop と `activeWorkbookTabStore` への依存を除去し、タブクリック時の動作を `onclick` prop として親に委譲する。

---

**Files:**

- Modify: `src/features/workbooks/components/list/WorkbookTabItem.svelte`

- [ ] **Step 1: ファイル全体を以下に置き換え**

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

- [ ] **Step 2: 型チェック**

```bash
pnpm check
```

- [ ] **Step 3: コミット**

```bash
git add src/features/workbooks/components/list/WorkbookTabItem.svelte
git commit -m "refactor(workbooks/components): WorkbookTabItem removes store, exposes onclick prop"
```
