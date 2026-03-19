# Refactoring Plan: 問題集一覧機能 (#3280)

## Context

Issue #3269（管理者指定の並び順で問題集を表示）をスムーズに実装するための前工程。
現状、`+page.svelte` の肥大化・`+page.server.ts` の N+1 クエリ・サービス層への SvelteKit 依存・テスト不足が課題。
コード整理と責務分離を行い、#3269 への接続コストを下げる。

---

## 残作業

### ユーティリティ整理（低リスク）

- [ ] `countReadableWorkbooks` を `workbooks.ts` に移動し単体テストを追加
  - `WorkBookList.svelte` / `CurriculumWorkBookList.svelte` の重複解消
  - 両コンポーネントの `wbs` 省略形を `workbooks` に修正（coding-style 違反）
- [ ] `CurriculumWorkBookList.svelte` の `getGradeMode` ローカルラッパーを削除し、`workbooks.ts` の `getGradeMode(id, map)` を直接使用

### コンポーネント整理（低リスク）

- [ ] empty state markup を `EmptyWorkbookList.svelte` として抽出（`WorkBookList.svelte` / `CurriculumWorkBookList.svelte` の重複解消）

### テスト整理（低リスク）

- [ ] `services/workbooks.test.ts`: インライン `vi.mocked` を `mockCreate` / `mockTransaction` / `mockDelete` ヘルパーとして抽出

### rules 更新（低リスク）

- [ ] `testing.md`: コンポーネントの Vitest 単体テスト省略条件を追記（テンプレートのみ・E2E カバー済みの場合）
- [ ] `svelte-components.md`: `list/` サブディレクトリ化の閾値（20 ファイル超）を追記

---

## やらないと決めたこと

| 案                                                                                               | 判断              | 理由                                                                                          |
| ------------------------------------------------------------------------------------------------ | ----------------- | --------------------------------------------------------------------------------------------- |
| `TableHeadCell` のコンポーネント化（「回答状況」「修了」列）                                     | ❌ 不要           | 静的テキストのみで props なし。コンポーネントにしても可読性は上がらずファイルだけ増える       |
| `CreatedByUserTable` の `authorName` セルをコンポーネント化                                      | ❌ 不要           | 1 箇所のみ使用。他テーブルへの転用予定なし                                                    |
| `CurriculumWorkBookList.svelte` の if ネスト削減（`ReplenishedWorkbookSection.svelte` 切り出し） | ❌ 不要（YAGNI）  | 3 段→2 段にするだけのためにファイルを追加するコストに見合わない                               |
| `list/` のサブディレクトリ化                                                                     | ❌ 不要（YAGNI）  | 現状 12 ファイルで許容範囲。20 ファイル超えたら再検討（閾値は `svelte-components.md` に記録） |
| `list/` コンポーネントへの Vitest 単体テスト追加                                                 | ❌ 現時点では不要 | E2E でカバー済み。テンプレートのみでロジックが薄い場合は省略（条件は `testing.md` に記録）    |
