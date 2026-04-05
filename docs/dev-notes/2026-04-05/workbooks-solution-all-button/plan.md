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

## コードレビュー指摘の妥当性判定

### 1. ✅ **workbook_url_params.test.ts — describe() 分割**

**妥当**
`describe('buildWorkbooksUrl')` のテスト (109-135行目) でカリキュラムと解法別が混在しているため、以下の3つに分割推奨：

- `describe('curriculum tab with grade', ...)`
- `describe('solution tab with category', ...)`
- `describe('created_by_user tab', ...)`

テスト順序も「カリキュラム → 解法別 → ユーザ作成」に統一。

---

### 2. ✅ **workbook_url_params.ts — 関数配置・命名・コメント**

**妥当**

#### 2a. isSelectableCategory(value: string | null) の引数名

`value` → `category` に変更。「何を検証しているのか」が不明確。

#### 2b. Private 関数の配置順

**違反確認**: isSelectableCategory (13-19行目) と isValidNonPending (96-102行目) は private だが、public 関数（parseWorkBookTab, parseWorkBookGrade 等）より**前に**配置されている。
`coding-style.md` に「Exported functions and classes (public API first) 2. Internal helper functions」と明記。修正が必要。

#### 2c. buildWorkbooksUrl コメント

**違反確認**: TSDoc (65-73行目) は英語だが、実装コメント (85行目) の「category は null（ALL）のとき falsy なので params に追加されない」が日本語。AGENTS.md に「Write all source code comments, TSDoc, commit messages, and test titles in English」。英語に変更すべき。

---

### 3. ✅ **workbooks.test.ts — Mock ヘルパー化**

**既に実装済み**
mockFindUnique, mockFindMany, mockCount ヘルパー関数が 83-95行目に存在。指摘は不要。

---

### 4. ✅ **solution_category_grouper → solution_category_group への名前変更**

**このフェーズで実施**
`grouper` (～する者/ツール) よりも `group` (結果物) の方が自然という指摘は妥当。以下を一括変更：

- ファイル: `solution_category_grouper.ts` → `solution_category_group.ts`
- ファイル: `solution_category_grouper.test.ts` → `solution_category_group.test.ts`
- 関数名: `groupBySolutionCategory` は現状のまま（関数内容は不変）
- import 修正: `src/features/workbooks/components/list/SolutionWorkBookList.svelte` の import パス更新

---

### 5. ✅ **solution_category_grouper.test.ts — テスト内コメント英語化**

**妥当**
6行目の日本語コメント「groupBySolutionCategory は id のみ参照するため最小フィクスチャで十分。タイトルは実際の問題集名に合わせて可読性を確保する。」を英語に変更。fixture 内の日本語は許容。

---

### 6. ✅ **SolutionWorkBookList.svelte — スタイル統一・タイトル追加**

**妥当**

#### 6a. CurriculumWorkBookList とのスタイル統一

- **CurriculumWorkBookList** (105行目): `<div class="text-2xl pb-4 dark:text-white">手引き</div>`
- **SolutionWorkBookList** (96行目): `<h2 class="mt-8 mb-3 text-xl font-semibold">{...}</h2>`

クラスを統一すべき（`text-2xl pb-4 dark:text-white` に合わせる）。

#### 6b. ALL以外の解法別表示時もタイトルを追加

現在の実装 (92-114行目) では：

- `currentCategory === ALL_SOLUTION_CATEGORIES` 時: グループごとにヘッダー表示（96行目）
- 特定カテゴリ選択時（107-113行目）: ヘッダーなし

単一カテゴリ表示時もカテゴリタイトルを表示すべき（UX 一貫性）。

---

## 未解決・後続タスク候補

- [ ] workbook_url_params.ts: 関数配置修正、コメント英語化、引数名 value → category
- [ ] workbook_url_params.test.ts: describe() 分割、テスト順序統一
- [ ] solution_category_grouper.ts/test.ts → solution_category_group.ts/test.ts にリネーム + import 修正
- [ ] solution_category_grouper.test.ts: 6行目のコメント英語化
- [ ] SolutionWorkBookList.svelte: スタイル統一、ALL以外の解法別表示時もタイトル追加
- [ ] prisma/seed.ts 確認：PENDING 問題集が `isPublished: false` か確認、または単体テスト環境での PENDING 除外確認
- [ ] E2E テスト失敗原因の再調査・修正
- [ ] CodeRabbit potential_issue 対応（lefthook.yml, E2E セマンティック属性）

---

## E2E テスト失敗の原因分析

### テスト 1: `All button is shown at the beginning of category buttons` (行 165-172)

**失敗の症状**:

```typescript
const buttons = page.getByRole('button');
await expect(buttons.first()).toHaveText(LABEL_ALL, ...);
```

最初のボタンが「All」ではない。

**原因の仮説**:

