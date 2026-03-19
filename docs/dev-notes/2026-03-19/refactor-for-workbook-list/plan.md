# Refactoring Plan: 問題集一覧機能 (#3280)

## Context

Issue #3269（管理者指定の並び順で問題集を表示）をスムーズに実装するための前工程。
現状、`+page.svelte` の肥大化・`+page.server.ts` の N+1 クエリ・サービス層への SvelteKit 依存・テスト不足が課題。
コード整理と責務分離を行い、#3269 への接続コストを下げる。

---

## Findings

### テスト欠落（最優先）

- `services/workbooks.ts` (202行) — テストなし
- `services/workbook_tasks.ts` (18行) — テストなし

### +page.server.ts

- **N+1クエリ**: `getWorkBooks()` → ループ内で `getUserById()` (N回) → `include: { user }` で1クエリ化可能
- try/catch が `workbooksWithAuthors` を囲っていない（著者取得失敗時も 500 が返らない）
- `console.log('form -> actions -> delete')` デバッグログ残留

### +page.svelte

- `getWorkBooksByType()` — TODO コメントあり、utils に移すべき純粋関数
- `fetchTaskResultsWithWorkBookId()` — 複雑なロジックがコンポーネント内に埋め込まれている

### services/workbooks.ts

- `getWorkbookWithAuthor()` がサービス層で SvelteKit の `error()` を呼ぶ（テスト不能、責務混在）
- `isExistingWorkBook()` が存在確認のために全フィールドを `findUnique` している（`count` で十分）

### WorkBookList.svelte

- `loggedInUser: any` — 型安全性の欠如（使用フィールドは `.id` と `.role` のみ）
- `$derived(() => countReadableWorkbooks(...))` — Svelte 5 の誤用、`$derived(countReadableWorkbooks(...))` が正しい

### WorkBookBaseTable.svelte

- FIXME コメント: 「問題集の種類別にコンポーネントを分ける」
- CURRICULUM / SOLUTION / CREATED_BY_USER でヘッダー・ボディ両方に if 分岐が散在

### utils/workbooks.ts テストギャップ

- `calcWorkBookGradeModes` のタイブレーク動作（同頻度グレードの場合）が未テスト

---

## 実装フェーズ

### Phase 0: 未テストサービスへのテスト追加（純粋追加、リスクなし）

- [ ] `services/workbook_tasks.test.ts` を新規作成
  - `getWorkBookTasks`: 通常ケース、空配列、comment フィールドの取り扱い
  - `validateRequiredFields`: 正常ケース、taskId 欠損、priority 欠損（index 0/中/末/負/小数）、空配列
  - **注意**: `validateRequiredFields` は `!task.priority` を使用しているが `priority === 0` は `false` になる潜在バグ → テストで明確化してから修正を判断

### Phase 1: +page.svelte から utils へ純粋関数を抽出（低リスク）

- [ ] `utils/workbooks.ts` に `getWorkBooksByType(workbooks, type)` を追加（TODO コメント対応）
  - テスト追加（通常フィルタ、空配列、type が一致しない場合）
- [ ] `utils/workbooks.ts` に `buildTaskResultsByWorkBookId(workbooks, taskResultsByTaskId)` を追加
  - 現在 +page.svelte の `fetchTaskResultsWithWorkBookId()` に相当
  - テスト追加（task 結果あり/なし、空配列）
- [ ] `+page.svelte` を更新: 両関数を import に置き換え

### Phase 2: +page.server.ts の N+1 修正とクリーンアップ（中リスク）

- [ ] `services/workbooks.ts` に `getWorkBooksWithAuthors()` を追加
  - `include: { user: { select: { username: true } }, workBookTasks: { orderBy: { priority: 'asc' } } }` を使用
  - 戻り値型 `WorkbooksWithAuthors` を `types/workbook.ts` に追加（`authorName: string` を含む）
  - 著者削除済みの場合は `user?.username ?? 'unknown'` で対応
- [ ] `+page.server.ts` の `load()` を更新:
  - `getWorkBooks()` + N+1 ループ → `getWorkBooksWithAuthors()` に置き換え
  - try/catch の範囲を拡大（workbooks 取得も含める）
- [ ] CRUD アクションのログを「受信時」→「成功後」に移動（3ファイル）

**判断根拠**: 現在の `console.log('form -> actions -> ...')` はバリデーション**前**（アクション受信時）に発火するため、不正なリクエストでも記録される。また「どのリソースを誰が操作したか」が分からず本番デバッグに役立たない。成功を確認できる位置に移動し、識別情報を含めることで意味のあるログにする。

```ts
// Before（受信時、情報量が低い）
console.log('form -> actions -> delete');
// ... バリデーション ...
await workBooksCrud.deleteWorkBook(workBookId);

// After（操作成功後、識別情報を含む）
await workBooksCrud.deleteWorkBook(workBookId);
console.log(`Deleted workbook ${workBookId} by user ${loggedInUser?.id}`);
```

対象ファイルと成功後ログの内容:

| ファイル | ログ内容 |
|----------|---------|
| `routes/workbooks/+page.server.ts` (delete) | `Deleted workbook ${workBookId} by user ${loggedInUser?.id}` |
| `routes/workbooks/create/+page.server.ts` | `Created workbook "${workBook.title}" by user ${author.id}` |
| `routes/workbooks/edit/[slug]/+page.server.ts` | `Updated workbook ${workBookId}`（edit action に `locals` がなくユーザー情報なし） |

### Phase 3: サービス層から SvelteKit error() を除去（中リスク）

`getWorkbookWithAuthor()` の error() 移動 — 方針:

- スラッグバリデーション（`parseWorkBookId/parseWorkBookUrlSlug`）は**入力バリデーション = ルートの責務**
- サービスは DB アクセスのみ、存在しない場合は `null` を返す
- 2種類のエラー（BAD_REQUEST vs NOT_FOUND）をルートが区別できる構造にする

```
// Before: サービスが error() を直接呼ぶ
export async function getWorkbookWithAuthor(slug) {
  if (workBookId === null && workBookUrlSlug === null) {
    error(BAD_REQUEST, '...');   // ← SvelteKit 依存
  }
  if (workBook === null) {
    error(NOT_FOUND, '...');     // ← SvelteKit 依存
  }
}

// After: ルートが責務を持つ
// service: null を返すだけ
// route: slug バリデーション → null チェック → error() 呼び出し
const workBookId = parseWorkBookId(slug);
if (!workBookId) { error(BAD_REQUEST, '...'); }
const workbook = await getWorkbookWithAuthor(slug);
if (!workbook) { error(NOT_FOUND, '...'); }
```

- [ ] `getWorkbookWithAuthor()` から `error()` 呼び出しを削除、`null` を返すように変更
- [ ] 呼び出し元のルートハンドラーを更新（`src/routes/workbooks/[slug]/+page.server.ts` 等）:
  - slug バリデーションを呼び出し元に移動
  - null チェック後に `error(BAD_REQUEST/NOT_FOUND, ...)` を呼び出す
- [ ] `isExistingWorkBook()` を `db.workBook.count({ where: { id } }) > 0` に変更

### Phase 4: services/workbooks.ts の統合テスト追加（Phase 3 後）

- [ ] `services/workbooks.test.ts` を新規作成（`@quramy/prisma-fabbrica` ファクトリー使用）
  - `getWorkBook`: 存在する/しない
  - `getWorkBooksWithAuthors`: 著者あり/著者削除済み
  - `createWorkBook`: 正常、重複スラッグ
  - `updateWorkBook`: 正常、存在しない ID
  - `deleteWorkBook`: 正常、存在しない ID

### Phase 5: WorkBookList.svelte 型修正と Svelte 5 パターン修正（低リスク）

- [ ] `loggedInUser: any` → 使用フィールド（`id: string`, `role: Roles`）の最小 interface を定義
  - `$lib/types/user.ts` の既存型を確認して再利用
- [ ] `$derived(() => countReadableWorkbooks(...))` を `$derived(countReadableWorkbooks(...))` に修正（2箇所）

### Phase 6: WorkBookBaseTable.svelte を3種コンポーネントに分割（中リスク）

ユーザー方針: 「3種類コンポーネントをベースに、if 文のところは interface で分岐をなくす」

**設計判断: 完全分離 vs 基底+差分**

`WorkBookBaseTable.svelte` を「共通の基底コンポーネント」として残す案もあるが、**完全分離を採用する**。

| 方針                 | メリット                                 | デメリット                                      |
| -------------------- | ---------------------------------------- | ----------------------------------------------- |
| **完全分離（採用）** | 各ファイルが自己完結、開けば全体が見える | `<Table>` 等のテンプレート構造が3箇所に存在     |
| 基底 + 差分          | テンプレートの行数が少ない               | 「共通はどこ？差分はどこ？」と2層読み回しが必要 |

分割後の1ファイルは概算 50〜70行。共通の**ロジック**（`AcceptedCounter`, `ThermometerProgressBar` 等）は import で共有するため実質的な重複はなく、重複するのはテンプレート構造だけ → 許容範囲。`WorkBookBaseTable.svelte` はリネームせず削除する。

**命名判断: `WorkBook` プレフィックスを省略する**

同ディレクトリの `WorkBookList.svelte` や `WorkbookTabItem.svelte` は routes 側（`+page.svelte`）からもインポートされるため、`WorkBook` プレフィックスが文脈の補足として機能する。一方、3分割コンポーネントは workbooks feature 内でしか使われず、`src/features/workbooks/components/list/` というパスがすでに "workbook" の文脈を提供している。プレフィックスは冗長になるため省略する。

```
// 省略なし（冗長）
import CurriculumWorkbookTable from '.../workbooks/components/list/CurriculumWorkbookTable.svelte'

// 省略あり（採用）
import CurriculumTable from '.../workbooks/components/list/CurriculumTable.svelte'
```

- [ ] 共通 `interface WorkbookTableProps` を定義（3コンポーネントが同じシグネチャを持つ）
  - `workbooks`, `workbookGradeModes`, `userId`, `role`, `taskResults` を共通 props に
