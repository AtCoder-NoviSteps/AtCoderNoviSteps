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

| # | ファイル | 内容 | 性質 |
|---|---------|------|------|
| 1 | `src/routes/workbooks/+page.svelte:28-32` | `loggedInUser`・`role`・`tasksMapByIds`・`taskResultsByTaskId` が `data` の初期値しか取らない | **潜在バグ**。現状の grade/category 切替では実害は少ないが、form action 後など `data` が更新された場合に古い値が表示され続ける可能性がある。Svelte 5 Runes のベストプラクティス違反でもある（`pnpm check` も WARNING を出力済み）。`$derived` に変更する |
| 2 | `src/routes/workbooks/+page.server.ts:42` | `loggedInUser?.role as Roles` が unsafe | **型安全性の問題**。認証ガード（SvelteKit hooks）が先に動くため実際は `null` にならないが、TypeScript はそれを知らない。`(!loggedInUser \|\| !isAdmin(loggedInUser.role))` に変更 |
| 3 | `src/routes/workbooks/+page.server.ts:54` | `loggedInUser?.id as string` が unsafe | **型安全性の問題**（2 と同じ背景）。`loggedInUser ? ... : Promise.resolve(new Map())` に変更 |
| 4 | `src/features/workbooks/components/list/SolutionWorkBookList.svelte:36-38` | `AVAILABLE_CATEGORIES` が `const` のため props 変化時に再計算されない | **リアクティビティバグ**。SvelteKit のナビゲーション時に `availableCategories` prop が変わっても画面が更新されない。`$derived` に変更 |
| 5 | `src/features/workbooks/types/workbook.ts:64` | `SolutionTableProps` のコメントが `//` | **コーディング規約違反**。エクスポート型には TSDoc（`/** */`）が必須 |

### スキップ（defer）

| # | ファイル | 内容 | 理由 |
|---|---------|------|------|
| 6 | `WorkBookList.svelte:43-44` | `as Roles` キャスト | 親 `{#if loggedInUser}` で保護済み |
| 7 | `workbook_url_params.ts:78-93` | PENDING が `buildWorkbooksUrl` に渡せる | 呼び出し元はパース済み値のみ渡す設計。YAGNI |
| 8 | `WorkBookList.svelte:61` | `gradeModesEachWorkbook={new Map()}` — `CreatedByUserTable` がこの prop を使わないなら props 定義から削除を検討 | 既存仕様の範囲外・影響なし |
| 9 | `phase-4.md:60-62` | ドキュメントのコード例にも `loggedInUser?.role as Roles` の unsafe cast が残っている | docs のみ、実装には影響なし |
| 10 | `e2e/workbooks_list.spec.ts:119-124` | `isVisible({ timeout: 3000 })` がハードコード → `VISIBILITY_CHECK_TIMEOUT` 等の定数化を検討 | 意図的に短いタイムアウトのため許容 |
| 11 | `services/workbooks.ts:129-142` | `getAvailableSolutionCategories` の `.filter(c => c !== null)` が冗長（Prisma クエリで `{ not: null }` 済み） | TypeScript 型ガードとして機能しており防御的コーディングとして許容 |
| 12 | `utils/workbooks.ts:143-151` | `partitionWorkbooksAsMainAndReplenished` が `filter` を 2 回実行（O(2N)）→ `reduce` で 1 パスに | 問題集リストは小規模。マイクロ最適化 |
| 13 | `workbooks.test.ts:263-267` | `mockWorkbookFindMany` が既存の `mockFindMany` とほぼ同一で重複 | テストコードのみ |
| 14 | `phase-9.md:42-44` | `git add -A` は無関係なファイルも含む可能性 → `git add -u src/features/workbooks/stores/` 推奨 | 過去の手順ドキュメントのみ |
| 15 | `phase-9.md:18-22` | 削除前の grep が削除対象ファイル自身にヒットするため「結果ゼロ」の確認にならない | 過去の手順ドキュメントのみ |
| 16 | `phase-8.md:196-205` | ドキュメントの WorkBookList 例がインライン呼び出しのまま（実装は `$derived` で事前計算済みに変更されている） | 過去の手順ドキュメントのみ |
| 17 | `.gitignore:157-159` | VS Code 関連の除外パターンが 145 行目と 157 行目に分散 → 145 行目のセクションに統合推奨 | 機能への影響なし |

- **critical / high**: 次のフェーズ開始前に修正する
- **low / info**: 内容を確認し、セキュリティ・リグレッション関連なら即修正、それ以外は最終 PR レビュー時に対応

---

## Task 11-C: `/session-close` の実行

- [ ] **Step 1: `/session-close` を実行**

```
/session-close
```

セッション締め処理（plan チェックリスト更新・rule/skill 追加提案・bloat チェック・繰り返し指示の検出）を行う。
