# build・check・lint の警告の解消

## 概要

- `pnpm check`・`pnpm lint` の警告31件（`state_referenced_locally` 29、`a11y_no_noninteractive_tabindex` 1、oxlint 1）を0件にし、警告が出たら CI で失敗するようにした（2026-11-01 着手、staging `3eb7eadd`）。oxlint の1件は #4277、残りはブランチ `#4285`。
- svelte-check・oxlint・ESLint は、既定では警告があっても exit 0 を返す。そのため、警告が溜まっても CI は通っていた。
- `state_referenced_locally` は、Svelte 5.45.3 から props にも出る（[sveltejs/svelte#17289](https://github.com/sveltejs/svelte/issues/17289)）。実害は、同じ route の中で移動するとコンポーネントが再利用され、`let x = data.x` が古い値のまま残ること。今はそうしたリンクが無く、潜在的なバグにとどまる。

## 決めたこと

- **値の使い方で書き方を分ける:**
  - 表示や検索に使うだけの `data.*`・props は `$derived` にする。
  - 初期値にして、その後は自分で持つ state は `untrack(() => ...)` で包む（Superforms の初期値、`VotableGrade` の `displayGrade`）。実行時の挙動は変わらず、「初期値だけを使うのは意図したことだ」とコードに残す。
  - ライブラリが自分の `$effect` で読み直す option（`createDroppable` の `type`・`accept`）は getter で渡す。
  - 迷う所は、今の挙動を保つ `untrack` にする。
  - 採らなかった案:
    - `warningFilter`・`svelte-ignore`: 本物のバグも隠れてしまう。
    - `{#key}`: `$derived` で足りる。
    - Superforms の値を `$derived` にする: `superForm` は初期化した後、自分で state を持つ。
    - `displayGrade` を `$derived` にする: 投票した直後の表示が、親の値で元に戻る。
- **a11y:** `tabindex="0"` を消すだけにした。flowbite-svelte 1.33.1 の `Popper.svelte:201` が、Tooltip のトリガーに実行時に `tabIndex = 0` を付けるので、キーボードでの操作は変わらない。
  - 採らなかった案: `<button>` にする（当初の plan）。押しても何も起きないのに、スクリーンリーダーに「ボタン」と読まれる。
- **警告で失敗させる:**
  - `check` に `--fail-on-warnings` を付けた。
  - `lint` の oxlint に `--deny-warnings` を、ESLint に `--max-warnings 0` を付け、lefthook の同じ job にも付けた。
  - svelte-check は CI でだけ走り、pre-commit では走らない。
  - ESLint のフラグは当初は不要としたが、付けた。oxlint は `.svelte` を lint しないので、付けないと `.svelte` の `no-explicit-any` だけが止まらないため。
- **テスト:** 挙動の分岐を足さないので test-first は省いた。各 phase で、`pnpm check` の件数・既存の E2E・変更前後の比較で確かめた。
- **手での確認を E2E にする基準:** テストが無く、ライブラリの更新で何度も流す価値があり、安定して書けるものだけにした。当てはまったのは2件。
  - `votes.spec.ts`: フラスコのアイコンに focus すると Tooltip が開く。そのために、seed の `VOTE_STATS_DEMO_DATA` に、PENDING の `zone2021_f` を足した（中央値は本番のデータの D3）。
  - `workbook_create.spec.ts`（新規）: admin の作成画面で、`userId`・`isOfficial`・「問題集の種類」の初期値を見る。送信しないので DB は汚れない。
  - 画面の文字の比較はデータで変わり、同じ route の中での移動は経路が無いので、テストにしなかった。
- **ルールへの追記:** 今回の教訓を英語で1行ずつ足した。警告でも CI が落ちることと ESLint 側のルール（AGENTS.md）、Superforms と getter（`svelte-runes.md`）、Tooltip のフォーカス（`accessibility.md`）、`rg` の `|`（`coding-style.md`）。

## 事実（コードや git に残らない）

- `let x = data.x` は、Svelte 4 の時も追従していなかった（追従させるには `$:` が要った）。runes に移した `01fffb99` は、`export let data` を `$props()` に置き換えただけ。つまり v5 で壊れたのではなく、v4 の頃からある潜在的なバグに警告が出るようになった。
- `@dnd-kit/svelte` 0.5.1 の `createDroppable` は、`id`・`accept`・`type` を内部の `$effect` で読み直す。`KanbanBoard` は `group` に固定の文字列を渡すので、getter にしても今の動きは変わらない。
- `workbooks/create` は admin 専用（admin 以外には 403）。そのため、`isOfficial` は常に `true` になる。
- svelte.dev・dndkit.com には devcontainer から接続できなかった。代わりに、手元の Svelte 5.57.3 の型定義と、GitHub 上の docs の source を見た。Superforms は issue（[#667](https://github.com/ciscoheat/sveltekit-superforms/issues/667)）で確かめた。

## 検証

- **警告:** `pnpm check` は 30 → 16 → 11 → 10 → 0 件になった。
- **テスト:** 各 phase で、関係する E2E と unit テスト（2994件）がすべて pass した。例外は `workbooks_list` の1件で、データが無いときに飛ばす条件付きの skip。
- **変更前後の比較（Playwright）:**
  - 表示: 6画面と `/workbooks/create` の本文と input に、差分は無かった。
  - 問題集の作成・編集: input の値と送信内容（`__superform_json`）に、差分は無かった。送信は abort した。
- **フラスコのアイコン:** 最初は、`/votes/__data.json` を書き換えてアイコンを出し、手で確かめた。実行時に `tabindex="0"` が付き、Tab でフォーカスすると Tooltip が開いて、フォーカスが離れると閉じた。その後、E2E にした。
- **足した E2E:** 2件とも通り、E2E 全体も121件 pass した（1件は条件付きの skip）。production のコードを壊すと、2件とも失敗した。Tooltip を消すと `tabindex` が付かずに失敗し、`$form.isOfficial` の代入を消すと `isOfficial` が `false` になって失敗した。
- **警告で失敗するか:** 警告が無ければ `check`・`lint` は exit 0 だった。`let x = data.x`、`any` を書いた `.ts`・`.svelte` を一時的に足すと exit 1 になった。lefthook と同じ形の呼び出しでも、同じ結果だった。
- **確かめていないこと:**
  - DB に実際に保存したときの値
  - 同じ route の中での移動
  - SSR の HTML で、JS が読み込まれる前のフォーカス
  - `pnpm dev` の出力
  - E2E は CI でコメントアウトされているので、足した E2E はローカルでしか流れない

## レビュー

Codex（`codex exec -s read-only`、0.166.0）に頼んだ。sandbox が起動しないので、必要なファイルは prompt に埋め込んだ。Critical・Severe の指摘は無かった。ユーザーが直すのに選んだのは、Minor の1件だけ。

- **Minor（直した）:** ESLint が除外するディレクトリの `.svelte` を lefthook が渡すと、「ignored」の警告で失敗する。再現したので、lefthook の eslint に `--no-warn-ignored` を足した。該当する git 管理の `.svelte` は0件。
- **Moderate（直していない）:** pre-commit で svelte-check が走らない。指摘どおりで、svelte-check の警告は CI でだけ止まる。`pnpm check` は staged のファイルだけに絞れず、11秒かかる。
- **未検証（直していない）:** 編集画面 A から B へ移ると、見出しは B に追従するが、form は A のまま残りうる。初期値を固定する構造は変更前からあり、今はこの移動をする経路が無い。

## 残る作業

- **chunk size の警告（範囲外）:** devcontainer でだけ出る。原因は `compose.yaml` の `NODE_ENV=development` で、Vite が dev モードで build し、flowbite-svelte の使っていないコンポーネント（約 158 kB）が残る。本番では出ない。直すなら `NODE_ENV` を消す（devcontainer の作り直しが要る）。`treeshake.moduleSideEffects`・deep import・`chunkSizeWarningLimit` は、効果が小さいか、本番の設定を変えることになる。
- **`.coderabbit.yaml`:** `src/**/*utils/**` の「pure functions」の指示がテストにも当たり、`vi.stubGlobal` が指摘された。直すなら、テストは除くと1行足す。
- **UI の3層構造:** Tailwind → Flowbite → flowbite-svelte の見直しは、別の PR にする。flowbite-svelte は2026-04-07から更新が止まっている。
- **`account_transfer`:** `svelte/legacy` の `run` が残っている。
