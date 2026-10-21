# SvelteKit 3 / adapter-vercel 7 移行計画

## 概要

SvelteKit 2.70.3 → 3.1.0、adapter-vercel 6.3.4 → 7.0.1 に移行する。Kit 3 対応に必要な Superforms 2.31.0 → 3.0.0 の更新と、alias（`$lib`・`$features`・`@`）から `package.json#imports`（`#lib`・`#features`）への置換も含める。
外部の依存ブロッカーはなく、移行は可能と判断した。根拠・影響範囲・検証結果は [survey.md](./survey.md) にまとめた。
2026-10-21 時点で、#4115・PR A（#4190）・PR A2（#4191）はマージ済み。PR B は branch `#4192` で実装・手元の確認・preview での手動確認まで終わり、push と production の確認が残る。要点は [summary.md](./summary.md) にまとめた。計画を立てた時の基準は 2026-10-18 JST の `origin/staging`（`f02b7238`）。

## PR の構成と順序

| 順  | PR    | 内容                                                                    | 土台       | マージの条件                                                                               |
| --- | ----- | ----------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------ |
| 1   | #4115 | Superforms 2.31.0 → 3.0.0（依存と lockfile のみ）                       | Kit 2.70.3 | 2026-10-18 にマージ済み（`dc9f2471`）。マージ前に5画面と既存 E2E を確認した（Phase 0）。   |
| 2   | PR A  | `$lib` → `#lib`（282ファイル・676 specifier の機械置換）                | Kit 2.70.3 | #4115 の確認後。共同開発者の新機能追加より前、遅くとも1か月以内（Phase A）。               |
| 3   | PR A2 | `$features`・`@` → `#features`（144ファイル・286 specifier の機械置換） | Kit 2.70.3 | PR A のマージ後、PR B より前（Phase A2）。                                                 |
| 4   | PR B  | Kit 3.1.0・adapter-vercel 7.0.1 と、設定・型・state・フォームの移行     | Kit 3.1.0  | Phase 1 の spike と Phase 3 の E2E が通ってから preview・production へ進む（Phase 1〜4）。 |

1本ずつマージするのは、不具合が出た時に原因の PR を切り分けるため。CI は E2E を実行しないので、各段階の実ブラウザー確認と E2E は手元で行う。

## 実装フェーズ

### Phase 0: #4115（Superforms 3.0.0）

- [x] PR 本文の rebase のチェックボックスで Renovate に rebase させ、今の staging の上で CI を再実行する（workflow の re-run は当時の合成コミットを使うので、rebase の代わりにならない）。2026-10-18 に rebase し、head `5833c1d0` は staging `f02b7238` の直上。CI は build (24)・preview 成功、production は skipped。
- [x] lockfile の差分が Superforms 本体と optional validator に限られることを確認する。pnpm 12.14.0 の再解決で書き換えは出ず、supply-chain policy の検査も通った（survey の「Superforms 3.0.0（#4115）」）。
- [x] マージ前に、v3 で内部のページ状態の同期が変わるため、`superForm` を使う5画面を実ブラウザーで確認する。CI は E2E を実行しないので、PR の branch を手元で checkout して既存 E2E（`signin / redirect_after_login / votes / workbook_edit / workbook_order`）も流す。
  - 画面の確認は、#4115 の CI が作った preview deploy でも行える。preview は本番とは別の DB（`PREVIEW_DATABASE_URL`）を使う。
  - staging ドメインは他の PR の CI でも付け替わる（`ci.yml` の alias の step の条件が `github.ref != 'refs/heads/main'` のため）。確認には #4115 のデプロイ URL を使う。
  - 結果（2026-10-18）: 5画面は #4115 の preview deploy で確認した。E2E は head `5833c1d0` を手元で checkout し（Superforms 3.0.0・Playwright 1.64.1、ローカルの `test_db`）、5本の spec の56件がすべて成功した。

| 画面                 | 確認すること                                                                |
| -------------------- | --------------------------------------------------------------------------- |
| ログイン・新規登録   | 入力エラー時に入力値が残る、成功後に redirect される、ゲストログイン。      |
| 問題集の作成・編集   | 問題リスト（JSON の入れ子データ）が送信・再表示される、失敗時に入力が残る。 |
| 管理: アカウント移行 | 成功・失敗のメッセージ、一般ユーザーが実行できない。                        |

