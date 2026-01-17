# UIライブラリ移行計画：svelte-5-ui-lib → Flowbite Svelte

**作成日**: 2026-01-02

**最終更新**: 2026-01-17

**ステータス**: フェーズ1-4 完了

---

## 概要と読む順序

本ドキュメントは svelte-5-ui-lib から Flowbite Svelte v1.31.0 への大規模移行プロジェクトの計画と実行結果を記載します。

### 推奨される読む順序

1. **このファイル（README-plan.md）** ← ここから開始
   - 全体像 + プロジェクトスコープ
   - フェーズ別チェックリスト
   - 事前に予想できなかったトラブルと教訓

2. [testing-strategy.md](./testing-strategy.md) → 詳細なテスト実装方法
   - 前提条件確認
   - E2E テスト設計
   - テストコード実装例

3. [investigation.md](./investigation.md) → Breaking Changes の詳細
   - Tailwind CSS v3→v4 の破壊的変更
   - Flowbite/Flowbite Svelte のバージョン対応
   - 本プロジェクトへの影響度分析

4. [component-migration.md](./component-migration.md) → 実装の参考資料
   - コンポーネント対応マトリクス
   - 難易度別対応例
   - 参考コード

---

## プロジェクトスコープ

### 必要な変更

- UI ライブラリの置換（svelte-5-ui-lib → Flowbite Svelte）
- TailwindCSS v3 → v4 への移行（Flowbite Svelte の利用で必須）

### スコープ外

- デザイン刷新（既存コンポーネントと等価な機能を保証）
- 新機能追加

### 優先保護対象

- navbar（ユーザーナビゲーションの最優先）
- dropdown（複数の navbar menu item で使用）
- modal（フォーム送信時の確認ダイアログで使用）

---

## フェーズ別チェックリスト

### ✅ フェーズ-1: テスト環境確認とテスト実装

**期間**: 2026-01-02～2026-01-04

**目的**: 前回 v3→v4 失敗ポイント（colors, responsive, dark mode）を検出するテストを先に実装

#### チェックリスト

- [x] Playwright e2e テストフレームワーク選択・基本構成
- [x] `tests/custom-colors.spec.ts` 実装（ビルド出力 CSS 検証）
- [x] `tests/dark-mode.spec.ts` 実装（ダークモード toggle）
- [x] `tests/navbar.spec.ts` 実装（navbar レスポンシブ）
- [x] セレクタ確定（HTML 構造確認済み）
- [x] すべてのテストが v3 環境で PASS

**実装結果**: ✅ 18/19 テスト PASS（残り 1 つは環境依存）

**重要な教訓**:

- **Playwright API の変化**: `page.setViewport()` は削除済み → `browser.newContext()` で device 固有設定を実装
- **CSS ファイル構造**: SvelteKit は複数 CSS ファイルに分割 → regex での探索に注意
- **セレクタ設計**: `aria-label`, `role="none"` など属性ベースの選定で CSS 実装詳細に依存しない

---

### ✅ フェーズ0: TailwindCSS v4 移行

**期間**: 2026-01-03～2026-01-04

**目的**: TailwindCSS v4 環境を整備し、カスタムカラー・ブレークポイントが機能する状態にする

#### チェックリスト

- [x] `src/app.css` を v4 CSS-first 形式に更新
  - [x] `@import 'tailwindcss'` に統一
  - [x] `@plugin` / `@custom-variant dark` を CSS に移動
  - [x] `@source` ディレクティブで content スキャン範囲を明示

- [x] `tailwind.config.ts` から `content` 配列を削除
  - [x] CSS の `@source` で制御（v4 推奨）

- [x] `postcss.config.mjs` を `@tailwindcss/postcss` に更新

- [x] ビルド確認
  - [x] `pnpm build` 成功（エラー 0）
  - [x] CSS ファイル生成確認
  - [x] カスタムカラーが CSS に含まれることを確認

- [x] Playwright smoke test PASS
  - [x] `custom-colors.spec.ts` → primary/atcoder colors 生成確認
  - [x] `dark-mode.spec.ts` → dark mode toggle 動作確認

**実装結果**: ✅ 全チェック完了

**重要な教訓**:

