# Phase 9: 不要ストア削除

**リスク:** 低

`task_grades_by_workbook_type.ts` は URLパラメータに置き換えられた。`active_workbook_tab.ts` は `+page.svelte` のローカル `$state` に置き換えられた。参照ゼロを確認してから削除する。

---

**Files:**

- Delete: `src/features/workbooks/stores/task_grades_by_workbook_type.ts`
- Delete: `src/features/workbooks/stores/task_grades_by_workbook_type.test.ts`
- Delete: `src/features/workbooks/stores/active_workbook_tab.ts`
- Delete: `src/features/workbooks/stores/active_workbook_tab.test.ts`

- [ ] **Step 1: 参照ゼロを確認**

```bash
grep -r "task_grades_by_workbook_type\|active_workbook_tab" \
  src/ --include="*.ts" --include="*.svelte"
# 結果ゼロを確認してから次へ進む
```

- [ ] **Step 2: ファイル削除**

```bash
rm src/features/workbooks/stores/task_grades_by_workbook_type.ts
rm src/features/workbooks/stores/task_grades_by_workbook_type.test.ts
rm src/features/workbooks/stores/active_workbook_tab.ts
rm src/features/workbooks/stores/active_workbook_tab.test.ts
```

- [ ] **Step 3: 型チェック・ユニットテスト**

```bash
pnpm check
pnpm test:unit
```

- [ ] **Step 4: コミット**

```bash
git add -A
git commit -m "chore(workbooks): Remove stores replaced by URL params and local state"
```
