# グレードテーブル分割の部分 revert

## 概要

コミット 24d470a0 で導入した Pending / グレード済みのテーブル分割を元に戻し、単一テーブルに統合する。検索するまで問題を非表示にし、1ページ50件表示とする。ページネーションと `TaskGradeTable` コンポーネントは維持。

## 設計根拠

- テーブル分割は管理画面での使い勝手を下げていた
- 検索ファーストの UI に戻すことで、大量データでも快適に操作可能
- 1ページ50件表示で一覧性を確保しつつ、ページネーションで大量データにも対応

## 却下した代替案

- **完全 revert**: ページネーションや `TaskGradeTable` コンポーネントまで戻すのは不要な作業
- **コンポーネント削除して `+page.svelte` に直書き**: コンポーネント分離は保守性の面で有用

## 変更サマリ

| 観点                 | 変更前（分割）                                     | 変更後（統合）     |
| -------------------- | -------------------------------------------------- | ------------------ |
| テーブル数           | 2つ（Pending + グレードあり）                      | 1つ（「一覧」）    |
| 検索前の表示         | Pending は全件表示 / グレードあり はプレースホルダ | プレースホルダ     |
| 検索結果上限         | 無制限                                             | 無制限（変更なし） |
| ページネーション     | 20件/ページ                                        | 50件/ページ        |
| `requireSearch` prop | あり                                               | 削除               |

---

## Phase 1: テスト更新（TDD）

**ファイル:** `src/routes/(admin)/tasks/grade/_utils/grade_table_filter.test.ts`

1. `filterGradeTableTasks()` の全呼び出しから `requireSearch` 引数を削除
2. `'empty query'` describe ブロック:
   - `'returns an empty array when search is required'` → `'returns an empty array'` にリネーム、`filterGradeTableTasks(tasks, '')` に変更
   - `'treats a whitespace-only query as empty'` → `filterGradeTableTasks(tasks, '   ')` に変更
   - `'returns all tasks unchanged when search is not required'` → 削除
3. `'non-empty query'` describe ブロック:
   - 各テストから第3引数 `false` / `true` を削除
   - `'returns every match without a result limit'`（25件テスト）→ 変更なし（検索結果上限は引き続き無制限）

## Phase 2: フィルタユーティリティ更新

**ファイル:** `src/routes/(admin)/tasks/grade/_utils/grade_table_filter.ts`

1. `requireSearch` 引数を削除。新シグネチャ: `filterGradeTableTasks(tasks, query)`
2. 空クエリ時は常に `[]` を返す
3. `filterTasksBySearch(tasks, query, Infinity)` は変更なし（検索結果上限なし）
4. JSDoc を新仕様に合わせて更新

## Phase 3: コンポーネント更新

**ファイル:** `src/routes/(admin)/tasks/grade/_components/TaskGradeTable.svelte`

1. `Props` インターフェースから `requireSearch` を削除
2. `filterGradeTableTasks` 呼び出しから第3引数を削除
3. テンプレートの条件分岐を簡略化:
   - `{#if isSearchEmpty}` → プレースホルダ表示
   - `{:else if filteredTasks.length === 0}` → 「該当なし」表示
   - `{:else}` → テーブル行を描画（既存のまま）
4. `isSearchEmpty` derived は維持（テンプレートで使用）
5. `PAGE_SIZE` を `20` → `50` に変更

## Phase 4: ページ更新

**ファイル:** `src/routes/(admin)/tasks/grade/+page.svelte`

1. `TaskGrade` import を削除
2. `pendingTasks` / `gradedTasks` derived を削除
3. 2つの `<section>` を1つの `<TaskGradeTable title="一覧" tasks={data.tasks} />` に置換
4. `HeadingOne title="グレード管理"` は変更なし

## 検証

1. `pnpm test:unit` で `grade_table_filter.test.ts` が全件パス
2. `pnpm check` で型エラーなし
3. `pnpm dev` で `/tasks/grade` を開き、以下を確認:
   - 初期表示: プレースホルダメッセージのみ
   - 検索: 結果が表示される（上限なし）
   - ページネーション: 50件/ページでページ送り可能
   - グレード変更: select から変更可能
