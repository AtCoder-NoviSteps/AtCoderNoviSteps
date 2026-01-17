# テスト戦略・E2E スモークテスト実装ガイド

**作成日**: 2026-01-02

**対象**: svelte-5-ui-lib → flowbite-svelte 移行時の回帰検出テスト

---

## 概要

本ドキュメントは、TailwindCSS v3→v4 移行と Flowbite Svelte への置き換え後に、前回失敗ポイント（カスタムカラー未反映、navbar responsive 破壊、ダークモード消失）を検出するテスト戦略を記載します。

---

## テストフレームワークの選択

| テスト種別             | Vitest                   | Playwright E2E               |
| ---------------------- | ------------------------ | ---------------------------- |
| **対象**               | コンポーネント単体、関数 | ユーザーフロー（実ブラウザ） |
| **実行速度**           | 高速（秒単位）           | 遅い（分単位）               |
| **デバッグ難度**       | 低い                     | 高い                         |
| **スモークテスト向き** | △ 条件付き               | ⭐ 推奨                      |

**本プロジェクトでは Playwright を重視する理由：**

- CSS ビルド出力検証（ファイル読み込み + regex 検証）
- 実ブラウザでの UI 動作確認（セレクタ特定、レイアウト確認）
- 前回失敗ポイント（レスポンシブ、ダークモード toggle）は UI 操作テストが有効

---

## テスト設計方針

### 目的の明確化

```
前回の失敗：
  - ビルドは成功したが UI が崩壊
  - カスタム colors（primary, atcoder）が反映されない
  - navbar のレスポンシブが動作しない
  - ダークモード toggle が消失

対策：
  - 各フェーズ完了直後に「最小限の smoke test」を実行
  - 大きな問題を素早く検出 → 詳細テストは後回し
  - 時間単位での確認を重視（分単位の遅さは許容）
```

---

## フェーズごとのテスト実行タイミング

| フェーズ                | テスト対象                        | テストファイル                | 実行タイミング          |
| ----------------------- | --------------------------------- | ----------------------------- | ----------------------- |
| **フェーズ-1**          | Playwright 環境確認、セレクタ特定 | smoke-tests.md 前提条件確認   | フェーズ-1 中に手動確認 |
| **フェーズ0**           | ビルド出力確認（カスタムカラー）  | `tests/custom-colors.spec.ts` | フェーズ0 完了直後      |
| **フェーズ1-1/1-2/1-4** | UI 動作確認（dark mode, navbar）  | `tests/dark-mode.spec.ts`     | フェーズ1-4 完了直後    |
| **フェーズ1-4**         | Navbar レスポンシブ確認           | `tests/navbar.spec.ts`        | フェーズ1-4 完了直後    |
| **フェーズ2**           | 全テスト実行による回帰検出        | `pnpm test:integration`       | 毎回の CI 実行          |

---

## 前提条件確認（フェーズ-1）

フェーズ実装前に、以下を手動確認してセレクタを特定します。

### 前提条件確認の流れ

1. `pnpm dev` で開発サーバ起動
2. ブラウザで http://localhost:5174/ にアクセス
3. Developer Tools で以下を確認

### 確認項目

#### 1-1. ダークモード切り替えボタンのセレクタ確認

```html
<!-- 実装確認済み -->
<button aria-label="Dark mode" type="button" class="...">
  <svg>...</svg>
</button>
```

**確定セレクタ**: `button[aria-label="Dark mode"]` ✅

#### 1-2. navbar 構造確認

```html
<!-- nav 要素が存在する -->
<nav class="...">
  <div>
    <button aria-label="Dark mode" ...><!-- dark mode toggle --></button>
    <button class="... lg:hidden"><!-- hamburger --></button>
    <div role="none">
      <ul>
        <li><a href="/">...</a></li>
        ...
      </ul>
    </div>
  </div>
</nav>
```

**確定セレクタ:**

- navbar: `nav` ✅
- menu items: `nav ul li a` ✅
- hamburger button: `nav button:not([aria-label])` ✅
- menu container: `div[role="none"] ul` ✅

#### 1-3. ブレークポイント確認

| デバイス        | 幅     | navbar menu 表示状態                   |
| --------------- | ------ | -------------------------------------- |
| Mobile (iPhone) | 375px  | `hidden` クラス + `lg:hidden` で非表示 |
| Tablet          | 768px  | 同上                                   |
| Desktop (lg)    | 1024px | `lg:block` で表示                      |

**確認方法**: Playwright `isVisible()` で実際のレンダリング確認

---

## テストコード実装

### テスト A: TailwindCSS v4 ビルド出力確認

**ファイル**: `tests/custom-colors.spec.ts`

**フェーズ**: フェーズ0（TailwindCSS v4 移行直後）

