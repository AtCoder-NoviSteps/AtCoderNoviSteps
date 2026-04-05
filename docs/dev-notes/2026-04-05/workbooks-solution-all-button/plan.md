# SOLUTION タブ「全て」ボタン追加 実装プラン

**Goal:** workbooks ページの解法別（SOLUTION）タブに「全て」ボタンを追加し、管理者は非公開含む全問題集を、一般ユーザは公開済みのみカテゴリ別グループ表示で閲覧できるようにする。

**Architecture:** `categories` URL パラメータ省略 = null (= ALL) として扱う null-as-ALL 方式。`ALL_SOLUTION_CATEGORIES = null` 命名済み定数で意図を明示。サービス層でnullを受け取ったとき solutionCategory フィルターなし（全件取得）、UI側で `Object.values(SolutionCategory)` 列挙順にグループ化。グループ化用の categoryMap はサーバーから別クエリで取得して props 経由で渡す。

**Tech Stack:** SvelteKit 2 + Svelte 5 Runes, TypeScript, Prisma, Vitest, Playwright

---

## ファイル構成

| 変更種別 | ファイル                                                             |
| -------- | -------------------------------------------------------------------- |
| 修正     | `src/features/workbooks/types/workbook_placement.ts`                 |
| 修正     | `src/features/workbooks/utils/workbook_url_params.ts`                |
| 修正     | `src/features/workbooks/utils/workbook_url_params.test.ts`           |
| 修正     | `src/features/workbooks/services/workbooks.ts`                       |
| 修正     | `src/features/workbooks/services/workbooks.test.ts`                  |
| 新規     | `src/features/workbooks/utils/solution_category_grouper.ts`          |
| 新規     | `src/features/workbooks/utils/solution_category_grouper.test.ts`     |
| 修正     | `src/routes/workbooks/+page.server.ts`                               |
| 修正     | `src/routes/workbooks/+page.svelte`                                  |
| 修正     | `src/features/workbooks/components/list/WorkBookList.svelte`         |
| 修正     | `src/features/workbooks/components/list/SolutionWorkBookList.svelte` |
| 修正     | `e2e/workbooks_list.spec.ts`                                         |

---

## 設計方針

- **admin order ページは変更しない**: `src/routes/(admin)/workbooks/order/` は今回のスコープ外。「全て」カテゴリへの問題集振り分けは意図しない。
- **sessionStorage の URL 保存**: `+page.svelte` の `$effect` で `buildWorkbooksUrl(data.tab, data.selectedGrade, data.selectedCategory)` を保存している。null カテゴリ（全て）のとき `/workbooks?tab=solution` が保存され、戻ったときにデフォルトの「全て」表示に戻る動作になる。
- **availableCategories**: 「All」選択時も引き続き取得・使用される（個別カテゴリボタンの表示制御のため）。
- **PENDING 表示制御**: `groupBySolutionCategory` は PENDING グループを自動的に含める。ただし一般ユーザには `getSolutionCategoryMapByWorkbookId(false)` が呼ばれ、公開済み問題集のみが対象となる。PENDING 問題集は未公開のため、一般ユーザのマップには含まれず PENDING グループは自然に空→除外される。

---

## 実装完了（2026-04-05）

**Task 1～11 完了。Unit test 2054 PASS、型チェック・lint OK。**

実装内容（コードで確認可能）:

- null-as-ALL 方式の型定義（ALL_SOLUTION_CATEGORIES, SelectedSolutionCategory）
- URL パラメータ層の修正（parseWorkBookCategory デフォルト null）
- サービス層の buildPlacementFilter ヘルパーと getSolutionCategoryMapByWorkbookId 追加
- groupBySolutionCategory ユーティリティ実装（enum 順グループ化）
- ページサーバー・コンポーネント型伝播
- SolutionWorkBookList 「全て」ボタン + グループ表示
- E2E テスト追加

---

## 汎用的・新規性の高い教訓の候補

