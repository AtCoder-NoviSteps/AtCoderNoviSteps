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

### Phase A: ルール更新（リスクなし） ✅

- [x] `testing.md`: テストタイトルは英語で書く旨を追記
- [x] `coding-style.md`: エクスポート対象（関数・型・クラス）には TSDoc を必須とする旨を追記
- [x] `AGENTS.md`: `@quramy/prisma-fabbrica` の用途を明確化（seed / E2E グローバルセットアップ専用。service 層ユニットテストは `vi.mock` を使う）

### Phase B: テスト修正（低リスク） ✅

_Phase A 完了後_

- [x] `workbook_tasks.test.ts`: テストタイトルを英語に変換
- [x] `workbook_tasks.test.ts`: `describe('validateRequiredFields')` を `valid inputs` / `invalid inputs` に分割
- [x] `workbooks.test.ts`: テストタイトルを英語に変換
- [x] `workbooks.test.ts`: `describe` 順序を実装順（`getWorkBooksByType` → `buildTaskResultsByWorkBookId` → `calcWorkBookGradeModes`）に変更
- [x] `workbooks.ts`: `canViewWorkBook` に TSDoc 追加
- [x] `workbook_tasks.ts`: `getWorkBookTasks` / `validateRequiredFields` に TSDoc 追加

### Phase C: テーブルコンポーネントのリファクタリング（中リスク） ✅

_Phase B と独立して実施可能。完了後に `pnpm check` で確認。_

- [x] `utils/workbooks.ts` に `getGradeMode(id, map)` / `getTaskResult(id, map)` を追加（テスト付き）
- [x] `types/workbook.ts` に `WorkbookTableProps` を定義（3テーブル共通 Props）
- [x] `GradeTableBodyCell.svelte` を作成（GradeLabel ラッパー、CurriculumTable 専用）
- [x] `WorkbookProgressCell.svelte` を作成（ThermometerProgressBar + AcceptedCounter）
- [x] `WorkbookCompletionCell.svelte` を作成（CompletedTasks トロフィー）
- [x] `WorkbookAuthorActionsCell.svelte` を作成（編集/削除フォーム）
- [x] 3テーブルコンポーネントを更新して上記を import
- [x] `pnpm check` で型エラーなし（既存 2 件は login/signup の pre-existing エラーで無関係）

### Phase 4: services/workbooks.ts の統合テスト追加 ✅

_Phase C と独立して実施可能。_

- [x] `services/workbooks.test.ts` を新規作成（`crud.test.ts` と同じモック方式: `vi.mock('$lib/server/database', ...)`）
  - `getWorkBook`: found / not found
  - `getWorkBooksWithAuthors`: with author / deleted author (`'unknown'` fallback)
  - `createWorkBook`: success, duplicate slug
  - `updateWorkBook`: success, not found id
  - `deleteWorkBook`: success, not found id

### Phase 8: E2E テスト追加（純粋追加） ✅

新規ファイル `tests/workbooks_list.test.ts` を作成。`loginAsAdmin` / `loginAsUser` を `tests/helpers/auth.ts` に抽出し、`workbook_order.test.ts` も移行済み。

**アクセス制御**

- [x] 未ログインで `/workbooks` にアクセスすると `/login` にリダイレクトされる

**ログインユーザー（一般）**

- [x] カリキュラム・解法別タブが表示される
- [x] ユーザ作成タブは非管理者には表示されない
- [x] カリキュラムタブでグレードフィルター（`10Q` → `9Q`）をクリックするとリストが切り替わる
- [x] 補充問題集が存在するグレードでトグル（`aria-label="Toggle visibility of replenishment workbooks for curriculum"`）をクリックすると補充セクションが表示/非表示になる

**管理者**

- [x] 「新規作成」ボタンが表示される
- [x] ユーザ作成タブが表示される
- [x] 問題集行に「編集」リンクと「削除」ボタンが表示される
