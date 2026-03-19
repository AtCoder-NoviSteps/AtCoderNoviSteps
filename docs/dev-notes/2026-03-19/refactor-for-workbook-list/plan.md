# Refactoring Plan: 問題集一覧機能 (#3280)

## Context

Issue #3269（管理者指定の並び順で問題集を表示）をスムーズに実装するための前工程。
現状、`+page.svelte` の肥大化・`+page.server.ts` の N+1 クエリ・サービス層への SvelteKit 依存・テスト不足が課題。
コード整理と責務分離を行い、#3269 への接続コストを下げる。

---

## Findings

### テスト

- テストタイトルが日本語 → 英語で統一する（`testing.md` でルール化）
- 正常系・異常系が同一 `describe` に混在 → `valid inputs` / `invalid inputs` で分割する
- テストの並び順が実装の関数順と不一致 → 実装順に揃える

### ドキュメント

- エクスポートされた関数・型に TSDoc なし → `coding-style.md` で必須化する

### コンポーネント設計

- 複数コンポーネント間で Props 型・ヘルパー関数・テンプレートブロックが重複 → 共通セルコンポーネントに抽出する
- コンポーネント内のヘルパー関数が純粋関数 → `utils/` に移動してテスト可能にする

---

## 実装フェーズ

### Phase A: ルール更新（リスクなし）

- [ ] `testing.md`: テストタイトルは英語で書く旨を追記
- [ ] `coding-style.md`: エクスポート対象（関数・型・クラス）には TSDoc を必須とする旨を追記
- [ ] `AGENTS.md`: `@quramy/prisma-fabbrica` の用途を明確化（seed / E2E グローバルセットアップ専用。service 層ユニットテストは `vi.mock` を使う）

### Phase B: テスト修正（低リスク）

_Phase A 完了後_

- [ ] `workbook_tasks.test.ts`: テストタイトルを英語に変換
- [ ] `workbook_tasks.test.ts`: `describe('validateRequiredFields')` を `valid inputs` / `invalid inputs` に分割
- [ ] `workbooks.test.ts`: テストタイトルを英語に変換
- [ ] `workbooks.test.ts`: `describe` 順序を実装順（`getWorkBooksByType` → `buildTaskResultsByWorkBookId` → `calcWorkBookGradeModes`）に変更
- [ ] `workbooks.ts`: `canViewWorkBook` に TSDoc 追加
- [ ] `workbook_tasks.ts`: `getWorkBookTasks` / `validateRequiredFields` に TSDoc 追加

### Phase C: テーブルコンポーネントのリファクタリング（中リスク）

_Phase B と独立して実施可能。完了後に `pnpm check` で確認。_

- [ ] `utils/workbooks.ts` に `getGradeMode(id, map)` / `getTaskResult(id, map)` を追加（テスト付き）
- [ ] `types/workbook.ts` に `WorkbookTableProps` を定義（3テーブル共通 Props）
- [ ] `GradeTableBodyCell.svelte` を作成（GradeLabel ラッパー、CurriculumTable 専用）
- [ ] `WorkbookProgressCell.svelte` を作成（ThermometerProgressBar + AcceptedCounter）
- [ ] `WorkbookCompletionCell.svelte` を作成（CompletedTasks トロフィー）
- [ ] `WorkbookAuthorActionsCell.svelte` を作成（編集/削除フォーム）

**命名の判断根拠**

- `GradeTableBodyCell` — 既存の `TitleTableBodyCell` パターンに合わせる
- `WorkbookProgressCell` と `WorkbookCompletionCell` を分割した理由: ThermometerProgressBar + AcceptedCounter は「現在の進捗」、CompletedTasks トロフィーは「全タスク完了という達成」で意味が異なるため責務を分ける
- `WorkbookAuthorActionsCell` — 編集（`canEdit`）・削除（`canDelete`）はいずれも著者または管理者権限を要する操作。`ManageCell`（曖昧）・`CrudCell`（実装手段の露出）・`AdminActionsCell`（管理者専用に見える）を退けた
- [ ] 3テーブルコンポーネントを更新して上記を import
- [ ] `pnpm check && pnpm dev` で3タブの表示を確認

### Phase 4: services/workbooks.ts の統合テスト追加

_Phase C と独立して実施可能。_

- [ ] `services/workbooks.test.ts` を新規作成（`crud.test.ts` と同じモック方式: `vi.mock('$lib/server/database', ...)`）
  - `getWorkBook`: found / not found
  - `getWorkBooksWithAuthors`: with author / deleted author (`'unknown'` fallback)
  - `createWorkBook`: success, duplicate slug
  - `updateWorkBook`: success, not found id
  - `deleteWorkBook`: success, not found id

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
