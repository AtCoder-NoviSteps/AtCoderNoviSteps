# CI と型チェックの高速化、actions の SHA 固定

## 概要

Kit 3 への移行（PR B、branch `#4192`）の後、build・check が遅いと感じるという相談から、時間の内訳を測って4つの対策を選んだ。
あわせて、セキュリティのために、GitHub Actions の `uses:` を commit SHA と `# vX.Y.Z` のコメントの形に固定する。
PR B とは別の PR にし、PR B のマージ後に `staging` から branch を切る。
運用実績の少ない代替ツール（rsvelte など）は入れない。tsgo は型チェックの診断だけに使い、TypeScript 6 は残す。

## 計測（2026-10-19、devcontainer 上）

| コマンド         | 時間    | 内訳                                                                                             |
| ---------------- | ------- | ------------------------------------------------------------------------------------------------ |
| `pnpm build`     | 14.4 秒 | `prisma generate` 1.8 秒、Vite（server 2.6 秒・client 2.0 秒）、adapter-vercel の出力 2.3 秒など |
| `pnpm lint`      | 11.6 秒 | prettier 9.3 秒、ESLint 4.4 秒、oxlint 0.1 秒                                                    |
| `pnpm check`     | 10.6 秒 | `svelte-kit sync` 0.9 秒、svelte-check 9.3 秒                                                    |
| `pnpm test:unit` | 6.0 秒  |                                                                                                  |

- CI は `staging` の直近10回が全体で 2分21秒〜2分50秒。#4191 のマージ（2分44秒）では `preview` が 1分16秒で、残りが `build` ジョブ。
- `build (24)` ジョブの step ごとの時間（ユーザーが共有した平均的な実行、全体 1分19秒）:

  | 区分     | step と時間                                                                                   | 計   |
  | -------- | --------------------------------------------------------------------------------------------- | ---- |
  | 準備     | Set up job 2秒、Setup pnpm 6秒、Use Node.js 24 6秒、Install dependencies 10秒（checkout 0秒） | 24秒 |
  | 本体     | Build 13秒、Lint 11秒、Check 11秒、Unit test 13秒                                             | 48秒 |
  | 後片付け | Post Use Node.js 24 5秒（他は 0秒）                                                           | 5秒  |

  ジョブごとの固定の負担は約29秒。本体の4つは順に実行されるので、合計の48秒がそのまま掛かる。

- 今の `build` ジョブは build・lint・check・unit test を1つのジョブで順に実行する。preview・production のジョブは `pnpm build` の後に `vercel build` を実行する。`vercel build` は内部で install と build command を実行するので、その前の `pnpm build` が重複している（根拠は Phase 5）。`vercel build` 自体は `vercel deploy --prebuilt` に必要なので残す。
- svelte-check 4.7.7 の `--tsgo`: 使い捨てのコピーに `@typescript/native-preview@7.0.0-dev.20260707.2` を入れて測った。そのままでは「rootDir の外」の設定エラーが103件出る。`tsconfig.json` の `"outDir": "build"` を消すと、通常の check と同じ 0 errors・30 warnings になり、9.0 秒 → 2.6 秒。`.ts`・`.svelte`・テスト・`prisma/` に1件ずつ入れた型エラーを、通常の check と同じ位置ですべて検出した。表示のファイル数は 2740 → 約130 になるが、数え方の違い。
- `--incremental` も `outDir` が原因で同じエラーになる。`outDir` を消すと 2回目は 4.1 秒。
- `prettier --check . --cache`: 1回目 9.2 秒、2回目 1.7 秒。

## actions の現状（2026-10-20）

workflow は `.github/workflows/ci.yml` の1本で、3つの action を major tag で参照している（各3か所）。`git ls-remote --tags` で、各 repo の tag が指す commit を確かめた。

