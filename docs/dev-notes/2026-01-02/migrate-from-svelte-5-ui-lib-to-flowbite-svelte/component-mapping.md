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

## カテゴリ3：外部ライブラリ復帰（⭐⭐ 難易度中）

| コンポーネント | 変更内容                                         | 詳細                                                |
| -------------- | ------------------------------------------------ | --------------------------------------------------- |
| **Carousel**   | embla-carousel-svelte → Flowbite Svelte Carousel | Plugin-based → Prop-based API、自動スケーリング無し |

### Carousel プロパティ対応表

| 項目                   | embla-carousel-svelte                            | Flowbite Carousel                            | 説明                                                          |
| ---------------------- | ------------------------------------------------ | -------------------------------------------- | ------------------------------------------------------------- |
| **基本API**            | `use:emblaCarouselSvelte={{ options, plugins }}` | `<Carousel {images} duration={3000}>`        | embla: action directive / Flowbite: component-based           |
| **自動スライド**       | `Autoplay()` plugin                              | `duration` prop                              | embla: plugin系 / Flowbite: prop単位で制御                    |
| **ループ動作**         | `options = { loop: true }`                       | デフォルト有効                               | Flowbite は常にループ（設定不可）                             |
| **画像配列形式**       | `[{ src: '...', alt: '...' }]`                   | `[{ src: '...', alt: '...', title: '...' }]` | **互換性あり**（同一形式）                                    |
| **画像スケーリング**   | `imgClass="object-contain h-full w-fit"`         | `slideFit="contain"`                         | embla: CSS class管理 / Flowbite: prop制御                     |
| **レスポンシブ高さ**   | 外側div に手動で class 設定                      | `class="min-h-[300px] xs:min-h-[400px]..."`  | どちらも外側divで制御必須                                     |
| **Overflow 処理**      | 外側 div に `overflow-hidden`                    | 内部処理あり + 明示的推奨                    | Flowbite内部処理だが、CSS overrides対応のため明示的指定が安全 |
| **Alt 属性**           | 手動設定（`imgClass` 別管理）                    | `images` 配列内に `alt` 含める               | **自動適用**（Slide.svelte で自動反映）                       |
| **インジケータ表示**   | 手動実装が必要                                   | `<CarouselIndicators />`                     | Flowbite が提供（コンポーネント化）                           |
| **ナビゲーション矢印** | 手動実装が必要                                   | `<Controls />` (任意）                       | Flowbite が提供（optional）                                   |

### 移行実装例

**Before (embla-carousel-svelte v8.6.0)**

```svelte
<script>
  import emblaCarouselSvelte from 'embla-carousel-svelte';
  import Autoplay from 'embla-carousel-autoplay';

  let options = { loop: true };
  let plugins = [Autoplay()];
  const problemImages = [
    { src: '...', alt: 'Image 1', title: 'sample' },
    // ...
  ];
</script>

<div class="overflow-hidden m-4" use:emblaCarouselSvelte={{ options, plugins }}>
  <div class="flex min-h-[300px] xs:min-h-[400px] md:min-h-[540px] mb-8 xs:mb-12">
    {#each problemImages as image}
      <div class="flex flex-shrink-0 w-full min-w-0 items-center justify-center">
        <Img src={image.src} alt={image.alt} imgClass="object-contain h-full w-fit" />
      </div>
    {/each}
  </div>
</div>
```

**After (Flowbite Carousel v1.31.0)** ✅

```svelte
<script>
  import { Carousel, CarouselIndicators } from 'flowbite-svelte';

  const problemImages = [
    { src: '...', alt: 'Image 1', title: 'sample' }, // alt は自動適用
    // ...
  ];
</script>

<div class="m-4 mb-8 xs:mb-12 overflow-hidden">
  <Carousel
    images={problemImages}
    duration={3000}
    slideFit="contain"
    class="min-h-[300px] xs:min-h-[400px] md:min-h-[540px]"
  >
    <CarouselIndicators />
  </Carousel>
</div>
```

### 移行時の注意点

1. **Plugin-based → Prop-based への設計変更**
   - `Autoplay()` plugin → `duration` prop（ミリ秒単位）
   - 簡潔だが、細かい制御が必要な場合は Flowbite API では対応不可

2. **自動スケーリング不可**
   - embla: `imgClass` で自動管理
   - Flowbite: `slideFit` prop で明示的に指定が必要

3. **レスポンシブクラスは手動指定**
   - 外側 div の `class` prop に`min-h-[300px] xs:min-h-[400px]` など記載必須
   - embla同様、Flowbite も内部では自動生成されない

4. **Alt 属性は自動適用** ✅
   - `images` 配列の各オブジェクトに `alt` を含める
   - Slide.svelte 内で `{...image}` で展開されるため自動で反映

5. **Overflow 処理は明示的に指定** ✅
   - Flowbite 内部で処理される可能性だが、CSS overrides に対応するため外側 div に `overflow-hidden` を追加推奨

### 教訓

- **API 設計の違いを理解することの重要性**: Plugin-based と Prop-based では柔軟性が異なる
- **ドキュメント不足時はソースコード確認が必須**: alt属性の自動適用はドキュメント未記載だったが GitHub で確認可能
- **Canonical CSS classes の使用**: Tailwind v4 では `min-h-[300px]` 形式が推奨される（VSCode拡張で警告あり）

---

**作成日:** 2026-01-02

**最終更新:** 2026-01-04

**ステータス:** カテゴリ3 実装完了、ドキュメント更新完了
