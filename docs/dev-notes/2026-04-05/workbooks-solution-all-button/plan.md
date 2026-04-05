# SOLUTION タブ「全て」ボタン追加 実装プラン

**Goal:** workbooks ページの解法別（SOLUTION）タブに「全て」ボタンを追加し、管理者は非公開含む全問題集を、一般ユーザは公開済みのみカテゴリ別グループ表示で閲覧できるようにする。

**Architecture:** `categories` URL パラメータ省略 = null (= ALL) として扱う null-as-ALL 方式。`ALL_SOLUTION_CATEGORIES = null` 命名済み定数で意図を明示。サービス層でnullを受け取ったとき solutionCategory フィルターなし（全件取得）、UI側で `Object.values(SolutionCategory)` 列挙順にグループ化。グループ化用の categoryMap はサーバーから別クエリで取得して props 経由で渡す。

**Tech Stack:** SvelteKit 2 + Svelte 5 Runes, TypeScript, Prisma, Vitest, Playwright

---

## 設計方針

- **admin order ページは変更しない**: `src/routes/(admin)/workbooks/order/` は今回のスコープ外。「全て」カテゴリへの問題集振り分けは意図しない。
- **sessionStorage の URL 保存**: `+page.svelte` の `$effect` で `buildWorkbooksUrl(data.tab, data.selectedGrade, data.selectedCategory)` を保存している。null カテゴリ（全て）のとき `/workbooks?tab=solution` が保存され、戻ったときにデフォルトの「全て」表示に戻る動作になる。
- **availableCategories**: 「All」選択時も引き続き取得・使用される（個別カテゴリボタンの表示制御のため）。
- **PENDING 表示制御**: `groupBySolutionCategory` は PENDING グループを自動的に含める。ただし一般ユーザには `getSolutionCategoryMapByWorkbookId(false)` が呼ばれ、公開済み問題集のみが対象となる。PENDING 問題集は未公開のため、一般ユーザのマップには含まれず PENDING グループは自然に空→除外される。

---

## ステータス

✅ **完了**: 2026-04-05

- Unit Tests: 2054 PASS | 1 SKIP
- E2E Tests: 23 PASS | 2 SKIP
- Build: ✓

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

## Code Review 指摘と修正

### ✅ 修正完了

**型安全性:**

- isSelectableCategory の戻り値型を `Exclude<SolutionCategory, 'PENDING'>` に更新
- PENDING は enum 値だが選択不可という意図を型レベルで表現

**セマンティック属性 (E2E テスト堅牢性):**

- SolutionWorkBookList.svelte の Button に `aria-pressed={currentCategory === entry.value}` を追加
- E2E テストを CSS クラス依存から `aria-pressed="true"` ベースの検証に変更
- テスト結果: 23 PASS | 2 SKIP

**言語統一:**

- SolutionWorkBookList.svelte コメント: 「全て」→ 「All」に統一
- e2e/workbooks_list.spec.ts コメント: 日本語→英語に統一

**安全性:**

- lefthook.yml の grep コマンド: `-- ` セパレータを追加してファイル名の安全性を向上

---

## Generalizable Lessons for Rules/Skills

These patterns emerged from implementation and are applicable across the codebase.

### 1. **coding-style.md** — URL Parameter Patterns: null-as-ALL

Omit filter URL parameters entirely to represent "all" state, rather than using a magic value (e.g., "ALL", "\*").

- **Pattern:** Parse function defaults to null → null means "no filter applied"
- **Benefit:** Cleaner URLs, intuitive history behavior, smaller sessionStorage footprint
- **Example:** `/workbooks?tab=solution` (no `categories=`) defaults to showing all categories

### 2. **coding-style.md** — Type Guards: Precise Narrowing for Excluded Values

Use `Exclude<T, 'VALUE'>` in type guard return type when intentionally excluding enum members.

```typescript
// Bad: Type doesn't reflect runtime exclusion
function isSelectable(v: string | null): v is Category { ... && v !== PENDING; }

// Good: Type matches runtime behavior
function isSelectable(v: string | null): v is Exclude<Category, 'PENDING'> { ... }
```

**Benefit:** Caller code trusts the type system; no `as` casts needed.

### 3. **testing.md** — Describe Block Organization: Multi-Scenario Functions

Split `describe` blocks by scenario when a function behaves differently based on input type or mode.

```typescript
// Instead of flat list mixing all cases:
describe('buildWorkbooksUrl with curriculum tab') { ... }
describe('buildWorkbooksUrl with solution tab') { ... }
describe('buildWorkbooksUrl with created_by_user tab') { ... }
```

**Benefit:** Test discovery improves, structure mirrors implementation, test names less redundant.

### 4. **testing-e2e.md** — Semantic Attributes Over CSS Classes

Assert element state via `aria-pressed`, `aria-selected`, `data-*` attributes, not CSS classes (which are implementation details).

```typescript
// Bad: Brittle to styling changes
await expect(button).toHaveClass(/text-primary-700/);

// Good: Resilient to refactors
await expect(button).toHaveAttribute('aria-pressed', 'true');
```

**Note:** If component library doesn't expose the attribute, add it (or contribute PR). Teaching tests brittle selectors is not sustainable.