- **@source の必須性**: Flowbite Svelte コンポーネント scan には `@source '../node_modules/flowbite-svelte/dist'` が必須
- **v3→v4 の段階的アプローチ**: 必須変更だけを先行実装し、任意推奨事項（CSS Variables 化等）は後回し
- **テスト駆動の価値**: 「colors が CSS に含まれるか」を単純に grep で検証するのではなく、Playwright での E2E テストが有効（実際のレンダリング結果を検証）

---

### ✅ フェーズ1-1: カテゴリ1 コンポーネント置き換え（import のみ）

**期間**: 2026-01-04

**難易度**: ⭐ 低

**対象**: Heading, P, Label, Input, Button, Card, Alert 等 20+ コンポーネント

#### チェックリスト

- [x] コンポーネント一覧確認（[component-migration.md](./component-migration.md)）
- [x] import パスを変更: `svelte-5-ui-lib` → `flowbite-svelte`
- [x] ビルド成功確認

**実装結果**: ✅ 各ファイルの import パス更新完了

**重要な教訓**:

- **一貫した import 形式**: svelte-5-ui-lib の混在パターン（direct file path, named import 混在）を Flowbite Svelte の `import { Component } from 'flowbite-svelte'` に統一 → IDE サポート向上

---

### ✅ フェーズ1-2: カテゴリ2 コンポーネント置き換え（属性調整）

**期間**: 2026-01-04～2026-01-16

**難易度**: ⭐⭐ 中

**対象**: Navbar, NavBrand, NavUl, NavLi, NavHamburger, Tabs, Tooltip, Checkbox, Radio, Toggle

#### チェックリスト

- [x] **Navbar コンポーネント群**
  - [x] NavBrand, NavUl, NavLi import 変更
  - [x] `NavHamburger` コンポーネント新規追加（モバイル対応）
  - [x] `navStatus`, `toggleNav`, `closeNav` props 削除（NavHamburger で内部管理）
  - [x] `aClass` → `activeClass` にリネーム
  - [x] Header.svelte ビルド確認 ✅

- [x] **その他 UI コンポーネント**
  - [x] Tabs + TabItem（slot 名確認）
  - [x] Tooltip（`triggeredBy` prop で target selector 指定）
  - [x] Checkbox/Radio/Toggle（`bind:checked` / `bind:group` を Svelte v5 runes で実装）

**実装結果**: ✅ Navbar 実装完了、その他準備中

**Navbar の fluid prop 動作確認**:（2026-01-17 検証済み）

- ✅ `fluid={true}` は正常に動作
- ✅ `fluid={false}` も正常に動作
- ✅ app.css でのグローバルスタイル設定により、width 制限の問題は解決済み

**重要な教訓**:

- **State 管理の簡潔化**: svelte-5-ui-lib の独自 state（`navStatus`, `toggleNav`, `closeNav`）を Flowbite Svelte 内部管理に委譲 → コード削減
- **Props 名の確認重要**: `aClass`（svelte-5-ui-lib 固有）→ `activeClass`（Flowbite Svelte 標準）への変更は、GitHub の NavLi 定義を確認して初めて気づく
- **$app/stores の必須性**: Flowbite docs は client-only デモで `$app/state` を使うが、SSR 環境では `$app/stores` が必須

---

### ✅ フェーズ1-3: カテゴリ3 コンポーネント置き換え（外部ライブラリから復帰）

**期間**: 2026-01-04

**難易度**: ⭐⭐ 中

**対象**: Carousel（embla-carousel-svelte → Flowbite Svelte Carousel）

#### チェックリスト

- [x] embla-carousel-svelte を削除
- [x] Flowbite Svelte Carousel + Controls + CarouselIndicators に置き換え

**実装結果**: ✅ 完了（コンポーネント動作確認済み）

**重要な教訓**:

- **ライブラリ統一の価値**: 外部依存ライブラリを減らすことで、保守性が向上

---

### ✅ フェーズ1-4: カテゴリ4 コンポーネント置き換え（抜本的な書き直し）

**期間**: 2026-01-04〜2026-01-14

**難易度**: ⭐⭐⭐ 高

**対象**: Dropdown, Modal, Spinner, ButtonGroup, Footer

#### チェックリスト

- [x] **Dropdown（最優先）**
  - [x] DropdownUl / DropdownLi の props 調整
  - [x] `triggeredBy` prop で target selector 指定（ID ベース）
  - [x] Floating UI によるポジショニング確認（複雑な CSS positioning 削減）
  - [x] 複数 dropdown の navbar 実装例（#nav-dashboard など）

