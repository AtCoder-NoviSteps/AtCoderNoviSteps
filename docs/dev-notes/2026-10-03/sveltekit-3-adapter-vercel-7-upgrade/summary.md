# SvelteKit 3 移行のまとめ

SvelteKit 2.70.3 → 3.1.0、adapter-vercel 6.3.4 → 7.0.1 への移行の要点（2026-10-21 時点）。
作業の記録は [plan.md](./plan.md)、調査の詳細は [survey.md](./survey.md) にある。

## いまの状況

| PR                     | 内容                           | 状態                               |
| ---------------------- | ------------------------------ | ---------------------------------- |
| #4115                  | Superforms 2.31.0 → 3.0.0      | マージ済み                         |
| #4190（PR A）          | `$lib` → `#lib`                | マージ済み                         |
| #4191（PR A2）         | `$features`・`@` → `#features` | マージ済み                         |
| PR B（branch `#4192`） | Kit 3 本体                     | 手元と preview で確認済み、未 push |

- 確認済み: check・lint・unit test・build・E2E（119件）、preview での手動確認、Codex のレビュー（重大な指摘なし）。
- 残り: push と CI、production への配備と確認（→「残りタスク」）。

## なぜ移行したか

- adapter-vercel 7 以降は Kit 3 が前提で、Kit 2 のままでは Vercel 向けの更新を取り込めない。
- 速度やサイズの恩恵は無い（build は約3秒遅く、初回表示の JS は約4 KB 増）。得られるのは、開発時の検査の強化。

## 主な決定

- PR を4本に分け、1本ずつマージした。不具合が出た時に原因を切り分けるため。
  - Superforms は Kit 2・3 の両方に対応するので、最初に Kit 2 上で入れた。
  - alias の置換は、共同開発者が新機能を足す前に、Kit 2 上で先に済ませた。
- Kit と adapter は同時に更新する。片方だけだと build が失敗する。
- 版は 3.1.0 / 7.0.1 に固定した。3.1.0 に server-only の判定の修正が入っている。
- alias は使わず、`package.json` の `imports`（`#lib`・`#features`）にした。Kit 3 で alias は非推奨。
- 公式の `sv migrate` はコピーで試して一部だけ採用し、alias の置換は自前の codemod（[codemod_subpath_imports.py](./codemod_subpath_imports.py)）で行った。
- 却下した案は plan.md の「却下した代替案」にある。

## 知っておきたい Kit 3 の挙動

- `fail(400)` は HTTP 400 で返る（Kit 2 は 200）。
- 別ページの action を持つフォーム（ログアウト）は、失敗しても action のページへ移る。
- `$app/stores` は使うと実行時に例外になるので、`$app/state` を使う。`$app/environment` は `$app/env` に変わった。
- `resolve()` に渡せるのは実在する route だけ。`/` 始まりは route ID として扱われ、group も含めて書く。
- `redirect()` は外部の URL へは throw する。
- `server/` ディレクトリと `*.server.*` のファイルは、client から import できない（`features/*/server/` も対象）。
- `svelte.config.js` は使えず、置くとエラーになる。設定は `vite.config.ts` の `sveltekit()` に書く。
- `$lib` はどこに書いてもエラーになる。ただし `vi.mock('$features/...')` だけはエラーにならず、黙って無視される。
- import の拡張子は、TS が `.js`、runes モジュールが `.svelte.js`。E2E では `#lib` が解決できないので相対 import にする。

根拠になったコードと、Kit 2 との比較の結果は survey.md と plan.md（Phase 2〜4）にある。

## 開発環境での注意

- E2E は CI で流していない。手元で流す。
- devcontainer では次のことが起きるが、Kit 3 の不具合ではない。
  - AtCoder ID の「確認」が必ず失敗する。秘密の値を置かない方針で、`CONFIRM_API_URL` が無いため（#4061）。
  - `/tasks/[task_id]` が 500 になる。firewall が Google Apps Script への通信を通さないため。
  - 同じディレクトリで dev server を2つ動かすと、Vite のキャッシュを共有して壊れる。

## 残りタスク

PR B:

- [ ] push し、CI が通ることを確かめる（push は人が行う）。
- [ ] preview と production の build・deploy と smoke test（preview は仮の deploy で確認済み）。
- [ ] 配備時の確認: デプロイ前から開いていたタブの動作と、配備後の Vercel のログ。
- [ ] 共同開発者への連絡（PR A・A2 のマージと、作業中の branch での codemod の再実行）。

別 PR（計画あり）:

- [CI と型チェックの高速化、actions の SHA 固定](../../2026-10-20/ci-and-typecheck-speedup/plan.md)
- [Prettier から oxfmt への移行（#2226）](../../2026-10-21/oxfmt-migration/plan.md)
- [AtCoder ID の本人確認がときどき失敗する件](../../2026-10-21/atcoder-verification-failures/survey.md)

別 PR（計画はまだ無い）:

- `/tasks/[task_id]` が、タグの取得に失敗すると 500 になる。
- E2E の追加（signup、`/tasks/grade` とタグの編集、問題集の作成）。
- `TaskTableBodyCell.svelte` が別の feature（votes）を import している。
- 提出状況のドロップダウンが、サーバーの応答を確かめずに画面を更新する。セルの状態が色だけで表される。
- 任意機能の検討（更新通知、tracing）。
- 細かいもの: dev server の依存の事前スキャンのエラー、flowbite-svelte の `Tabs` の非推奨の props、Superforms の `posted`。

## 出典

- [SvelteKit 3 の公式移行ガイド](https://svelte.dev/docs/kit/migrating-to-sveltekit-3)
- リリース: [Kit 3.0.0](https://github.com/sveltejs/kit/releases/tag/%40sveltejs%2Fkit%403.0.0)・[3.1.0](https://github.com/sveltejs/kit/releases/tag/%40sveltejs%2Fkit%403.1.0)、[adapter-vercel 7.0.0](https://github.com/sveltejs/kit/releases/tag/%40sveltejs%2Fadapter-vercel%407.0.0)、[Superforms v3.0.0](https://github.com/ciscoheat/sveltekit-superforms/releases/tag/v3.0.0)
- `$lib` が `#lib` になった経緯: issue [#16182](https://github.com/sveltejs/kit/issues/16182)、PR [#16360](https://github.com/sveltejs/kit/pull/16360) ほか（survey.md の「Kit 3 が `$lib` を `#lib` に変えた理由」）
- 挙動の根拠にした Kit のコードと実測は、survey.md と plan.md に記載。
