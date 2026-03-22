# Phase 8: `valid-prop-names-in-kit-pages` 調査・修正

## 概要

`svelte/valid-prop-names-in-kit-pages` 警告に対応する。
SvelteKit の `+page.svelte` コンポーネントでは、SvelteKit が渡すプロップは `data` と `form` のみ。
他のプロップ（`formAction`, `status` 等）は非標準であり、警告が発生する。

対象: 2ファイル

## タスク

### Task 8-1: account_transfer/+page.svelte の `formAction` 調査

**対象ファイル:** `src/routes/(admin)/account_transfer/+page.svelte`
**対象行:** 30行目

- [ ] ファイルを読み込み、`formAction` prop の定義と使用箇所を確認
- [ ] `formAction` が外部から実際にバインドされているか確認（parent layout や他ファイルからのバインド有無）
- [ ] 判断:
  - 外部からバインドされていない → `let formAction = $state('account_transfer')` に変換して `$props()` から削除
  - 外部からバインドされている → そのままにして `// eslint-disable-next-line svelte/valid-prop-names-in-kit-pages` で抑制し、コメントで理由を記載

### Task 8-2: users/edit/+page.svelte の `status` 調査

**対象ファイル:** `src/routes/users/edit/+page.svelte`
**対象行:** 28行目

- [ ] ファイルを読み込み、`status = $bindable('nothing')` の定義と使用箇所を確認
- [ ] `status` が外部からバインドされているか確認（parent layout や他ファイルからのバインド有無）
- [ ] 判断:
  - 外部からバインドされていない → `let status = $state('nothing')` に変換して `$props()` から削除
  - 外部からバインドされている → `// eslint-disable-next-line svelte/valid-prop-names-in-kit-pages` で抑制し、コメントで理由を記載

### Task 8-3: 動作確認

- [ ] `pnpm lint` で `svelte/valid-prop-names-in-kit-pages` の warning が解消したことを確認
- [ ] `pnpm check` で型エラーがないことを確認
- [ ] `pnpm test:unit` で既存テストが全パスすることを確認

## 完了条件

`valid-prop-names-in-kit-pages` の warning が解消（または適切なコメントで抑制）されており、既存テストが全パスすること。
