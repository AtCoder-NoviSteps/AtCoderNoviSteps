# build・check・lint の警告の解消

## 概要

`pnpm build`・`pnpm check`・`pnpm lint` の警告31件を0件にし、CI で再発を止める（2026-11-01、staging `3eb7eadd`）。

| 警告                                    | 出どころ                        | 件数 |
| --------------------------------------- | ------------------------------- | ---- |
| `state_referenced_locally`              | Svelte（build と `pnpm check`） | 29   |
| `a11y_no_noninteractive_tabindex`       | 同上                            | 1    |
| `unicorn/no-useless-fallback-in-spread` | oxlint（`pnpm lint`）           | 1    |

- build は SSR と client で2回 compile するので Svelte の警告は60個表示されるが、ユニークなのは30件で `pnpm check` と一致する。`pnpm format` の警告は0件。
- 警告を抑える設定は無い。svelte-check と oxlint は既定では警告があっても exit 0 を返すので、CI が通っている。
- error にする予定は見当たらない。`state_referenced_locally` は Svelte 5.45.3 から props にも出るようになり、メンテナーは「props の初期値を使うのはほとんどの場合バグ」として戻さない（[sveltejs/svelte#17289](https://github.com/sveltejs/svelte/issues/17289)）。実害は、同じ route の中で移動すると SvelteKit がコンポーネントを再利用し、`let x = data.x` が古い値のまま残ること（[SvelteKit docs](https://svelte.dev/docs/kit/state-management#Component-and-page-state-is-preserved)）。今はそうした移動をするリンクが無く、潜在的なバグにとどまる。
- svelte.dev などに devcontainer から接続できなかったので、docs は GitHub 上の source で、Superforms は issue で確かめた。
- 範囲外: chunk size の警告（末尾）、`(admin)/account_transfer` の `svelte/legacy` の `run`。`pnpm dev`・`test:unit`・`test:e2e` の出力は見ていない。

## 方針

- 値の変化に追従してよい所は `$derived` に、初期値だけを使う意図の所は `untrack(() => ...)` にする。迷う所は、今の挙動を保つ `untrack` にする。前者は SvelteKit の docs と `svelte-runes.md` に、後者は Superforms の docs（[superforms#667](https://github.com/ciscoheat/sveltekit-superforms/issues/667)、`superForm(untrack(() => data.form))`）と `AtCoderVerificationForm.svelte:23-24` に揃える。
- 挙動の分岐を足さないので test-first は省く。各 phase で `pnpm check` の残りの件数と既存の E2E を確かめてから commit する。手で変えるのは18ファイルで、クロスレビューの条件には当たらない。

## フェーズ

### Phase 1: oxlint（1件）

- [x] `src/test/lib/utils/auth_forms.test.ts:222-224` の stub を `vi.stubGlobal('crypto', { randomUUID: undefined })` にし、`prevCrypto` を消して、コメントを実態に合わせる。`?? {}` は、object の spread が null・undefined を無視するので要らない。`prevCrypto` は `beforeEach` の stub（`randomUUID` だけを持つ object）なので、元のコードも `{ randomUUID: undefined }` を作っていた。コメントの「preserve other properties」は実態と合っていなかった。
- [x] 確認: `pnpm exec oxlint .` が0件になり、`auth_forms.test.ts` が通る。

### Phase 2: 表示にだけ使う値を `$derived` にする（14件、残り16件）

- [x] `InputFieldWrapper.svelte:29`・`(admin)/tags/+page.svelte:6`・`(admin)/tags/[tag_id]/+page.svelte:6-7`・`(admin)/tasks/[task_id]/+page.svelte:8-9`・`problems/[slug]/+page.svelte:15-16`・`users/[username]/+page.svelte:11-14`・`workbooks/[slug]/+page.svelte:31,36` を、`let tags = $derived(data.tags);` の形にする。
- [x] `workbooks/[slug]` の `$effect` は、今も `taskResults` を通じて `data` が変わるたびに再実行されている。`workBook` を `$derived` にしても、表示は変わらない見込み。
- [x] 確認: E2E の `submission_status`・`workbooks_list`・`redirect_after_login` が通り、上の6画面を開いて表示が変わっていない。結果: `pnpm check` は30件から16件（Phase 2 の7ファイルは0件）。E2E は50件 pass・1件 skip（データが無いときの条件付き skip）。admin で6画面と `/workbooks/create` の本文と input（`readonly`・value）を変更の前後で書き出し、差分は無かった。

### Phase 3: コンポーネントの props（5件、残り11件）

- [x] `KanbanColumn.svelte:21,23`: `type`・`accept` も `id` と同じく getter にする。`@dnd-kit/svelte` の `createDroppable` は、getter の値を `$effect` の中で読み直す。
- [x] `VotableGrade.svelte:63`: `componentId` を `$derived` にする。
- [x] `VotableGrade.svelte:59`: 投票後の表示に使う state の初期値なので、`untrack` で包む（同じファイルの78行目と同じ形）。
- [x] 確認: E2E の `workbook_order`・`votes`・`workbooks_list` が通る。結果: `pnpm check` は16件から11件。E2E は54件のうち53件 pass・1件 skip（Phase 2 と同じ条件付き skip）。`VotableGrade:59` は、78行目に揃えて `initialGrade` を消し、`$state(untrack(() => ...))` にまとめた。

### Phase 4: a11y（1件、残り10件）

- [ ] `votes/+page.svelte:69` の `<span role="img" tabindex="0">` を `<button type="button" aria-label="暫定グレード">` にする。`id`・`class` はそのまま残す。flowbite-svelte の `Tooltip` はトリガーの `focusin` で開くので、この `tabindex` はキーボードで Tooltip を開くためのもの。`<button>` にしても、フォーカスで開く挙動は変わらない。
- [ ] 確認: Tab でアイコンにフォーカスすると Tooltip が開き、見た目（cursor・色・位置）が変わらない。E2E の `votes` が通る。

### Phase 5: Superforms の初期値（10件、残り0件）

- [ ] `untrack` で包む: `(admin)/account_transfer/+page.svelte:31`、`AuthForm.svelte:43`・`WorkBookForm.svelte:41`（受け取った superForm の object を分割代入する所）、`workbooks/create/+page.svelte:14,22,23`、`workbooks/edit/[slug]/+page.svelte:21`。
- [ ] `$derived` にする: `workbooks/create/+page.svelte:26`、`workbooks/edit/[slug]/+page.svelte:16,29`。
- [ ] 確認: E2E の `account_transfer`・`signin`・`redirect_after_login`・`workbook_edit`・`error_pages` が通る。問題集を作ると `authorId`・`isOfficial`・`workBookType` が今と同じ値で保存され、編集画面に今の値が入っている。

### Phase 6: CI で警告を止める

- [ ] `package.json` の `check` に `--fail-on-warnings` を、`lint` の oxlint に `--deny-warnings` を付ける。`check:watch` は変えない。`lefthook.yml` の oxlint の job にも `--deny-warnings` を付ける。
- [ ] 確認: どちらも exit 0 で終わる。試しに `let x = data.x` を1行足すと `pnpm check` が exit 1 になる（`rtk bypass` で確かめ、元に戻す）。
- [ ] これ以後、`no-explicit-any`（`warn`）も disable コメントが無ければ CI で失敗する。今ある `any` には、すべて disable コメントが付いている。

## 採らなかった案

- **`warningFilter`・`svelte-ignore` で消す:** 本物のバグも隠れてしまう。意図的な所も、`untrack` の方が意図をコードで表せる。
- **Superforms に渡す値を `$derived` にする:** `superForm` は初期化した後、自分で state を持つ。`AuthForm` は呼び出し側が template の式で `superForm(data?.form)` を渡すので、子で読み直すと初期化の外で `superForm()` が呼ばれうる。
- **`VotableGrade` の `displayGrade` を上書きできる `$derived` にする:** 親が新しい `taskResult` を渡すと、投票した直後の表示が元に戻る。挙動の変更を chore に混ぜない。
- **`{#key}` でコンポーネントを作り直す:** `$derived` で足りる。
- **a11y の警告を `tabindex` を消して直す:** キーボードで Tooltip を開けなくなる。
- **ESLint にも `--max-warnings 0` を付ける:** 今の警告は0件で、今回の警告の出どころでもない。

## 範囲外: chunk size の警告

- devcontainer でだけ出る。`compose.yaml` の `NODE_ENV=development` のため Vite が dev モードで build し、Svelte が dev モードでだけ出す `Component[FILENAME] = ...` を Rolldown が副作用として扱う。その結果、flowbite-svelte の使っていないコンポーネント（135個、約 158 kB）が残る。本番モードでは最大の chunk は 301 kB で、警告は出ない。
- flowbite-svelte を Rolldown の `treeshake.moduleSideEffects` で副作用なしと宣言しても、本番では 75 kB（約9%）しか減らない。upstream が止まっているので、この設定はずっと残り、flowbite-svelte を上げるたびに確認が要る。
- deep import（`flowbite-svelte/Button.svelte`）にしても、`Button.svelte` 自体がルートの barrel を読み込むので縮まない。`chunkSizeWarningLimit` を上げるのは、本番では出ない警告のために本番の設定を変えることになる。

## 残る作業

- devcontainer の `pnpm build` と E2E（Playwright の `webServer`）は dev モードのまま。本番と揃えるなら、`compose.yaml` の `NODE_ENV=development` を消す。`NODE_ENV` を読むコードは無いが、devcontainer の作り直しが要る。
- `.coderabbit.yaml` の `src/**/*utils/**` の指示（「Must be pure functions with no side effects」）はテストファイルにも当たるので、`auth_forms.test.ts` の `vi.stubGlobal` を副作用として指摘された（Phase 1 の review）。直すなら、指示の文面に「本番コード向けで、テストでは `afterEach` で戻すなら `vi.stubGlobal` を使ってよい」と1行足す。この glob に当たるテストは63ファイルあるが、global を stub しているのはこのファイルだけ。`path_instructions` の glob が `!` による除外に対応しているかは確かめていない。
- UI の3層構造（Tailwind CSS → Flowbite → flowbite-svelte）の見直しは、別の task・PR にする。flowbite-svelte は2026-04-07から release も merge も無く、66ファイルが46コンポーネントを import している。flowbite は3.1.2のまま（最新は v4.0.2）。
