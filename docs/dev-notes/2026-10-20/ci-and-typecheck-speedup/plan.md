# CI と型チェックの高速化、actions の SHA 固定

## 概要

Kit 3 への移行（PR B、branch `#4192`）の後、「build・check が遅い」という相談を受けて時間の内訳を測り、対策を選んだ。
あわせて、セキュリティのために GitHub Actions の `uses:` を commit SHA に固定した。
branch `ci-and-typecheck-speedup` で、Phase 1・2（tsgo 以外）・3・4・5 を実装済み（2026-10-21）。
tsgo による型チェックの高速化は後回しにし、残タスクとして [TASK.md](../../../tasks/TASK.md) に移した。

## 計測（2026-10-19、devcontainer 上）

| コマンド         | 時間    | 内訳                                                                                             |
| ---------------- | ------- | ------------------------------------------------------------------------------------------------ |
| `pnpm build`     | 14.4 秒 | `prisma generate` 1.8 秒、Vite（server 2.6 秒・client 2.0 秒）、adapter-vercel の出力 2.3 秒など |
| `pnpm lint`      | 11.6 秒 | prettier 9.3 秒、ESLint 4.4 秒、oxlint 0.1 秒                                                    |
| `pnpm check`     | 10.6 秒 | `svelte-kit sync` 0.9 秒、svelte-check 9.3 秒                                                    |
| `pnpm test:unit` | 6.0 秒  |                                                                                                  |

- CI は `staging` の直近10回が全体で 2分21秒〜2分50秒。#4191 のマージ（2分44秒）では `preview` が 1分16秒で、残りが `build` ジョブ。
- 分割前の `build (24)` ジョブ（ユーザーが共有した1回分、全体 1分19秒）: 準備 24秒（Setup pnpm 6秒、Node.js 6秒、install 10秒など）、本体 48秒（Build 13秒、Lint 11秒、Check 11秒、Unit test 13秒を順に実行）、後片付け 5秒。ジョブごとの固定の負担は約29秒。
- `prettier --check . --cache` は、1回目 8.6 秒、2回目 1.6 秒（実装後の計測）。

## 決めたこと

- **低リスクから順に入れる:** ローカルの設定（Phase 1・2）→ 挙動の変わらない CI の変更（Phase 3）→ CI の構成（Phase 4）→ 配備のジョブ（Phase 5）。Phase ごとに1 commit（Phase 4 は composite action の切り出しと、ジョブの分割の2 commit）。
- **SHA は当時の major tag と同じ commit にする:** 固定するだけで、動く action のコードは変えない。作業の直前に各 action の公式 repo で `git ls-remote --tags` を取り直し、計画時の値から動いていないことを確かめた。`pnpm/action-setup` は annotated tag なので、tag object ではなく、tag が指す commit（`^{}` の行）を使う。
- **SHA の更新は Renovate に任せる:** `helpers:pinGitHubActionDigestsToSemver` が、digest とコメントの `vX.Y.Z` を一緒に更新する。Renovate の github-actions manager は、既定で `.github/actions/` 配下と `action.yml` も対象にする（docs で確認）。
- **SHA 固定の理由:** GitHub の security hardening guide は、tag は「can be moved or deleted if a bad actor gains access to the repository storing the action」として SHA 固定を勧める。この workflow は `VERCEL_TOKEN` と、preview・production の DB の接続先を扱う。第三者の action だけでなく `actions/*` も同じ仕組みで書き換えられうるので、3つとも固定した。
- **CI の check 名 `build (24)` は残す:** `build` ジョブだけ matrix を残し、lint・check・unit-test を別のジョブにした。
- **setup は composite action にまとめ、deploy のジョブでも使う:** 6ジョブの setup は中身が同じで、SHA の更新を1か所で済ませるため。checkout は local action の読み込みに要るので、各ジョブに残す。
- **migration は build の成功後:** 二重 build を消した後も「build が失敗したら DB を変えない」を保つため、`prisma migrate deploy` を `vercel build` の後に移した。
- **branch protection（2026-10-21、admin が対処）:** この repo は Settings → Branches の Branch protection rules の方式。分割後は lint・check・unit test の失敗が `build (24)` に出なくなるので、「Require status checks to pass before merging」に `lint`・`check`・`unit-test` を追加した。
- **「Require branches to be up to date before merging」は変えない:** 入れると、マージのたびに他の PR で更新と CI のやり直しが要る。Renovate の PR が多く（`prHourlyLimit: 10`）、`rebaseWhen` の既定の `auto` は、この設定があると base が進むたびに rebase する（`rebaseWhen` の挙動は docs で未確認）。

## コードから読み取れない根拠

### lint・check・unit-test は build の出力を使わない（Phase 4）

- `tsconfig.json` が extends する `$app/tsconfig`（`node_modules/$app/`）は、build ではなく `svelte-kit sync` が生成する。check は script の先頭の sync で、unit-test は Vitest が読み込む SvelteKit の Vite plugin で生成する。lint は型情報を使わない。
- 確認（2026-10-21）: `git archive HEAD` を空のディレクトリ3つに展開し、それぞれ `pnpm install --frozen-lockfile` の後に1つだけを実行した。3つとも成功し、どのコピーにも `build/` は生成されなかった。

### tsconfig の `outDir`・`sourceMap`・`incremental` を消してよい（Phase 2）