| action               | 現在の参照 | tag が指す版 | commit SHA                                 |
| -------------------- | ---------- | ------------ | ------------------------------------------ |
| `actions/checkout`   | `@v7`      | v7.0.1       | `3d3c42e5aac5ba805825da76410c181273ba90b1` |
| `actions/setup-node` | `@v7`      | v7.1.0       | `949feb2413d6458794dcd2491c4babbbce0c15c1` |
| `pnpm/action-setup`  | `@v6`      | v6.0.10      | `0977fd99725f1db4007ccb2928dbb4e90d06cc86` |

- `pnpm/action-setup` は annotated tag なので、tag object ではなく、tag が指す commit（`^{}` の行）を使う。v6.1.0 も出ているが、`v6` の tag はまだ v6.0.10 を指す。
- GitHub の公式の security hardening guide は、action を commit SHA に固定するよう勧めている。tag は「can be moved or deleted if a bad actor gains access to the repository storing the action」ため、作者を信頼していても危険がある。
- この workflow は `VERCEL_TOKEN` と、preview・production の `DATABASE_URL`・`DIRECT_URL` を扱う。action の repo が乗っ取られて tag が書き換えられると、これらが漏れうる。

## 方針

- **低リスクから順に入れる:** ローカルだけに効くもの（Phase 1・2）→ 挙動の変わらない CI の変更（Phase 3）→ CI の構成（Phase 4）→ 配備のジョブ（Phase 5）。
- **型チェックの正は tsc のまま:** CI の `pnpm check` は変えず、tsgo はローカル用の `check:fast` として足す。プレビュー版の tsgo が壊れても、影響は手元の型チェックの結果だけにとどまる。CI を tsgo に切り替えるかは、運用してから決める（「後で決めること」）。
- **`outDir` は消す:** tsc で出力することは無く（`$app/tsconfig` が `noEmit`、`vite build` は型を消すだけ）、`--tsgo`・`--incremental` を壊す原因になっている。同じ理由で効果の無い `sourceMap` も消す（source map は tsc が出力するファイルにしか付かない。Vite・Vitest の source map は tsconfig の外で決まる）。
- **SHA は今の tag と同じ commit にする:** 固定するだけで、動く action のコードは変えない。版の更新は Renovate の PR に任せる。
- **SHA の更新は Renovate に任せる:** `helpers:pinGitHubActionDigestsToSemver` は、digest を固定し、コメントを `vX.Y.Z` の完全な版にする preset。更新の PR は SHA とコメントを一緒に書き換える。
- **CI の check 名は残す:** `build` ジョブは matrix ごと残し、check 名 `build (24)` を変えない。lint・check・unit test は新しいジョブにする。
- **migration は build の成功後:** 今は `pnpm build` が migration の前にあり、build が失敗すれば DB は変わらない。二重 build を消すときに `prisma migrate deploy` を `vercel build` の後へ移し、この順序を保つ。

## 採らなかった案

- **rsvelte などの代替ツール:** 運用実績が少ない（ユーザー判断）。
- **CI の check を最初から `--tsgo` にする:** tsgo はプレビュー版で、tsc との差を見る期間が無い。
- **`--tsgo-experimental-api`:** svelte-check の help に experimental と明記されている。
- **svelte-check の `--incremental`:** 2回目でも 4.1 秒で、tsgo（初回から 2.6 秒）より遅い。CI で効かせるにはキャッシュの保存も要る。
- **ESLint の `--cache`:** 未計測。ESLint は 4.4 秒で、今回は prettier の方が大きい。
- **Vite・adapter・`prisma generate` の調整:** どれも数秒で、削れる余地が小さい。Vite 8 は既に Rolldown を使う。
- **preview の `needs: build` を外して並行に走らせる:** lint・check が失敗した変更でも preview DB に migration が当たる。
- **setup の step を各ジョブに複製する:** 4ジョブ×3 step の重複になる。composite action にまとめる。
- **workflow dependency lockfile（`.github/workflows/actions.lock`）:** GitHub の guide は「the strongest protection available, and supersedes SHA pinning」とし、間接的に使われる action も固定できる。ただし GitHub 側は public preview（「subject to change」）で、`gh actions-lock` という gh の拡張で生成する。Renovate も対応している（`actions.lock` があれば、action の更新のたびに `gh actions-lock` で作り直す）が、Renovate の docs は experimental と明記している。両方とも安定版ではなく運用実績が少ないので、今は SHA 固定にする。後で乗り換えるときは、`gh actions-lock` が SHA の固定を版の参照に戻す。
- **第三者の action（`pnpm/action-setup`）だけ固定する:** guide は第三者の action を主な対象にしているが、`actions/*` も tag で参照する限り同じ仕組みで書き換えられうる。3つしかないので全部固定する。