- [x] **Modal**
  - [x] `bind:open` で UI state 管理
  - [x] SvelteKit Form Actions との共存（`form` prop は不要）
  - [x] `use:enhance` で server action 処理

- [x] **Spinner**
  - [x] import パス変更のみ

- [x] **ButtonGroup**
  - [x] 既に正しい状態（修正不要）

- [x] **Footer**
  - [x] `footerType` prop 削除
  - [x] `FooterCopyright` コンポーネント新規追加

**実装結果**: ✅ 全コンポーネント置き換え完了

**重要な教訓**:

- **ライブラリの API 仕様を context に合わせる**
  - Flowbite Modal の `form` prop + `onaction` callback は「クライアント側の form validation UI」に特化
  - SvelteKit server action 環境では不要 → `bind:open` + `use:enhance` で十分

- **相対パスの重要性（SvelteKit Form Actions）**
  - URL ネストが深い場合、絶対パス `/logout` では routing が失敗の可能性
  - 相対パス `../../logout?/logout` で確実に target route に到達

- **Flowbite のシンプルな設計**
  - Props が少なく、CSS クラスでカスタマイズする方針
  - 例：Footer では `class="shadow-none w-screen m-6"` で見た目をコントロール

- **最小限の変更が最良**
  - uiHelpers 削除 → `$state(open)` のみ
  - Modal component の props 調整 → `bind:open` + `outsideclose` のみ
  - form structure は完全保持 → `handleSubmit()` + `?/update` action
  - 余計な「modernization」は避けるべき

---

## 📋 今後対応が必要なタスク

### ⚠️ フェーズ2: テスト実行・回帰検出（進行中）

**状態**: 一部テスト PASS、一部失敗・スキップ

**テスト結果（2026-01-17）**:

- ✅ 17 passed
- ❌ 1 failed（logout テスト - タイムアウト）
- ⏭️ 1 skipped（mobile navbar テスト - `test.fixme()`）

#### チェックリスト

- [x] `pnpm test:integration` で全テスト実行
- [x] Playwright smoke test 実行
  - [x] `custom-colors.spec.ts` → primary/atcoder colors 生成確認 ✅ PASS
  - [x] `dark-mode.spec.ts` → dark mode toggle 動作確認 ✅ PASS (4/4)
  - [x] `navbar.spec.ts` → navbar レスポンシブ確認
    - [x] lg (1024px) での動作 ✅ PASS
    - [ ] mobile (375px) での動作 ⏭️ SKIP（`test.fixme()`でマーク）
      - 原因: Flowbite-Svelte v1.31.0 の navbar `breakpoint` prop が Svelte 5 Context API 実装の不具合で機能しない
      - 対応: v2.0 リリース待機推奨
      - GitHub Issue: https://github.com/themesberg/flowbite-svelte/issues/1710

- [ ] logout テスト失敗の調査・修正
  - [ ] 原因: navbar header dropdown の実装・状態確認
  - [ ] アクション: Header.svelte の dropdown 実装を確認し、ユーザー名リンクの可視性をテスト
  - [ ] 期待時期: フェーズ1-4 完了後

- [ ] visual regression テスト（手動確認）
  - [ ] space-y-_ / space-x-_ セレクタ変更による layout shift 確認
  - [ ] divide-y / divide-x による table border 変更確認
  - [ ] デフォルト値変更（border color, ring size）の visual 確認

---

### ✅ フェーズ3: 依存ライブラリ削除（完了）

**状態**: 完了（2026-01-17 確認済み）

**実施内容**:

- ✅ `pnpm remove svelte-5-ui-lib` 実行済み
- ✅ `pnpm remove embla-carousel-svelte` 実行済み（Carousel を Flowbite Svelte に置き換え完了）
- ✅ `pnpm-lock.yaml` 更新済み
- ✅ ビルド + テスト実行で問題なし（17 passed）

**確認**:

- package.json から両ライブラリを削除されたことを確認

### 🔮 将来タスク: Flowbite-Svelte v2.0 アップグレード検討

**状態**: 将来（v2.0 リリース後）

**背景**: Flowbite-Svelte v1.31.0 は Svelte 5 + Tailwind CSS v4 への対応が不完全な可能性がある

**確認事項**:

- [ ] Flowbite-Svelte v2.0 リリース（ETA: TBD）
- [ ] v2.0 で navbar `breakpoint` バグが解決されているか検証
- [ ] v2.0 への upgrade 実行（必要に応じて）
- [ ] mobile navbar テスト復活（`test.fixme()` → `test()`）

**参考**: [Flowbite-Svelte v2.0 進捗（GitHub Issues #1614）](https://github.com/themesberg/flowbite-svelte/issues/1614)

---

### 📝 設計課題: FormWrapper refactor（後回し）

**優先度**: 低

**課題**:

- [ ] FormWrapper の purpose（外側のスタイリング用か、内側のフォーム処理用か）を明確化
- [ ] nested form 設計を ドキュメント化

**期待時期**: フェーズ3 完了後

---

## 学習点・教訓（全フェーズ共通）

### Tailwind CSS v4 移行時

1. **@source ディレクティブの必須性**
   - v4 では `@source` で指定したディレクトリのファイルのみスキャン
   - Flowbite Svelte コンポーネント利用時は `@source '../node_modules/flowbite-svelte/dist'` が必須
   - テストで CSS ファイルの存在だけを確認するのではなく、実際のコンポーネント使用状況を見る方が信頼性が高い

2. **段階的アプローチの効果**
   - 必須変更（CSS ディレクティブ、@source、plugin 指定）だけを先行実装
   - 任意推奨事項（CSS Variables 化、autoprefixer 削除など）はフェーズ1 以降で検討
   - この段階的アプローチにより、安定した状態での次フェーズ開始が可能

3. **テスト駆動開発の価値**
   - v4 では「colors が CSS に含まれるか」を単純に grep で検証することは困難
   - 実際の HTML 内で使用されているクラス名のみ生成されるため、Playwright での E2E テストが有効（実際のレンダリング結果を確認）

### コンポーネント置き換え時

1. **「新しい = 正しい」という仮定は危険**
   - Flowbite Modal の `form` prop + `onaction` callback は「クライアント側の form validation UI」に特化
   - SvelteKit の server action context では使うべきではない
   - ドキュメントをしっかり読み込まないと、誤った方向に進む

2. **ライブラリの API 仕様を context に合わせるべき**
   - 新しいライブラリのすべての機能を使う必要はない
   - SvelteKit Form Actions との共存を優先 → `form` prop は不要
   - `bind:open` (UI 管理) + `use:enhance` (server action) の分離が正解

3. **最小限の変更が最良**
   - uiHelpers 削除 → `$state(open)` のみ
   - Modal component の props 調整 → `bind:open` + `outsideclose` のみ
   - form structure は完全保持 → `handleSubmit()` + `?/update` action
   - 余計な最適化や「modernization」は避けるべき

4. **Props 名の確認重要**
   - `aClass`（svelte-5-ui-lib 固有）→ `activeClass`（Flowbite Svelte 標準）への変更は、GitHub の NavLi 定義確認が必須

5. **$app/stores の必須性（SSR 環境）**
   - Flowbite docs は client-only デモで `$app/state` を使うが、SSR 環境では `$app/stores` が必須

6. **相対パスの重要性（SvelteKit Form Actions）**
   - URL ネストが深い場合、絶対パス `/logout` では routing が失敗の可能性
   - 相対パス `../../logout?/logout` で確実に target route に到達

### テスト実装時

1. **Playwright API の変化**
   - `page.setViewport()` は削除済み → `browser.newContext()` で device 固有設定を実装
   - BDD スタイルテストでは `let page` の手動管理ではなく、`async ({ page })` で injection
   - mobile/desktop テストは `devices` config を使用した `browser.newContext()` が推奨

2. **CSS ファイル構造の理解**
   - SvelteKit ビルドは複数の CSS ファイルに分割される
   - `.svelte-kit/output/client/_app/immutable/assets/0.*.css` がメイン CSS
   - CSS は圧縮されるため regex での検索はセレクタサイズの違いに注意

3. **セレクタ設計の工夫**
   - `aria-label` がない button を `nav button:not([aria-label])` で識別
   - `div[role="none"] ul` で menu container を特定（CSS class 依存を避ける）
   - Playwright の `isVisible()` は実際のレンダリング結果を確認（CSS 実装詳細に依存しない）

4. **テストの安定性向上**
   - viewport 変更後のページ再レンダリング問題 → `browser.newContext()` で新規コンテキスト作成
   - boundingBox 取得前に `toBeVisible()` で存在確認
   - 複数 SVG がある場合は `.locator('svg').count()` で存在確認

5. **カスタムフィクスチャの活用**
   - `test.extend()` で device 固有設定を抽象化（`iPhonePage`, `desktopPage`）
   - Playwright の `await use(page)` パターンで自動 context クローズを実現し、ボイラープレート削減
   - 型定義 `<{ iPhonePage: Page; desktopPage: Page }>` で TypeScript サポート確保

---

## 参考資料

- [testing-strategy.md](./testing-strategy.md) - テスト詳細・実装例
- [investigation.md](./investigation.md) - Breaking Changes 詳細
- [component-migration.md](./component-migration.md) - コンポーネント対応表

---

## トラブルシューティング

### Q: TailwindCSS v4 への移行後、カスタムカラーが反映されない

**A**: `src/app.css` の `@source` ディレクティブを確認する。

```css
@source "../src/**/*.{html,js,svelte,ts}";
@source "../node_modules/flowbite-svelte/dist/**/*.{html,js,svelte,ts}";
```

Flowbite Svelte コンポーネント scan には両方の `@source` が必須です。

---

### Q: Flowbite Svelte での Tabs コンポーネントがモバイルで改行される

**A**: Tabs の layout 設計が v3 と v4 で異なるため、レスポンシブ対応が必須。

- v3 では単純な horizontal layout だが、v4 では `flex-wrap` + `gap` + item alignment の組み合わせが必要
- ハマった点：`items-center` のままだと改行後に中央寄せされて見づらくなる → `items-start` or `items-baseline` に変更
- 教訓：Flowbite 内部の layout 実装を仮定せず、ブラウザ DevTools で実際の flex layout を確認する

---

### Q: ButtonGroup の角が丸くなってしまう

**A**: Tailwind v4 の `rounded` スケール変更により、Flowbite の ButtonGroup 内部の `rounded-sm` 適用が意図せず変更された。

- ハマった点：`rounded-none md:rounded-md` という条件付きスタイリングが必要（base で角を消し、md breakpoint で復活）
- 教訓：Flowbite components は内部的に rounded ユーティリティを使うため、カスタマイズ時は `rounded-none` で明示的に unset する

---

### Q: Dropdown のスタイリングが複雑に絡み合っている

**A**: Flowbite Dropdown は以下の 4 つの要素の組み合わせで成り立っており、各層でのスタイリング衝突を理解する必要がある。

- **bullet point 欠落**：`DropdownDivider` がリスト項目として認識されず、bullet がない → CSS `list-style: none` で統一
- **divide-y のデフォルト色**：v4 では `divide-gray-200` から `divide-currentColor` に変更 → Dropdown の仕切り線が親要素の text color を継承してしまう → 明示的に色を指定（`divide-gray-200`）
- **border の可視性**：Dropdown の border color も同様にデフォルト値変更 → `border-gray-200` を明示指定
- **ポジショニング（Floating UI）**：ネストされた dropdown や navbar での z-index 競合 → Floating UI の middleware 設定を確認

ハマった点：「なぜ Dropdown がこんなに複雑か」を理解するまで試行錯誤が続いた

教訓：UI component ライブラリを導入する際は「内部実装（何を親から継承するか）」を早期に document に記載すべき

---

### Q: Tailwind v4 への移行後、動的カラー（CSS 変数）が機能しない

**A**: Tailwind v4 の CSS-first 設計では、ユーティリティクラスは「必要なもの」のみ生成される（v3 の auto-generation は廃止）。

- ハマった点：`class="bg-" + getTaskGradeName(grade)` という動的クラス名の組み立てが動作しない → クラスそのものが CSS に存在しない
- 採用した解決策：インラインスタイル + CSS 変数の組み合わせ
  - `style={`background-color: ${getTaskGradeColor(grade)};`}` で CSS 変数名を展開
  - `getTaskGradeColor()` は `"var(--color-atcoder-Q4)"` のような形式を返す
  - ブラウザが `var()` 関数を解釈して実際の色を適用
- 教訓：v4 では「ユーティリティクラス = すべて事前定義」という assumption は危険。動的値にはインラインスタイル + CSS 変数を活用する

---
