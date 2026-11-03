# build・check・lint の警告の解消

## 概要

`pnpm build`・`pnpm check`・`pnpm lint` の警告31件を0件にし、警告が出たら CI（`pnpm check`・`pnpm lint`）で失敗するようにした（2026-11-01 着手、staging `3eb7eadd`）。pre-commit では oxlint と ESLint の警告だけを止め、svelte-check（`state_referenced_locally` など）は走らせていない。oxlint の1件は #4277 で、残りはブランチ `#4285` で直した。

| 警告                                    | 出どころ                        | 件数 |
| --------------------------------------- | ------------------------------- | ---- |
| `state_referenced_locally`              | Svelte（build と `pnpm check`） | 29   |
| `a11y_no_noninteractive_tabindex`       | 同上                            | 1    |
| `unicorn/no-useless-fallback-in-spread` | oxlint（`pnpm lint`）           | 1    |

- build は SSR と client で2回 compile するので Svelte の警告は60個表示されるが、ユニークなのは30件で `pnpm check` と一致する。
- svelte-check・oxlint・ESLint は、既定では警告があっても exit 0 を返す。そのため、警告が溜まっていても CI は通っていた。
- `state_referenced_locally` は、Svelte 5.45.3 から props にも出るようになった。メンテナーは「props の初期値を使うのはほとんどの場合バグ」として、この変更を戻さない（[sveltejs/svelte#17289](https://github.com/sveltejs/svelte/issues/17289)）。実害は、同じ route の中で移動すると SvelteKit がコンポーネントを再利用し、`let x = data.x` が古い値のまま残ること（[SvelteKit docs](https://svelte.dev/docs/kit/state-management#Component-and-page-state-is-preserved)）。今はそうした移動をするリンクが無く、潜在的なバグにとどまる。

## 決めたこと

- **値の使い方で書き方を分ける:**
  - 表示や検索に使うだけで、今の値に追従すべきもの（`data.*`・props）は `$derived` にする。
  - 受け取った値を初期値にして、その後は自分で書き換える state は `untrack(() => ...)` で包む。Superforms の初期値（`superForm(untrack(() => data.form))`、[superforms#667](https://github.com/ciscoheat/sveltekit-superforms/issues/667)）と、`VotableGrade` の `displayGrade` がこれに当たる。実行時の挙動は `untrack` が無い時と同じで、「初期値だけを使うのは意図したことだ」とコードに残すために使う。
  - ライブラリに渡す option のうち、ライブラリが自分の `$effect` の中で読み直すもの（`createDroppable` の `id`・`type`・`accept`）は getter で渡す。
  - 迷う所は、今の挙動を保つ `untrack` にする。
- **Superforms の初期値:** `workbooks/create`・`edit` の `initialData` は、object 全体を `untrack` で包んだ。`edit` では、`$derived` にした `workBook` も初期化のときに読むため。`AuthForm`・`WorkBookForm` で受け取った superForm の object を分割代入する所も、`untrack` で包んだ。
- **a11y の警告:** `votes/+page.svelte` のフラスコのアイコンから、`tabindex="0"` を消すだけにした。flowbite-svelte 1.33.1 の `Popper.svelte:201` が、`Tooltip` のトリガーに実行時に `tabIndex = 0` を付けるので、markup の `tabindex` は重複していた。実行時の DOM は今と同じく「フォーカスできる `role="img"`」のままで、a11y の状態は良くも悪くもならない。`VotableGrade.svelte` の同じアイコンも、`tabindex` を書かずにトリガーにしている。
- **警告で失敗させる:** `check` に `--fail-on-warnings` を付けた。`lint` では、oxlint に `--deny-warnings` を、ESLint に `--max-warnings 0` を付けた。`lefthook.yml` の oxlint と eslint の job にも同じフラグを付けた。CI（`ci.yml`）は `pnpm lint`・`pnpm check` を呼ぶので、workflow は変えていない。`check:watch` も変えていない。
- **ESLint の扱い:** ESLint に `--max-warnings 0` を付けるのは、当初は不要とした。しかし oxlint は `.svelte` を見ないので、付けないと `.svelte` の `no-explicit-any` だけが CI で止まらず、`.ts` と扱いが揃わない。それがわかったので付けた。今ある `any` には、すべて disable コメントが付いている。
- **テスト:** 挙動の分岐を足さないので test-first は省いた。phase ごとに `pnpm check` の残りの件数・既存の E2E・変更前後の画面の比較で確かめてから commit した。

## 採らなかった案

- **`warningFilter`・`svelte-ignore` で消す:** 本物のバグも隠れてしまう。意図的な所も、`untrack` の方が意図をコードで表せる。
- **Superforms に渡す値を `$derived` にする:** `superForm` は初期化した後、自分で state を持つ。`AuthForm` は呼び出し側が template の式で `superForm(data?.form)` を渡すので、子で読み直すと初期化の外で `superForm()` が呼ばれうる。
- **`VotableGrade` の `displayGrade` を上書きできる `$derived` にする:** 親が新しい `taskResult` を渡すと、投票した直後の表示が元に戻る。挙動の変更を chore に混ぜない。
- **`{#key}` でコンポーネントを作り直す:** `$derived` で足りる。
- **a11y の警告を、アイコンを `<button>` にして直す:** 当初の plan はこの案だった。押しても何も起きないのに、スクリーンリーダーに「ボタン」と読まれる。flowbite-svelte がトリガーにフォーカスを付けるので、`<button>` にする必要も無い。
- **a11y の警告を、`tabindex` を消すとキーボードで開けなくなるとして残す:** 当初の plan の前提だったが誤り。上の `Popper.svelte:201` のとおり、消しても実行時に付く。

## わかったこと（コードや git に残らない事実）

- `let x = data.x` は、Svelte 4 の時も初期値を写すだけで、追従していなかった（追従させるには `$: x = data.x` が要った）。`users/[username]`・`problems/[slug]` は作った時から `export let data; let x = data.x;` で、runes に移した `01fffb99`（2025-02-22）は `export let data` を `$props()` に置き換えただけ。そのため、v5 で壊れたのではなく、v4 の頃からある潜在的なバグに警告が出るようになった、というのが実態。
- `@dnd-kit/svelte` 0.5.1 の `createDroppable` は、input の `id`・`accept`・`type` を内部の `$effect` で読み直す。dnd-kit の docs には、「reactive な値と同期させたい option は getter で定義する」とある。一方、quickstart では `createDroppable({id})` と値をそのまま渡している。`KanbanBoard.svelte` は `group` に固定の文字列を渡すので、getter にしても今の動きは変わらない。
- `workbooks/create` は admin 専用で、`+page.server.ts` が admin 以外に 403 を返す。そのため `isOfficial` は実際には常に `true` で、`CREATED_BY_USER` の分岐はこの画面からは通らない。
- oxlint は `.svelte` を lint しない。`.svelte` の lint は ESLint だけが担っている。
- **調べた資料:** svelte.dev・dndkit.com には devcontainer から接続できなかった。代わりに、手元の Svelte 5.57.3 の型定義（`untrack` の JSDoc）と、GitHub 上の source（Svelte の `compile-warnings.md`・`$effect.md`、dnd-kit の `create-droppable.mdx`・`quickstart.mdx`）を見た。Superforms は issue で確かめた。

## 確かめたこと

- **警告の件数:** `pnpm check` は30件 → 16件（`$derived`）→ 11件（props）→ 10件（a11y）→ 0件（Superforms）になった。
- **E2E:** 各 phase で関係する spec を流した。次以外はすべて pass した。`workbooks_list` の1件は、データが無いときに飛ばす条件付きの skip。
  - Phase 2: `submission_status`・`workbooks_list`・`redirect_after_login`
  - Phase 3: `workbook_order`・`votes`・`workbooks_list`
  - Phase 4: `votes`
  - Phase 5: `account_transfer`・`signin`・`redirect_after_login`・`workbook_edit`・`error_pages`
- **unit テスト:** 各 phase で `pnpm test:unit` の2994件が pass した。
- **Phase 2 の画面:** admin で6画面と `/workbooks/create` を開き、本文と input（`readonly`・value）を Playwright で書き出した。変更前・変更後・2回目の変更後で比べ、差分は無かった。
- **Phase 4 のアイコン:** dev の DB に暫定グレードの問題が無いので、Playwright で `/votes/__data.json` を書き換え、PENDING の問題1件に `estimatedGrade` を足してアイコンを出した。dev server のコンパイル結果に `tabindex` は無かった。それでも実行時の要素には `tabindex="0"` が付き、Tab でフォーカスすると Tooltip が開いて、フォーカスが離れると閉じた。`cursor: help` と色も変わらない。
- **Phase 5 の form:** admin で作成・編集の画面を開き、input の値と送信内容（`__superform_json`）を変更の前後で書き出して比べた。差分は無かった（毎回変わる `__superform_id` は除いた）。
- **警告で失敗するか:**
  - 警告が無い今の状態では、`pnpm check`・`pnpm lint` はどちらも exit 0。
  - `let tagsSnapshot = data.tags;` を1行足すと、`pnpm check` は exit 1。
  - `any` を書いた一時的な `.ts` では、`pnpm lint` も lefthook と同じ形の `oxlint --deny-warnings <file>` も exit 1。
  - `any` を書いた一時的な `.svelte` では、ESLint にフラグを付ける前は `pnpm lint` が exit 0 だった。付けた後は、`pnpm lint` も lefthook と同じ形の `eslint --max-warnings 0 <file>` も exit 1。
  - 足した行と一時ファイルは消した。

## 確かめていないこと

- 問題集を実際に保存した時の値。Phase 5 では送信を Playwright で abort したので、DB には保存していない。
- 同じ route の中での移動（`/users/a` → `/users/b` など）で、`$derived` にした値が新しくなること。今はそうしたリンクが無い。
- フラスコのアイコンの E2E。今は E2E にこのアイコンのテストが無く、Phase 4 の確認は手で動かした1回だけ。
- JS が読み込まれる前の SSR の HTML では、アイコンにフォーカスできない。これは実際に困ることがまず無いとして、見ていない。
- `pnpm dev` と E2E の警告の出力。

## レビュー

- ユーザーの依頼で、Codex（`codex exec -s read-only`、codex-cli 0.166.0）にクロスレビューを頼んだ（2026-11-03）。Codex の sandbox は devcontainer で起動しない（`bwrap: No permissions to create a new namespace`）。そのため、plan・差分・変更したファイルの全文・関係するライブラリの source・ルールを prompt に埋め込んで渡した。
- Critical・Severe の指摘は無かった。dnd-kit の getter、`untrack` の追加、`tabindex` の削除、`package.json` のフラグと CI の呼び出し経路は、問題無しとされた。
- 指摘は次の3件で、どれを直すかはユーザーの選択待ち。
  - **Moderate: pre-commit で svelte-check が走らない（`lefthook.yml`）。** 指摘どおりで、`.svelte` に `let x = data.x` を足しても commit できる。止まるのは CI の `pnpm check`。`pnpm check` は全体を見るので staged のファイルだけには絞れず、devcontainer で11秒かかった。
  - **Minor: ESLint が除外するディレクトリの `.svelte` を、lefthook が明示的に渡すと失敗する（`lefthook.yml`）。** 再現した。`package/` に一時的な `.svelte` を置いて `eslint --max-warnings 0 <file>` を呼ぶと、「File ignored because of a matching ignore pattern」の警告で exit 1 になり、通常のファイルと混ぜても exit 1 だった。`--no-warn-ignored` を付けると exit 0。ただし、ESLint の `ignores`（`build`・`coverage`・`.svelte-kit`・`package` など）の下にある git 管理の `.svelte` は0件で、今は起きない。
  - **未検証（Codex 自身が断定していない）: 編集画面 A から B へ、コンポーネントを使い回したまま移ると、見出しと `tasksMapByIds` は B に追従するが、form は A の値のまま残りうる（`workbooks/edit/[slug]/+page.svelte`）。** 初期値を固定する構造は変更前からある。編集画面へのリンクは一覧（`WorkbookAuthorActionsCell`）にしか無く、編集画面の中には `/workbooks` へのパンくずリストしか無い。更新に成功すると `/workbooks` に redirect する。そのため、今はこの移動をする経路が無い。Superforms がページデータの変化で form を同期するかは確かめていない。
- Codex は、plan の「ESLint にも付ける案を採らなかった」が最終のコードと矛盾するとも指摘した。これは Codex に渡した後に plan を書き直した時に解消した。

## 範囲外: chunk size の警告

- devcontainer でだけ出る。`compose.yaml` の `NODE_ENV=development` のため Vite が dev モードで build し、Svelte が dev モードでだけ出す `Component[FILENAME] = ...` を Rolldown が副作用として扱う。その結果、flowbite-svelte の使っていないコンポーネント（135個、約 158 kB）が残る。本番モードでは最大の chunk は 301 kB で、警告は出ない。
- flowbite-svelte を Rolldown の `treeshake.moduleSideEffects` で副作用なしと宣言しても、本番では 75 kB（約9%）しか減らない。upstream が止まっているので、この設定はずっと残り、flowbite-svelte を上げるたびに確認が要る。
- deep import（`flowbite-svelte/Button.svelte`）にしても、`Button.svelte` 自体がルートの barrel を読み込むので縮まない。`chunkSizeWarningLimit` を上げるのは、本番では出ない警告のために本番の設定を変えることになる。

## 残る作業

- devcontainer の `pnpm build` と E2E（Playwright の `webServer`）は dev モードのまま。本番と揃えるなら、`compose.yaml` の `NODE_ENV=development` を消す。`NODE_ENV` を読むコードは無いが、devcontainer の作り直しが要る。
- `.coderabbit.yaml` の `src/**/*utils/**` の指示（「Must be pure functions with no side effects」）はテストファイルにも当たるので、`auth_forms.test.ts` の `vi.stubGlobal` を副作用として指摘された（Phase 1 の review）。直すなら、指示の文面に「本番コード向けで、テストでは `afterEach` で戻すなら `vi.stubGlobal` を使ってよい」と1行足す。この glob に当たるテストは63ファイルあるが、global を stub しているのはこのファイルだけ。`path_instructions` の glob が `!` による除外に対応しているかは確かめていない。
- UI の3層構造（Tailwind CSS → Flowbite → flowbite-svelte）の見直しは、別の task・PR にする。flowbite-svelte は2026-04-07から release も merge も無く、66ファイルが46コンポーネントを import している。flowbite は3.1.2のまま（最新は v4.0.2）。
- `(admin)/account_transfer` に残っている `svelte/legacy` の `run` は、今回の範囲外として残した。