## スコープ外（別 PR）

- **oxlint・oxfmt への移行（formatter の置き換えを含む）:** [#2226](https://github.com/AtCoder-NoviSteps/AtCoderNoviSteps/issues/2226) で別 PR として扱う。この PR の lint は、prettier・oxlint・ESLint の今の構成のままにし、Phase 1 は prettier に `--cache` を付けるだけにする。
  - 確認の結果（2026-10-21、Kit 3 の branch の HEAD のコピー）: `oxfmt@0.74.0` は Svelte を有効にすると、`.svelte` の100ファイルすべてで Prettier と同じ結果になり、`--check` は 7.4 秒 → 0.97 秒。違いは `.ts` 2ファイルの union 型の改行などだけ。`oxlint` 1.88.0 には Svelte のルールが無いので、`.svelte` は ESLint のまま。詳細は #2226 に貼るコメントにまとめた。
  - prettier が `.prettierrc` を優先して読み、`prettier.config.js` の `prettier-plugin-tailwindcss` が使われていない問題も、#2226 の PR で扱う。
  - oxfmt に移ると Phase 1 の `prettier --cache` は不要になるが、変更は1か所だけなので先に入れる。

## フェーズ

### Phase 1: prettier の cache（ローカル）

- [x] `package.json` の `lint` を `prettier --check . --cache && oxlint . && eslint .` にする。cache は `node_modules/.cache/prettier/.prettier-cache`（`node_modules` ごと gitignore 済み）。既定の `--cache-strategy` は `content` で、prettier の版や設定が変わると cache は無効になる。
- [x] CI は `node_modules` を保存しないので効果は無いが、害も無い。lefthook の pre-commit は staged ファイルだけを整形するので変わらない。
- 確認: `pnpm lint` を2回流して時間を比べる。2回目の前に1ファイルの整形を崩し、cache があっても検出されることを確かめる。
- 設定のみで分岐が無いので、テスト先行は省略する。

### Phase 2: tsgo の型チェック（ローカル）

- [x] `tsconfig.json` から `"outDir": "build"`・`"sourceMap": true`・`"incremental": true` を消す（`incremental` は `noEmit` と併用でき、`tsc` を直接実行すれば `*.tsbuildinfo` に型チェックの情報を保存する。ただしこの repo には `tsc` を直接実行する script・lefthook・CI が無く、svelte-check も自分の `--incremental` を使わない限り読まないので、効果が無い。テンプレートにも無い。3つを消した後の `pnpm check`・`pnpm build`・`pnpm test:unit` でも `*.tsbuildinfo` は生成されなかった）。`pnpm check` が 2740 files・0 errors・30 warnings のまま変わらず、`pnpm build`・`pnpm test:unit` も通ることを確かめる。
- 消してよい根拠（2026-10-21 に確認）:
  - TypeScript の TSConfig Reference: `sourceMap` は「Source map files are emitted as `.js.map` … next to the corresponding `.js` output file」、`outDir` は「If specified, `.js` (as well as `.d.ts`, `.js.map`, etc.) files will be emitted into this directory」。どちらも出力のときだけ効く。`noEmit` は「Do not emit compiler output files like JavaScript source code, source-maps or declarations」。
  - `noEmit: true` は Kit が生成する `node_modules/$app/tsconfig.json` にあり、`tsconfig.json` は上書きしていない。Kit のソース（`src/core/sync/write_tsconfig/utils.js`）のコメントは「Vite handles the build and ignores this」。svelte.dev の docs は接続できず、ソースで確認した。
  - Vite の docs（vitejs/vite の `docs/guide/features.md`）: 「Vite only performs transpilation on `.ts` files and does **NOT** perform type checking」。Vite が読む `compilerOptions` の一覧（`isolatedModules`・`target`・`paths`・`jsx` など）に `sourceMap`・`outDir` は無い。
  - 出どころ: `sourceMap` は 2023 年の作成時のテンプレート（create-svelte 5.0.5）にあり、`outDir` はテンプレートの外で足したもの。現行の `sv create`（sv 1.1.1）の tsconfig は `extends: "$app/tsconfig"`・`strict: true`・`include` だけで、どちらも無い。
  - 確認: `git archive HEAD` のコピーで2つを消し、`pnpm check` は 2740 files・0 errors・30 warnings、`pnpm build` は成功、`pnpm test:unit --run` は 97 files・2726 tests が成功した。
  - デプロイとは無関係: Vercel に上げる成果物の置き場は tsconfig ではなく adapter が決める。adapter-vercel は `.vercel/output`（Build Output API）に固定で書き出し（ソースの `const dir = '.vercel/output'`）、CI の `vercel deploy --prebuilt` はそれを上げる。上の確認の `pnpm build` でも `.vercel/output` が生成され、`build/` は作られなかった。`build/` が成果物になるのは adapter-node の `out` の既定値（docs: 「It defaults to `build`」）で、この repo では使わない。
- [ ] `@typescript/native-preview` を devDependencies に exact で追加する（dev 版なので範囲指定にしない）。
- [ ] script を足す: `"check:fast": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json --tsgo"`。CI と lefthook は変えない。
- [ ] `renovate.json` に `@typescript/native-preview` の packageRule を足し、dev 版の毎日の更新を週1回にまとめる（例: `"schedule": ["before 9am on monday"]`）。
- [ ] `AGENTS.md` の Commands に `check:fast` を加え、「CI の正は `check`」と書く。
- 確認: `pnpm check:fast` が 0 errors・30 warnings。spike と同じく `.ts`・`.svelte`・テスト・`prisma/` に一時的な型エラーを入れ、`check` と `check:fast` の両方が同じ4件を出すことを確かめてから戻す。
- 設定・script のみなので、テスト先行は省略する。

### Phase 3: actions の SHA 固定

- [x] `ci.yml` の9か所の `uses:` を、「actions の現状」の表の SHA と `# vX.Y.Z` に置き換える。

  ```yaml
  - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
  - uses: pnpm/action-setup@0977fd99725f1db4007ccb2928dbb4e90d06cc86 # v6.0.10
  - uses: actions/setup-node@949feb2413d6458794dcd2491c4babbbce0c15c1 # v7.1.0
  ```

- [x] 作業の直前に `git ls-remote --tags https://github.com/<owner>/<repo>` で SHA を取り直す。fork ではなく各 action の公式 repo から取る（guide の注意）。
- [x] `renovate.json` の `extends` に `helpers:pinGitHubActionDigestsToSemver` を足す。
- 確認: `grep -rn 'uses:' .github` に tag だけの参照が残らない。PR の CI が今と同じく通る。マージ後の Renovate の PR（例: `pnpm/action-setup` v6.1.0）が SHA とコメントを一緒に更新する。
- 参照の書き換えだけで分岐が無いので、テスト先行は省略する。

### Phase 4: CI のジョブの並列化

- [x] setup を composite action にする（checkout は各ジョブに残す。local action の読み込みに必要なため）。Phase 3 の SHA を使う。Renovate の github-actions manager は `action.yml` も更新の対象にする。

  ```yaml
  # .github/actions/setup/action.yml
  name: Setup pnpm and Node.js
  inputs:
    node-version:
      default: '24'
  runs:
    using: composite
    steps:
      - uses: pnpm/action-setup@0977fd99725f1db4007ccb2928dbb4e90d06cc86 # v6.0.10
        with:
          package_json_file: package.json
          run_install: false
      - uses: actions/setup-node@949feb2413d6458794dcd2491c4babbbce0c15c1 # v7.1.0
        with:
          node-version: ${{ inputs.node-version }}
          check-latest: true
          cache: 'pnpm'
          cache-dependency-path: pnpm-lock.yaml
      - run: pnpm install # postinstall runs prisma generate
        shell: bash
  ```

- [x] `build`（matrix の node 24 を残す）・`lint`・`check`・`unit-test` の4ジョブに分ける。Prisma client は `pnpm install` の `postinstall` で生成されるので、check・unit-test に `prisma generate` は要らない。
- [x] `preview`・`production` の `needs` を `[build, lint, check, unit-test]` にする。
- lint・check・unit-test は build の出力を使わない: `tsconfig.json` が extends する `$app/tsconfig`（`node_modules/$app/`）は build ではなく `svelte-kit sync` が生成し、check は script の先頭の sync、unit-test は Vitest が読み込む SvelteKit の Vite plugin で生成する。lint は型情報を使わない（ESLint に `projectService`・`project` が無い）。
  - 確認（2026-10-21、devcontainer）: `git archive HEAD` を空のディレクトリ3つに展開し、それぞれ `pnpm install --frozen-lockfile` の後に1つだけを実行した。install 直後は `node_modules/$app`・`.svelte-kit` とも無い。`pnpm lint` は成功（既存の oxlint の warning 1件）、`pnpm check` は 2740 files・0 errors・30 warnings、`pnpm test:unit --run` は 97 files・2726 tests が成功。どのコピーにも `build/` は生成されず、lint のコピーには `.svelte-kit` も生成されなかった。
- [x] 人が行う: branch protection の required checks に `lint`・`check`・`unit-test` を追加する。今の required checks は repo から見えないので、admin が確認する。
  - 理由: 分割前は lint・check・unit test の失敗が `build (24)` に出ていた。分割後は別の check に出るので、追加しないと `build (24)` だけ通った PR がマージできてしまう（preview・production は `needs` で4つを待つので、配備は止まる）。
  - 対処（2026-10-21、admin）: この repo は Settings → Branches の Branch protection rules の方式。「Require status checks to pass before merging」の下に3つを追加した。
  - 「Require branches to be up to date before merging」は今回は変えない。入れると、マージのたびに他の PR で「Update branch」と CI のやり直しが要る。Renovate の PR が多く（`prHourlyLimit: 10`）、`rebaseWhen` の既定の `auto` は、この設定があると base が進むたびに PR を rebase するので、代償が大きい（`rebaseWhen` の挙動は docs で未確認）。
- 見込み: 各ジョブは固定の約29秒と自分の本体だけになるので、この段は「約29秒 + 最も遅い本体（Build・Unit test の13秒）」≈ 42秒（今は 1分19秒、約37秒短縮）。runner の使用時間は約2倍（4ジョブ × 約29秒 + 48秒 ≈ 2分44秒）になるが、public repo なので費用は掛からない。
- 確認: PR の CI で4ジョブが並行に走り、`build` の段の時間と全体の時間を、1分19秒・直近の 2分21秒〜2分50秒と比べる。

### Phase 5: preview・production の二重 build の削除

消すのは `vercel build` の前の `pnpm build` だけで、`vercel pull`・`vercel build`・`vercel deploy --prebuilt` は残す。根拠（2026-10-20 に調査）:

- 経緯: 2023-10 の #121 では deploy のジョブは `pnpm install vercel@latest` → `vercel pull` → `vercel build` → `vercel deploy --prebuilt` だけで動いていた（`pnpm install vercel@latest` は全依存も入れる）。2024-04 の #362 で `pnpm install`・`pnpm build`・`prisma migrate deploy` が migration のために一緒に追加された（`a6afb2d4`・`d0eb57b9`）。commit には `pnpm build` が必要だった失敗の記録は無い。
- `vercel deploy --prebuilt` は `vercel build` の出力を使う。CLI 64.5.0 の help: 「`--prebuilt`: Use in combination with `vc build`. Deploy an existing build」、例は `vercel build` → `vercel deploy --prebuilt` で、別の build は挟まない。
- `vercel build` が実行する build command は、ダッシュボードの設定が無ければ SvelteKit の preset の `vite build`（CLI の framework 定義）。`@vercel/static-build` は `installCommand` が未設定なら `runNpmInstall` で install も行う。
- `prisma migrate deploy` に build は要らない。CLI の help の option は `--schema` だけで、schema・migrations・接続先の環境変数で動く。
- 再現: `git archive HEAD` の新しいコピー（`node_modules`・`.svelte-kit` 無し）で `pnpm install`（`postinstall` が `prisma generate`）→ `vite build` だけを実行し、`.vercel/output`（`config.json`・`functions`・`static`）が生成された。`vercel build` 自体は Vercel の token が要るので実行していない。
- 公式 docs（vercel.com・prisma.io）は WebFetch が失敗し、shell からの取得も許可されていないため、CLI の help と配布コードで確認した。

- [x] preview・production のジョブから `pnpm build` の step を消す。Prisma client は `pnpm install` の `postinstall` で生成済み。
- [x] step の順序を `install → vercel pull → vercel build → prisma migrate deploy → vercel deploy` にする。build が失敗したら migration を当てない、という今の性質を保つ。
- [ ] 人が行う: Vercel のダッシュボードの Build Command を確認する（`vercel.json` に `buildCommand` は無い）。`vite build` だけでも client は生成済みなので動くが、想定外のコマンドなら先に揃える。
- 見込み: preview・production のジョブから Build の約13秒（`build (24)` の Build step と同じ処理）が減る。Phase 4 と合わせて、CI 全体は 2分21秒〜2分50秒 → 約1分30秒〜2分。
- 確認: PR の preview ジョブが成功し、preview の URL でログインできる。production はマージ後の最初の実行を見る。

## 後で決めること

- CI の check を `--tsgo` に切り替えるか: `check` と `check:fast` の結果の違いを数週間見て、違いが無ければ CI に `check:fast` を並べ、さらに問題が無ければ置き換える。ただし Phase 4 の後は Check（11秒）が最も遅い本体ではないので、切り替えても CI 全体の時間は縮まない。主な効果はローカルにとどまる。TypeScript 7 の安定版が出たら、svelte-check は `typescript` 7 以上も tsgo として検出するので、`@typescript/native-preview` から乗り換える。
- ESLint の `--cache`: 測ってから判断する。- workflow dependency lockfile: GitHub 側が GA になり、Renovate の対応から experimental が外れたら、SHA 固定から乗り換えるかを決める。

## 確認限界

- CI の step ごとの時間は、ユーザーが共有した `build (24)` の1回分だけで、preview・production のジョブの内訳は見ていない。Phase 4・5 の見込みはこの値からの計算で、実際の効果は PR の CI で測る。
- Vercel のダッシュボードの設定と、branch protection の required checks は repo から見えない。required checks の追加は admin が行い、agent は結果を見ていない。
- tsgo の計測は devcontainer の1台。CI の runner での時間は Phase 2 では測らない（CI では動かさないため）。
- workflow dependency lockfile は、GitHub docs の2ページ（security hardening guide と「workflow dependency lockfiles」）と Renovate の github-actions manager の docs だけで確認し、試していない。GitHub の plan・org の要件は docs に記載が無い。
