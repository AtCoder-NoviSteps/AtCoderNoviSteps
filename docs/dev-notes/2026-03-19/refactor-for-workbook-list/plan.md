# Refactoring Plan: 問題集一覧機能 (#3280)

## Context

Issue #3269（管理者指定の並び順で問題集を表示）をスムーズに実装するための前工程。
現状、`+page.svelte` の肥大化・`+page.server.ts` の N+1 クエリ・サービス層への SvelteKit 依存・テスト不足が課題。
コード整理と責務分離を行い、#3269 への接続コストを下げる。

---

## Findings

### コンポーネント設計

- `WorkBookList.svelte` L117–123 に `type WorkbookTableProps` のローカル定義がある。
  `types/workbook.ts` に同一型を既にエクスポートしているため重複。削除して import に置き換える。

- `WorkBookList.svelte` の `tableComponents` に Deprecated な WorkBookType（`TEXTBOOK` / `GENRE` / `THEME` / `OTHERS`）が残っている。
  削除時は `satisfies Record<...>` → `satisfies Partial<Record<...>>` への変更と、参照箇所の `{#if TableComponent}` ガードが必要。

### ユーティリティ

- `workbooks.ts` のメソッド順序が広い→狭い（影響範囲の大→小）になっていない。
  `getGradeMode` / `getTaskResult` はヘルパー（単一要素のMap lookup）なのに先頭に置かれている。
  推奨順: `canViewWorkBook` → `getUrlSlugFrom` → `getWorkBooksByType` → `buildTaskResultsByWorkBookId` → `calcWorkBookGradeModes` → `getGradeMode` → `getTaskResult`

- `workbooks.test.ts` が `testing.md` の Mock Helpers ルール未適用。
  `vi.mocked(prisma.workBook.xxx).mockResolvedValue(asPrismaWorkBook(...))` を直接書いており、`crud.test.ts` の `mockFindMany()` パターンに揃えるべき。

### サーバー

- `+page.server.ts` の `load` 関数内で3クエリ（`getWorkBooksWithAuthors` / `getTasksByTaskId` / `getTaskResultsOnlyResultExists`）を逐次実行しているが、互いに独立なので `Promise.all` で並列化できる。

---

## 残作業

### workbooks ユーティリティ整理（低リスク）

- [ ] `workbooks.ts`: メソッドを広い→狭い順に並び替え
- [ ] `workbooks.test.ts`: 実装の並び順に合わせて describe 順を変更 + vi.mocked ヘルパー関数を追加

### WorkBookList コンポーネント整理（低リスク）

- [ ] `WorkBookList.svelte`: ローカルの `type WorkbookTableProps` を削除し、`types/workbook.ts` から import
- [ ] `WorkBookList.svelte`: `tableComponents` から Deprecated エントリ（TEXTBOOK / GENRE / THEME / OTHERS）を削除
  - `satisfies Record<WorkBookType, ...>` → `satisfies Partial<Record<WorkBookType, ...>>` に変更
  - 参照箇所に `{#if TableComponent}` ガードを追加

### +page.server.ts 改善（低リスク）

- [ ] `load` 内の3クエリを `Promise.all` で並列化

### WorkBookList CURRICULUM分岐の切り出し（中リスク）

`WorkBookList.svelte` に CURRICULUM 専用ロジックが混在している。
次PRで Solution にも同様の ButtonGroup を追加するため、今回のPRで切り出しておかないと次PRが「機能追加＋リファクタリング」になる。

- [ ] `CurriculumWorkBookList.svelte` を新規作成
  - 切り出し範囲: `selectedGrade` 状態 + `filterByGradeMode` + `AVAILABLE_GRADES` + 関連 `$effect` + `mainWorkbooks` / `replenishedWorkbooks` の `$derived` + ButtonGroup + 補充セクション全体
  - `WorkBookList.svelte` は薄いディスパッチャとして残す（`workbookType` に応じたコンポーネント切り替えのみ）
  - 完了後 `pnpm check` で確認

---

## やらないと決めたこと

| 案 | 判断 | 理由 |
|---|---|---|
| `TableHeadCell` のコンポーネント化（「回答状況」「修了」列） | ❌ 不要 | 静的テキストのみで props なし。コンポーネントにしても可読性は上がらずファイルだけ増える |
| `list/` のサブディレクトリ化（curriculum / solution / created_by_user / shared） | ❌ 不要（YAGNI） | 現状 12 ファイルで許容範囲。インポートパスが深くなるデメリットの方が大きい。20 ファイル超えたら再検討 |
| `CreatedByUserTable` の `authorName` セルをコンポーネント化 | ❌ 不要 | 1 箇所のみ使用。他テーブルへの転用予定なし |
| `list/` コンポーネントへの Vitest 単体テスト追加 | ❌ 現時点では不要 | E2E（`tests/workbooks_list.test.ts`）でアクセス制御・グレードフィルター・補充トグルをカバー済み。コンポーネントはほぼテンプレートのみでロジックが薄く、`@testing-library/svelte` の設定コストに見合わない。コンポーネントにビジネスロジックが入ったら再検討 |
