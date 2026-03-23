# eslint-plugin-svelte v3.10.1 → v3.16.0 アップデート対応

## 概要

PR #3297（定期依存アップデート）で eslint-plugin-svelte を v3.10.1 から v3.16.0 へ更新したことにより、CI の lint チェックが失敗している。本計画では新規追加・severity 変更されたルールへの対応を行い、CI を通過させる。

エラー（CI blocking）を優先して修正し、可能な限り warning も解消する。

## 変更内容と背景

v3.10.1 → v3.16.0 で追加・変更されたルール:

| ルール                                 | 旧        | 新    | 内容                                          |
| -------------------------------------- | --------- | ----- | --------------------------------------------- |
| `svelte/no-navigation-without-resolve` | なし      | error | 内部ナビゲーションに `resolve()` の使用を強制 |
| `svelte/prefer-svelte-reactivity`      | なし      | error | `Map`/`Set` 等の代わりに `SvelteMap` 等を要求 |
| `svelte/require-each-key`              | なし/warn | warn  | `{#each}` にキーを要求                        |
| `svelte/prefer-writable-derived`       | なし      | warn  | `$state` + `$effect` → `$derived` を推奨      |

**`resolve()` の実体:** `import { resolve } from '$app/paths'`
SvelteKit 2.55.0 で実装済み。`resolveRoute` は deprecated となり `resolve` に統一された。
ベースパスをパスに付与する純粋な関数。除外条件: 絶対URL、`rel="external"` 属性、空文字列、hash fragment。

**導入背景:** SvelteKit はルートパス以外（例: `example.com/my-app/`）へのデプロイをサポートするが、`<a href="/foo">` や `goto('/foo')` のようにパスをハードコードすると base path が加味されずナビゲーションが壊れる。`resolve()` は base path を実行時に付与する純粋関数としてこれを解決する。JS のモジュール解決（webpack alias 等）と概念は近いが、モジュール解決がビルド時に静的確定するのに対し、`resolve()` は base path がデプロイ設定に依存して実行時まで確定しないため、明示的な関数呼び出しとして設計されている。`eslint-plugin-svelte` v3.12.0 でルール化された。

**メリット:** base path が変わってもコードの修正不要 / `resolve('/blog/[slug]', { slug })` 形式でルートパラメータをコンパイル時に型検査できる / 全内部ナビゲーションが一貫した経路を通るため挙動が予測しやすい。

**デメリット:** 全コンポーネントに import が必要でボイラープレートが増加 / base path を使わないプロジェクトでは恩恵が見えにくく冗長に感じる / 既存コードへの適用コストが高い（本件がまさにそれ）。