- [x] 問題がなければ staging にマージする。production は `main` への push でしか deploy されないので、staging へのマージは本番に影響しない。2026-10-18 にマージした（merge commit `dc9f2471`、tree は検証した head `5833c1d0` と同一）。staging への push の [CI](https://github.com/AtCoder-NoviSteps/AtCoderNoviSteps/actions/runs/39128896093) も成功した。
- [x] 挙動の変更が必要になったら、Phase 3 の確認表にあるテストを先に書き、対応する層だけを修正する。依存だけの更新では新規 unit test を追加しない。
  - 結果: 不要だった。使用中の API（`superValidate`・`superForm`・`zod4`）は不変で、preview での5画面の確認・手元の E2E 56件・staging の CI がすべて通った。マージ後の `svelte-check` も 0 errors・30 warnings で、2.31.0 のときと件数が変わらない。

### Phase A: PR A（`$lib` → `#lib`、Kit 2 上）

- [x] `package.json` に `"imports": { "#lib/*": "./src/lib/*" }` を追加する。
- [x] [codemod_subpath_imports.py](./codemod_subpath_imports.py) の `lib` モード（`python3 -I codemod_subpath_imports.py <repo-root> lib`）で置換し、`pnpm format` を実行する。拡張子の規約は survey の「拡張子の規約」に従う。
- [x] `$lib` の import を禁止する `no-restricted-imports` を、`.ts` 向けに `.oxlintrc.json`、`.svelte` 向けに `eslint.config.mjs` へ追加する。Kit 2 は `$lib` を組み込みで解決するので、規則が無いと新しいコードの `$lib` に PR B まで気付けない。
- [x] `docs/guides/architecture.md`・`agent-rules/testing.md`・`testing-e2e.md`・`server-cache.md`・`prisma-db.md` の `$lib` 記述を、`#lib` と拡張子の規約に更新する。
- [x] `pnpm check / lint / test:unit --run / build` と既存 E2E（`signin / votes / workbook_edit / workbook_order`）で確認する。置換・設定・docs の変更なのでテスト先行は省略する。
  - 結果（2026-10-18、branch `refactor/lib-subpath-imports`）: lint 成功（oxlint の既存の警告1件のみ）、check は 0 errors・30 warnings（置換前と同数）、unit test は97ファイル・2726件が成功、build 成功。E2E は `redirect_after_login` も含めた5本の spec の56件が成功。seed の import 経路も tsx で解決できる。変更は290ファイル（置換282・`package.json`・`.oxlintrc.json`・`eslint.config.mjs`・docs 5ファイル）。
- [ ] 共同開発者の新機能の着手前、遅くとも1か月以内にマージし、連絡する。作業中の branch は rebase 後に codemod を再実行してもらう。codemod は repo に入れず、PR A の本文に全文を貼って共有する（レビュー手順・rebase 手順と一緒に記載）。
- [x] cross-review は、手編集ではなくスクリプト出力なので AGENTS.md の除外規定（生成物・機械的変更）に照らして要否を判断する。レビュー者は `staging` で codemod と `pnpm format` を再実行し、diff の一致を確かめられる。
  - 結果（2026-10-18、commit `f629666a`）: import の規約という共有 architecture の変更に当たるため、Codex の cross-review を受けた。staging（`dc9f2471`）で codemod と prettier を再実行すると `src/`・`e2e/`・`prisma/` が commit と一致することも確認した。Critical・Severe の指摘はなく、誤った置換も見つからなかった。
  - Minor（解消済み）: lint 規則は `vi.mock('$lib/...')` と `.svelte` 内の動的 `import('$lib/...')` を検出しない（`.ts` の `import type`・`export … from`・`export * from`・動的 `import()` は oxlint が検出することを実測した）。`architecture.md` の「禁止している」は、この検出範囲を補足すると正確になる。
    - PR A では `architecture.md` に検出範囲を補足した。Kit 3 では、`vi.mock('$lib/...')` は Vitest が `module_removed_lib` で失敗し、`.svelte` の動的 `import('$lib/...')` は check が失敗するので、検出漏れ自体が無くなった。PR B（`444e4daf`）で `architecture.md` をこの挙動に合わせた（Phase 4 の cross-review の項目を参照）。
  - Nit: `git diff --check` の結果が review の資料に無かった。commit の範囲で実行して問題なし。

### Phase A2: PR A2（`$features`・`@` → `#features`、Kit 2 上）

- [x] PR A のマージ後に着手し、`package.json#imports` に `"#features/*": "./src/features/*"` を追加する。PR A は #4190（`485ce861`）でマージ済み。branch は `refactor/features-subpath-imports`。
- [x] codemod の `features` モードで `$features/...` と `@/features/...` を置換し、`pnpm format` を実行する。
- [x] `rg -n '\$lib|\$features|@/features' src e2e prisma` で残りが 0件であることを確かめる。lint 規則と型チェックは `vi.mock` の specifier と `.svelte` 内の動的 `import()` を検出しないため。
- [x] `svelte.config.js` の `alias` を削除する（`@`・`$features`・`$features/*` と、PR A で参照が 0 になった `$lib` の2行）。残った `$features` は型チェックで失敗するので、リント規則は要らない。
- [x] `docs/guides/architecture.md`・`agent-rules/testing-e2e.md` の `$features` 記述を更新する。あわせて `svelte.config.js` と `tsconfig.json` の alias に関するコメントも更新した。
- [ ] 確認・連絡・cross-review は Phase A と同じ。PR B の前にマージする。
  - 確認の結果（2026-10-18、未 commit の作業ツリー）: lint 成功（oxlint の既存の警告1件のみ）、check は 0 errors・30 warnings（変更前と同数）、unit test は97ファイル・2726件が成功、build 成功、E2E は5本の spec の56件が成功、seed の import 経路も tsx で解決できる。staging（`485ce861`）で codemod と prettier を再実行すると、git 管理下の `src/`・`e2e/`・`prisma/` が作業ツリーと一致する。変更は149ファイル（置換144・`package.json`・`svelte.config.js`・`tsconfig.json`・docs 2ファイル）。
  - alias を外した後の確認: `$features` を import すると型チェックで `Cannot find module` になる。Kit 2 の生成 tsconfig には `$lib` の paths だけが残る（組み込み。再流入は PR A の lint 規則で防ぐ）。
  - Codex の cross-review（未 commit の diff）: Critical・Severe の指摘なし、置換の誤りなし。Minor は、`architecture.md:147` の grep の例が `@/` を含まない点と、リポジトリ全体の残存確認が無い点。全体を検索すると `.coderabbit.yaml:28` に `$lib/server/database` が残っていた（PR A での取りこぼし）。`git diff --check` は問題なし。grep の例に `@/` を加え、`.coderabbit.yaml` を `#lib/server/database.js` に直して commit した（`bbb40c1e`、150ファイル）。

本 PR のスコープ外:

- `TaskTableBodyCell.svelte` の feature 間 import（survey の「気付いた既存の問題」）。置換しても違反は残るが、直すのは別タスクとする。

### Phase 1: PR B・設定と module 解決

- [x] 独立した作業環境で `npx sv migrate sveltekit-3` の spike を行い、`pnpm build / check / lint / test:unit --run` が通ることを確認する。通らない場合は原因を切り分けるまで本線に取り込まず、Superforms 側の fork や shim で埋めない。特に次の3点を見る。
  - Vitest が Kit 3 で `$app/server` を解決できるか（`src/features/workbooks/zod/schema.test.ts` が Superforms の `/server` を実体で import する）。解決できなければ、同テストの import を root の `sveltekit-superforms` に切り替える。→ 解決できた（unit test 2726件が成功）。
  - 移設後の `dynamicCompileOptions` が node_modules の `SuperDebug.svelte` に効き、build が通るか。→ `sveltekit({...})` の直下に置けば効き、build が通る。`sv migrate` が出力した `vitePlugin: { dynamicCompileOptions }` は、Kit 3 では `config.vitePlugin` が削除済みで `svelte-kit sync` が失敗する。
  - `#lib`・`#features` が Kit 3 でも TypeScript / Vite / Vitest で解決され、新しい警告が出ないか。`sv migrate` が `$lib` に触れる場合は、PR A の結果と食い違わないか確認する。spike の前に `rg -n '\$lib|\$features|@/' src e2e prisma` が 0件であることも確かめる（PR A・PR A2 の後に入った `vi.mock` などを拾うため）。→ 0件。`#lib`・`#features` は Kit 3 でも解決でき、新しい警告も無い（build の警告は chunk サイズの1件のみ）。
- [x] Kit 3.1.0・adapter-vercel 7.0.1 に更新し、`svelte.config.js` を `vite.config.ts` に集約する（→「設計方針」の設定例）。tsconfig の extends を `$app/tsconfig` に変える。
- [x] 設定・機械的な import 変更はテスト先行を省略し、`pnpm build / check / lint` と既存 unit test で確認する。
  - `#4192` への反映後も spike と同じ結果（check の 20 errors も同じ箇所）。check の失敗は Phase 2 で直す方針（2026-10-19 に決定）。commit `76a6d0c3`（5ファイル、未 push）。この commit 単体では CI の check が落ちるので、Phase 2 の後に push する。
  - spike の結果（2026-10-19、`sv` 1.1.1、Kit 3.1.0・adapter-vercel 7.0.1）: build・unit test・lint は成功、check は 20 errors（すべて Phase 2 の項目。下記）。build の `.vc-config.json` は `nodejs24.x`・`hnd1`・memory 3008・maxDuration 30。
  - `sv migrate` の出力のうち採用しなかったもの: `vitePlugin` の入れ子（上記）、Kit と adapter の `^` 範囲指定（`3.1.0`・`7.0.1` に固定）、実在しない `src/lib/index.js` への bare `#lib`、Markdown の `$lib` の置換（`architecture.md` の文意が壊れ、過去の dev-notes も書き換えた）、既存コメントの移動と `/* */` への書き換え。`tsconfig.json` は codemod の形（`$app/tsconfig` が削った設定をすべて提供する）に、既存の説明コメントを残した。
  - `tsconfig.json` から消えた9個（`allowJs`・`checkJs`・`esModuleInterop`・`forceConsistentCasingInFileNames`・`isolatedModules`・`moduleResolution`・`resolveJsonModule`・`skipLibCheck`・`verbatimModuleSyntax`）は、`$app/tsconfig` が同じ値を設定するので、重複として消した。デフォルトが厳しくなったからではない。`tsc --showConfig` で Kit 2（`staging`）と Kit 3 の実際の設定を比べ、9個とも同じ値であることを確かめた（2026-10-21）。
  - 実際の設定で違うのは、Kit 3 の基本設定から来る4つだけ: `paths` から `$lib` が消えた（意図どおり）、`types` に `$app/types` が増えた（`types` は継承されず上書きされるため）、`moduleDetection: "force"`（すべてのファイルをモジュールとして扱う）、`allowImportingTsExtensions: true`（`.ts` の拡張子の import を許す。`.js` と書く規約は変えない）。
  - 残したのは、基本設定に無い `strict: true` と、Kit 2 から引き継いだ `incremental`・`sourceMap`・`outDir`。`outDir` は svelte-check の `--tsgo` を壊すので、[CI の高速化](../../2026-10-20/ci-and-typecheck-speedup/plan.md)の Phase 2 で消す。`sourceMap` は `noEmit` では効かないので、同じ時に消してよい。

### Phase 2: PR B・ルート型と state

- [x] `Handle` を `@sveltejs/kit/hooks`、`SubmitFunction` を `$app/forms` に移す。`$app/environment` を `$app/env` に揃える（テストの mock も含む）。
  - 結果: ソース4ファイルとテストの mock 4ファイルを `$app/env` に揃え、コメントの docs リンクも `$app-env` に直した。Kit 3 の実行時の `$app/environment` は `../env/index.js` を再 export するだけなので、mock を先に `$app/env` へ変えてもテストは通り続けた（mock は両方の名前に効く）。
- [x] 修正の前に、E2E `keeps kanban edits while replacing filter URL`・`restores saved workbook filters without adding a history entry` を追加する。
  - Kanban のテストは `keeps kanban state while replacing filter URL` という名前で `workbook_order.spec.ts` に追加した。ドラッグは Playwright では不安定なので、並べ替えの状態が消えない仕組み（絞り込みの変更で履歴が増えず、`__data.json` の再取得も起きない）を検証する。修正前は `$app/stores` の例外でページが描画されず失敗した。
  - 復元のテストは `workbooks_list.spec.ts` に追加した。Kit 3.1.0 の `goto` は非推奨の `replaceState` も `replace` として受け付ける（`opts.replace ?? opts.replaceState`）ため、修正前から通る回帰の監視用のテストになる。
  - どちらも、壊れた実装に一時的に差し替えて失敗することを確かめた（Kanban は `shallow`・`replace` をそれぞれ外す2通り、復元は `replace` を外す1通り）。
- [x] `KanbanBoard.svelte` の `$app/stores` を `$app/state` と Runes に移し、`replaceState` を `goto(..., { shallow: true, replace: true, state: page.state })` へ移す。`workbooks/+page.svelte` の `{ replaceState: true }` を `{ replace: true }` にする。
  - Kit 3 の `page.url` は型の上で読み取り専用（`searchParams` は `ReadonlyURLSearchParams`）なので、`kanban.ts` の `parseInitialCategories`・`parseInitialGrades` の引数を `Pick<URLSearchParams, 'get'>`、`buildUpdatedUrl` の引数を `Pick<URL, 'href'>` に広げた（型だけの変更で、既存の unit test 36件が成功）。
- [x] `resolve()` の呼び出しを、route ID と pathname（leading slash なし）の区別に合わせる。純粋な URL 変換を足す場合は既存の `workbook_url_params.ts / kanban.ts` を先に調べ、隣接 unit test を先行する。
  - Kit 3 の `resolve()` は、`/` で始まる引数を route ID（`(group)` を除き `[param]` を埋める。`?`・`#` 以降は残す）、それ以外を pathname として扱う。型は既知の route ID・pathname と、それに `?`・`#` を付けたテンプレート文字列だけを受け付ける。
  - 定数を渡す6か所（`HOME_PAGE`・`EDIT_PROFILE_PAGE` など）は値がそのまま route ID なので、Kit 2 の回避用の `@ts-expect-error` を外した。`resolve('/votes', {})` の `{}` も外した。
  - `buildWorkbooksUrl` の戻り値の型を `` `/workbooks?${string}` `` にして、`workbooks/+page.svelte` の3か所の `@ts-expect-error` を外した。復元は `` `/workbooks?${savedUrl.searchParams}` `` で組み立てる（保存される値は常に `buildWorkbooksUrl` の出力）。
  - `KanbanBoard` は route ID `` `/(admin)/workbooks/order?${...}` `` で組み立てる。
  - `AuthForm` の `alternativePageLink`（`buildSignupPath()` が実行時に作る `/signup?redirectTo=...` など）は型で表せないので、`@ts-expect-error` を残し、理由を Kit 3 に合わせて書き直した。新しい URL ユーティリティは追加していないので、追加の unit test は無い。
- [x] `page.url` を直接変更していないことを確認する。Kit 3 の `page.url` は型の上で読み取り専用なので、check が 0 errors で通ることで確かめた。
- [x] Phase 1 の check で見つかった Kit 3 の型の変更を直す。`(admin)/tasks/[task_id]/+page.server.ts` は `Actions` を `@sveltejs/kit` の汎用型から import しているため `params.task_id` が `string | undefined` になる。`./$types` の `Actions` に替える（同じ書き方の他の7ファイルは `params` を使わないので任意）。

Phase 1 の check の 20 errors（Phase 2 で直す）:

| 分類                                                                     | 件数 | 箇所                                                                                                                                                                        |
| ------------------------------------------------------------------------ | ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `$app/environment` が見つからない                                        | 4    | `features/auth/server/auth.ts`・`lib/stores/local_storage_helper.svelte.ts`・`features/workbooks/stores/replenishment_workbook.svelte.ts`・`lib/actions/handle_dropdown.ts` |
| `Handle` が無い（+ 暗黙の any 2件）                                      | 3    | `hooks.server.ts`                                                                                                                                                           |
| `SubmitFunction` が無い（+ 暗黙の any 2件）                              | 4    | `(admin)/tasks/+page.svelte`・`(admin)/tasks/_components/TaskTableForImport.svelte`                                                                                         |
| `$app/stores` が見つからない                                             | 1    | `(admin)/workbooks/order/_components/KanbanBoard.svelte`                                                                                                                    |
| 不要になった `@ts-expect-error`（Kit 2 の `RouteId` の型の不具合の回避） | 6    | `VotableGrade.svelte`・`AuthForm.svelte`（2件）・`TagForm.svelte`・`users/[username]/+page.svelte`・`votes/[slug]/+page.svelte`                                             |
| `resolve()` の引数の数                                                   | 1    | `votes/[slug]/+page.svelte:45` の `resolve('/votes', {})`（`{}` は Kit 2 の回避策）                                                                                         |
| `params` の型                                                            | 1    | `(admin)/tasks/[task_id]/+page.server.ts:71`（上記）                                                                                                                        |

`sv migrate` の Phase 2 向けタスク（`environment`・`imports`・`app-state`・`shallow-routing`・`paths`）は、Phase 1 と同じく本線に直接かけず、コピーで出力を確かめてから採用する。

- 結果（2026-10-19）: `environment`・`imports`・`app-state`・`shallow-routing` の出力は計画どおりで、同じ変更を手で入れた。`paths` は何も変更しなかった。整形の副作用（`x: x` → `x`、空要素の自己閉じ化、`tsconfig.json` のコメント削除）は採用しなかった。`hooks.server.ts` は import が既存コメントの上に移ったので、元の位置で import 元だけを変えた。
- Phase 2 の確認（2026-10-19、commit `a046e268`、23ファイル、未 push）: check は 0 errors・30 warnings（変更前と同数）、lint 成功（oxlint の既存の警告1件のみ）、unit test は97ファイル・2726件が成功、build 成功（deprecated の警告なし）。E2E は `signin`・`redirect_after_login`・`votes`・`workbook_edit`・`workbook_order`・`workbooks_list` の82件が成功、1件は既存の spec がデータ不足で自ら skip したもの。
- Phase 4 への申し送り: `agent-rules/sveltekit.md` の「Static: `resolve('/')` + `@ts-expect-error`（AppTypes merging quirk）」は Kit 3 では不要になった。上記の `resolve()` の扱いに合わせて書き換える。

### Phase 3: PR B・フォーム・認証・error

- [x] 先に E2E `keeps form values after a failed enhanced submission`・`returns the fail status for an enhanced submission`・`redirects to home when logging out without a session` を書く。
  - 3本とも `signin.spec.ts` に追加した。Kit 3 の branch では3本とも成功する。staging（`e3d1145c`、Kit 2）のコピーでも流し、`returns the fail status ...`（Kit 2 は 200）と `redirects to home ...`（Kit 2 は `/workbooks` に留まる）が失敗することを確かめた。どちらも Kit 3 の挙動の変化を検出できる。`keeps form values ...` は Kit 2 でも成功する（挙動は同じ）。
- [x] 次の表の確認を行う。一般ユーザーが管理 action を実行できないことも確認する。
  - 結果は表の下に記載。

| 層・責務                   | 対象                                                                                            | 確認・テスト名                                                                                                                                                                                                                                                              |
| -------------------------- | ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 共通 util / 型             | src/lib/utils/auth_forms.ts、src/lib/types/auth_forms.ts、src/test/lib/utils/auth_forms.test.ts | 既存 util を再利用し、schemaShape・errors・posted・valid の契約を保持する。unit test は Superforms を mock するので、統合対応の証拠にはしない。                                                                                                                             |
| 認証ルート・UI（層1）      | login / signup、src/lib/components/AuthForm.svelte                                              | 実際の superForm / enhance を通して `keeps form values after a failed enhanced submission` と既存の redirect_after_login spec。入力エラー・認証失敗・成功時の session と redirectTo を確認する。ゲストログインは `fetch` 直送なので別経路として確認する。                   |
| 管理ルート・UI（層1）      | (admin)/account_transfer の server / page                                                       | `rejects account transfer by a non-admin user`。権限拒否・validation failure・成功時の message と入力状態を確認する。action は `fail()` ではなく通常の返り値で失敗を表すため、status の挙動変更は受けない。                                                                 |
| 問題集ルート・UI（層1）    | workbooks/create、workbooks/edit/[slug]、WorkBookForm.svelte                                    | JSON の nested data と workBookTasks が送信・再表示されること、失敗時の入力保持、成功後の再初期化を、既存の workbook_edit / workbook_order と `keeps nested workbook tasks after a failed submission` で確認する。                                                          |
| 検証フォーム（層1）        | problems、votes/[slug]、workbooks/[slug] の server load/action                                  | zod4 の errors・constraints と投票結果の表示を既存の votes spec で確認する。superValidate だけを使う経路と、独自 enhance の経路を区別する。                                                                                                                                 |
| Kit 3 の応答・state（層1） | 上記フォーム全体、Header のログアウト                                                           | `returns the fail status for an enhanced submission` で fail(400/403/500) を確認し、戻る/進む、再 load、redirect、onError の表示も見る。ログアウトは成功を既存の `signin.spec.ts`、未ログインでの失敗を `redirects to home when logging out without a session` で固定する。 |

確認表の結果（2026-10-19、Kit 3.1.0 の branch `#4192`、commit `2c420dac`、未 push）:

- 共通 util / 型: 変更は不要だった。`auth_forms` の unit test は Superforms を mock するので、統合の確認は下の E2E で行った。
- 認証: `keeps form values after a failed enhanced submission`（失敗のメッセージが出て、ユーザー名が残る）と既存の `redirect_after_login` が成功。ゲストログインのボタンは本番用のパスワードを送るため、ローカルの seed では成功の経路を流せない（`AuthForm` の HACK）。成功時の応答は HTTP 200 の redirect で Kit 2 と同じ。失敗時は Kit 3 では HTTP 400 になり `response.ok` が false なのでログイン画面に留まる（Kit 2 は 200 が返り、失敗してもホームへ遷移していた）。
- 管理: 新しい `account_transfer.spec.ts` に `rejects account transfer by a non-admin user`（ページを開くと別ページへ redirect され、直接 POST すると `/login` への redirect が返る）と、管理者で新旧に同じ名前を入れると検証のメッセージが出て入力が残るテストを追加した。万一ガードが壊れていても実データをコピーしないよう、存在しないユーザー名を使う。成功の経路はデータを書き換えるので流していない。
- 問題集: `keeps nested workbook tasks after a failed submission` を `workbook_edit.spec.ts` に追加した（管理者が編集ページでタイトルを2文字にして送信すると、検証のメッセージが出て、タイトルと問題リストが残り、保存されない）。編集の action は検証の失敗を `fail()` ではなく通常の返り値で返すので、status の変更は受けない。作成ページは問題の検索の操作が要るので UI では流していない。成功後の再初期化もデータを書き換えるので流していない。
- 検証フォーム: 既存の `votes` spec が成功。
- Kit 3 の応答・state: `returns the fail status for an enhanced submission`（`fail(400)` が HTTP 400 になる）と `redirects to home when logging out without a session` が成功。戻るは Phase 2 の復元のテスト、redirect は既存の `redirect_after_login` が守る。エラーページは上記の 404・403・500 で確かめた。enhanced form の action が `error()` を投げたときの UI の表示（Superforms の `onError`）は、既存の直接 POST のテスト（`workbook_edit` の 403）で status だけを確かめている。
- 一般ユーザーが管理 action を実行できないこと: アカウント移行（上記）と、既存の `workbook_edit` の直接 POST（403）で確かめた。
- E2E 全体（18本の spec）: 116件が成功、1件は既存の spec がデータ不足で自ら skip したもの。lint も成功。

- [x] 404 / 403 / 500 と `+error.svelte` の表示、`handleError` に expected error も届くことを確認する。cookie は secure / httpOnly / sameSite を維持し、session が続くことを実フォームで確認する。
  - 404・403 は新しい `error_pages.spec.ts` で固定した（未知のルートで 404、一般ユーザーが `/workbooks/create` を開くと `load` の `error(403)`）。
  - 500 は、必ず例外を投げる一時的なルートと確認用の spec を置いて確かめ、確認後に両方とも削除した（commit していない）。status は 500 で、`+error.svelte` に「エラーが発生しました」・`500`・`Internal Error`・「ホームに戻る」が出た。
  - `handleError` は本アプリでは定義していないので、Kit 3 の既定の実装が使われる。500 のときはサーバーに例外のスタックが出て、404・403 のときは出なかった（既定の実装は想定済みのエラーを記録しない）。
  - cookie は `keeps the session cookie attributes after login` で固定した（`auth_session` が `path: /`・`httpOnly`・`secure`・`sameSite: Lax`。ログイン後に session が必要な `/users/edit` を開けることも確かめる）。

### Phase 4: PR B・配備と規約

- [x] robots / sitemap / meta tags と、anonymous・logged-in・admin の SSR を確認する。
  - robots・sitemap は Phase 3 の E2E 全件（`robots.spec.ts`・`sitemap.spec.ts` を含む）で成功。
  - `pnpm build` + `pnpm preview` に curl で10パスを取得した（2026-10-19）。anonymous は公開ページが 200、保護ページが `/login?redirectTo=...` への 307。guest は利用者ページが 200、admin ページが 307。admin はすべて 200。
  - 200 のページはすべて title・description・twitter・og:* を持つ。`pageMetaTags` を設定するルートは無いので、全ページが共通の tag になるのは仕様どおり。header は anonymous にログイン・アカウント作成のリンク、guest・admin に利用者名を SSR で出す。
- [ ] Vercel preview の build / deploy と、生成された `.vc-config.json` の runtime・region・memory・maxDuration を確認する。production は preview と別に確認する。
  - ローカルの build で生成された `.vc-config.json` は `nodejs24.x`・`hnd1`・memory 3008・maxDuration 30、framework は sveltekit 3.1.0。
  - preview と production は push 後に人が確認する（agent は push しない）。
- [x] `docs/guides/architecture.md`（feature server の保護・alias の説明）、`agent-rules/sveltekit.md`（pathname 規則）、`auth.md`（redirect）を移行後の仕様に更新する。
  - architecture.md: Kit 3 は `src/routes`・`static` 外のすべての `server/` と `server.*`・`*.server.*` を server-only として扱う（`exports/vite/utils.js` の `is_server_only_path` で確認）。alias は `sveltekit()` に置かない。`$lib` の lint 禁止は Kit 2 の習慣への案内として残す。
  - sveltekit.md: `resolve()` は route ID（`/` 始まり、group を含めて書く）と pathname（leading slash なし）を区別し、`string` は渡せない。Kit 2 の回避用の `@ts-expect-error` は不要で、実行時の pathname を渡す `AuthForm.svelte` だけ理由付きで残る。`redirect()` は外部 location で throw する（`exports/url.js` の `validate_redirect_location`）ので、利用者入力は従来どおり `isSameOriginRedirect()` で検証する。
  - auth.md: 同じ `redirect()` の変更を Security に記載。
  - Kit 2 の記述の全体の検索（AGENTS.md・CONTRIBUTING.md・agent-rules・設定・source）: AGENTS.md の stack 表記、CONTRIBUTING.md の version と設定場所、testing.md の `$app/environment` の mock、testing-e2e.md の form action の応答（`fail(N)` の status、別ページの action）、`eslint.config.mjs` のコメント、`src/app.d.ts` の旧 URL を更新した。残る言及は意図した履歴の注記だけ。
  - `e2e/signin.spec.ts` の生の `JSON.parse` を testing-e2e.md の型付き `deserializeActionResult` に置き換えた。
  - commit `b5e822aa`（未 push）。check 0 errors / 30 warnings、lint 成功、unit 2726件成功、signin E2E 6件成功、`git diff --check` 問題なし。
- [x] PR B は共有 architecture の変更に当たりうるため、AGENTS.md に従って cross-review の要否を判断する（実装した agent とは別の agent、不可なら CodeRabbit）。
  - 共有の設定・型・docs を変えるので必要と判断し、Codex で `staging...b5e822aa` を review した（2026-10-19、`codex exec -s read-only`、資料は prompt に埋め込み）。Critical・Severe は無し。
  - Minor（確認済み）: `architecture.md:78` は、`src/routes`・`static` の除外が `server.*`・`*.server.*` にもかかるように読める。実装では除外は `server/` ディレクトリの判定だけにかかる。
  - Minor（確認済み）: `workbook_order.spec.ts` の `keeps kanban state while replacing filter URL` は未保存の drag を作らないので、`__data.json` の再取得と履歴の追加は検出できるが、ローカル状態を初期データに戻す回帰は検出できない。テスト名が検証範囲より広い。
  - Minor（可能性あり）: `workbook_edit.spec.ts` の `keeps nested workbook tasks after a failed submission` は問題リストを変えずに失敗させるので、nested data の送信が壊れてサーバーの元データに戻る回帰を通しうる。
  - 確認事項は解消: prettier・lefthook・`ci.yml` を含む repo 全体に `svelte.config.js`・`.svelte-kit/tsconfig` への参照は無い。Vercel の配備確認は上の項目で扱う。
  - ユーザーの選択で3件とも対応した。`architecture.md:78` は、ファイル名による判定（場所を問わない）と `server/` ディレクトリによる判定（`src/routes`・`static` を除く）を分けて書いた。Kanban のテスト名は `replaces filter URL without reloading data or adding history` に絞った（drag の E2E は不安定になりやすいので足さない）。workbook_edit のテストは、最後の行を削除してから失敗させ、失敗後も削除後の4行が残ることを確認する `keeps edited nested workbook tasks after a failed submission` にした。
  - 変異の確認: 編集ページの `superForm` に、更新のたびに元の問題リストへ戻す `onUpdate` を一時的に入れると、新しいテストは最後の assertion（5行が表示）で失敗した。元のテストは元のリストと比べるので、この変異を通す。変異は戻した。
  - 同じ時に、`architecture.md` の 6節（subpath imports）が Kit 3 で使うもの・使わないものを区別しにくいという指摘を受け、「使う」「使わない」「拡張子」の箇条書きと OK・NG の例に再編した。
  - format・lint・check（0 errors / 30 warnings）・`git diff --check` は成功。E2E は workbook_edit・workbook_order の 21件が成功。
  - 6節の lint の段落も Kit 2 前提（lint だけが `$lib` を止める）だったので、一時ファイルで Kit 3 の挙動を確かめて書き直した（2026-10-19）。`$lib` は `vi.mock('$lib/...')` でも Vitest が `module_removed_lib` で失敗し（Kit の Vite plugin の `resolveId` が `$lib` を検出する）、`.svelte` の動的 `import('$lib/...')` は check が `Cannot find module` で失敗する。`vi.mock('$features/...')` は解決されないまま無視され、本物のモジュールが使われる。残る穴はこれだけなので、`rg` の確認はその理由で残した。一時ファイルは削除した。

### 手動確認: PR B の preview・配備

unit test と E2E が通らない操作のうち、Kit 3 の変更が当たるものを手で確認する。1〜7 は preview で、成功条件の smoke test（ログイン・投票・編集）と一緒に行う。
依存パッケージで Kit 3 が削除した `$app/stores`・`$app/environment` を参照するのは eslint-plugin-svelte の lint 規則だけで、実行時に壊れるものは無い（2026-10-19 に `node_modules` を検索）。

優先度・高（E2E が無く、Kit 3 の変更が直接当たる）:

- [x] 1. 提出状況の更新: /problems・問題集の詳細・利用者ページで、ドロップダウンとモーダルから状態を AC などに変え、表示が変わり、リロード後も残る。最もよく使う操作だが E2E が無く、`use:enhance` の form action は Kit 3 で失敗時の応答（`fail(N)` の status）が変わった。
  - 結果: Kit 3 を仮に deploy した preview で確認した（2026-10-21、ユーザーが確認）。
- [x] 2. admin の問題インポート（/tasks）: コンテストの取得（`?/fetch`）から問題の作成（`?/create`）まで通す。Phase 2 で型の import を直した独自の enhance callback と `goto(result.location)` を通る。外部 API を使うので E2E が無い。
  - 結果: Kit 3 を仮に deploy した preview で確認した（2026-10-21、ユーザーが確認）。
- [x] 3. 新規登録とアカウント設定: signup の入力エラーの表示と登録の成功、AtCoder ID の検証コードの発行・確認・リセット。どれも `fail(N)` の status が変わったフォーム。
  - 結果: Kit 3 を仮に deploy した preview で確認した（2026-10-21、ユーザーが確認）。
  - 「確認」は devcontainer では必ず失敗し、Kit 3 では HTTP 500 として見える（2026-10-21 に確認）。#4061（`6696b604`）で、秘密の値をコンテナに置かないため `CONFIRM_API_URL` を設定しない方針にし、`compose.yaml` で空の `.devcontainer/empty.env` を `.env` に重ねている。そのため `process.env.CONFIRM_API_URL` が無く、action が `fail(500)` を返す。seed の `admin`・`guest` は連携済みなので、開発には支障が無い。
  - 同じリクエストを Kit 2 に送ると、応答の中身は同じ `{"type":"failure","status":500,…}` で、HTTP status だけが 200 だった。Kit 3 で壊れたのではなく、`fail(N)` の status がそのまま返るようになって見えただけ。「発行」と「リセット」は手元の Kit 2・Kit 3 とも 200 で成功した。
  - 「確認」の成功は、`CONFIRM_API_URL` が設定された Vercel の preview で確かめる。→ Kit 3 を仮に deploy した preview で、本人確認が成功した（2026-10-21、ユーザーが確認）。
  - PR B のスコープ外（Kit 2 からある問題で、別 PR で直す。調査は [atcoder-verification-failures/survey.md](../../2026-10-21/atcoder-verification-failures/survey.md)）:
    - 本番の DB で、本人確認が完了していないケースがときどきある。検証コードに有効期限は無く、失敗の理由がログにも画面にも残らないため、原因はまだ決められない。
    - `users/edit/+page.svelte` は `load` の `data.message`（常に空）だけを表示し、action が返す `form.message` を表示しないので、成功・失敗のメッセージが画面に出ない。

優先度・中:

- [x] 4. 選択状態の保存（`browser` の import 元を `$app/env` に変えた store）: /problems のコンテスト種別のタブと問題一覧のタブを切り替えてリロードし、選択が残る。/workbooks で条件を選び、別のページから戻ると条件が復元される。unit test は mock なので、実際のブラウザーでの保存は未確認。
  - 結果: Kit 3 を仮に deploy した preview で確認した（2026-10-21、ユーザーが確認）。
- [x] 5. admin の残りの画面（admin でログインして操作する）:
  - 結果: Kit 3 を仮に deploy した preview で、下の3画面の操作をすべて確認した（2026-10-21、ユーザーが確認）。
  - グレードの設定（/tasks/grade）: 問題のグレードを変えると保存され、リロード後も残る。`use:enhance` の form action（`?/setTaskGrade`）で、失敗時の status が変わったフォーム。
  - 問題の編集（/tasks/[task_id]、例: `/tasks/abc001_a`）: グレードを変えて保存（`?/update`）すると保存され、別の問題の値は変わらない。Phase 2 で `Actions` を `@sveltejs/kit` の汎用の型から `./$types` に替えた画面（`params.task_id` が `string | undefined` になるのを直した、型だけの変更）。
  - タグの編集（/tags/[tag_id]）: タグ名を変えて保存すると保存される。「タグ一覧へもどる」と、問題へのリンク（Phase 2 で `resolve()` を直した `TagForm.svelte`）が正しいページを開く。
  - `/tasks/[task_id]` は devcontainer では存在する問題でも 500 になるので、preview で確認する（2026-10-21 に確認）。`load` が表示のたびに `taskTagsApiService.getTaskTags()` で Google Apps Script（`script.google.com`）からタグを取得し、失敗するとそのまま投げる。devcontainer の外向き通信の firewall（`30b5f207`、`.devcontainer/init-firewall.sh`）は `script.google.com` を許可していないので、`fetch failed`（`EHOSTUNREACH`）で失敗する。Kit 2（`staging` のコピー）でも同じく 500 で、Kit 3 の regression ではない。→ Kit 3 を仮に deploy した preview で、`/tasks/[task_id]` の閲覧とグレードの保存を確認した（2026-10-21、ユーザーが確認）。
  - PR B のスコープ外（Kit 2 からある問題で、別 PR で直す）:
    - タグの取得に失敗すると、問題の編集画面全体が 500 になる。本番でも Google Apps Script が遅い・落ちていると起きうる。取得に失敗したら DB のタグだけで表示する案がある。
    - Google Apps Script の URL が `src/lib/constants/urls.ts` ではなく `tasktagsApiService.ts` に直接書かれている。firewall の一覧は「アプリが呼ぶ外部 API（`urls.ts`）」を基準にしているため、漏れた。`urls.ts` に移すか、firewall で許可するか（Apps Script の応答は `script.googleusercontent.com` へ転送されるはずで、エージェントが出られる範囲が広がる）を決める。
- [x] 6. 問題集の作成（/workbooks/create）: 入力エラーを出し、直して保存すると問題リストも保存される。編集は E2E があるが、作成には無い。
  - 結果: Kit 3 を仮に deploy した preview で確認した（2026-10-21、ユーザーが確認）。
- [x] 7. 画面遷移: header のドロップダウン（利用者メニュー・外部リンク）が開閉する。別のページへの遷移では spinner が出て、同じページでの条件変更では出ない。ブラウザーの戻る・進むが正しく動く。
  - 結果: Kit 3 を仮に deploy した preview で確認した（2026-10-21、ユーザーが確認）。

ローカル:

- [x] 8. `pnpm dev`: 起動・HMR と、terminal とブラウザーの console に新しい警告が出ないか。build の警告は確認済みだが、dev server は未確認（「検証手順と完了条件」の「build と dev に出る新しい警告・エラーはすべて調査する」）。
  - 結果（2026-10-21）: `#4192`（`cfa16889`）を `git archive` したコピーで `vite dev` を起動し、Playwright で anonymous・guest・admin の16ページを開いた（初回と2回目）。起動と HMR は正常で、新しい警告は無い。
  - ブラウザーの console は、Kit 2（`staging` のコピー）と同じ3種類だけ: firewall が `fonts.googleapis.com`・`www.googletagmanager.com` を許可しないための `net::ERR_ADDRESS_UNREACHABLE`、flowbite-svelte の `Tabs` の deprecated の警告2種（`ulClass`・`contentClass`）。
  - HMR: `/about` のコンポーネントを書き換えると、ページ全体を再読み込みせずに反映され、元に戻した変更も同じく反映された。console のエラーは無い。
  - terminal: 依存の事前スキャンが `src/routes/about/SectionSnippets.svelte` の snippet の export で `PARSE_ERROR` になり、依存の事前バンドルを飛ばす（Kit 2 も同じ9件）。そのため初回の表示では、依存を見つけるたびに `optimized dependencies changed. reloading` が起きる。PR B のスコープ外（Kit 2 から）。
  - 注意: 同じディレクトリで dev server を2つ動かすと、Vite の依存のキャッシュ（`node_modules/.vite`）を共有して壊れる（`Failed to hydrate`・`lifecycle_outside_component`・`Cannot read properties of undefined (reading 'call')`）。今回、ユーザーの `pnpm dev`（`127.0.0.1:5173`）と確認用の dev server（`[::1]:5173`）が重なって起き、別のコピーで動かすと消えた。Kit 3 の問題ではない。

配備時:

- [ ] 9. デプロイをまたぐタブ: production のデプロイ前にタブを開いておき、デプロイ後にそのタブでページ遷移とフォーム送信をする。メジャー更新なので、古い client と新しい server が食い違うのはこの時。
- [ ] 10. 配備後の Vercel のログ: 最初の数日、500 や見慣れないエラーが出ていないか。Kit 3 の既定の `handleError` は想定外のエラーだけを記録する。

### 手動確認の自動化: PR B（手動確認の1・4）

手動確認の1（提出状況の更新）と4（/problems のタブの保存）を E2E にする（2026-10-21 にユーザーが決定）。どちらも今は E2E が無く、DB の後片付けが要らないか、元に戻せる。本番のコードは変えない（ユーザーの判断）。

- [x] `e2e/submission_status.spec.ts` の `keeps the updated status after reload`: guest で /problems の既定の ABS の表を開き、seed で唯一の ABS の問題 `practice_1`（Welcome to AtCoder）のセルのドロップダウンで、今と違う状態を選ぶ。`/problems?/update` の POST を待ってリロードし、ドロップダウンを開き直して、選んだ項目にチェックのアイコンがあることを確かめる。最後に元の状態へ戻す。
  - セルの状態は背景色でしか表されないので、リロード後のドロップダウンのチェックのアイコンで確かめる。DOM の構造に依存するが、本番のコードを変えないためにこの方法をとる。
  - ドロップダウンは自前の `fetch` で送信し、`response.ok` も結果の種類も見ずに画面を更新する（Kit 2 から）。画面だけでは保存の失敗を検出できないので、必ずリロードしてから確かめる。
- [x] `e2e/problems_tabs.spec.ts` の `keeps the selected problem list tab after reload`: 「グレード別」のタブを選んでリロードし、`aria-selected="true"` のままであることを確かめる（flowbite の `TabItem` は `role="tab"`・`aria-selected` を出す）。
- [x] `e2e/problems_contest_table.spec.ts` の `keeps the selected contest type after reload`: 「ABC 319 〜」のグループ（利用者が最も多い）を選んでリロードし、その表の見出し（AtCoder Beginner Contest 319 〜（7 問制））が出ることを確かめる。最初は xDPC で書いたが、ユーザーの指摘で ABC 319 〜 に替え、変異の確認もやり直した。既定は `abs` なので、保存されていなければ失敗する。ボタンの選択状態は CSS の class でしか表されないので、表示される内容で確かめる。
- [x] 変異で検出力を確かめる: `updateTaskResult` が保存しないようにすると提出状況のテストが、`LocalStorageWrapper` が保存しないようにするとタブの2つのテストが失敗すること。変異は戻す。
- 結果（2026-10-21）: 3つとも `--repeat-each=3` で9回すべて成功。変異（`updateTaskResult` が保存しない・`LocalStorageWrapper` が保存しない）を入れると、3つともリロード後の assert で失敗し、既存の xDPC のテストは通った（ABC 319 〜 に替えた後も、`LocalStorageWrapper` の変異で失敗することを確認）。変異は戻した。format・lint（既存の警告1件のみ）・check（0 errors / 30 warnings）・`git diff --check` は成功。E2E の全件は 119 passed / 1 skipped（前回の 116 に3つ増えた）。

- 既存の動作を確かめるテストなので、テスト先行（RED）は無い。変異で代わりに検出力を確かめる。

残り・保留（2026-10-21 にユーザーが決定）:

- 残りタスク（別 PR）: 3（signup の入力エラーの表示と、Alice での発行 → リセット。「確認」は外部 API が要るので service の unit test のまま）、5 のうち /tasks/grade とタグの編集（値を戻して E2E にできる）、6（問題集の作成。作った問題集を消す後片付けが要る）。
- 保留: 2（問題のインポートはサーバーから外部 API を呼ぶので Playwright で差し替えられず、DB に問題を作る）、5 のうち `/tasks/[task_id]`（devcontainer では firewall で 500 になる。タグの取得を直す別 PR の後）、7（spinner は一瞬しか出ず assert が不安定。利用者メニューの開閉はログアウトの E2E で通っている）。
- E2E は CI では流していない（`ci.yml` の TODO）。追加したテストが回帰を防ぐのは、手元で流したときだけ。

### Phase 5: 任意機能（別タスク）

- [ ] 必須移行の配備後に、更新通知（`updated.current`）や tracing を選ぶ。候補と推薦度は survey の「便利な機能・採用推薦」。移行の成功条件には混ぜない。
- [ ] 更新通知を採用する場合は、先に Vercel の skew protection が有効かを確認する。有効だと古い版のユーザーの通信は古いデプロイに送られ、ページ遷移などの通常の通信では新しいデプロイを検知できないことがある。確認先は Vercel のプロジェクト設定か、CI の preview ジョブで `vercel build` が出力する `config.json` の `__vdpl`（repo からは分からない）。

## 設計方針

- **Superforms を最初に入れる:** 3.0.0 は Kit 2 と 3 の両方に対応するので、Kit 2 上で先に入れてフォームの基準を確認できる。後で Kit 3 のフォームに不具合が出た時、原因を Kit 3 側に絞れる。
- **alias の置換を Kit 3 本体から切り離す:** `$lib` は Kit 3 でも alias で維持できるが、`kit.alias` 自体が deprecated。共同開発者が1か月以内に新機能を追加するため、新しい `$lib` の import が増える前に置換する。`#lib` が Kit 2 でも解決されることはコピー上で確認済みなので、Kit 3 を待たずに先行できる。
- **`$features`・`@` は PR A と分ける:** PR A が既に282ファイルあるため。PR A2 で alias の参照を 0 にすれば、PR B は `alias` を使わずに済み、`kit.alias` の deprecated 警告も出ない。
- **移行先は Kit 3.1.0 / adapter 7.0.1:** 3.1.0 に 3.0.x の server-only 判定の修正が入っている。
- **Kit と adapter は同じ PR で更新する:** adapter 7 は Kit 3 を peer に要求し、`builder.generateServerInstance` を呼ぶ。片方だけの更新は Build が失敗する。

設定移行は既存の値を保つ。`vite.config.ts` の `plugins` を次の形にし、現行の `optimizeDeps / test` の設定は残す。
`alias` は書かない。`$lib` の alias を残すと Kit 3 で `$lib` が黙って復活し、新しいコードの逆戻りを build で検知できなくなる。`dynamicCompileOptions` は、Superforms の root entry が巻き込む旧構文の `SuperDebug.svelte` のために残す。adapter の runtime は実行環境の Node 24 に合わせて生成結果を確認する。

```typescript
import adapter from '@sveltejs/adapter-vercel';
import { sveltekit } from '@sveltejs/kit/vite';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [
    tailwindcss(),
    sveltekit({
      preprocess: vitePreprocess(),
      adapter: adapter({
        regions: ['hnd1'],
        memory: 3008,
        maxDuration: 30,
      }),
      compilerOptions: { runes: true },
      dynamicCompileOptions({ filename }) {
        if (filename.includes('node_modules')) {
          return { runes: undefined };
        }
      },
    }),
  ],
  // Keep the existing optimizeDeps and test options here.
});
```

公式の `npx sv migrate sveltekit-3` は PR B の作業時に独立した作業環境で使い、自動変換しきれない設定・`dynamicCompileOptions`・query/hash・依存側の旧 API は手で確認する。alias の置換は PR A・PR A2 の自前の codemod で済ませる。

### 却下した代替案

- Kit と adapter を別々にマージ: peer と Builder API が不整合になり、実際に #4104・#4105 の Build が失敗した。
- #4105・#4104 の 3.0.0 / 7.0.0 をそのまま採用: 3.1.0 / 7.0.1 に server-only 判定などの修正が出ている。
- Superforms 2.31.0 のまま Kit 3 へ: Kit 3 の `$app/stores` は購読で例外を投げるスタブで、install と build は通っても `superForm()` を使う画面が実行時に失敗する。
- `$app/stores` の互換 shim や依存の独自 fork を恒久運用: フォームと認証の依存に保守負担を持ち込む。公式 v3 が対応済みのため不要。
- `$lib` を alias で維持して `#lib` を先送り: Kit 3 では動くが、共同開発者の新機能が `$lib` の import を増やすほど置換の衝突と手戻りが増える。
- `$lib` → `#lib` を Kit 3 本体の PR に混ぜる: 282ファイルの機械置換が数ファイルの実変更を埋もれさせ、Kit 3 の回帰と置換の不具合を切り分けられなくなる。
- `$features`・`@` を PR A に含める: PR A がさらに大きくなり、レビューと共同開発者の rebase が重くなる。
- `$features` を alias のまま Kit 3 へ持ち込む: 動くが deprecated 警告が残り、alias が削除される時に同じ置換を Kit 3 の後でやり直すことになる。
- alias の置換に公式の `sv migrate` を使う: 自動置換の対象が明記されておらず、Kit 2 上の先行 PR では使えない。実在ファイルで拡張子を判定する自前の codemod なら、結果を再現・検証できる。
- 移行と同時に全フォームを remote functions へ置換: 実験機能で変更範囲が大きく、現行 Superforms + Zod の設計も変えるため別の検討にする。
- 移行と同時に URL utility や UI を再設計: removed API への対応に絞り、既存フォームの業務仕様は維持する。
- `posted` や `flashMessage` など Superforms の非推奨 API を移行と同時に整理: 3.0.0 で動作するため、削除された時に対応する。
- super-sitemap を移行と同時に 2.x へ更新: export が変わる major 更新で、Kit 3 移行の必須条件ではない。1.0.12 は Kit の API に依存しない。

## 検証手順と完了条件

各 PR で次を実行する。

```bash
pnpm install
pnpm build
pnpm lint
pnpm check
pnpm test:unit --run
pnpm test:e2e -- e2e/signin.spec.ts e2e/redirect_after_login.spec.ts e2e/votes.spec.ts e2e/workbook_edit.spec.ts e2e/workbook_order.spec.ts e2e/robots.spec.ts e2e/sitemap.spec.ts
git diff --check
```

- E2E は既存の test DB・認証 fixture を用意する。`playwright.config.ts` は build + preview を起動するため、CI の Node 24 build / unit test だけで完了扱いにしない。
- PR B では `kit.alias` を使わないため、build と dev に出る新しい警告・エラーはすべて調査する。
- PR B は preview の `pull / build / deploy --prebuilt / alias set` に加え、production の `build --prod / deploy --prod --prebuilt` と、ログイン・投票・編集の smoke test も成功条件に含める。
- 失敗時は該当 PR を通常の revert で戻し、Kit 2 / adapter 6 の成果物に戻せる状態を保つ。DB schema / migration はこの計画の対象外。
- codemod は repo に入れず、PR A の本文に全文を貼って共有する。PR A2 の `features` モードも同じスクリプトを使う。