- [ ] 3コンポーネントを作成（全て `WorkbookTableProps` を実装）:
  - `CurriculumTable.svelte` — グレード + タイトル列
  - `SolutionTable.svelte` — タイトル列（padding 広め）
  - `CreatedByUserTable.svelte` — 作者 + タイトル列
  - 各コンポーネントは同じ `interface Props` を持ち、内部に WorkBookType の if 分岐なし
  - 共通列（ProgressBar、AcceptedCounter、CompletedTasks、編集/削除ボタン）は既存コンポーネントをそのまま利用
- [ ] `WorkBookList.svelte` を更新: `Record<WorkBookType, Component>` ルックアップで切り替え

```svelte
<!-- WorkBookList.svelte -->
<script>
  const tableComponents = {
    [WorkBookType.CURRICULUM]: CurriculumTable,
    [WorkBookType.SOLUTION]: SolutionTable,
    [WorkBookType.CREATED_BY_USER]: CreatedByUserTable,
  } as const satisfies Record<WorkBookType, Component<WorkbookTableProps>>;
</script>

{@const TableComponent = tableComponents[workbookType]}
<TableComponent
  {workbooks}
  {workbookGradeModes}
  {userId}
  {role}
  taskResults={taskResultsWithWorkBookId}
/>
```

- [ ] `WorkBookBaseTable.svelte` を削除

### Phase 7: コーナーケーステストの強化（純粋追加）

- [ ] `utils/workbooks.ts` `calcWorkBookGradeModes`:
  - タイブレーク動作のテスト（同頻度グレードが2つある場合、`calcGradeMode` の動作を確認して文書化）
- [ ] 既存テストの `toBeTruthy()`/`toBeFalsy()` を `toBe(true)`/`toBe(false)` に置き換え（coding-style.md 準拠）

### Phase 8: E2E テスト追加（純粋追加）

新規ファイル `tests/workbooks_list.test.ts` を作成。`loginAsAdmin` ヘルパーは `workbook_order.test.ts` から抽出して共有する。

**アクセス制御**

- [ ] 未ログインで `/workbooks` にアクセスすると `/login` にリダイレクトされる

**ログインユーザー（一般）**

- [ ] カリキュラム・解法別タブが表示される
- [ ] ユーザ作成タブは非管理者には表示されない
- [ ] カリキュラムタブでグレードフィルター（`10Q` → `9Q`）をクリックするとリストが切り替わる
- [ ] 補充問題集が存在するグレードでトグル（`aria-label="Toggle visibility of replenishment workbooks for curriculum"`）をクリックすると補充セクションが表示/非表示になる

**管理者**

- [ ] 「新規作成」ボタンが表示される
- [ ] ユーザ作成タブが表示される
- [ ] 問題集行に「編集」リンクと「削除」ボタンが表示される

**補足**: グレードラベルの文字列（`10Q` 等）は `getTaskGradeLabel()` の戻り値に依存するため、実装時に `workbook_order.test.ts` の既存セレクター（`{ name: '10Q' }`）と一致していることを確認すること。

---

## 変更ファイル一覧

### 新規作成

- `src/features/workbooks/services/workbook_tasks.test.ts`
- `src/features/workbooks/services/workbooks.test.ts`
- `src/features/workbooks/components/list/CurriculumTable.svelte`
- `src/features/workbooks/components/list/SolutionTable.svelte`
- `src/features/workbooks/components/list/CreatedByUserTable.svelte`
- `tests/workbooks_list.test.ts`

### 変更

- `src/features/workbooks/services/workbooks.ts` — `getWorkBooksWithAuthors()` 追加、`isExistingWorkBook()` 修正、`getWorkbookWithAuthor()` から error() 除去
- `src/features/workbooks/types/workbook.ts` — `WorkbooksWithAuthors` 型追加
- `src/features/workbooks/utils/workbooks.ts` — `getWorkBooksByType()`, `buildTaskResultsByWorkBookId()` 追加
- `src/features/workbooks/utils/workbooks.test.ts` — 追加テスト
- `src/features/workbooks/components/list/WorkBookList.svelte` — 型修正・Svelte 5 パターン修正・3コンポーネント使用
- `src/routes/workbooks/+page.svelte` — 関数 import 化
- `src/routes/workbooks/+page.server.ts` — N+1 修正・ログを成功後に移動
- `src/routes/workbooks/create/+page.server.ts` — ログを成功後に移動
- `src/routes/workbooks/edit/[slug]/+page.server.ts` — ログを成功後に移動
- `src/routes/workbooks/[slug]/+page.server.ts` 等 — error() 呼び出し元更新

### 削除

- `src/features/workbooks/components/list/WorkBookBaseTable.svelte`（Phase 6 後）

---

## 検証方法

```bash
pnpm test:unit        # Phase 0, 4, 7 のテスト確認
pnpm check            # Svelte 型チェック（Phase 5, 6）
pnpm lint             # ESLint チェック
pnpm test:integration # Phase 8 の E2E テスト確認
pnpm dev              # ローカルで3タブ（カリキュラム/解法別/ユーザ作成）が正常表示されること
```