> 出典: [$app/paths — SvelteKit 公式ドキュメント](https://svelte.dev/docs/kit/$app-paths) / [no-navigation-without-resolve — eslint-plugin-svelte](https://github.com/sveltejs/eslint-plugin-svelte/blob/main/docs/rules/no-navigation-without-resolve.md)

**`SvelteMap` の実体:** `import { SvelteMap } from 'svelte/reactivity'` — Svelte 5 でリアクティブな `Map` として提供。`.set()` / `.clear()` 等の変更を `$derived` / `$effect` に伝播する。`$state` ラッパーは不要。

**導入背景:** Svelte 5 のリアクティビティはプロキシベースだが、`Map` 等のネイティブ組み込み型はエンジン内部実装のためプロキシでトラップできない（`$state(new Map())` では `.set()` が伝播しない）。`SvelteMap` はメソッドをオーバーライドしてシグナルと連携することで解決。本プロジェクトは v4 から v5 へ移行した経緯があり、`writable + subscribe` を機械的に置き換えた `$state + $effect` が残存していた。今回のルール追加はその技術的負債を検出したもの。

## 設計方針

- **機械的置き換えを基本とする**: ルールの意図に従い、最小限の変更で修正する
- **外部リンクは `rel="external"` で明示**: `resolve()` で外部URLをラップしない。`rel` 属性に `external` を追加することで rule を満足させる
- **`resolve()` は内部パスのみに適用**: 動的URLの場合は変数の内容（相対パスか絶対URLか）を確認してから適用
- **警告は全件修正を目指す**: `valid-prop-names-in-kit-pages` のみコード調査が必要なため最後に対処

## 却下した代替案

| 案                                                   | 却下理由                                                                       |
| ---------------------------------------------------- | ------------------------------------------------------------------------------ |
| `no-navigation-without-resolve` をルール設定で無効化 | ルールの意図（base path 対応）は正当であり、将来のデプロイ設定変更に備えるべき |
| `// eslint-disable-next-line` で個別無効化           | 件数が多く、保守性が下がる。真に必要な箇所（外部リンク等）に限定すべき         |
| `SvelteMap` を `Map` の型エイリアスで代替            | ルールは型ではなくコンストラクタ呼び出しを検出するため回避不可                 |
| PR を revert して別途対応                            | アップデート内容自体は問題なく、lint 修正のみで対応可能                        |

全 8 フェーズ完了。`pnpm lint` 0 errors・0 warnings、`pnpm check` 既存の 2 件のみ、`pnpm test:unit` 45 ファイル 1954 件全パス。

## CodeRabbit Findings

PR #3298 のレビューより。critical / high / potential_issue (medium) を記載。修正要否はユーザーが判断する。

---

### 🔴 Critical

**[1] `TaskTable.svelte:66` — `$derived(() => ...)` wraps a function, not a value**

> `$derived(() => prepareContestTablesMap(providers))` creates a derived that holds an arrow function as its value rather than calling it. This means `contestTableMaps` is always a function reference (never a `Map`), and mutations to it are not preserved across renders. Replace with `$derived.by(() => prepareContestTablesMap(providers))` and remove the call-site `()`.

判断: **修正すべき**。`$derived(() => fn)` は fn を値として保持するだけで `providers` 変化を追跡しない実バグ。

---

**[2] `account_transfer/+page.svelte:31` — Named action missing `?/` prefix**

> `let formAction = $state('account_transfer')` passes the value directly to `action={formAction}`. SvelteKit named actions require the `?/` prefix (e.g. `'?/account_transfer'`). Without it the form submission targets a URL named `account_transfer` rather than invoking the named action.

判断: **修正すべき**。明確なバグ。現状フォームが正しく動作していない可能性が高い。

---

**[3] `workbooks/+page.svelte:53` — Query-string path passed to `resolve()`**

> `goto(resolve(saved), { replaceState: true })` passes a value like `'/workbooks?tab=curriculum&grades=5'` to `resolve()`. The `resolve()` function accepts route patterns (e.g. `'/workbooks'`), not URLs containing query strings. This causes a TypeScript error and is semantically incorrect. Suggested fix: `goto(buildWorkbooksUrl(...), { replaceState: true })`.

判断: **修正すべき**（ただし修正方針は要検討）。`resolve()` に query string を渡すのは型・意味ともに誤り。完全除去は base path 対応を壊すリスクあり。正確には path と search を分離して `resolve(savedPath) + savedSearch` にする対応が望ましい。現状 base path 設定なしのため動作上は問題ない。

---

### 🟠 Major

**[4] `UpdatingDropdown.svelte:214-216` — Internal href attributes not wrapped with `resolve()`**

> `<DropdownItem href={SIGNUP_PAGE}>` and `<DropdownItem href={LOGIN_PAGE}>` use raw string constants (`'/signup'`, `'/login'`) without `resolve()`. These will break if a base path is configured. Pre-compute `signupHref` and `loginHref` using `resolve()` in the `<script>` block.

判断: **修正すべき**（`no-navigation-without-resolve` ルール準拠）。現状 no-op だが一貫性のため適用する。

---

**[5] `KanbanBoard.svelte:64` — `resolve()` applied to a `$page.url`-derived URL**

> `replaceState(resolve(updatedUrl.pathname + updatedUrl.search), {})` calls `resolve()` on a URL derived from `$page.url`. Since `$page.url` already reflects the actual browser URL (base path included), applying `resolve()` here would double-apply the base path when one is configured. Remove `resolve()` and pass `updatedUrl` directly.

判断: **修正すべき**。`$page.url` 由来の URL に `resolve()` を適用すると base path 設定時に二重適用になるバグ。除去が正しい。

---

**[6] `AuthForm.svelte:45-50` — `alternativePageLink` typed too broadly as `string`**

> `alternativePageLink` is typed as `string` and suppressed with `@ts-expect-error`. Narrow it to `'/login' | '/signup'` to eliminate the suppression and enable exhaustive checks.

判断: **修正すべき**。型安全性の向上、`@ts-expect-error` 除去。

---

**[7] `TaskGradeList.svelte:19-31` — `run()` from `svelte/legacy` still in use**

> The `run()` block is a compatibility shim from Svelte 4→5 migration and is deprecated. Extract the grouping logic into a `groupTaskResultsByGrade()` utility and replace with `$derived`.

判断: **修正候補**。deprecated API の除去。影響範囲が小さければ対応推奨。

---

### 🔵 Trivial / 情報

**[8] `TagForm.svelte:33` — `@ts-expect-error` on `resolve('/(admin)/tags')`**

> Suppress the TS error by changing to `resolve('/tags')`.

判断: **採用しない**。`/(admin)/tags` は正しいルートID（admin グループ含む）。`'/tags'` は別ルートになる。`@ts-expect-error` の原因は typed routes の構造的問題（`TS2554: AppTypes declaration merging`）であり、他ファイルと同様のコメントで統一されている。

---

**[9] `users/[username]/+page.svelte:16-17` — Unnecessary `resolve()` on static path**

> `resolve(PROBLEMS_PAGE)` uses `resolve()` on a static path constant. Suggested fix: use `PROBLEMS_PAGE` directly.

判断: **採用しない**。`<a href>` に使う静的パスへの `resolve()` 適用は base path 設定時に必要。除去すると将来 base path を設定した際にナビゲーションが壊れる。`@ts-expect-error` も他ファイルと同じ構造的原因で正当。

## 残課題

**`users/edit/+page.svelte` — AtCoder 認証機能の再公開**

コメントアウト済みの AtCoder ID 認証・バリデーションフォームは未公開状態のまま保持。`status` プロップは `valid-prop-names-in-kit-pages` 制約のため削除済みのため、再公開時は Props 設計（`data` prop への一本化等）を合わせて再検討すること。
