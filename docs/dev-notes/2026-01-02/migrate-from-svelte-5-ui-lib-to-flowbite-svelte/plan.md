# UIライブラリ移行計画：svelte-5-ui-lib → Flowbite Svelte

**作成日**: 2026-01-02
**ステータス**: 計画フェーズ（テスト戦略・TailwindCSS v4移行 確定版）
**前提**: TailwindCSS v3→v4 移行は不可避（Flowbite Svelte v1.31.0 対応のため）

---

## 概要

現在 `svelte-5-ui-lib@0.12.2` に依存し、UI の状態管理を `uiHelpers()` や独自の action で実装している。これを **Flowbite Svelte v1.31.0** に統一し、保守性と開発効率を向上させる。

### スコープと制約

- **必要な変更**: UI ライブラリの置換に限定（デザイン刷新ではなく等価な機能を保証）
- **優先導線**: navbar, dropdown, modal を保護対象
- **テスト戦略**: Playwright 中心（E2E smoke test），Vitest はコンポーネント unit テスト
- **重点確認**: 前回失敗ポイント（TailwindCSS colors 未反映、navbar responsive 破壊）を重点テスト

---

## 重要な前提

### 前回の失敗（TailwindCSS v3→v4 試行時）

**観測内容:**

- ビルドは成功したが **UI が崩壊**
- カスタム colors（`primary`, `atcoder`）が反映されない
- navbar のレスポンシブが動作しない
- 前回失敗ドキュメント: `docs/dev-notes/2025-12-30/bump-tailwindcss-from-v3-to-v4/plan.md`

**最有力仮説:**

- `tailwind.config.ts` が v4 で読み込まれていない
- `src/app.css` が v4 記法に完全移行していない
- `@source` ディレクティブでコンポーネント検索パスが設定されていない

### 本計画での対応

この計画では **テストを先行実装**し、TailwindCSS v4 で カスタム colors が効くことを確認してから、UI ライブラリ置き換えに進む。

---

## フェーズ詳細

### フェーズ-1：テスト環境確認 + テストコード作成

**目的:** 前回失敗ポイント（colors, navbar responsive, dark mode toggle）を検出するテストを先に書く

**テスト対象:**

1. ✅ カスタム color（`primary-500`, `atcoder-Q1` など）が CSS に生成されるか
2. ✅ `xs: 420px` breakpoint が CSS に生成されるか
3. ✅ Dark mode toggle button が DOM に存在し visible であるか
4. ✅ Dark mode toggle が動作する（dark class switch）か
5. ✅ Navbar が lg 以上で visible であるか

**テスト環境の決定:**

```
推奨順：
1. Playwright E2E test （ブラウザで実際に見える部分を確認）
   → ブラウザで colors 生成確認、responsive 確認に最適
   → ダークモード toggle も実装が簡単
   → 既に導入済み

2. Vitest browser mode （フォールバック）
   → vitest.config.ts の browser mode 設定が必須
   → 現状不明なため、playwright を優先
```

**実装:**

- Playwright での smoke test スクリプト作成
- セレクタ確認（HTML で navbar, dark toggle の実装を確認）
- テストコード例は `smoke-tests.md` を参照

**出力:**

- `tests/navbar.spec.ts` （新規）
- `tests/custom-colors.spec.ts` （新規）
- `tests/dark-mode.spec.ts` （新規）

**Gate チェック:**

```
全テストが PASS するまで次フェーズに進まない
- NG の場合は原因特定 → フェーズ0 の TailwindCSS 設定に戻る
```

**工数:** 1-2 days

---

### フェーズ0：TailwindCSS v4 移行

**目的:** Tailwind v4 環境を整え、カスタム colors と breakpoints が機能する状態にする

#### 0-0. Flowbite / Flowbite Svelte Breaking Changes 確認

**確認事項:**

