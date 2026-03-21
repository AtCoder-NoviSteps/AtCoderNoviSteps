# Phase 11: `/refactor-plan` → `/session-close`

**リスク:** 低 | **前提:** Phase 10 まで完了・全テスト通過済み

Phase 0–10 で変更したファイル全体に対して `/refactor-plan` スキルを実行し、見落とした改善点を体系的にリストアップする。その後 `/session-close` でセッションを締める。

---

## Task 11-A: `/refactor-plan` + CodeRabbit レビュー 実施結果

### simplify スキル（Task 11-A）の結果

- [x] **Step 1: `/refactor-plan` を実行**

```
/refactor-plan
```

対象パス（Phase 0–10 で変更・新規作成したファイル）:

- `src/features/workbooks/types/workbook.ts`
- `src/features/workbooks/utils/workbook_url_params.ts`
- `src/features/workbooks/utils/workbooks.ts`
- `src/features/workbooks/services/workbooks.ts`
- `src/routes/workbooks/+page.server.ts`
- `src/features/workbooks/components/list/SolutionWorkBookList.svelte`
- `src/features/workbooks/components/list/SolutionTable.svelte`
- `src/features/workbooks/components/list/CurriculumWorkBookList.svelte`
- `src/features/workbooks/components/list/WorkbookTabItem.svelte`
- `src/features/workbooks/components/list/WorkBookList.svelte`
- `src/routes/workbooks/+page.svelte`
- `e2e/workbooks_list.spec.ts`

- [x] **Step 2: 生成された計画をユーザーにレビュー依頼**

**結果:** `buildTaskResultsByWorkBookId()` が 3 回呼ばれていた問題を発見・修正（`$derived` に統合）。
コミット: `dfb79211` `refactor(workbooks): compute taskResultsWithWorkBookId once via $derived`

---

## Task 11-B: CodeRabbit AI レビュー

- [x] **Step 1: CodeRabbit レビューを実行**

```bash
coderabbit review --plain
```

- [x] **Step 2: 指摘を severity でトリアージ**

17 件の指摘。トリアージ結果は以下の通り。

### 即時修正対象（potential_issue 5 件）

| #   | ファイル                                                                   | 内容                                                                                          | 性質                                                                                                                                                                                                                                                     |
| --- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `src/routes/workbooks/+page.svelte:28-32`                                  | `loggedInUser`・`role`・`tasksMapByIds`・`taskResultsByTaskId` が `data` の初期値しか取らない | **潜在バグ**。現状の grade/category 切替では実害は少ないが、form action 後など `data` が更新された場合に古い値が表示され続ける可能性がある。Svelte 5 Runes のベストプラクティス違反でもある（`pnpm check` も WARNING を出力済み）。`$derived` に変更する |
| 2   | `src/routes/workbooks/+page.server.ts:42`                                  | `loggedInUser?.role as Roles` が unsafe                                                       | **型安全性の問題**。認証ガード（SvelteKit hooks）が先に動くため実際は `null` にならないが、TypeScript はそれを知らない。`(!loggedInUser \|\| !isAdmin(loggedInUser.role))` に変更                                                                        |
| 3   | `src/routes/workbooks/+page.server.ts:54`                                  | `loggedInUser?.id as string` が unsafe                                                        | **型安全性の問題**（2 と同じ背景）。`loggedInUser ? ... : Promise.resolve(new Map())` に変更                                                                                                                                                             |
| 4   | `src/features/workbooks/components/list/SolutionWorkBookList.svelte:36-38` | `AVAILABLE_CATEGORIES` が `const` のため props 変化時に再計算されない                         | **リアクティビティバグ**。SvelteKit のナビゲーション時に `availableCategories` prop が変わっても画面が更新されない。`$derived` に変更                                                                                                                    |
| 5   | `src/features/workbooks/types/workbook.ts:64`                              | `SolutionTableProps` のコメントが `//`                                                        | **コーディング規約違反**。エクスポート型には TSDoc（`/** */`）が必須                                                                                                                                                                                     |

### 実施結果（#6〜17）

| #   | ファイル                             | 対応           | 備考                                                                                                            |
| --- | ------------------------------------ | -------------- | --------------------------------------------------------------------------------------------------------------- |
| 6   | `WorkBookList.svelte:43-44`          | ✅ 修正        | `as Roles` → `?? Roles.USER`（`import type` → `import` に変更）                                                |
| 7   | `workbook_url_params.ts:78-93`       | ⏭️ 差し戻し    | `Exclude<TaskGrade, PENDING>` が全呼び出し元に型エラーを連鎖。parse 関数の戻り値型から変えるべき大きな変更になる |
| 8   | `WorkBookList.svelte:61`             | ✅ 修正        | `CreatedByUserTable` を `SolutionTableProps` に変更し `gradeModesEachWorkbook={new Map()}` を削除               |
| 9   | `phase-4.md:60-62`                   | ✅ 修正        | docs コード例を最新実装（null チェック分離）に合わせた                                                          |
| 10  | `e2e/workbooks_list.spec.ts:119-124` | ✅ 修正        | `VISIBILITY_CHECK_TIMEOUT = 3000` 定数を追加し全箇所を置き換え                                                  |
| 11  | `services/workbooks.ts:129-142`      | ⏭️ 差し戻し    | フィルタ削除でテスト "excludes null solutionCategory entries" が失敗。mock は WHERE 句を無視するため防御的フィルタが必要 |
| 12  | `utils/workbooks.ts:143-151`         | ✅ 修正        | `filter` 2 回 → `reduce` 1 パスに変更                                                                          |
| 13  | `workbooks.test.ts:263-267`          | ✅ 修正        | `mockWorkbookFindMany` 削除・`mockFindMany` に統合（引数型を `object[]` に緩和）                                |
| 14  | `phase-9.md:42-44`                   | ✅ 修正        | `git add -A` → `git add -u src/features/workbooks/stores/`                                                     |
| 15  | `phase-9.md:18-22`                   | ✅ 修正        | grep に `--exclude` を追加し削除対象ファイル自身がヒットしないよう修正                                          |
| 16  | `phase-8.md:196-205`                 | ✅ 修正        | インライン `buildTaskResultsByWorkBookId(...)` → `{taskResultsWithWorkBookId}` に更新                          |
| 17  | `.gitignore:157-159`                 | ✅ 修正        | VS Code セクション（145 行目）に統合し重複行を削除                                                              |

コミット: `abecf45b` `fix(workbooks): address CodeRabbit findings from Phase 11 review`

---

## Task 11-C: `/session-close` の実行

- [ ] **Step 1: `/session-close` を実行**

```
/session-close
```

セッション締め処理（plan チェックリスト更新・rule/skill 追加提案・bloat チェック・繰り返し指示の検出）を行う。