- 3つとも出力に関わる設定で、`noEmit: true` の下では効かない。`noEmit` は Kit が生成する `$app/tsconfig` にあり（Kit のソースのコメントは「Vite handles the build and ignores this」）、`tsconfig.json` は上書きしていない。
- TypeScript の TSConfig Reference によると、`sourceMap` は出力した `.js` の横に `.js.map` を出し、`outDir` は出力先の指定。Vite の docs によると、Vite は型を消すだけで、読む `compilerOptions` に `sourceMap`・`outDir` は無い。
- `incremental` は `noEmit` と併用でき、`tsc` を直接実行すれば `*.tsbuildinfo` を保存する。ただしこの repo には `tsc` を直接実行する script・lefthook・CI が無く、svelte-check も自分の `--incremental` を使わない限り読まない。
- 出どころ: `sourceMap` は 2023 年の作成時のテンプレート（create-svelte 5.0.5）にあり、`outDir`・`incremental` はテンプレートの外で足したもの。現行の `sv create`（sv 1.1.1）の tsconfig には3つとも無い。
- `outDir` は svelte-check の `--tsgo`・`--incremental` で「rootDir の外」のエラーを起こしていた。これが tsgo の前提だったので、tsgo を後回しにしてもこの変更は先に入れた。
- デプロイとは無関係: Vercel に上げる成果物の置き場は adapter が決め、adapter-vercel は `.vercel/output` に固定で書き出す。`build/` が成果物になるのは adapter-node の既定値で、この repo では使わない。

### deploy のジョブの `pnpm build` は重複していた（Phase 5）

- 経緯: 2023-10 の #121 では、deploy のジョブは `vercel pull` → `vercel build` → `vercel deploy --prebuilt` だけで動いていた。2024-04 の #362 で、migration のために `pnpm install`・`pnpm build`・`prisma migrate deploy` が一緒に追加された（`a6afb2d4`・`d0eb57b9`）。`pnpm build` が必要だった失敗の記録は無い。
- `vercel deploy --prebuilt` は `vercel build` の出力を使う（CLI 64.5.0 の help）。`vercel build` は、ダッシュボードに設定が無ければ SvelteKit の preset の `vite build` を実行し、`installCommand` が未設定なら install も行う（CLI の配布コード）。
- `prisma migrate deploy` は build を必要とせず、schema・migrations・接続先の環境変数で動く。Prisma client は `pnpm install` の `postinstall` で生成される。
- 再現: `git archive HEAD` の新しいコピーで `pnpm install` → `vite build` だけを実行し、`.vercel/output` が生成された。`vercel build` 自体は Vercel の token が要るので実行していない。vercel.com・prisma.io の docs は取得できず、CLI の help と配布コードで確認した。
- build のときに DB を読む経路（prerender など）は無い。将来 prerender を入れると、migration 前の DB を読むことになる（Codex のレビューの指摘）。

## 採らなかった案

- **rsvelte などの代替ツール:** 運用実績が少ない（ユーザー判断）。
- **svelte-check の `--incremental`:** 2回目でも 4.1 秒で、tsgo（初回から 2.6 秒）より遅い。CI で効かせるにはキャッシュの保存も要る。
- **Vite・adapter・`prisma generate` の調整:** どれも数秒で、削れる余地が小さい。Vite 8 は既に Rolldown を使う。
- **preview の `needs` を外して並行に走らせる:** lint・check が失敗した変更でも、preview の DB に migration が当たる。
- **setup の step を各ジョブに複製する:** 重複が増え、SHA の更新箇所も増える。
- **workflow dependency lockfile（`.github/workflows/actions.lock`）:** GitHub の guide は SHA 固定より強いとし、間接的に使われる action も固定できる。ただし GitHub 側は public preview で、Renovate の対応も experimental。どちらも運用実績が少ないので、今は SHA 固定にする。

## スコープ外

- **oxlint・oxfmt への移行:** [#2226](https://github.com/AtCoder-NoviSteps/AtCoderNoviSteps/issues/2226) と [oxfmt-migration の計画](../../2026-10-21/oxfmt-migration/plan.md) で扱う。移行すると Phase 1 の `prettier --cache` は不要になるが、変更は1か所なので先に入れた。prettier が `.prettierrc` を優先し、`prettier-plugin-tailwindcss` が使われていない問題も同じ PR で扱う。

## 残りの確認（人が行う）

- [ ] Vercel のダッシュボードの Build Command を確認する（`vercel.json` に `buildCommand` は無い）。想定外のコマンドなら先に揃える。
- [ ] PR の CI で4ジョブが並行に走るか確かめ、`build` の段と全体の時間を、分割前の 1分19秒・2分21秒〜2分50秒と比べる。見込みは、`build` の段が約42秒、全体が約1分30秒〜2分。
- [ ] PR の preview ジョブが成功し、preview の URL でログインできる。production はマージ後の最初の実行で確かめる。
- [ ] マージ後の Renovate の action の更新 PR（例: `pnpm/action-setup` v6.1.0）が、SHA とコメントを一緒に書き換える。

## 後で決めること

- ESLint の `--cache`: 未計測。測ってから判断する。
- workflow dependency lockfile: GitHub 側が GA になり、Renovate の対応から experimental が外れたら、SHA 固定から乗り換えるかを決める。乗り換えるときは、`gh actions-lock` が SHA の固定を版の参照に戻す。

## 確認限界

- CI の step ごとの時間は、`build (24)` の1回分だけで、preview・production のジョブの内訳は見ていない。見込みはこの値からの計算。
- Vercel のダッシュボードの設定と branch protection は repo から見えない。required checks の追加は admin が行い、agent は結果を見ていない。
- actionlint は、ダウンロードが許可されず実行していない。workflow は yaml のパーサーと Prettier でしか確かめていない。
- workflow dependency lockfile は、GitHub docs の2ページと Renovate の docs だけで確認し、試していない。