- テスト DB にデータが不足し、「All」以外のカテゴリボタンが描画されていない
- または、`AVAILABLE_CATEGORIES` が空で、テンプレート (SolutionWorkBookList.svelte:80-90) でボタンが描画されていない
- CodeRabbit 指摘 (nitpick) と同じく、CSS クラスに依存したアクティブ判定が脆弱

**改善方向**:

1. テスト DB に複数カテゴリの SOLUTION workbook を確実にシード
2. Tailwind `text-primary-700` ではなく、セマンティック属性 `aria-pressed="true"` でアクティブ状態を判定
3. または、ボタン取得をスコープ限定: `await page.locator('.mb-6').getByRole('button').first()`

---

### テスト 2: `non-admin user does not see PENDING section in All view` (行 186-191)

**失敗の症状**:

```typescript
await expect(page.getByRole('heading', { name: '未分類' })).not.toBeVisible();
```

一般ユーザに「未分類」(PENDING) セクションが表示されている。

**原因の調査**:
実装コード確認：

- `getSolutionCategoryMapByWorkbookId(false)` (workbooks.ts:152-177) は `isPublished: true` 条件で公開済み問題集のみを取得 ✅
- `groupBySolutionCategory()` (solution_category_grouper.ts:20-26) は categoryMap に含まれないワークブックをフィルター ✅
- PENDING グループは空になり、自動除外される (`.filter((group) => group.workbooks.length > 0)`) ✅

実装は正しいが、テスト失敗の可能性：

- **仮説 A**: テスト DB シードスクリプトが PENDING 問題集を `isPublished: true` で作成している
- **仮説 B**: テスト環境が共有 DB で、別のテスト/実行で PENDING 公開データが残存
- **仮説 C**: テスト前提条件が不明確（PENDING データ有無の確認が不足）

**改善方向** — **Test DB シード確認**（実施予定）:

1. `prisma/seed.ts` を確認：PENDING 問題集（解法別未分類）が作成されているか
   - 作成されている場合、`isPublished: false` で作成されているか確認
   - または、PENDING は管理者用のため、テスト用シード時には省略すべき
2. E2E テスト実行環境：テスト DB が毎回リセットされるか確認（Playwright setup/teardown）
3. テスト失敗時のデバッグ：
   ```typescript
   // 詳細ログ取得
   const sections = await page.locator('h2.text-xl').allTextContents();
   console.log('Visible sections:', sections);
   ```

**代替案** (実施しない):

- test.skip() は条件付きスキップとして有効だが、テスト DB 状態の不確定性が根本原因のため、シード確認が先決

---

## CodeRabbit 追加レビュー結果（2026-04-05 第2-3段階）

### 🔴 potential_issue（重要）

1. **workbook_url_params.ts - 型ガード戻り値型の不正確性**
   - `isSelectableCategory(value: string | null): value is SolutionCategory`
   - 問題: PENDING を除外するにもかかわらず、戻り値型が PENDING を含む `SolutionCategory` になっている
   - 修正案: `value is Exclude<SolutionCategory, 'PENDING'>` に変更
   - 影響: 型安全性の向上、PENDING は SolutionCategory だが選択不可カテゴリであることを型レベルで表現

2. **solution_category_group.ts - ユニットテストの確認**
   - 新しいファイル `solution_category_group.ts` に対して `solution_category_group.test.ts` が存在することを確認 ✅
   - 古いファイル `solution_category_grouper.ts/test.ts` は削除済み ✅

### 🟡 nitpick（低優先度）

1. **SolutionWorkBookList.svelte - コメント・ラベル言語の不一致**
   - Line 54 コメント: 「全て」（日本語）
   - Line 58 ラベル: `'All'`（英語）
   - 意図的な言語分離（ドキュメント日本語、UI 英語）ならば問題なし

2. **e2e/workbooks_list.spec.ts - CSS クラス依存の脆弱性**
   - Line 162: `.toHaveClass(/text-primary-700/)` 使用
   - 修正済み ✅（スコープを `div.mb-6` に限定し、ロケータを改善）
   - 残る改善: `aria-pressed="true"` 属性の追加を検討（Button コンポーネント側の修正が必要）

3. **lefthook.yml - grep の安全性**
   - ファイル名にスペースやダッシュが含まれる場合の対策
   - 提案: `grep -nE -- '\([a-z]\)\s*(=>|:)'` で `--` セパレータを追加

### 📋 実装完了の検証

- ✅ workbook_url_params.ts: 関数配置修正、コメント英語化、引数名変更完了
- ✅ workbook_url_params.test.ts: describe() 分割、テスト順序統一完了
- ✅ solution_category_grouper → solution_category_group リネーム完了
- ✅ solution_category_group.test.ts: 日本語コメント英語化完了
- ✅ SolutionWorkBookList.svelte: スタイル統一、タイトル追加完了
- ✅ E2E テスト修正: 23 PASS、2 SKIP（想定通り）
- ✅ ユニットテスト: 2054 PASS、1 SKIP