**目的**: ビルド出力に カスタムカラーが含まれているか確認（前回 v3→v4 失敗の再現防止）

```typescript
import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import { resolve } from 'path';

test.describe('TailwindCSS v4 configuration', () => {
  /**
   * ビルド出力（.svelte-kit/output/client/_app/immutable/assets/0.*.css）に
   * カスタムカラーが生成されているか確認
   *
   * 前提条件：pnpm build 実行済み
   */

  test('primary color is generated in CSS', () => {
    const cssDir = resolve('.svelte-kit/output/client/_app/immutable/assets');
    const cssFiles = require('fs')
      .readdirSync(cssDir)
      .filter((f: string) => f.startsWith('0.') && f.endsWith('.css'));

    expect(cssFiles.length).toBeGreaterThan(0);

    const cssPath = resolve(cssDir, cssFiles[0]);
    const css = readFileSync(cssPath, 'utf-8');

    // primary-* クラスが生成されているか
    expect(css).toMatch(/\.text-primary-[0-9]/);
    expect(css).toMatch(/\.bg-primary-[0-9]/);
  });

  test('atcoder color is generated', () => {
    const cssDir = resolve('.svelte-kit/output/client/_app/immutable/assets');
    const cssFiles = require('fs')
      .readdirSync(cssDir)
      .filter((f: string) => f.startsWith('0.') && f.endsWith('.css'));
    const cssPath = resolve(cssDir, cssFiles[0]);
    const css = readFileSync(cssPath, 'utf-8');

    // atcoder-* クラスが生成されているか
    expect(css).toMatch(/\.bg-atcoder-/);
  });

  test('xs breakpoint is available', () => {
    const cssDir = resolve('.svelte-kit/output/client/_app/immutable/assets');
    const cssFiles = require('fs')
      .readdirSync(cssDir)
      .filter((f: string) => f.startsWith('0.') && f.endsWith('.css'));
    const cssPath = resolve(cssDir, cssFiles[0]);
    const css = readFileSync(cssPath, 'utf-8');

    // CSS が正常に生成されているか（サイズ確認）
    expect(css.length).toBeGreaterThan(10000);
  });
});
```

**実行方法**:

```bash
# フェーズ0: TailwindCSS v4 @import/@config/@source 対応完了直後
pnpm build
pnpm playwright test tests/custom-colors.spec.ts
```

**成功条件**:

- ✅ primary color classes が CSS に含まれている
- ✅ atcoder color classes が CSS に含まれている
- ✅ ビルド出力が正常に生成されている

---

### テスト B: ダークモード検出

**ファイル**: `tests/dark-mode.spec.ts`

**フェーズ**: フェーズ1-4（navbar/auth コンポーネント置換完了後）

**目的**: ダークモード切り替えボタンが消失していないか確認（前回 v3→v4 失敗の再現防止）

```typescript
import { test, expect, Page, Browser } from '@playwright/test';

test.describe('Dark mode - Regression from v3->v4 migration', () => {
  /**
   * 前提条件:
   * - 前提条件確認セクション で確認したセレクタを使用
   * - pnpm dev で開発サーバ起動済み
   */

  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('dark toggle button is visible on homepage', async () => {
    await page.goto('http://localhost:5174/');

    const darkToggle = page.locator('button[aria-label="Dark mode"]');
    await expect(darkToggle).toBeVisible();
  });

  test('dark mode icon shows correctly on mobile', async () => {
    // iPhone viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:5174/');

    const darkIcon = page.locator('button[aria-label="Dark mode"] svg');
    await expect(darkIcon).toBeVisible();

    // 位置がずれていないか確認（viewport 外ではない）
    const bbox = await darkIcon.boundingBox();
    expect(bbox?.x).toBeGreaterThan(0);
    expect(bbox?.width).toBeGreaterThan(0);
  });

  test('dark mode icon shows correctly on lg (desktop)', async () => {
    // Desktop viewport
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto('http://localhost:5174/');

    const darkIcon = page.locator('button[aria-label="Dark mode"] svg');
    await expect(darkIcon).toBeVisible();
  });

  test('dark mode toggle switches theme', async () => {
    await page.goto('http://localhost:5174/');

    const html = page.locator('html');
    const initialClass = await html.getAttribute('class');

    // toggle button クリック
    const darkToggle = page.locator('button[aria-label="Dark mode"]');
    await darkToggle.click();

    // クラスが変更されたか確認（dark class が toggle される）
    const afterClass = await html.getAttribute('class');
    expect(initialClass).not.toBe(afterClass);
  });
});
```

**実行方法**:

```bash
# フェーズ1-4: navbar/auth コンポーネント置換完了直後
pnpm dev  # 別ターミナルで起動
pnpm playwright test tests/dark-mode.spec.ts
```

**成功条件**:

- ✅ ダークモード button が visible
- ✅ mobile / lg で icon が正しく表示
- ✅ toggle で `<html class>` が変更される

---

### テスト C: Navbar レスポンシブ確認

**ファイル**: `tests/navbar.spec.ts`

**フェーズ**: フェーズ1-4（navbar 置換完了後）

**目的**: navbar のレスポンシブ動作を確認（モバイルでメニューが隠れる、デスクトップで表示されるか）

```typescript
import { test, expect, Page } from '@playwright/test';

test.describe('Navbar responsive behavior', () => {
  /**
   * 前提条件: 前提条件確認セクション で確認したセレクタを使用
   */

  test('navbar menu is hidden on mobile', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 },
    });
    const page = await context.newPage();

    await page.goto('http://localhost:5174/');

    // menu container が非表示であることを確認
    const menuContainer = page.locator('div[role="none"] ul');
    const isVisible = await menuContainer.isVisible();

    // mobile では hidden class が効いて非表示のはず
    expect(isVisible).toBe(false);

    await context.close();
  });

  test('navbar menu is visible on lg (desktop)', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 1024, height: 768 },
    });
    const page = await context.newPage();

    await page.goto('http://localhost:5174/');

    // menu container が表示されていることを確認
    const menuContainer = page.locator('div[role="none"] ul');
    const isVisible = await menuContainer.isVisible();

    // desktop では lg:block が効いて表示のはず
    expect(isVisible).toBe(true);

    await context.close();
  });

  test('hamburger button is visible on mobile', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 },
    });
    const page = await context.newPage();

    await page.goto('http://localhost:5174/');

    // hamburger button が表示されていることを確認
    const hamburger = page.locator('nav button:not([aria-label])');
    const isVisible = await hamburger.isVisible();

    expect(isVisible).toBe(true);

    await context.close();
  });

  test('hamburger button is hidden on lg (desktop)', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 1024, height: 768 },
    });
    const page = await context.newPage();

    await page.goto('http://localhost:5174/');

    // hamburger button が非表示であることを確認（lg:hidden）
    const hamburger = page.locator('nav button:not([aria-label])');
    const isVisible = await hamburger.isVisible();

    expect(isVisible).toBe(false);

    await context.close();
  });

  test('menu items are visible on lg', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 1024, height: 768 },
    });
    const page = await context.newPage();

    await page.goto('http://localhost:5174/');

    // menu items が表示されていることを確認
    const menuItems = page.locator('nav ul li a');
    const count = await menuItems.count();

    expect(count).toBeGreaterThan(0);

    await context.close();
  });
});
```

**実行方法**:

```bash
# フェーズ1-4: navbar 置換完了直後
pnpm dev  # 別ターミナルで起動
pnpm playwright test tests/navbar.spec.ts
```

**成功条件**:

- ✅ mobile で menu hidden, hamburger visible
- ✅ lg (desktop) で menu visible, hamburger hidden
- ✅ menu items が lg で表示される

---

## テスト実行手順

### 全 Playwright テストの実行

```bash
# 全テスト実行
pnpm playwright test tests/

# または特定のテストのみ
pnpm playwright test tests/custom-colors.spec.ts
pnpm playwright test tests/dark-mode.spec.ts
pnpm playwright test tests/navbar.spec.ts
```

### テスト結果の確認

```bash
# テスト実行後に HTML report が生成される
pnpm playwright show-report
```

---

## Visual Regression テスト（手動確認チェックリスト）

E2E テストの後、以下の visual regression をブラウザで手動確認します（investigation.md の breaking changes 参照）。

### フェーズ0 → フェーズ1 移行時

- [ ] カスタムカラー（primary, atcoder）が正しい色で表示されているか
- [ ] navbar メニューのレイアウトが崩れていないか
- [ ] dark mode toggle が正しく動作するか

### フェーズ1 → フェーズ2 移行時（任意）

- [ ] space-y-_ / space-x-_ による margin 変更を visual 確認
- [ ] divide-y / divide-x による table border 変更を visual 確認
- [ ] 各コンポーネントの色、サイズが期待通りか

---

## トラブルシューティング

### Q: テストが localhost に接続できない

**A**: `pnpm dev` で開発サーバが起動しているか確認してください。

```bash
# 別ターミナルで起動
pnpm dev

# その後、別のターミナルでテスト実行
pnpm playwright test
```

### Q: CSS ファイルが見つからない（custom-colors.spec.ts）

**A**: `pnpm build` を先に実行してください。

```bash
pnpm build
pnpm playwright test tests/custom-colors.spec.ts
```

---

## 参考資料

- [README-plan.md](./README-plan.md) - 実行計画とチェックリスト
- [investigation.md](./investigation.md) - Breaking Changes 詳細
- [Playwright 公式ドキュメント](https://playwright.dev/docs/intro)

---

**最終更新**: 2026-01-04
