# CI と型チェックの高速化、actions の SHA 固定

## 概要

Kit 3 への移行の後、「build・check が遅い」という相談を受け、時間の内訳を測って効く所だけを直した。
あわせて、GitHub Actions の action を commit SHA に固定した。
branch `ci-and-typecheck-speedup` で実装済み（2026-10-21）。
tsgo による型チェックの高速化は後回しにし、[TASK.md](../../../tasks/TASK.md) に移した。

| Phase | 変更                                                   | 効果                                          |
| ----- | ------------------------------------------------------ | --------------------------------------------- |
| 1     | `pnpm lint` の prettier に `--cache` を付けた          | ローカルの prettier 8.6 秒 → 1.6 秒           |
| 2     | `tsconfig.json` から効いていない3項目を消した          | tsgo を使う前提を整えた（挙動は同じ）         |
| 3     | action を commit SHA に固定した                        | tag の書き換えによる攻撃を防ぐ                |
| 4     | CI の build・lint・check・unit test を並列ジョブにした | CI の `build` の段 1分19秒 → 約42秒（見込み） |
| 5     | deploy のジョブの重複した `pnpm build` を消した        | deploy のジョブ 約13秒短縮（見込み）          |

CI 全体は 2分21秒〜2分50秒 → 約1分30秒〜2分の見込み。実測は PR の CI で行う。

## 判断と根拠

### Phase 3: SHA 固定

- tag は action の repo が乗っ取られると書き換えられる（GitHub の security hardening guide）。この workflow は Vercel の token と DB の接続先を扱うので、`actions/*` も含めて3つとも固定した。
- SHA は当時の major tag が指す commit にし、動くコードは変えていない。`pnpm/action-setup` は annotated tag なので、tag が指す commit（`git ls-remote` の `^{}` の行）を使った。
- 以後の更新は Renovate の `helpers:pinGitHubActionDigestsToSemver` が、SHA とコメントの版を一緒に書き換える。

### Phase 4: ジョブの並列化

- lint・check・unit test は build の出力を使わないので、並列にできる。型チェックに要る `node_modules/$app/` は build ではなく `svelte-kit sync` が生成し、check と unit test はそれぞれ自分で sync を実行する。
  - 確認: 空のディレクトリで `pnpm install` の後に1つずつ単独で実行し、3つとも成功した。
- `build` ジョブだけ matrix を残し、既存の check 名 `build (24)` を変えていない。
- setup（pnpm・Node.js・install）は composite action にまとめ、deploy のジョブでも使う。SHA の更新を1か所で済ませるため。
- branch protection（admin が対処済み）: 分割後は lint などの失敗が `build (24)` に出なくなるので、required checks に `lint`・`check`・`unit-test` を追加した。
- 「Require branches to be up to date before merging」は変えていない。入れると、Renovate の多数の PR がマージのたびに rebase と CI のやり直しになる。

### Phase 2: tsconfig の3項目

- `outDir`・`sourceMap`・`incremental` は、TypeScript がファイルを出力するとき（または `tsc` を直接実行するとき）だけ効く。Kit が生成する `$app/tsconfig` が `noEmit: true` で、`tsc` を直接実行する所も無いので、どれも効いていなかった。
- `outDir` は svelte-check の `--tsgo` を壊していた（「rootDir の外」のエラー）。tsgo は後回しにしたが、この削除は先に入れた。
- Vercel への成果物（`.vercel/output`）は adapter-vercel が決めるので、`outDir: "build"` とは関係しない。
- 削除の前後で、check・build・unit test の結果は変わらない。

### Phase 5: deploy のジョブの重複

- `vercel build` が install と `vite build` を自分で行うので、その前の `pnpm build` は重複していた。2024 年に migration の step と一緒に追加されたもので、必要だった記録は無い。
- `prisma migrate deploy` を `vercel build` の後に移し、「build が失敗したら DB を変えない」を保った。
- 今は build のときに DB を読む処理（prerender など）が無い。将来 prerender を入れると、migration 前の DB を読むことになるので注意する。

## 採らなかった案

- **rsvelte などの代替ツール:** 運用実績が少ない。
- **svelte-check の `--incremental`:** 2回目でも 4.1 秒で、tsgo（2.6 秒）より遅い。
- **Vite・adapter・`prisma generate` の調整:** それぞれ数秒で、削れる余地が小さい。
- **deploy を lint などと並行に走らせる:** lint・check が失敗した変更でも、preview の DB に migration が当たる。
- **workflow dependency lockfile（`actions.lock`）:** SHA 固定より強いが、GitHub 側は public preview、Renovate の対応も experimental。
- **oxfmt への移行:** 別 PR（[#2226](https://github.com/AtCoder-NoviSteps/AtCoderNoviSteps/issues/2226)、[計画](../../2026-10-21/oxfmt-migration/plan.md)）。移行すると Phase 1 は不要になるが、1行の変更なので先に入れた。

## 残りの確認（人が行う）

- [ ] Vercel のダッシュボードの Build Command が想定外のコマンドになっていないか（`vercel.json` には指定が無い）。
- [ ] PR の CI で4ジョブが並行に走り、時間が見込みどおり縮むか。
- [ ] PR の preview ジョブが成功し、preview の URL でログインできるか。production はマージ後の最初の実行で確かめる。
- [ ] マージ後の Renovate の action の更新 PR が、SHA とコメントを一緒に書き換えるか。

## 後で決めること

- **ESLint の `--cache`:** 測ってから判断する。
- **workflow dependency lockfile:** GitHub と Renovate の対応が安定したら、SHA 固定から乗り換えるかを決める。

## 確認限界

- CI の見込みは、分割前の `build (24)` の1回分の時間からの計算。
- `vercel build` そのものは token が要るので実行しておらず、`vite build` までで確かめた。
- actionlint は実行できず、workflow は yaml のパーサーと Prettier でしか確かめていない。
- Vercel のダッシュボードと branch protection の設定は、repo からは見えない。

## 付録: 計測（2026-10-19、devcontainer）

| コマンド         | 時間    | 主な内訳                                                     |
| ---------------- | ------- | ------------------------------------------------------------ |
| `pnpm build`     | 14.4 秒 | Vite 4.6 秒、adapter-vercel 2.3 秒、`prisma generate` 1.8 秒 |
| `pnpm lint`      | 11.6 秒 | prettier 9.3 秒、ESLint 4.4 秒、oxlint 0.1 秒                |
| `pnpm check`     | 10.6 秒 | svelte-check 9.3 秒                                          |
| `pnpm test:unit` | 6.0 秒  |                                                              |

- CI の `staging` の直近10回は、全体で 2分21秒〜2分50秒。
- 分割前の `build (24)` ジョブは 1分19秒。うち setup などジョブごとの固定分が約29秒、Build・Lint・Check・Unit test の本体が順に計48秒。
