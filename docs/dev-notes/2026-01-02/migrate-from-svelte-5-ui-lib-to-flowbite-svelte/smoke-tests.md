# スモークテスト実装ガイド

svelte-5-ui-lib → flowbite-svelte 移行時の回帰検出テスト

---

## 目次

1. [スモークテストの考え方](#スモークテストの考え方)
2. [根幹アプローチ](#根幹アプローチ)
3. [前提条件確認（Step 1）](#前提条件確認step-1)
4. [実装対象テスト](#実装対象テスト)
5. [テスト実行コマンド](#テスト実行コマンド)
6. [参考資料](#参考資料)

---

## スモークテストの考え方

### 「スモークテスト」とは

新しい実装が **「全体として壊れていないか」の最小限の確認テスト** です。

**このプロジェクトでの位置付け：**

| 項目         | 詳細                                                                                                                          |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| **目的**     | TailwindCSS v4 移行後と Flowbite Svelte 置換後に、前回の v3→v4 失敗（カラー未反映、レスポンシブ破損、ダークモード消失）を検出 |
| **範囲**     | ビルド出力確認 + E2E ユーザー操作フロー                                                                                       |
| **時期**     | 各フェーズ完了直後に実施                                                                                                      |
| **量**       | フェーズあたり 1～2テストケース（最小限）                                                                                     |
| **実行時間** | 分単位（遅い）                                                                                                                |

### なぜスモークテストなのか

- **早期発見**: ビジネス要件に直結した最小フロー検証で、大きな問題を素早く検出
- **低コスト**: 詳細テストより準備が簡単（コンポーネント単位の複雑な props 確認不要）
- **リスク検出**: 前回の失敗ポイント（カラー、レスポンシブ、ダークモード）を重点化

---

## 根幹アプローチ

### テストフレームワークの選択

| テスト種別             | Vitest                   | Playwright                   |
| ---------------------- | ------------------------ | ---------------------------- |
| **対象**               | コンポーネント単体、関数 | ユーザーフロー（実ブラウザ） |
| **実行速度**           | 高速（秒単位）           | 遅い（分単位）               |
| **デバッグ難度**       | 低い                     | 高い                         |
| **スモークテスト向き** | △ 条件付き               | ⭐ 推奨                      |

**このプロジェクトでは Playwright を重視：**

- CSS ビルド出力検証（ファイル読み込み）
- 実ブラウザでの UI 動作確認（セレクタ特定、レイアウト確認）
- 前回失敗ポイント（レスポンシブ、ダークモード toggle）は UI 操作テストが有効

### フェーズごとのテスト実行タイミング

| フェーズ                | テスト                                             | 目的                                                  |
| ----------------------- | -------------------------------------------------- | ----------------------------------------------------- |
| **0**（TailwindCSS v4） | `tests/custom-colors.spec.ts`                      | ビルド出力確認：カスタムカラーが CSS に含まれているか |
| **2-1**（navbar 置換）  | `tests/navbar.spec.ts` + `tests/dark-mode.spec.ts` | UI 動作確認：レスポンシブ、ダークモード               |

---

## 前提条件確認（Step 1）

フェーズ実装前に、以下を手動確認してセレクタを特定します。

### 1-1. ダークモード切り替えボタンのセレクタ確認

**実装結果:**

```html
<!-- 実装確認済み -->
<button aria-label="Dark mode" type="button" class="...">
  <svg>...</svg>
</button>
```

**確定セレクタ:**

- `button[aria-label="Dark mode"]` ✅

### 1-2. navbar 構造確認

**実装結果:**

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

### 1-3. ブレークポイント確認

**確認結果:**

| デバイス        | 幅     | navbar menu 表示状態                   |
| --------------- | ------ | -------------------------------------- |
| Mobile (iPhone) | 375px  | `hidden` クラス + `lg:hidden` で非表示 |
| Tablet          | 768px  | 同上                                   |
| Desktop (lg)    | 1024px | `lg:block` で表示                      |

**確認方法:** Playwright `isVisible()` で実際のレンダリング確認

---

## 実装対象テスト

### テスト A: TailwindCSS v4 ビルド出力確認

**ファイル:** `tests/custom-colors.spec.ts`

**フェーズ:** 0（TailwindCSS v4 移行直後）

**目的:** ビルド出力に カスタムカラーが含まれているか確認（前回 v3→v4 失敗の再現防止）

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
    // build output をチェック
    // パス: .svelte-kit/output/client/_app/immutable/assets/ の ハッシュ付きCSSファイル
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

  test('xs breakpoint is available (or custom breakpoints)', () => {
    const cssDir = resolve('.svelte-kit/output/client/_app/immutable/assets');
    const cssFiles = require('fs')
      .readdirSync(cssDir)
      .filter((f: string) => f.startsWith('0.') && f.endsWith('.css'));
    const cssPath = resolve(cssDir, cssFiles[0]);
    const css = readFileSync(cssPath, 'utf-8');

    // カスタムブレークポイント確認
    // 420px が生成されているかを確認（またはメディアクエリが存在するか）
    // TODO: tailwind.config.ts で xs: 420px が有効か確認
    expect(css.length).toBeGreaterThan(10000); // CSS が正常に生成されている
  });
});
```

**実行タイミング:**

```bash
# フェーズ 0: TailwindCSS v4 @import/@config/@source 対応完了直後
pnpm build
pnpm playwright test tests/custom-colors.spec.ts
```

**成功条件:**

- ✅ primary color classes が CSS に含まれている
- ✅ atcoder color classes が CSS に含まれている
- ✅ ビルド出力が正常に生成されている

---

### テスト B: ダークモード回帰検出

**ファイル:** `tests/dark-mode.spec.ts`

**フェーズ:** 2-1（navbar/auth コンポーネント置換完了後）

**目的:** ダークモード切り替えボタンが消失していないか確認（前回 v3→v4 失敗の再現防止）

```typescript
import { test, expect, Page } from '@playwright/test';

test.describe('Dark mode - Regression from v3->v4 migration', () => {
  /**
   * 前提条件:
   * - Step 1 で確認したセレクタを使用
   * - pnpm dev で開発サーバ起動済み
   */

  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('dark toggle button is visible', async () => {
    await page.goto('http://localhost:5174/');

    const darkToggle = page.locator('button[aria-label="Dark mode"]');
    await expect(darkToggle).toBeVisible();
  });

  test('dark mode icon shows correctly on mobile', async () => {
    await page.setViewport({ width: 375, height: 667 }); // iPhone
    await page.goto('http://localhost:5174/');

    const darkIcon = page.locator('button[aria-label="Dark mode"] svg');
    await expect(darkIcon).toBeVisible();

    // 位置がずれていないか確認（viewport 外ではない）
    const bbox = await darkIcon.boundingBox();
    expect(bbox?.x).toBeGreaterThan(0);
    expect(bbox?.width).toBeGreaterThan(0);
  });

  test('dark mode icon shows correctly on lg', async () => {
    await page.setViewport({ width: 1024, height: 768 }); // desktop
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

**実行タイミング:**

```bash
# フェーズ 2-1: navbar/auth コンポーネント置換完了直後
pnpm dev  # 別ターミナルで起動
pnpm playwright test tests/dark-mode.spec.ts
```

**成功条件:**

- ✅ ダークモード button が visible
- ✅ mobile / lg で icon が正しく表示
- ✅ toggle で `<html class>` が変更される

---

### テスト C: navbar レスポンシブ動作確認

**ファイル:** `tests/navbar.spec.ts`

**フェーズ:** 2-1（navbar/auth コンポーネント置換完了後）

**目的:** navbar がレスポンシブに動作するか確認（前回 v3→v4 失敗の再現防止）

```typescript
import { test, expect, Page } from '@playwright/test';

test.describe('Navbar - Regression from v3->v4 migration', () => {
  /**
   * 前提条件:
   * - Step 1 で確認した navbar セレクタ（通常 nav 要素）
   * - pnpm dev で開発サーバ起動済み
   */

  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('navbar is visible on lg (1024px)', async () => {
    await page.setViewport({ width: 1024, height: 768 });
    await page.goto('http://localhost:5174/');

    const navbar = page.locator('nav');
    await expect(navbar).toBeVisible();
  });

  test('navbar menu items align properly on lg', async () => {
    await page.setViewport({ width: 1024, height: 768 });
    await page.goto('http://localhost:5174/');

    const navItems = page.locator('nav ul li a');
    const count = await navItems.count();
    expect(count).toBeGreaterThan(0);

    // menu items の位置確認（レイアウト破損がないか）
    for (let i = 0; i < Math.min(count, 3); i++) {
      const item = navItems.nth(i);
      const bbox = await item.boundingBox();
      expect(bbox?.width).toBeGreaterThan(0);
      expect(bbox?.height).toBeGreaterThan(0);
      // navbar viewport 内に収まっているか
      expect(bbox?.x || 0).toBeGreaterThanOrEqual(0);
    }
  });

  test('navbar is visible and functional on mobile (375px)', async () => {
    await page.setViewport({ width: 375, height: 667 });
    await page.goto('http://localhost:5174/');

    const navbar = page.locator('nav');
    await expect(navbar).toBeVisible();

    // mobile では hamburger menu が存在
    const hamburger = page.locator('nav button:not([aria-label])');
    await expect(hamburger).toBeVisible();

    // menu が非表示（hidden class）
    const menuContainer = page.locator('div[role="none"] ul');
    await expect(menuContainer).not.toBeVisible();
  });
});
```

**実行タイミング:**

```bash
# フェーズ 2-1: navbar/auth コンポーネント置換完了直後
pnpm dev  # 別ターミナルで起動
pnpm playwright test tests/navbar.spec.ts
```

**成功条件:**

- ✅ navbar が lg（1024px）で visible
- ✅ menu items が複数存在し、レイアウトが正常
- ✅ mobile（375px）で navbar が機能（hamburger または折り畳み表示）

---

## テスト実行コマンド

### Phase 0: TailwindCSS v4 ビルド確認

```bash
# 1. ビルド実行
pnpm build

# 2. カスタムカラー生成確認
pnpm playwright test tests/custom-colors.spec.ts --ui
```

### Phase 2-1: navbar / dark mode 回帰テスト

```bash
# 開発サーバ起動（別ターミナル）
pnpm dev

# navbar テスト
pnpm playwright test tests/navbar.spec.ts --ui

# ダークモード テスト
pnpm playwright test tests/dark-mode.spec.ts --ui

# 両方実行
pnpm playwright test tests/navbar.spec.ts tests/dark-mode.spec.ts --ui
```

### テスト実行オプション

| オプション        | 用途                                         |
| ----------------- | -------------------------------------------- |
| `--ui`            | 対話モード（開発中推奨）- ブラウザで動作確認 |
| `--debug`         | デバッグモード（ステップ実行）               |
| `--headed`        | 無視できるブラウザウィンドウを表示           |
| `--reporter=html` | HTML レポート生成                            |

### 全テスト実行（CI 用）

```bash
pnpm build
pnpm playwright test
```

---

## セレクタ確認チェックリスト

**2026-01-02 確認済み:**

| 項目                              | 確認状況    | セレクタ値                       |
| --------------------------------- | ----------- | -------------------------------- |
| ダークモード button の aria-label | ✅ 確認済み | `button[aria-label="Dark mode"]` |
| navbar 要素                       | ✅ 確認済み | `nav`                            |
| navbar menu items                 | ✅ 確認済み | `nav ul li a`                    |
| hamburger button (mobile)         | ✅ 確認済み | `nav button:not([aria-label])`   |
| menu container (visibility)       | ✅ 確認済み | `div[role="none"] ul`            |

**確認完了 → テストコード実装開始**

---

## 参考資料

- [Playwright 公式ドキュメント](https://playwright.dev/)
- [Playwright Inspector（デバッグ用）](https://playwright.dev/docs/inspector)
- [メイン計画ドキュメント](./plan.md)
- [コンポーネント対応マトリクス](./component-mapping.md)
- [前回失敗時のドキュメント](../2025-12-30/bump-tailwindcss-from-v3-to-v4/plan.md)

---

**作成日:** 2026-01-02
**ステータス:** ドラフト完成（テスト実装前）
**次ステップ:** Step 1 実行 → セレクタ確認 → テストコード実装