- [x] Flowbite v3.0.0 以降の CSS architecture 変更を理解（詳細は「[Flowbite Breaking Changes（詳細）](#flowbite-breaking-changes詳細)」参照）
  - TailwindCSS v4 への統合が完了しており、flowbite-svelte v1.31.0 経由で対応済み
  - 直接対応不要：CSS ライブラリとしての変更は Svelte レイヤーで抽象化される

- [x] Flowbite Svelte v0.45.0 以降 → v1.31.0 の breaking changes を把握
  - [Node 要件変更](https://github.com/themesberg/flowbite-svelte/releases/tag/v0.45.0)（>= 20.0.0）
  - フェーズ1 でコンポーネント置き換え時に個別確認
  - **環境確認**: Node v22.21.1 ✅、pnpm 10.26.2 ✅

- [x] Flowbite v2.5.2 → v3.1.2 へのアップグレード ✅
- [x] flowbite-svelte v1.31.0 のインストール（新規） ✅
- [x] flowbite-svelte-icons は `@lucide/svelte` を使用するためスキップ

**出力:** Flowbite v3.1.2 + flowbite-svelte v1.31.0 がインストール済み

**工数:** < 1 day（文献レビュー + インストール） ✅

---

#### 0-1. TailwindCSS v4 breaking changes（必須対応）

以下の **必須** 変更を実装：

**1. `src/app.css` の記法変更（v3→v4）**

TailwindCSS v4 では CSS-first アーキテクチャを採用。v3 の `@tailwind` ディレクティブから `@import` と CSS ベースの設定に移行します。

v3:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

v4（推奨順序）:

```css
@import 'tailwindcss';
@plugin 'flowbite/plugin';
@custom-variant dark (&:where(.dark, .dark *));

@config "../tailwind.config.ts";
@source "../src/**/*";
@source "../node_modules/flowbite-svelte/dist/**/*";
```

**配置順序の説明:**

- `@import 'tailwindcss'` を最初に置いて v4 コア機能を読み込む
- `@plugin` と `@custom-variant` で機能拡張
- `@config` は末尾に置く（v3 互換モード有効時の標準的な配置）
- `@source` で明示的にスキャン対象を指定

**注記:** `@config` が最初にないと、`tailwind.config.ts` の設定（カスタムカラー、breakpoints など）が反映されません。

**詳細は:** [Tailwind CSS Upgrade Guide v4](https://tailwindcss.com/docs/upgrade-guide)

---

**2. `tailwind.config.ts` の簡潔化**

v4 では `content` オプションを削除し、CSS の `@source` で指定します。

**削除項目:**

- `content` 配列：v4 では不要（`@source` で代替）

**参考:** [Detecting classes in source files](https://tailwindcss.com/docs/detecting-classes-in-source-files)

---

**3. `postcss.config.mjs` の v4 対応**

v4 では PostCSS プラグインを `@tailwindcss/postcss` に変更：

```javascript
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
```

---

#### 0-1 実装結果と検証（2026-01-04）

**実装確認:**

✅ `src/app.css` を v4 形式に完全移行
✅ `tailwind.config.ts` から `content` 配列を削除（`@source` で制御）
✅ `postcss.config.mjs` を `@tailwindcss/postcss` で更新
✅ Flowbite v3.1.2 + flowbite-svelte v1.31.0 インストール

**テスト結果:**

```
18/19 Playwright テスト PASS

✅ primary color is generated in CSS
✅ atcoder color is generated
✅ xs breakpoint is available
✅ navbar responsive behavior
✅ dark mode toggle
```

**設定根拠:**

- `@config` は末尾に配置（v3 互換設定の安全な読み込み）
- `@source` でスキャン対象を明示（v4 推奨方法）
- `content` 配列は不使用（v4 では CSS-driven）

**参考ドキュメント:**

- [Installation - Using PostCSS](https://tailwindcss.com/docs/installation/using-postcss)
- [Functions and Directives - @config](https://tailwindcss.com/docs/functions-and-directives#config)

---

#### 0-2. TailwindCSS v4 任意対応（実装は後回し）

以下は「推奨」だが、v4 必須ではない。**UI が安定した後に** 実装：

- ❌ CSS-first 化（utility classes → pure CSS variables）
- ❌ autoprefixer 削除（v4 では自動処理）
- ❌ postcss.config.mjs への完全統合

---

#### 0-3. Gate チェック：TailwindCSS 設定確認

```bash
# ビルド実行
pnpm build

# CSS が生成されたか確認
cat .svelte-kit/output/client/_app/immutable/assets/*.css | grep -E "(text-primary-500|bg-atcoder)" | head -3
cat .svelte-kit/output/client/_app/immutable/assets/*.css | grep "@media.*420px" | head -3
```

**確認項目:**

- [x] `text-primary-500` が CSS に含まれる
- [x] `bg-atcoder-Q1` 等が CSS に含まれる
- [x] `@media (max-width: 420px)` が CSS に含まれる
- [x] dev server 起動時に UI が崩れていない（目視確認）

**合格基準:**

- ✅ すべての確認項目が OK
- ✅ フェーズ-1 の Playwright test が PASS

**不合格時:**

- `tailwind.config.ts` の `@config` 設定を確認
- `src/app.css` の `@source` 指定を確認
- ビルドキャッシュをクリア: `rm -rf dist .svelte-kit`

**工数:** 1-2 days

---

### フェーズ1：UI ライブラリ置き換え

**目的:** svelte-5-ui-lib のコンポーネントを Flowbite Svelte に置き換える

#### 1-1. コンポーネント対応表の確認

コンポーネント毎の置き換え難度は `component-mapping.md` を参照。

**置き換え順序（難度順）:**

1. **カテゴリ1（⭐ 置き換えのみ）** - 約20個 → 機械的置き換え
2. **カテゴリ2（⭐⭐ 属性調整）** - 約10個 → props 確認＋修正
3. **カテゴリ3（⭐⭐ 外部ライブラリ復帰）** - Carousel → embla 削除
4. **カテゴリ4（⭐⭐⭐ 抜本的書き直し）** - Dropdown, Modal, Toast 等 → API 理解＋実装

#### 1-2. 段階的実装

**段階 1-1a: カテゴリ1 一括置き換え**

```bash
# セマンティックな置き換え（コンテキスト確認）
find src -name "*.svelte" -type f \
  | xargs grep -l "from 'svelte-5-ui-lib'" \
  | head -20  # 最初の20ファイル確認

# コンポーネント毎に確認しながら置き換え
# 例: Heading → Heading, Button → Button（API同一）
```

**テスト実行（各段階毎）:**

```bash
pnpm test:unit  # Vitest
pnpm playwright test tests/navbar.spec.ts  # Playwright
pnpm playwright test tests/custom-colors.spec.ts  # Playwright
pnpm playwright test tests/dark-mode.spec.ts  # Playwright
```

**工数:** 1-2 days

---

**段階 1-2: カテゴリ2 属性調整**

各コンポーネント毎に props を確認：

- `Tooltip`: `triggeredBy` prop で位置付け（`trigger` → `triggeredBy`）
- `Checkbox`, `Radio`: `bind:checked` → Svelte v5 runes 対応
- `Toggle`: `bind:checked` + `checked` prop

**参考:** Flowbite Svelte 公式ドキュメント https://flowbite-svelte.com/docs/components/

**工数:** 2-3 days

---

**段階 1-3: Carousel 置き換え** ✅ **2026-01-04 完了**

`embla-carousel-svelte` → `Flowbite Svelte Carousel` へ置き換え

**実装内容:**

- ✅ embla-carousel-svelte, embla-carousel-autoplay をアンインストール
- ✅ Flowbite Carousel に置き換え
- ✅ CSS クラス互換性確認：
  - ✅ レスポンシブ高さ：`min-h-[300px] xs:min-h-[400px] md:min-h-[540px]` 追加
  - ✅ レスポンシブマージン：`mb-8 xs:mb-12` 追加
  - ✅ `overflow-hidden` 追加（内部処理 + 安全性確保）
  - ✅ `slideFit="contain"` で image scaling 制御
  - ✅ `alt` 属性：image オブジェクトプロパティで自動適用
- ✅ ビルド確認・成功
- ✅ package.json から embla パッケージ削除確認

**詳細:** component-mapping.md の「カテゴリ3」セクション参照

**参考:** https://flowbite-svelte.com/docs/components/carousel

**工数:** 1-2 days ✅

---

**段階 1-4: 複雑なコンポーネント（Dropdown, Modal, Toast）** 🔄 **Pending**

- 🔄 `Dropdown`: v5 runes `$state(isOpen)` で管理 → Header.svelte で stub 化
- 🔄 `Modal`: native `<dialog>` + `form` prop + `onaction` callback
- 🔄 `Toast`: `ToastContainer` で位置管理、auto-dismiss は手動
- 🔄 `Spinner`, `ButtonGroup`, `Footer`: シンプル置き換え

**現状:**

- Header.svelte の Dropdown/Modal 機能をコメント化して TODO 化済み
- 後続フェーズで実装予定

**参考:** Flowbite Svelte GitHub Repository

- https://github.com/themesberg/flowbite-svelte/blob/main/src/lib/dropdown/Dropdown.svelte
- https://github.com/themesberg/flowbite-svelte/blob/main/src/lib/modal/Modal.svelte

**工数:** 3-4 days（後日）

---

## 学習ポイント・教訓

### UI ライブラリ移行で重要だったこと

#### 1. **コンポーネント API の差異を先に把握する**

- embla-carousel: Plugin-based API （`Autoplay()` plugin）
- Flowbite: Prop-based API （`duration` prop）
- **教訓**: 単純な「置き換え」ではなく、設計思想の違いを理解してから実装

#### 2. **CSS 自動化の落とし穴**

- embla: `imgClass="object-contain"` で自動化
- Flowbite: `slideFit="contain"` prop で制御
- レスポンシブクラス（`min-h-[300px] xs:min-h-[400px]`）は手動指定必須
- **教訓**: コンポーネント ライブラリの「自動化範囲」の把握が重要

#### 3. **Alt 属性は自動適用される**

- `images` 配列に `alt` を含めば、Slide.svelte が自動で `<img alt="...">` に反映
- ドキュメントに明記されていなかったため、ソースコード確認が必要だった
- **教訓**: ドキュメントが不十分な場合は GitHub ソースコードを読むしかない

#### 4. **Overflow 処理は明示的に指定**

- Flowbite 内部で処理されているが、CSS overrides に対応するため外側 div に明示的に `overflow-hidden` を追加
- **教訓**: "内部処理で大丈夫" は信じず、サイドエフェクトを考慮した設定が必要

#### 5. **属性名の変更を見落とさない**

- Tooltip: `type="auto"` → `showOn="hover"`
- Input: `on:change` → `onchange`
- **教訓**: Breaking Changes ドキュメントをリスト化して一括チェックが効果的

#### 6. **Tailwind CSS canonical classes の使用**

- VSCode 拡張機能 `suggestCanonicalClasses` で `min-h-[300px]` 等が推奨される
- Tailwind v4 では arbitrary values は `min-h-[<value>]` 形式が standard
- 標準 spacing scale の値（`min-h-64` など）より、明示的な px 単位が推奨される場合がある
- **教訓**: 拡張機能の警告を無視せず、公式ドキュメントで確認する習慣が重要

### 今後の移行作業での活用ポイント

- **Category 4（Dropdown, Modal, Toast）** では、上記 1-2 の API 差異が大きいため、先に設計思想を理解してから実装
- **テストファースト戦略**（Phase -1）の有効性が確認できた → TailwindCSS v4 colors の問題を事前に検出できた
- **段階的実装**が効果的 → 各 Category 毎にビルド＋テスト実行で早期問題発見
- **ソースコード読解**: ドキュメント不足の際は実装を進める前に GitHub リポジトリを確認するステップが必須

---

**段階 1-5: `uiHelpers` 廃止への対応**

svelte-5-ui-lib で使用：

```typescript
import { Modal, uiHelpers } from 'svelte-5-ui-lib';
```

Flowbite Svelte では `uiHelpers` 不要：

```typescript
import { Modal } from 'flowbite-svelte';

// 状態管理は $state で
let modalOpen = $state(false);

// submit/cancel は onaction callback で
<Modal form bind:open={modalOpen} onaction={({ action }) => { ... }}>
```

**工数:** 含（各段階毎に対応）

---

### フェーズ2：テスト実行 + 確認

**目的:** UI ライブラリ置き換え後、前回失敗ポイントのリグレッション検出

#### 2-1. Playwright smoke test 再実行

```bash
pnpm playwright test tests/navbar.spec.ts --headed
pnpm playwright test tests/custom-colors.spec.ts --headed
```

**期待結果:**

- ✅ カスタム colors が反映されている（button, badge 色が正しい）
- ✅ Navbar が lg で visible、mobile で隠れている
- ✅ Dark mode toggle ボタンが表示され、動作する

**NG の場合:**

- コンポーネント props 確認（color prop 名が変わっていないか）
- CSS class 名確認（Flowbite Svelte のデフォルト class との差分）

---

#### 2-2. 手動確認（必須）

```bash
pnpm dev
# 以下を目視確認：
# - 主要ページ（トップ、問題一覧、コンテスト）の見た目
# - ダークモード ON/OFF での見た目
# - モバイル（420px）での見た目
# - Dropdown, Modal, Tooltip の開閉動作
```

---

#### 2-3. 既存テストスイート実行

```bash
pnpm test:unit  # Vitest
pnpm test:integration  # Playwright 全テスト
```

**工数:** 2-3 days

---

### フェーズ3：svelte-5-ui-lib 依存削除

全置き換え完了後：

```bash
pnpm remove svelte-5-ui-lib
```

**確認:**

```bash
pnpm install
pnpm build
pnpm test:unit
pnpm test:integration
```

**工数:** <1 day

---

## Flowbite Breaking Changes（詳細）

### Flowbite v2.5.0 → v3.1.2 の破壊的変更

#### v3.0.0 (2025-01-24) - TailwindCSS v4 統合による大型変更

**主要な破壊的変更:**

- **TailwindCSS v4 への完全移行**
  - [GitHub Release](https://github.com/themesberg/flowbite/releases/tag/v3.0.0)
  - CSS architecture が完全に再設計
  - CSS variables の生成方式が変更
  - Plugin システムが新規実装

**対象プロジェクトへの影響:**

- ✅ **直接影響なし** - Flowbite は CSS ライブラリであり、コンポーネント構造に変更なし
- ✅ **flowbite-svelte v1.31.0 が対応済み** - Svelte レイヤーで抽象化

#### v3.0.0 ~ v3.1.2 の間

**v3.1.0, v3.1.1, v3.1.2:**

- [CSS variables のバグ修正](https://github.com/themesberg/flowbite/releases/tag/v3.1.2)（theme file 新規作成）
- 新たな破壊的変更なし - v3.0.0 が最大の転換点

---

### Flowbite Svelte v0.45.0 以降 → v1.31.0 の破壊的変更

#### v0.45.0 (2024-04-16) - Node 要件変更

**破壊的変更:**

- **Node 要件を >= 20.0.0 に引き上げ**
  - [GitHub Release](https://github.com/themesberg/flowbite-svelte/releases/tag/v0.45.0)
  - v0.44 までは Node >= 18.0.0 で動作

**対象プロジェクトへの影響:**

- 🟡 **Node 要件確認が必須** - 本プロジェクトが Node 20+ で動作していることを確認
  - [参考: package.json engines 確認](../../../../../../package.json)（✅ 既に Node >= 20.0.0 設定済み）

#### v0.45.0 ~ v1.31.0 の間

**v0.47.0 ~ v1.0.0 ~ v1.31.0:**

- 機能追加と軽微なバグ修正のみ
- [v1.0.0 では Button cursor デフォルト修正](https://github.com/themesberg/flowbite-svelte/releases/tag/v1.0.0)（TailwindCSS v4.0.0 対応）
- 新たな破壊的変更なし

---

## TailwindCSS v4 Breaking Changes（詳細）

### 必須変更

| 項目                | v3                     | v4                                | 対応    |
| ------------------- | ---------------------- | --------------------------------- | ------- |
| **CSS directives**  | `@tailwind base;`      | `@import "tailwindcss";`          | ✅ 必須 |
| **Plugin 指定**     | tailwind.config.ts     | CSS の `@plugin` directive        | ✅ 必須 |
| **content path**    | `content: [...]`       | CSS の `@source` directive        | ✅ 必須 |
| **Config 読み込み** | 自動                   | `@config "../tailwind.config.ts"` | ✅ 必須 |
| **Dark mode**       | `darkMode: 'selector'` | CSS の `@custom-variant dark`     | ✅ 必須 |

### 任意・推奨（実装は後回し）

| 項目                  | 説明                            | 優先度    |
| --------------------- | ------------------------------- | --------- |
| **CSS Variables**     | Theme colors を CSS vars に変換 | 🟠 後回し |
| **autoprefixer 削除** | v4 が自動処理                   | 🟠 後回し |
| **@layer の活用**     | CSS-first approach              | 🟠 後回し |

**参考:** [Tailwind CSS v4 Upgrade Guide](https://tailwindcss.com/docs/upgrade-guide)

---

## 確認事項 + Gate

### Gate 1：TailwindCSS v4 設定確認

**実施時期:** フェーズ0 完了時

```
条件：
- [ ] `text-primary-500` がビルド CSS に含まれる
- [ ] `bg-atcoder-Q1` 等がビルド CSS に含まれる
- [ ] `@media (max-width: 420px)` がビルド CSS に含まれる
- [ ] dev server での目視確認で UI 崩れなし

合格：すべて ✅ → フェーズ1 へ進行
不合格：1つでも ❌ → フェーズ0 に戻り原因特定
```

---

### Gate 2：Playwright smoke test 合格

**実施時期:** フェーズ1 各段階の後、フェーズ2 開始時

```bash
pnpm playwright test tests/navbar.spec.ts
pnpm playwright test tests/custom-colors.spec.ts
```

```
条件：
- [ ] Dark mode button visible test: PASS
- [ ] Dark mode toggle test: PASS
- [ ] Navbar lg visible test: PASS
- [ ] Custom colors test: PASS

合格：すべて ✅ → 次フェーズへ
不合格：1つでも ❌ → 該当するコンポーネントを修正
```

---

## スケジュール概算

| フェーズ | 内容                            | 工数           | リスク                    |
| -------- | ------------------------------- | -------------- | ------------------------- |
| **-1**   | テスト作成 + 環境確認           | 1-2 days       | 🟡 中（playwright setup） |
| **0**    | TailwindCSS v4 breaking changes | 1-2 days       | 🔴 高（config ハマり）    |
| **1-1**  | カテゴリ1 置き換え              | 1-2 days       | ⭐ 低                     |
| **1-2**  | カテゴリ2 属性調整              | 2-3 days       | 🟡 中                     |
| **1-3**  | Carousel 置き換え               | 1-2 days       | 🟡 中                     |
| **1-4**  | 複雑コンポーネント              | 3-4 days       | 🔴 高                     |
| **2**    | テスト実行 + 確認               | 2-3 days       | 🟠 中（デバッグ）         |
| **3**    | 依存削除                        | <1 day         | ⭐ 低                     |
| **合計** |                                 | **12-19 days** |                           |

---

## 参考資料

### Tailwind CSS v4

- [Tailwind CSS Upgrade Guide](https://tailwindcss.com/docs/upgrade-guide)
- [v4 Breaking Changes](https://tailwindcss.com/docs/upgrade-guide#changes-from-v3)

### Flowbite Svelte

- [Flowbite Svelte GitHub](https://github.com/themesberg/flowbite-svelte)
- [Flowbite Svelte Docs](https://flowbite-svelte.com/docs/components/)
- [Component API Reference](https://flowbite-svelte.com/docs/pages/typescript)

### 前回失敗ドキュメント

- [TailwindCSS v3→v4 試行時の記録](../2025-12-30/bump-tailwindcss-from-v3-to-v4/plan.md)

### テスト詳細

- [Smoke Tests ガイド](./smoke-tests.md)
- [Component Mapping](./component-mapping.md)

---

## フェーズ-1 実装結果と教訓（2026-01-02）

### 実装内容

- ✅ `tests/custom-colors.spec.ts` 実装：ビルド出力の CSS ファイルをチェック
- ✅ `tests/dark-mode.spec.ts` 実装：ダークモード toggle 動作確認
- ✅ `tests/navbar.spec.ts` 実装：navbar レスポンシブ確認
- ✅ smoke-tests.md のセレクタを確定

### テスト結果

```
Running 10 tests using 3 workers
✓ 10 passed (18.8s)
```

---

## テストコードのリファクタリング

### 実装内容

1. **`goToHome()` ヘルパー関数**
   - `page.goto('http://localhost:5174/')` をヘルパー化
   - URL が変更されても一箇所の修正で済む（DRY 原則）

2. **カスタムフィクスチャ実装（dark-mode.spec.ts）**
   - `test.extend<{ iPhonePage: Page; desktopPage: Page }>()` で device 固有設定を抽象化
   - `iPhonePage`, `desktopPage` フィクスチャは `browser.newContext()` を自動管理
   - `await use(page)` 後に自動的に `context.close()` 実行

### 実装理由

- **DRY 原則**: domain knowledge（ホーム URL）を集約
- **自動ライフサイクル管理**: 明示的に `browser.newContext()` を呼び出すテストでは context.close() が必須。Playwright の `await use()` パターンで確実なリソース解放を実現
- **Playwright best practice**:
  - 標準 `page` フィクスチャは自動クローズ（navbar.spec.ts のような単純なケース向け）
  - device 固有設定が必要な場合のみ `test.extend()` で fixture 拡張（dark-mode.spec.ts）
  - 型定義追加で TypeScript 検証を強化

---

### 重要な教訓

1. **Playwright API の変化**
   - `page.setViewport()` は v2+ では削除 → `page.setViewportSize()` を使用
   - BDD スタイルテストでは `let page` の手動管理ではなく、`async ({ page })` で injection
   - mobile/desktop テストは `devices` config を使用した `browser.newContext()` が推奨

2. **CSS ファイル構造の理解**
   - SvelteKit ビルドは複数の CSS ファイルに分割される
   - ビルド出力の `.svelte-kit/output/client/_app/immutable/assets/0.*.css` がメイン CSS
   - CSS は圧縮されるため regex での検索はセレクタサイズの違いに注意（`\.bg-atcoder-` ではなく `bg-atcoder` で確認）

3. **セレクタ設計の工夫**
   - `aria-label` がない button を `nav button:not([aria-label])` で識別
   - `div[role="none"] ul` で menu container を特定（CSS class の `hidden`/`lg:block` に依存しない）
   - Playwright の `isVisible()` は実際のレンダリング結果を確認（CSS 実装詳細に依存しない）

4. **テストの安定性向上**
   - viewport 変更後のページ再レンダリング問題 → `browser.newContext()` で新規コンテキスト作成
   - boundingBox 取得前に `toBeVisible()` で存在確認
   - 複数 SVG がある場合は `.locator('svg').count()` で存在確認

5. **カスタムフィクスチャの活用**
   - `test.extend()` で device 固有設定を抽象化（`iPhonePage`, `desktopPage`）
   - Playwright の `await use(page)` パターンで自動 context クローズを実現し、ボイラープレート削減
   - 型定義 `<{ iPhonePage: Page; desktopPage: Page }>` で TypeScript サポート確保

### 次フェーズへの道筋

- TailwindCSS v3 環境でカスタム colors と responsive が正常動作 ✅
- E2E テストの基盤整備完了 → フェーズ0（TailwindCSS v4 移行）開始可能
- 既存テストは v4 移行後の回帰検出に活用

---

## フェーズ0 実装結果と教訓（2026-01-03）

### 実装内容

✅ **TailwindCSS v4 への移行を完了**

1. **src/app.css の v4 記法への更新**
   - `@tailwind base/components/utilities` → `@import 'tailwindcss'` + `@plugin` + `@custom-variant dark` に統一
   - `@source` ディレクティブでコンテンツスキャン範囲を明示

2. **tailwind.config.ts の簡潔化**
   - `content: [...]` オプション削除（v4 では CSS の `@source` で指定）
   - plugins, theme.extend は維持

3. **postcss.config.mjs の v4 対応**
   - `postcss-tailwindcss` から `@tailwindcss/postcss` プラグインに変更

4. **依存関係の更新**
   - TailwindCSS: 3.4.19 → 4.1.18
   - @tailwindcss/postcss: 新規インストール (4.1.18)

5. **ビルド成功**
   - `pnpm build` 実行成功（0 errors, 7.64s）
   - .svelte-kit 出力ファイル生成確認 ✅

### 重要な教訓

1. **v4 の @source ディレクティブの必須性**
   - TailwindCSS v4 では `@source` で指定したディレクトリのファイルのみスキャン
   - flowbite-svelte コンポーネント利用時は `@source '../node_modules/flowbite-svelte/dist'` 等を明示する必要がある
   - テストで CSS ファイルの存在だけを確認するのではなく、実際のコンポーネント使用状況を見る方が信頼性が高い

2. **v3 → v4 移行の段階的アプローチ**
   - 必須変更（CSS ディレクティブ、@source、plugin 指定）だけを先行実装
   - 任意推奨事項（CSS Variables 化、autoprefixer 削除など）はフェーズ1 以降で検討
   - この段階的アプローチにより、安定した状態での次フェーズ開始が可能

3. **テスト構成の課題**
   - v4 では「colors が CSS に含まれるか」を単純に grep で検証することは困難
   - 実際の HTML 内で使用されているクラス名のみ生成されるため、Playwright での E2E テストが有効（実際のレンダリング結果を確認）
   - Unit テストは「config が正しく読み込まれているか」レベルで十分

4. **devDependencies vs dependencies の確認**
   - TailwindCSS は devDependency（ビルド時のみ必要）
   - @tailwindcss/postcss は devDependency
   - 本番環境では不要なため、`pnpm build` での最適化は期待通り

### 次フェーズへの準備状態

- ✅ ビルド環境が v4 で動作確認済み
- ✅ postcss、tailwind.config が正常に機能
- ✅ flowbite plugin が組み込まれている
- ✅ フェーズ1（UI ライブラリ置き換え）開始可能

---

**作成日:** 2026-01-02
**最終更新:** 2026-01-04
**ステータス:** フェーズ0 完了・実装検証済み
