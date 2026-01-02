# コンポーネント対応マトリクス

svelte-5-ui-lib → Flowbite Svelte 移行時の各コンポーネント難易度と対応方法。

---

## 概要

コンポーネントを以下の4カテゴリに分類。各カテゴリの対応手数と注意点を記載。

---

## カテゴリ1：ライブラリ名置き換えのみ（⭐ 難易度低）

| コンポーネント   | svelte-5-ui-lib | Flowbite Svelte | 対応内容                    | 注意点                        |
| ---------------- | --------------- | --------------- | --------------------------- | ----------------------------- |
| `Heading`        | ✅              | ✅              | import のみ変更             | `tag` prop 互換               |
| `P`              | ✅              | ✅              | import のみ変更             | -                             |
| `Label`          | ✅              | ✅              | import のみ変更             | -                             |
| `Input`          | ✅              | ✅              | import のみ変更             | -                             |
| `Hr`             | ✅              | ✅              | import のみ変更             | -                             |
| `Img`            | ✅              | ✅              | import のみ変更             | -                             |
| `List`           | ✅              | ✅              | import のみ変更             | slot 互換                     |
| `Li`             | ✅              | ✅              | import のみ変更             | -                             |
| `Helper`         | ✅              | ✅              | import のみ変更             | -                             |
| `Badge`          | ✅              | ✅              | import のみ変更             | `color` prop 互換             |
| `Avatar`         | ✅              | ✅              | import のみ変更             | `src`, `size` prop 互換       |
| `Breadcrumb`     | ✅              | ✅              | import のみ変更             | component 階層互換            |
| `BreadcrumbItem` | ✅              | ✅              | import のみ変更             | slot 互換                     |
| `Table`          | ✅              | ✅              | import のみ変更             | -                             |
| `TableHeadCell`  | ✅              | ✅              | import のみ変更             | -                             |
| `TableBodyCell`  | ✅              | ✅              | import のみ変更             | -                             |
| `TableBodyRow`   | ✅              | ✅              | import のみ変更             | -                             |
| `Button`         | ✅              | ✅              | import のみ変更 + props確認 | size, color, variant 系を確認 |
| `Card`           | ✅              | ✅              | import のみ変更             | slot 互換                     |
| `Alert`          | ✅              | ✅              | import のみ変更             | `color` prop 互換             |

**対応方法:**

```typescript
// Before
import { Heading, Button, Label } from 'svelte-5-ui-lib';

// After
import { Heading, Button, Label } from 'flowbite-svelte';
```

**テスト:** Vitest snapshot または Playwright (コンポーネント render 確認)