### 🔧 後続作業候補

- [ ] isSelectableCategory の戻り値型を `Exclude<SolutionCategory, 'PENDING'>` に変更
- [ ] Button コンポーネントに `aria-pressed` 属性を追加（E2E テストの堅牢性向上）
- [ ] lefthook.yml: grep に `--` セパレータを追加

---

## Rules/Skills への追加候補

### 1. 📋 coding-style.md に追加: **null-as-ALL URL パラメータ省略パターン**

**該当セクション:** "No Hard-Coded Values" または新規セクション "URL Parameter Patterns"

**提案内容:**
```markdown
## URL Parameter Patterns

### null-as-ALL: Omitting URL params to represent "all"

When a filter has an "all" or "unfiltered" state, represent it by omitting the parameter entirely
rather than using a magic value (e.g., "ALL", "NONE", "*").

**Pattern:**
- Parse function defaults to null when param is absent
- null means "show all" (no filter applied)
- URL: `/workbooks?tab=solution` (no `categories=` param)
- Returning to this URL via browser back button restores "all" state

**Benefit:** Cleaner URLs, intuitive history behavior, smaller sessionStorage footprint.

**Example:** parseWorkBookCategory with null default
```

**理由:** 従来の方法（常に値を含める）との差別化が明確で、複数の filter UI に応用可能。

---

### 2. 📋 coding-style.md に追加: **Type Guard の戻り値型を正確に narrowing する**

**該当セクション:** "Domain types over `string`" または "Naming" に補足

**提案内容:**
```markdown
## Type Guards: Precise Narrowing

When a type guard intentionally excludes enum values, use `Exclude<T, 'VALUE'>` in the return type.

**Bad:** Type guard says "is SolutionCategory" but runtime excludes PENDING
```typescript
function isSelectableCategory(value: string | null): value is SolutionCategory {
  return value !== null && ... && value !== SolutionCategory.PENDING;
}
```

**Good:** Type reflects the runtime exclusion
```typescript
function isSelectableCategory(value: string | null): value is Exclude<SolutionCategory, 'PENDING'> {
  return value !== null && ... && value !== SolutionCategory.PENDING;
}
```

**Benefit:** Caller code can trust the type system — no `as` casts needed.
```

**理由:** PENDING は存在する SolutionCategory だが選択不可という意図が、型レベルで明確になる。

---

### 3. 📋 testing.md に追加: **Describe ブロック分割: 複合テストの整理**

**該当セクション:** "Test Order Mirrors Source Order" に追加

**提案内容:**
```markdown
### Splitting Describe Blocks for Multi-Scenario Tests

When a single function accepts multiple types of inputs and behaves differently per type,
split the `describe` block by input type or scenario.

**Before:**
```typescript
describe('buildWorkbooksUrl', () => {
  test('curriculum tab with grade produces correct URL', () => { ... });
  test('solution tab with category produces correct URL', () => { ... });
  test('curriculum tab without grade produces URL with tab only', () => { ... });
  test('created_by_user tab produces URL with tab only', () => { ... });
});
```

**After:**
```typescript
describe('buildWorkbooksUrl with curriculum tab', () => {
  test('produces URL with tab only when grade is not provided', () => { ... });
  test('produces URL with tab and grade when grade is provided', () => { ... });
});

describe('buildWorkbooksUrl with solution tab', () => {
  test('produces URL with tab and category when category is provided', () => { ... });
  test('produces URL with tab only when category is null', () => { ... });
});

describe('buildWorkbooksUrl with created_by_user tab', () => {
  test('produces URL with tab only', () => { ... });
});
```

**Benefit:** Each scenario group is more discoverable; test names are less redundant; parallel structure mirrors source organization.
```

**理由:** テスト構造が実装構造と一致し、テスト探索性が向上。

---

### 4. 📋 testing-e2e.md に追加: **Semantic 属性を使用した状態検証（CSS クラス回避）**

**該当セクション:** "Assertions" に補足

**提案内容:**
```markdown
### Prefer Semantic Attributes Over CSS Classes for State Assertions

E2E tests should assert element state via accessibility attributes (`aria-pressed`, `aria-selected`, `data-*`)
rather than CSS classes, which change with styling refactors.

**Bad: Brittle to styling changes**
```typescript
await expect(button).toHaveClass(/text-primary-700/);
```

**Good: Resilient to styling changes**
```typescript
await expect(button).toHaveAttribute('aria-pressed', 'true');
// or
await expect(button).toHaveAttribute('data-active', 'true');
```

**Implementation note:** If the component does not expose the needed attribute, add it (or propose a PR to the component library).
This is more sustainable than teaching tests to brittle selectors.
```

**理由:** CodeRabbit の指摘でも浮き出た脆弱性。E2E テストの長期保守性向上。
