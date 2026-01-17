# コンポーネント対応表・実装参考資料

**作成日**: 2026-01-02

**最終更新:** 2026-01-17

**用途**: svelte-5-ui-lib → Flowbite Svelte 移行時の実装参考資料

---

## 概要

本ドキュメントは、svelte-5-ui-lib から Flowbite Svelte への移行時に、各コンポーネントの対応方法を示す実装参考資料です。

コンポーネントを以下の4カテゴリに分類し、対応手数と注意点を記載しています：

1. **カテゴリ1**: ライブラリ名置き換えのみ（難易度低）
2. **カテゴリ2**: 置き換え + 属性調整（難易度中）
3. **カテゴリ3**: 外部ライブラリからの復帰（難易度中）
4. **カテゴリ4**: 抜本的な書き直し（難易度高）

実装時は、[README-plan.md](./README-plan.md) のチェックリストと照らし合わせて実施してください。

---

## 関連ドキュメント

- [README-plan.md](./README-plan.md) - 実行計画・フェーズチェックリスト・教訓
- [testing-strategy.md](./testing-strategy.md) - テスト戦略・実装例
- [investigation.md](./investigation.md) - Breaking Changes 詳細分析

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

**参考:** [Flowbite Svelte Components](https://flowbite-svelte.com/docs/components/accordion)

---

## カテゴリ2：置き換え + 属性調整（⭐⭐ 難易度中）

| コンポーネント     | 変更内容                               | 詳細                                                           | 参考                                                                        |
| ------------------ | -------------------------------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `Tabs` + `TabItem` | import + slot 名確認                   | API は同一だが、slot 名が異なる可能性                          | [Flowbite Tabs](https://flowbite-svelte.com/docs/components/tabs)           |
| `Tooltip`          | import + `triggeredBy` prop            | v3: `content` prop / v5: `triggeredBy` で target selector 指定 | [Flowbite Tooltip](https://flowbite-svelte.com/docs/components/tooltip)     |
| `Checkbox`         | import + `bind:checked`                | Svelte v5 runes: `bind:checked` で直接管理                     | [Flowbite Checkbox](https://flowbite-svelte.com/docs/components/checkbox)   |
| `Radio`            | import + `bind:group`                  | Svelte v5 runes: `bind:group` で group 管理                    | [Flowbite Radio](https://flowbite-svelte.com/docs/components/radio)         |
| `Toggle`           | import + `bind:checked`                | Svelte v5 runes: `bind:checked` で state 管理                  | [Flowbite Toggle](https://flowbite-svelte.com/docs/components/toggle)       |
| `Navbar`           | import + props 削減                    | 内部 state 管理に変更（`toggleNav`, `closeNav` props 廃止）    | [Flowbite Navbar](https://flowbite-svelte.com/docs/components/navbar)       |
| `NavBrand`         | import のみ変更                        | slot 互換、`href` prop 互換                                    | [Flowbite NavBrand](https://flowbite-svelte.com/docs/components/navbar)     |
| `NavUl`            | import + prop 確認                     | `activeUrl` で active state 管理、`classes` prop で styling    | [Flowbite NavUl](https://flowbite-svelte.com/docs/components/navbar)        |
| `NavLi`            | `aClass` → `activeClass`               | `activeClass`, `nonActiveClass` で非アクティブ時のスタイル指定 | [Flowbite NavLi](https://flowbite-svelte.com/docs/components/navbar)        |
| `NavHamburger`     | 新規追加（svelte-5-ui-lib に同等なし） | モバイル時の menu toggle ボタン。内部 state 自動管理           | [Flowbite NavHamburger](https://flowbite-svelte.com/docs/components/navbar) |

**対応例：Navbar（Header.svelte の実装例）**

```svelte
<!-- Before (svelte-5-ui-lib + 独自 state 管理) -->
<script>
  let navStatus = $state(false);
  function toggleNav() { navStatus = !navStatus; }
  function closeNav() { navStatus = false; }
</script>

<Navbar {toggleNav} {closeNav} {navStatus}>
  <NavUl>
    <NavLi href="/about" aClass="dark:text-gray-400 lg:dark:hover:text-white">About</NavLi>
  </NavUl>
</Navbar>

<!-- After (Flowbite Svelte v1.31.0 + Svelte 5 runes) -->
<script lang="ts">
  import { page } from '$app/stores';
  let activeUrl = $state($page.url.pathname);
</script>

<Navbar breakPoint="lg">
  <NavUl {activeUrl}>
    <NavLi href="/about" class="..." activeClass="dark:text-gray-400 lg:dark:hover:text-white">
      About
    </NavLi>
  </NavUl>
  <NavHamburger />
</Navbar>
```

**主な変更点:**

- `navStatus`, `toggleNav`, `closeNav` → 廃止（`NavHamburger` が内部管理）
- `aClass` → `activeClass` に rename
- `NavHamburger` 新規追加（モバイル対応のハンバーガーメニュー）
- Navbar の内部 state 管理が簡潔に

**テスト:** Playwright navbar responsive + dropdown trigger test

---

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
      <div class="flex shrink-0 w-full min-w-0 items-center justify-center">
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

- `DropdownUl` / `DropdownLi` → `DropdownUl`/`DropdownLi` （Flowbite でも互換）
- `uiHelpers()` → `triggeredBy` prop で target selector 指定
- Floating UI が自動ポジショニングを処理（複雑な CSS クラス不要）
- `bind:isOpen` で内部状態管理

#### Header.svelte における `triggeredBy` パターン

**Before (svelte-5-ui-lib + 複雑な CSS positioning):**

```svelte
<script lang="ts">
  import { Dropdown, DropdownUl, DropdownLi, uiHelpers } from 'svelte-5-ui-lib';
  import { ChevronDown } from 'lucide-svelte';

  const dropdownForDashboard = uiHelpers();
  const dropdownForUserPage = uiHelpers();
  const dropdownForExternalLinks = uiHelpers();
</script>

<NavLi
  class="flex items-center cursor-pointer"
  on:click={() => (dropdownForDashboard.open = !dropdownForDashboard.open)}
>
  管理画面
  <ChevronDown class="ms-2 h-4 w-4 transition" />
</NavLi>

<Dropdown open={dropdownForDashboard.isOpen} class="left-32 mt-0 lg:-left-10 lg:mt-10">
  <DropdownUl>
    <DropdownLi href="/admin/dashboard">Submissions</DropdownLi>
    <DropdownLi href="/admin/users">Users</DropdownLi>
  </DropdownUl>
</Dropdown>
```

**After (Flowbite Svelte + `triggeredBy` + Floating UI):**

```svelte
<script lang="ts">
  import { Dropdown, DropdownUl, DropdownLi } from 'flowbite-svelte';
  import { ChevronDown } from 'lucide-svelte';
</script>

<NavLi id="nav-dashboard" class="flex items-center cursor-pointer">
  管理画面
  <ChevronDown class="ms-2 h-4 w-4 transition" />
</NavLi>

<Dropdown triggeredBy="#nav-dashboard" class="w-48 z-20">
  <DropdownUl>
    <DropdownLi href="/admin/dashboard">Submissions</DropdownLi>
    <DropdownLi href="/admin/users">Users</DropdownLi>
  </DropdownUl>
</Dropdown>

<!-- 他の Dropdown も同様 -->
<NavLi id="nav-userpage" class="flex items-center cursor-pointer">
  ユーザーページ
  <ChevronDown class="ms-2 h-4 w-4 transition" />
</NavLi>

<Dropdown triggeredBy="#nav-userpage" class="w-48 z-20">
  <DropdownUl>
    <DropdownLi href="/dashboard/profile">Profile</DropdownLi>
  </DropdownUl>
</Dropdown>
```

**主要改善点:**

1. **ポジショニングの簡略化**: `left-32 mt-0 lg:-left-10 lg:mt-10` → `w-48 z-20` に削減
2. **状態管理の削除**: `uiHelpers()` で 3つのオブジェクト管理 → Floating UI に委譲
3. **ID ベース選択**: `triggeredBy="#nav-dashboard"` で CSS selector に統一
4. **保守性向上**: trigger 要素と Dropdown の関連付けが明示的

**参考:** [Flowbite Dropdown](https://flowbite-svelte.com/docs/components/dropdown) / [Floating UI Placement](https://floating-ui.com/docs/placement)

---

#### Dropdown ベースのカスタムコンポーネント（⭐⭐ 難易度中）

| コンポーネント        | 変更内容                              | 詳細                                                        |
| --------------------- | ------------------------------------- | ----------------------------------------------------------- |
| **UpdatingDropdown**  | `uiHelpers()` 削除 + trigger 内部移動 | `triggeredBy` CSS selector で自動制御、位置管理ロジック削除 |
| **TaskTableBodyCell** | `bind:this` 削除、trigger ボタン削除  | UpdatingDropdown に trigger 統合、呼び出しを簡潔化          |

### UpdatingDropdown + TaskTableBodyCell 移行実装例

**変更内容:**

1. **位置管理ロジックの削除**
   - `calculateDropdownPosition()`, `updateDropdownPosition()` 等をコメントアウト
   - `uiHelpers()` と `handleDropdownBehavior` action を削除
   - CSS 変数 `--dropdown-x`, `--dropdown-y` の設定を削除
   - → Floating UI が自動的にビューポート外での調整を担当

2. **trigger ボタンの内部移動**
   - 親側: `<button onclick={(event) => updatingDropdown.toggle(event)}>` を削除
   - コンポーネント側: `<div id="update-dropdown-trigger-${componentId}">` を内部に配置
   - trigger は `role="button"`, `tabindex="0"` でアクセシビリティ確保

3. **Dropdown の `triggeredBy` 方式に統一**
   - `<Dropdown triggeredBy="#update-dropdown-trigger-${componentId}">` で自動連携
   - selector ベースの制御により、複数インスタンスでも unique ID で管理可能

**Before (svelte-5-ui-lib)**

```svelte
<!-- TaskTableBodyCell.svelte -->
<script>
  let updatingDropdown: UpdatingDropdown;
</script>

<button
  type="button"
  class="shrink-0 w-6 ml-auto"
  onclick={(event) => updatingDropdown.toggle(event)}
>
  <ChevronDown class="w-4 h-4 mx-auto" />
</button>

<UpdatingDropdown bind:this={updatingDropdown} {taskResult} {isLoggedIn} {onupdate} />
```

```svelte
<!-- UpdatingDropdown.svelte (内部) -->
<script>
  let dropdown = uiHelpers();
  let dropdownStatus = $state(false);
  let dropdownPosition = $state({ x: 0, y: 0, isInBottomHalf: false });

  export function toggle(event?: MouseEvent): void {
    toggleDropdown(event, { ... });
  }

  function updateDropdownPosition(event: MouseEvent): void { ... }
  function getDropdownClasses(isInBottomHalf: boolean): string { ... }
</script>

<div use:handleDropdownBehavior={{ ... }}>
  <Dropdown
    {activeUrl}
    {dropdownStatus}
    class={getDropdownClasses(dropdownPosition.isInBottomHalf)}
  >
    <DropdownUl class="border rounded-lg shadow">
      {#each submissionStatusOptions as submissionStatus}
        <DropdownLi href="javascript:void(0)" onclick={() => handleClick(submissionStatus)}>
          {submissionStatus.labelName}
        </DropdownLi>
      {/each}
    </DropdownUl>
  </Dropdown>
</div>
```

**After (Flowbite Svelte v1.31.0)** ✅

```svelte
<!-- TaskTableBodyCell.svelte (シンプル化) -->
<script>
  // bind:this 削除、trigger ボタン削除
</script>

<UpdatingDropdown {taskResult} {isLoggedIn} {onupdate} />
```

```svelte
<!-- UpdatingDropdown.svelte (位置管理削除、Floating UI 自動制御) -->
<script>
  const componentId = Math.random().toString(36).substring(2);
  // uiHelpers() 削除
  // 位置管理ロジック → コメントアウト
</script>

<div class="flex items-center gap-1">
  <!-- Trigger Button (内部移動) -->
  <div
    id={`update-dropdown-trigger-${componentId}`}
    class="flex-shrink-0 w-6 ml-auto cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 rounded p-1 transition"
    role="button"
    tabindex="0"
    aria-label="Update submission status"
  >
    <ChevronDown class="w-4 h-4 mx-auto" />
  </div>

  <!-- Dropdown Menu (triggeredBy で自動連携) -->
  <Dropdown triggeredBy={`#update-dropdown-trigger-${componentId}`} class="w-32 z-50">
    {#if isLoggedIn}
      {#each submissionStatusOptions as submissionStatus}
        <DropdownItem onclick={() => handleClick(submissionStatus)}>
          <div class="flex items-center justify-between w-full">
            <span>{submissionStatus.labelName}</span>
            {#if taskResult.status_name === submissionStatus.innerName}
              <Check class="w-4 h-4 text-primary-600 dark:text-gray-300" strokeWidth={3} />
            {/if}
          </div>
        </DropdownItem>
      {/each}
    {:else}
      <DropdownItem href={SIGNUP_PAGE}>アカウント作成</DropdownItem>
      <DropdownDivider />
      <DropdownItem href={LOGIN_PAGE}>ログイン</DropdownItem>
    {/if}
  </Dropdown>
</div>

{#if showForm && selectedSubmissionStatus}
  {@render submissionStatusForm(taskResult, selectedSubmissionStatus)}
{/if}
```

### 移行時の注意点

1. **trigger ID の一意性確保** ✅
   - `Math.random().toString(36).substring(2)` で unique ID 生成
   - 複数の UpdatingDropdown インスタンスでも selector が重複しない

2. **アクセシビリティ対応** ✅
   - trigger `<div>` に `role="button"`, `tabindex="0"`, `aria-label` を付与
   - ブラウザのデフォルトボタンスタイルを避けつつ、キーボード操作対応

3. **スタイル統一** ✅
   - trigger: `hover:bg-gray-200 dark:hover:bg-gray-700` でホバー状態表示
   - Dropdown: `class="w-32 z-50"` で幅と重なり順序を指定
   - 既存の見た目を保持

4. **位置管理ロジックはコメント保持** ✅
   - Floating UI の自動ポジショニングに任せる
   - 将来的にカスタム配置が必要になった場合の参考用にコメント保持

### 教訓

- **trigger の責任分離**: 親から trigger ボタン管理を削除し、コンポーネント内で完結 → 呼び出し側が単純化
- **CSS selector ベースの制御**: `bind:this` や export function より、`triggeredBy` selector による自動制御が保守性↑
- **Floating UI の活用**: ビューポート外での自動調整により、複雑な位置計算が不要

### 4-2. Modal

**差分の大きさ:** 🟡 中（native `<dialog>` ベース）

**主な変更点:**

- native HTML `<dialog>` element ベース
- `$state(open)` runes で状態管理（uiHelpers 削除）
- `bind:open` で Modal の可視性制御
- SvelteKit Form Actions (`use:enhance`) との共存
- フォーカストラップ、outside click は native で自動処理

### Modal 状態管理パターン比較表

| 項目                   | svelte-5-ui-lib                               | Flowbite Svelte                             | 説明                               |
| ---------------------- | --------------------------------------------- | ------------------------------------------- | ---------------------------------- |
| **状態管理**           | `uiHelpers()` で `open/close` 関数実装        | `$state(open)` runes で boolean 管理        | Flowbite は単純な boolean binding  |
| **バインド方式**       | Custom `modalStatus` prop + 関数呼び出し      | `bind:open` で双方向バインド                | UI state の管理のみ                |
| **フォーム統合**       | 手動 `<form>` タグで別管理                    | 手動 `<form method="POST">` タグで管理      | SvelteKit Form Actions と共存      |
| **フォーム送信**       | `onsubmit` handler + `event.preventDefault()` | `use:enhance` で server action 自動処理     | server-side form submission に対応 |
| **モーダルクローズ**   | `closeModal()` 関数を明示呼び出し             | form success 後に `modalOpen = false` 設定  | `use:enhance` result で制御        |
| **フッターレンダリ**   | Slot で custom レンダリング                   | Button を form 内に直接配置                 | form submit button として機能      |
| **フォーカストラップ** | `uiHelpers()` で実装                          | native `<dialog>` が自動処理                | HTML5仕様で自動                    |
| **Outside Click**      | `uiHelpers()` で実装                          | `outsideclose` prop で制御（default: true） | clickoutside での dismiss 可能     |

### Modal 実装例

**Before (svelte-5-ui-lib)**

```svelte
<script lang="ts">
  import { Modal, Button } from 'svelte-5-ui-lib';
  import { uiHelpers } from 'svelte-5-ui-lib';

  let { taskResult } = $props();
  const { open, close, isOpen } = uiHelpers();

  async function handleSubmit(event: Event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const response = await fetch('?/update', {
      method: 'POST',
      body: formData,
    });
    if (response.ok) close();
  }
</script>

<Button onclick={() => open()}>Update Status</Button>

<Modal {isOpen} {close}>
  <form onsubmit={handleSubmit}>
    <select name="status">
      <option>Accepted</option>
      <option>Wrong Answer</option>
    </select>
    <button type="submit">Confirm</button>
    <button type="button" onclick={close}>Cancel</button>
  </form>
</Modal>
```

**After (Flowbite Svelte v1.31.0)** ✅

```svelte
<script lang="ts">
  import { Modal, Button, Select } from 'flowbite-svelte';
  import { enhance } from '$app/forms';

  let { taskResult } = $props();
  let modalOpen = $state(false);

  async function handleSubmit(event: Event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const response = await fetch('?/update', {
      method: 'POST',
      body: formData,
    });
    if (response.ok) {
      modalOpen = false;
    }
  }
</script>

<Button onclick={() => (modalOpen = true)}>Update Status</Button>

<Modal bind:open={modalOpen} size="sm" outsideclose={true}>
  <form method="POST" action="?/update" onsubmit={handleSubmit} use:enhance>
    <Select name="status" required>
      <option selected>Accepted</option>
      <option>Wrong Answer</option>
    </Select>
    <Button type="submit" class="w-full">Confirm</Button>
  </form>
</Modal>
```

### Modal 実装時の注意点

1. **`form` prop は不要**
   - Flowbite の `form` prop は「クライアント側の form validation UI」に特化
   - SvelteKit server action には向かない
   - 手動で `<form method="POST" action="?/update">` を用意すること

2. **`bind:open` は UI state のみ**
   - Modal の可視性を制御するだけ
   - form submission とは独立

3. **`use:enhance` で server action を自動処理**

   ```typescript
   async function handleSubmit(event: Event) {
     event.preventDefault();
     const response = await fetch('?/update', { ... });
     if (response.ok) {
       modalOpen = false;  // form success 時のみ close
     }
   }
   ```

4. **`outsideclose` で dismiss 制御**
   - `outsideclose={true}` : outside click で modal close 可能（デフォルト）
   - `outsideclose={false}` : outside click を無視

5. **フォーカストラップと keyboard 処理**
   - native `<dialog>` の focustrap は自動
   - Esc キーでも close 可能（HTML5 standard）

6. **エラーハンドリングは手動**
   - `use:enhance` では server error を自動処理しない
   - try-catch で HTTP error をキャッチして処理

### 参考資料

- [Flowbite Modal](https://flowbite-svelte.com/docs/components/modal)
- [HTML5 `<dialog>` element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog)
- [SvelteKit Form Actions use:enhance](https://kit.svelte.dev/docs/form-actions)

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

- [Components Overview](https://flowbite-svelte.com/docs/components/accordion)
- [TypeScript API Reference](https://flowbite-svelte.com/docs/pages/typescript)
- [GitHub Repository](https://github.com/themesberg/flowbite-svelte)

### Svelte 関連

- [svelte 5 runes guide](https://svelte.dev/docs/svelte/v5-migration-guide)
- [Svelte 5 API Reference](https://svelte.dev/docs)

### 移行ガイド

- [メイン計画ドキュメント](./plan.md)
- [テスト戦略](./testing-strategy.md)

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
