# Workbooks List リファクタリング計画

## 概要

Phase 12 完了後のコードレビュー指摘事項を批判的に検討し、採用・却下を決定する。
計画: 日本語 / 実装コメント: 英語

---

## 批判的レビュー結果

### ✅ 採用

| #   | ファイル                      | 指摘内容                                                           | 判断理由                                                                                                                                                                                                                                                |
| --- | ----------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `workbook_url_params.test.ts` | grades=Q1, D1, D6 ケース追加; categories 2-3種類追加               | カバレッジ不足。Q1・D1・D6 はグレード境界値で未テスト。categories は SEARCH_SIMULATION / GRAPH の 2種類しかなく主要カテゴリが欠けている                                                                                                                 |
| 2   | `workbook_url_params.ts`      | `isValidNonPending` をエクスポート関数の後へ移動                   | coding-style.md §Function Ordering: 内部ヘルパーは公開関数の後に配置する規約に違反している                                                                                                                                                              |
| 3   | `workbook_url_params.ts`      | `VALID_TABS` → `EXISTING_TABS`                                     | set の内容（enum に存在するタブ値）を正確に表す名前。`VALID_TABS` は用途寄りの命名だが `EXISTING_TABS` の方が内容を忠実に表す                                                                                                                           |
| 4   | `workbook_placement.ts`       | `SolutionCategories = SolutionCategory[]` を追加                   | coding-style.md §Plural type aliases 規約: 配列型は複数形エイリアスで定義する                                                                                                                                                                           |
| 5   | 各ファイル                    | `SolutionCategory[]` → `SolutionCategories`                        | #4 の適用。`SolutionWorkBookList.svelte` Props、`WorkBookList.svelte` Props、`getAvailableSolutionCategories()` return type が対象                                                                                                                      |
| 6   | `utils/workbooks.ts`          | `partitionWorkbooksAsMainAndReplenished` の `acc` → `partition`    | coding-style.md §Naming:「省略形は厳禁」に直接違反                                                                                                                                                                                                      |
| 7   | `utils/workbooks.ts`          | 関数を概念的グループ順に並び替え                                   | `partitionWorkbooksAsMainAndReplenished` が末尾に追加されており、関連する workbook filtering 関数群と離れている                                                                                                                                         |
| 8   | `utils/workbooks.test.ts`     | テスト順を source と揃える                                         | #7 と連動。現状 `partitionWorkbooks...` が `getTaskResult` の後にあるが source では逆順                                                                                                                                                                 |
| 9   | `services/workbooks.ts`       | `PlacementQuery` 型を `workbook_placement.ts` に移動               | 型は `types/` 層に属する（coding-style.md §Pre-Implementation Layer Check）。placement 概念の型定義はすでに `workbook_placement.ts` に集約されている                                                                                                    |
| 10  | `services/workbooks.ts`       | `@param includeUnpublished` にデフォルト `false` を明記            | TSDoc は挙動を完全に記述すべき。デフォルト値は呼び出し側にとって重要な情報                                                                                                                                                                              |
| 11  | `services/workbooks.test.ts`  | テスト順を source と揃える                                         | source の関数順と test の describe 順が大きく乖離している（例: `getWorkBook` が先頭だが source では 6番目）                                                                                                                                             |
| 12  | `WorkBookList.svelte`         | `let props = $props()` → rest spread で CommonProps を展開         | `props.hoge` より Svelte shorthand `{hoge}` が書けるようになり可読性向上。TypeScript の discriminated union narrowing は rest spread（`...restProps`）で維持可能（TypeScript は `Omit<Props, CommonKeys>` を discriminated union として正しく推論する） |
| 13  | `+page.svelte`                | `handleTabChange` の if-else → `Record<WorkBookTab, () => string>` | 可読性改善。`undefined` の扱いの非対称（CURRICULUM は末尾省略、SOLUTION は `undefined` 明示）も Record 化で解消される。plan.md 方針#5（「タブ分岐は if/else を維持」）は誤判断だったため今回修正する                                                    |
| 14  | `+page.svelte`                | `onMount` 内: if ブロックと `const saved` の間に空行を追加         | if ブロックと const 宣言が密着しており視認性が低い                                                                                                                                                                                                      |
| 15  | E2E                           | `logged-in user (general)` と `admin user` の describe 階層を整理  | タブ可視性 / URL アクセス有効性 / ナビゲーション操作 / セッション状態 に分けることで意図が明確になる                                                                                                                                                    |

### ❌ 却下