### 1. null-as-ALL パターンの URL パラメータ省略化

**パターン**: URL パラメータの省略を「すべて表示」の意味として扱う設計
**新規性**: YAGNI 的（デフォルト値より null）。従来は `?tab=solution&category=SEARCH_SIMULATION` が常に含まれていた。
**応用**: フィルタUI全般で、デフォルトラジオボタン「全て」を選択時に URL パラメータを完全に省略し、戻ってくるとデフォルト状態に回帰する UX パターンに拡張可能。
**注意**: sessionStorage が保存するのは `?tab=solution` のみになり、ブックマークや画面遷移で意図的に「全て」に戻る動作が実現される。

### 2. サービス層の buildPlacementFilter ヘルパー化

**パターン**: CURRICULUM/SOLUTION の条件分岐ロジックをプライベートヘルパーに切り出す
**利点**: 三項演算子のネスト回避、可読性向上。Prisma の where-filter 構築が複雑な場合（JOIN 条件など）に有効。
**応用**: CRUD 層で複数の place-filter を組み合わせる場合、ヘルパーの再利用性が高まる。

### 3. グループ化用マップの別クエリ取得と遅延読込

**パターン**: 関連データの取得を UI 操作（「全て」選択）に応じて遅延させる
**効果**: 単一カテゴリ表示時は不要な categoryMap クエリをスキップ（Promise.all の条件）
**注意**: Prisma N+1 回避と UI レスポンス時間のバランス。一般的には「全て」表示の方が重いため、初回ロード時は categoryMap クエリを避けて基本タブ表示を先に済ませる判断も検討余地あり。

---

## E2E テスト結果と課題

**実装完了後の E2E テスト実行結果:**

- ✅ 21 テスト PASS
- ❌ 2 テスト失敗（新規追加）
- ⊘ 2 テストスキップ（環境依存、テスト DB に該当データなし）

**失敗の詳細:**

1. `All button is shown at the beginning of category buttons` (行 165)
   - `buttons.first()` が「全て」ボタンを取得しない（UI 描画順序またはロジック誤り）

2. `non-admin user does not see PENDING section in All view` (行 188)
   - **重大**: 一般ユーザに PENDING セクションが表示されている
   - 推測: `getSolutionCategoryMapByWorkbookId(false)` で isPublished フィルターが機能していない、またはテスト DB に PENDING（未公開）問題集が存在しない

**改善方向:**

- E2E テスト修正: テスト DB 状態を明確に制御するか、Skip 条件を厳密にする
- PENDING フィルター検証: 実装ロジック再確認（特にサービス層の where 条件）

---

## CodeRabbit レビュー結果

**指摘レベル別サマリー:**

### 🔴 potential_issue（修正推奨）

1. **lefthook.yml** (line 18-24): ファイル名にスペースが含まれる場合 grep が失敗
   - 修正案: xargs で安全化（例：`echo {staged_files} | xargs -I {} grep ... {}`)

2. **e2e/workbooks_list.spec.ts** (line 161-162): Tailwind CSS クラスに依存したアサーション
   - 問題: `text-primary-700` は実装詳細、スタイル変更で破損
   - 修正案: `aria-pressed="true"` などセマンティック属性を使用

### 🟡 nitpick（低優先度）

1. **e2e/workbooks_list.spec.ts**: 「All」ボタンのアクティブ判定が CSS クラス依存

2. **solution_category_grouper.test.ts**: categoryMap に存在しない workbook.id のエッジケーステスト不足
   - 追加提案: `test('handles workbooks not found in categoryMap', ...)`

3. **lefthook.yml**: Markdown 外での誤検知可能性（低確率）

---

## 未解決・後続タスク候補

- [ ] E2E テスト修正・PENDING フィルター検証
- [ ] CodeRabbit potential_issue 対応（lefthook.yml, E2E セマンティック属性）
- [ ] SolutionWorkBookList セクションヘッダー: スタイル統一 + 単体カテゴリ表示時のヘッダー追加検討
