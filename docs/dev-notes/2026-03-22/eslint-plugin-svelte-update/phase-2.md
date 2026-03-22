# Phase 2: 外部リンクへの `rel="external"` 追加

## 概要

`svelte/no-navigation-without-resolve` ルールは、`href` の値が外部URLであることをランタイムにしか確定できない場合も lint 時に flagging する。
`rel` 属性に `"external"` を含めることで、このリンクが外部リンクであることをリンターに明示し、エラーを解消する。

対象: 3ファイル、3箇所

## タスク

### Task 2-1: ExternalLinkWrapper.svelte

**対象ファイル:** `src/lib/components/ExternalLinkWrapper.svelte`
**対象行:** 28行目

- [ ] ファイルを読み込んで現在の `rel` 属性を確認
- [ ] `rel="noreferrer"` → `rel="noreferrer external"` に変更
      （`noreferrer` はセキュリティのため維持。`external` を追加してリンターに外部リンクであることを示す）

### Task 2-2: TagForm.svelte（AtCoder外部リンク）

**対象ファイル:** `src/lib/components/TagForm.svelte`
**対象行:** 90行目

- [ ] ファイルを読み込み、90行目の外部リンク（AtCoder URL）を確認
- [ ] `rel` 属性に `external` を追加（既存の `rel` 属性がある場合はスペース区切りで追記、ない場合は新規追加）

### Task 2-3: problems/[slug]/+page.svelte（AtCoder外部リンク）

**対象ファイル:** `src/routes/problems/[slug]/+page.svelte`
**対象行:** 34行目

- [ ] ファイルを読み込み、34行目の外部リンク（`getTaskUrl()` で生成されるAtCoder URL）を確認
- [ ] `rel` 属性に `external` を追加

### Task 2-4: 動作確認

- [ ] `pnpm lint` で Task 2-1〜2-3 の3件のエラーが解消したことを確認

## 完了条件

上記3ファイルの `svelte/no-navigation-without-resolve` エラーが解消していること。