| #   | ファイル                                                        | 指摘内容                                         | 却下理由                                                                                                                                                                                      |
| --- | --------------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | `services/workbooks.ts`                                         | `getWorkBooks()` 削除                            | `src/routes/sitemap.xml/+server.ts:47` で使用中。削除不可                                                                                                                                     |
| R2  | `+page.svelte`                                                  | `WORKBOOKS_URL_KEY` を最初に使う部分の直前に移動 | coding-style.md §No Hard-Coded Values:「定数はファイル先頭、または共有時は constants/ モジュールに配置」に反する。ファイル先頭の現在位置が正しい                                              |
| R3  | `+page.svelte`                                                  | `<Tabs>` 以降の各タブを `{#snippet}` で切り出す  | YAGNI。各タブはすでに `WorkBookList` コンポーネントに委譲済み。snippet 化は indirection を追加するだけで可読性向上は限定的                                                                    |
| R4  | E2E                                                             | for 文 → parameterize/test.each 化               | Playwright にネイティブの `test.each` は存在しない。`for...of` ループが公式推奨の parameterized test パターン（plan.md 教訓#12 参照）。変更する理由がない                                     |
| R5  | E2E                                                             | `SOLUTION_CATEGORY_CASES` の for 文も同様        | R4 と同じ理由                                                                                                                                                                                 |
| R6  | E2E                                                             | 定数を `$features/` からインポート               | `e2e/` ディレクトリは SvelteKit のパスエイリアスを解決しない（plan.md 教訓#26 の既存判断）。ローカル定数＋参照コメントが正解                                                                  |
| R7  | `CurriculumWorkBookList.svelte` / `SolutionWorkBookList.svelte` | グレード/カテゴリボタン群をコンポーネント化      | YAGNI。細部の差異（`size="sm"` の有無 / ラベル取得関数 / active 判定ロジック）があり、抽象化コストが 2 箇所のメリットを上回る                                                                 |
| R8  | `+page.server.ts`                                               | `fetchWorkbooksByTab` を `async` に変更          | 変更不要。関数は `getWorkBooksCreatedByUsers()` / `getWorkbooksByPlacement()` の Promise をそのまま返す。`async` は `await` を使う場合のみ必要。`Promise.all` 側で await される設計は意図通り |
| R9  | `+page.svelte`                                                  | if/for 前後の空行を linter で強制                | ESLint `padding-line-between-statements` はプロジェクト全体に影響する設定変更でスコープ外。今回は `onMount` 内の特定箇所のみ手動修正（採用 #14）にとどめる                                    |

---

## 補足: SvelteKit `goto()` について

`$app/navigation` の `goto()` は一般的なプログラミング言語の `goto` 文とは別物。
Vue Router の `router.push()` / React Router の `navigate()` に相当するクライアントサイドナビゲーション関数。URL を更新し `load` 関数を再実行する。`window.location` の変化（ブラウザリロード）は発生しないが、`+layout.svelte` が `{#if $navigating}` でスピナー表示するため UX 的にはリロード類似に見える（plan.md 教訓#27 参照）。

---

## 実装フェーズ

### Phase 1 — 型定義（最低リスク）

**依存なし。他フェーズより先に実施。**

- [x] `src/features/workbooks/types/workbook_placement.ts` に `export type SolutionCategories = SolutionCategory[]` を追加
- [x] `src/features/workbooks/services/workbooks.ts` の `PlacementQuery` 型を `workbook_placement.ts` に移動
- [x] 消費側 (`src/routes/workbooks/+page.server.ts`, `services/workbooks.ts`) のインポートを `workbook_placement.ts` からに更新

### Phase 2 — ユーティリティ整形（低リスク）

- [x] `workbook_url_params.ts`: `isValidNonPending` 関数をファイル末尾（`buildWorkbooksUrl` の後）へ移動
- [x] `workbook_url_params.ts`: `VALID_TABS` → `EXISTING_TABS` にリネーム（参照箇所は `parseWorkBookTab` 内のみ）
- [x] `services/workbooks.ts`: `getWorkbooksByPlacement` の `@param includeUnpublished` JSDoc に `Defaults to false.` を追記
- [x] `utils/workbooks.ts`: `partitionWorkbooksAsMainAndReplenished` の reduce コールバック引数 `acc` → `partition` にリネーム
- [x] `+page.svelte`: `onMount` 内の `if (window.location.search)` ブロックと `const saved = ...` の間、および `const saved` と `if (saved)` の間に空行を追加

### Phase 3 — 関数順序の統一（低リスク）

`utils/workbooks.ts` 内の関数を概念グループ順に並び替える。問題集レベルのグレード概念（上位）が、問題と回答の組み合わせ（下位）より先に来るように整理する:

```
1. canViewWorkBook                        — auth/access (workbook visibility)
2. getUrlSlugFrom                         — URL identifier
3. getWorkBooksByType                     — workbook filter by type
4. partitionWorkbooksAsMainAndReplenished — workbook partition (同グループ)
5. countReadableWorkbooks                 — workbook count
6. calcWorkBookGradeModes                 — grade computation (workbook-level concept, higher)
7. getGradeMode                           — grade getter (同グループ)
8. buildTaskResultsByWorkBookId           — task result map building (task-level concept, lower)
9. getTaskResult                          — task result getter (同グループ)
```

- [x] `utils/workbooks.ts`: 上記順序に並び替え（主な変更: grade 関連を 6-7 に、task result 関連を 8-9 に移動）
- [x] `utils/workbooks.test.ts`: describe 順を上記 source 順に揃える

`services/workbooks.test.ts` を source 関数順に揃える（現状の test 先頭は `getWorkBook` だが source では 6番目）:

```
1. getWorkBooksWithAuthors
2. getWorkbooksByPlacement
3. getWorkBooksCreatedByUsers
4. getAvailableSolutionCategories
5. getWorkBook
6. getWorkbookWithAuthor
7. createWorkBook
8. updateWorkBook
9. deleteWorkBook
```

- [x] `services/workbooks.test.ts`: 上記順序に describe ブロックを並び替え

### Phase 4 — テスト補強（低リスク）

- [x] `workbook_url_params.test.ts` `parseWorkBookGrade`: `TaskGrade.Q1`（最難関 Q 帯境界値）、`TaskGrade.D1`（D 帯最難）、`TaskGrade.D6`（D 帯最易）の 3 ケースを追加（いずれも有効値 → その値を返す）
- [x] `workbook_url_params.test.ts` `parseWorkBookCategory`: `SolutionCategory.DYNAMIC_PROGRAMMING`、`SolutionCategory.DATA_STRUCTURE` の 2 ケースを追加

### Phase 5 — 複数形型エイリアス適用（中リスク）

Phase 1 で追加した `SolutionCategories` をコードベースに適用:

- [x] `SolutionWorkBookList.svelte`: Props の `availableCategories: SolutionCategory[]` → `SolutionCategories`（インポートも更新）
- [x] `WorkBookList.svelte`: Props の `availableCategories: SolutionCategory[]` → `SolutionCategories`（インポートも更新）
- [x] `services/workbooks.ts`: `getAvailableSolutionCategories()` の return type を `Promise<SolutionCategories>` に変更

### Phase 6 — コンポーネント改善（中リスク）

- [x] `WorkBookList.svelte`: `let props: Props = $props()` を rest spread 形式に変更し、CommonProps を shorthand で記述できるようにする

  ```typescript
  // Before
  let props: Props = $props();

  // After: CommonProps fields are destructured; restProps retains the discriminated union type
  let { workbooks, taskResultsWithWorkBookId, loggedInUser, ...restProps }: Props = $props();
  ```

  テンプレート内: `props.workbooks` → `{workbooks}`、`props.workbookType` → `restProps.workbookType` で discriminated union narrowing を維持

- [x] `+page.svelte`: `handleTabChange` の if-else チェーンを `Record<WorkBookTab, () => string>` ルックアップに変更

  ```typescript
  // Each lambda closes over the reactive `data` binding at call time
  const TAB_URL_BUILDERS: Record<WorkBookTab, () => string> = {
    [WorkBookTab.CURRICULUM]: () => buildWorkbooksUrl(WorkBookTab.CURRICULUM, data.selectedGrade),
    [WorkBookTab.SOLUTION]: () =>
      buildWorkbooksUrl(WorkBookTab.SOLUTION, undefined, data.selectedCategory),
    [WorkBookTab.CREATED_BY_USER]: () => buildWorkbooksUrl(WorkBookTab.CREATED_BY_USER),
  };

  function handleTabChange(tab: WorkBookTab) {
    goto(TAB_URL_BUILDERS[tab]());
  }
  ```

### Phase 7 — E2E テスト階層整理（低リスク）

`logged-in user (general)` を以下の 4 グループに分割:

```
test.describe('logged-in user (general)', () => {
  test.describe('tab visibility', () => {
    // defaults to curriculum tab
    // curriculum and solution tabs are visible
    // user-created tab is not visible to non-admin
  })

  test.describe('URL parameter handling', () => {
    // non-admin accessing created_by_user tab is redirected to /workbooks
    // invalid tab param falls back to curriculum tab
    // direct URL access to solution tab selects the solution tab
  })

  test.describe('navigation interactions', () => {
    // clicking solution tab updates URL to tab=solution
    // curriculum grade buttons update URL (for-of: Q10, Q9, Q8)
    // solution category buttons update URL (for-of: GRAPH, DP, SEARCH)
  })

  test.describe('session state', () => {
    // navigating away and back restores saved URL filter state
  })

  // toggling replenishment workbooks (standalone — requires visibility check)
})
```

`admin user` を以下の 2 グループに分割:

```
test.describe('admin user', () => {
  test.describe('tab visibility', () => {
    // 新規作成 button is visible
    // user-created tab is visible to admin
    // admin can access created_by_user tab via URL
  })

  test.describe('workbook actions', () => {
    // workbook rows show edit link and delete button
  })
})
```

- [x] `e2e/workbooks_list.spec.ts`: 上記階層に整理

---

## 検証

- [x] `pnpm test:unit` — 全ユニットテスト通過
- [x] `pnpm check` — 型エラーなし（pre-existing の login/signup 2件のみ）
- [x] `pnpm lint` — Lint エラーなし（warnings は pre-existing）
- [x] `pnpm format` — フォーマット適用済み
- [ ] `coderabbit review --plain` — critical/high は即修正、low/info は最終 PR レビューで対応
  - [ ] 1回目
  - [ ] 2回目
  - [ ] 3回目
- [ ] `/session-close` — plan チェックリスト更新・rule/skill 追加提案・bloat チェック
