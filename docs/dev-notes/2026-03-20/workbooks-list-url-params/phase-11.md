# Phase 11: `/refactor-plan` → `/session-close`

**リスク:** 低 | **前提:** Phase 10 まで完了・全テスト通過済み

Phase 0–10 で変更したファイル全体に対して `/refactor-plan` スキルを実行し、見落とした改善点を体系的にリストアップする。その後 `/session-close` でセッションを締める。

---

## Task 11-A: `/refactor-plan` の実行

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

critical/high な指摘があれば即時対応する。low/info はこの場で判断し、対応するなら追加コミットする。

---

## Task 11-B: CodeRabbit AI レビュー

- [x] **Step 1: CodeRabbit レビューを実行**

```bash
coderabbit review --plain
```

- [x] **Step 2: 指摘を severity でトリアージ**

- **critical / high**: 次のフェーズ開始前に修正する
- **low / info**: 内容を確認し、セキュリティ・リグレッション関連なら即修正、それ以外は最終 PR レビュー時に対応

---

## Task 11-C: `/session-close` の実行

- [x] **Step 1: `/session-close` を実行**

```
/session-close
```

セッション締め処理（plan チェックリスト更新・rule/skill 追加提案・bloat チェック・繰り返し指示の検出）を行う。
