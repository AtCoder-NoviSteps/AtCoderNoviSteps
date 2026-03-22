# Phase 3: 内部 href への `resolve()` 適用

## 概要

内部ルート（SvelteKitのページ）へのリンクに `resolve()` をラップする。
各ファイルに `import { resolve } from '$app/paths'` を追加し、内部パス文字列を `resolve(...)` でラップする。

**変換パターン:**
- `href="/foo"` → `href={resolve('/foo')}`
- `href="/foo/{var}"` → `href={resolve(`/foo/${var}`)}`
- `href={CONST_PATH}` → `href={resolve(CONST_PATH)}`

対象: 9ファイル、12箇所

## タスク

### Task 3-1: workbook 関連コンポーネント（3ファイル）

**対象ファイル:**
- `src/features/workbooks/components/list/TitleTableBodyCell.svelte` (23行目)
- `src/features/workbooks/components/list/WorkbookAuthorActionsCell.svelte` (25行目)
- `src/features/workbooks/components/shared/WorkbookLink.svelte` (11行目)

- [ ] 各ファイルを読み込み、href の内容を確認
- [ ] 各ファイルに `import { resolve } from '$app/paths'` を追加
- [ ] `/workbooks/{...}` パターンの href を `resolve()` でラップ

### Task 3-2: AuthForm.svelte（href のみ）

**対象ファイル:** `src/lib/components/AuthForm.svelte`
**対象行:** 205行目、220行目（`goto()` は Phase 4 で対処）

- [ ] ファイルを読み込み、205・220行目の `href` 値（定数 `FORGOT_PASSWORD_PAGE` 等）を確認
- [ ] `import { resolve } from '$app/paths'` を追加（Phase 4 の `goto()` 修正とまとめて追加可）
- [ ] `href={CONST}` → `href={resolve(CONST)}` に変更

### Task 3-3: TagForm.svelte（内部リンク3箇所）

**対象ファイル:** `src/lib/components/TagForm.svelte`
**対象行:** 33行目、100行目、108行目（90行目は Phase 2 で対処済み）

- [ ] ファイルを読み込み、各行の内部パスを確認
- [ ] `import { resolve } from '$app/paths'` を追加（Phase 2 で既に修正した場合はまとめて追加）
- [ ] 各内部 `href` を `resolve()` でラップ

### Task 3-4: TagListForEdit.svelte

**対象ファイル:** `src/lib/components/TagListForEdit.svelte`
**対象行:** 60行目

- [ ] ファイルを読み込み、60行目の href を確認
- [ ] `import { resolve } from '$app/paths'` を追加
- [ ] `href="/tags/{...}"` → `href={resolve(`/tags/${...}`)}` に変更

### Task 3-5: TaskList.svelte / TaskListSorted.svelte

**対象ファイル:**
- `src/lib/components/TaskList.svelte` (131行目)
- `src/lib/components/TaskListSorted.svelte` (46行目)

- [ ] 各ファイルを読み込み、href の内容を確認
- [ ] 各ファイルに `import { resolve } from '$app/paths'` を追加
- [ ] `/tasks/{...}` / `/problems/{...}` パターンの href を `resolve()` でラップ

### Task 3-6: users/[username]/+page.svelte

**対象ファイル:** `src/routes/users/[username]/+page.svelte`
**対象行:** 21行目

- [ ] ファイルを読み込み、21行目の href を確認
- [ ] `import { resolve } from '$app/paths'` を追加
- [ ] `href="/problems"` → `href={resolve('/problems')}` に変更

### Task 3-7: 動作確認

- [ ] `pnpm lint` で Task 3-1〜3-6 の12件のエラーが解消したことを確認

## 完了条件

内部 href に関する `svelte/no-navigation-without-resolve` エラーが全件解消していること。