**参考:** [Flowbite Svelte Components](https://flowbite-svelte.com/docs/components/)

---

## カテゴリ2：置き換え + 属性調整（⭐⭐ 難易度中）

| コンポーネント     | 変更内容                    | 詳細                                                           | 参考                                                                      |
| ------------------ | --------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `Tabs` + `TabItem` | import + slot 名確認        | API は同一だが、slot 名が異なる可能性                          | [Flowbite Tabs](https://flowbite-svelte.com/docs/components/tabs)         |
| `Tooltip`          | import + `triggeredBy` prop | v3: `content` prop / v5: `triggeredBy` で target selector 指定 | [Flowbite Tooltip](https://flowbite-svelte.com/docs/components/tooltip)   |
| `Checkbox`         | import + `bind:checked`     | Svelte v5 runes: `bind:checked` で直接管理                     | [Flowbite Checkbox](https://flowbite-svelte.com/docs/components/checkbox) |
| `Radio`            | import + `bind:group`       | Svelte v5 runes: `bind:group` で group 管理                    | [Flowbite Radio](https://flowbite-svelte.com/docs/components/radio)       |
| `Toggle`           | import + `bind:checked`     | Svelte v5 runes: `bind:checked` で state 管理                  | [Flowbite Toggle](https://flowbite-svelte.com/docs/components/toggle)     |

**対応例：Tabs**

```svelte
<!-- Before (svelte-5-ui-lib v4 記法) -->
<script>
  import { Tabs, TabItem } from 'svelte-5-ui-lib';
</script>

<Tabs>
  <TabItem title="Tab 1">
    Content 1
  </TabItem>
</Tabs>

<!-- After (Flowbite Svelte v5 記法) -->
<script lang="ts">
  import { Tabs, TabItem } from 'flowbite-svelte';
</script>

<Tabs>
  <TabItem title="Tab 1">
    Content 1
  </TabItem>
</Tabs>
```

**対応例：Checkbox**

```svelte
<!-- Before -->
<script>
  let checked = false;
</script>
<Checkbox bind:checked={checked} />

<!-- After (v5 runes) -->
<script lang="ts">
  let checked = $state(false);
</script>
<Checkbox bind:checked />
```

**テスト:** Vitest props + event テスト

---

## カテゴリ3：外部ライブラリからの復帰（⭐⭐ 難易度中）

| コンポーネント | 現在の対応                         | Flowbite Svelte での対応            | 変更内容                                        |
| -------------- | ---------------------------------- | ----------------------------------- | ----------------------------------------------- |
| `Carousel`     | `embla-carousel-svelte` (外部導入) | ✅ Native Flowbite Svelte component | embla 削除、Flowbite Svelte Carousel へ置き換え |

**対応例：Carousel**

```typescript
// Before（embla-carousel-svelte）
import { Carousel } from 'embla-carousel-svelte';

// After（Flowbite Svelte）
import { Carousel, Controls, CarouselIndicators } from 'flowbite-svelte';
```

**詳細:** [Flowbite Carousel](https://flowbite-svelte.com/docs/components/carousel)

**テスト:** Playwright slide navigation test

---

## カテゴリ4：抜本的な書き直し必要（⭐⭐⭐ 難易度高）

### 4-1. Dropdown（最優先対応）

**差分の大きさ:** 🔴 高

**svelte-5-ui-lib:**

```svelte
<script>
  import { Dropdown, DropdownUl, DropdownLi, uiHelpers } from 'svelte-5-ui-lib';
  let { open } = uiHelpers();
</script>

<button on:click={() => (open = !open)}>Menu</button>
<Dropdown {open}>
  <DropdownUl>
    <DropdownLi>Item 1</DropdownLi>
  </DropdownUl>
</Dropdown>
```

**Flowbite Svelte:**

```svelte
<script lang="ts">
  import { Button, Dropdown, DropdownItem } from 'flowbite-svelte';
  import { ChevronDownOutline } from 'flowbite-svelte-icons';

  let isOpen = $state(false);
</script>

<Button onclick={() => (isOpen = !isOpen)}>
  Menu
  <ChevronDownOutline class="ms-2 h-6 w-6" />
</Button>

<Dropdown bind:isOpen simple>
  <DropdownItem>Item 1</DropdownItem>
  <DropdownItem onclick={() => (isOpen = false)}>Item 2</DropdownItem>
</Dropdown>
```

**主な変更点:**

- `DropdownUl` / `DropdownLi` → `DropdownItem` に統合
- `uiHelpers()` → `$state(isOpen)` runes で管理
- `bind:isOpen` でバインド
- slot ではなく component の直接配置

**参考:** [Flowbite Dropdown](https://flowbite-svelte.com/docs/components/dropdown)

---

### 4-2. Modal

**差分の大きさ:** 🟡 中（native `<dialog>` ベース）

**主な変更点:**

- native HTML `<dialog>` element ベース
- `form` prop で内部フォーム自動生成
- `bind:open` でバインド
- `onaction` callback で submit/cancel 処理
- `uiHelpers()` 不要（フォーカストラップ、outside click は native で処理）

**Flowbite Svelte:**

```svelte
<script lang="ts">
  import { Button, Modal } from 'flowbite-svelte';
  let open = $state(false);
</script>

<Button onclick={() => (open = true)}>Open Modal</Button>

<Modal
  form
  bind:open
  onaction={({ action }) => {
    if (action === 'accept') {
      console.log('Accepted');
    }
  }}
>
  <p>Modal content</p>
  {#snippet footer()}
    <Button type="submit" value="accept">Accept</Button>
    <Button type="submit" value="decline">Decline</Button>
  {/snippet}
</Modal>
```

**参考:** [Flowbite Modal](https://flowbite-svelte.com/docs/components/modal)

---

### 4-3. Toast

**差分の大きさ:** 🟡 中

**主な変更点:**

- `ToastContainer` で位置管理（top-right, bottom-left 等）
- auto-dismiss は手動実装（setTimeout）
- `transition` props で Svelte transitions 対応

**参考:** [Flowbite Toast](https://flowbite-svelte.com/docs/components/toast)

---

### 4-4. Spinner

**差分の大きさ:** ⭐ 低（置き換えのみ）

**主な変更点:**

- `type`: "default", "dots", "bars", "pulse", "orbit"
- `color`: "primary", "green", "red", "yellow" 等
- `size`: "4", "6", "8"

**参考:** [Flowbite Spinner](https://flowbite-svelte.com/docs/components/spinner)

---

### 4-5. ButtonGroup

**差分の大きさ:** ⭐ 低（ラッパー）

**Flowbite Svelte:**

```svelte
<script lang="ts">
  import { ButtonGroup, Button } from 'flowbite-svelte';
</script>

<ButtonGroup>
  <Button>Profile</Button>
  <Button>Settings</Button>
  <Button>Messages</Button>
</ButtonGroup>
```

**参考:** [Flowbite ButtonGroup](https://flowbite-svelte.com/docs/components/button-group)

---

### 4-6. Footer / FooterCopyright

**差分の大きさ:** 🟡 中（variants）

**Flowbite Svelte:**

```svelte
<script lang="ts">
  import { Footer, FooterCopyright, FooterLink, FooterLinkGroup } from 'flowbite-svelte';
</script>

<Footer>
  <FooterCopyright href="/" by="Company™" year={2024} />
  <FooterLinkGroup>
    <FooterLink href="/">About</FooterLink>
    <FooterLink href="/">Privacy Policy</FooterLink>
  </FooterLinkGroup>
</Footer>
```

**参考:** [Flowbite Footer](https://flowbite-svelte.com/docs/components/footer)

---

## uiHelpers 廃止への対応

`svelte-5-ui-lib` の `uiHelpers()` は以下で使用：

| 使用箇所       | svelte-5-ui-lib                  | Flowbite Svelte での代替               |
| -------------- | -------------------------------- | -------------------------------------- |
| Modal state    | `uiHelpers()` で open/close 管理 | `$state(open)` runes + `bind:open`     |
| Dropdown state | `uiHelpers()` で open/close 管理 | `$state(isOpen)` runes + `bind:isOpen` |
| Focus trap     | `uiHelpers()` で実装             | native `<dialog>` が自動処理           |
| Outside click  | `uiHelpers()` で実装             | Floating UI で自動処理                 |
| Scroll lock    | `uiHelpers()` で実装             | native `<dialog>` が自動処理           |

**置き換え方針:**

- Modal / Dropdown の state は Svelte v5 `$state` runes で管理
- フォーカストラップ、outside click は Flowbite Svelte が自動処理

---

## Svelte v4 → v5 runes への書き換え

移行時に v5 runes 記法への統一が必須。

| v4                                       | v5                                                          | 用途                 |
| ---------------------------------------- | ----------------------------------------------------------- | -------------------- |
| `let count = 0; $: doubled = count * 2;` | `let count = $state(0); let doubled = $derived(count * 2);` | 反応性、派生状態     |
| `let open = false;` (with event)         | `let open = $state(false);` (with event)                    | state 管理           |
| `onMount(...)`                           | `$effect(() => { ... })`                                    | ライフサイクル       |
| `if (browser) { ... }`                   | `$effect()` の中でブラウザチェック                          | クライアント専用処理 |

**参考:**

- [Svelte 5 Runes Documentation](https://svelte.dev/docs/svelte-5-migration-guide)
- [PR #1731 (v4→v5 書き換え例)](https://github.com/AtCoder-NoviSteps/AtCoderNoviSteps/pull/1731)

---

## 参考資料

### Flowbite Svelte 公式ドキュメント

- [Components Overview](https://flowbite-svelte.com/docs/components/)
- [TypeScript API Reference](https://flowbite-svelte.com/docs/pages/typescript)
- [GitHub Repository](https://github.com/themesberg/flowbite-svelte)

### Svelte 関連

- [Svelte 5 Runes Guide](https://svelte.dev/docs/svelte-5-migration-guide)
- [Svelte 5 API Reference](https://svelte.dev/docs)

### 移行ガイド

- [メイン計画ドキュメント](./plan.md)
- [Smoke Tests ガイド](./smoke-tests.md)

---

**作成日:** 2026-01-02
**最終更新:** 2026-01-02
**ステータス:** ドラフト完成
