# Dependabot アラート調査: 依存元・解消手段・代替案

初回 2026-08-07 / 更新 2026-11-04。対処はブランチ `chore/fix-dependabot-alerts`（`staging` `f09421b7` から分岐）。

## 結果

open だった 23 件（high 11 / moderate 10 / low 2）は全て開発用ツール経由の推移的依存で、本番の実行時コードには載らない。前回の大半を占めた vercel CLI 由来は、`@vercel/vc-native` への置換（2026-10-31）で解消済みだった。今回は 3 つの commit で 19 件を解消し、high は 0 件になった（`pnpm audit` で確認。Dependabot 側は `staging` へのマージ後に閉じる）。

| commit     | 内容                                                                  | 解消                |
| ---------- | --------------------------------------------------------------------- | ------------------- |
| `134ec0ab` | `pnpm update brace-expansion undici joi postcss-selector-parser`      | 15 件               |
| `7293ad96` | 未使用の `@eslint/eslintrc` と brace-expansion 1 系の override を削除 | 3 件                |
| `6c2c263c` | override `'deepmerge-ts@<8.0.0': '8.0.2'` を追加                      | 1 件（最後の high） |

残る 4 件は、どれも発火する経路がないか修正版がないので、全て dismiss する（後述）。

## アラート一覧

| アラート                 | 深刻度              | パッケージ（旧 → 修正版）             | 依存元（宣言レンジ）                                  | 状態               |
| ------------------------ | ------------------- | ------------------------------------- | ----------------------------------------------------- | ------------------ |
| #225、#239〜#244 の 3 件 | high 3 / moderate 1 | brace-expansion 5.0.8 → 5.0.12        | `minimatch@10.2.6`（`^5.0.8`）                        | 解消（`134ec0ab`） |
| #246〜#248、#250〜#254   | high 4 / moderate 4 | undici 8.12.1 → 8.12.3                | `jsdom@30.1.3`（`^8.12.1`）                           | 解消（`134ec0ab`） |
| #258                     | high                | joi 17.13.8 → 17.13.9                 | `sveltekit-superforms@3.1.0`（`^17.13.8`）            | 解消（`134ec0ab`） |
| #249、#235               | moderate / low      | postcss-selector-parser 7.1.1 → 7.1.7 | `svelte-eslint-parser@1.10.0`（`^7.0.0`）             | 解消（`134ec0ab`） |
| #239〜#244 の 3 件       | high 2 / moderate 1 | brace-expansion 1.1.18 → 1.1.21       | `@eslint/eslintrc` → `minimatch@3.1.5`                | 解消（`7293ad96`） |
| #234                     | high                | deepmerge-ts 7.1.5 → 8.0.2            | fabbrica → `@prisma/config@6.19.0`（完全固定）        | 解消（`6c2c263c`） |
| #200                     | moderate            | uuid 9.0.1 → 11.1.1                   | fabbrica → `short-uuid@5.2.0`（完全固定）             | dismiss 予定       |
| #257                     | moderate            | minimatch 10.2.6 → 11.0.1 以降        | eslint 系 3 経路、nft → glob                          | dismiss 予定       |
| #256                     | moderate            | glob 13.0.6 → 14.0.2 以降             | adapter-vercel → `@vercel/nft@1.10.2`（`^13.0.0`）    | dismiss 予定       |
| #255                     | low                 | deepmerge 4.3.1 → なし                | `@sveltejs/vite-plugin-svelte`・`flowbite-datepicker` | dismiss 予定       |

#239〜#244 は同じ GHSA の 1 系・5 系の組で、どちらが 1 系かは画面から判別できない。

## 再発の原因

- `lockFileMaintenance` が無効なので、Renovate は推移的依存を更新しない。15 件は、依存元のレンジ内に修正版があるのに lockfile が古いままだった
- override `'brace-expansion@>=1.0.0 <1.1.13': '1.1.18'` のピン先が、また脆弱になった（教訓 3）
- #200・#225 は前回からある番号で、脆弱な版はずっと lockfile に残っていた。閉じた理由は修正ではない。23 件が同時刻に開いた原因は未確認

## 決定と根拠

**lockfile 更新（15 件）。** 依存元の宣言は `^` レンジなので、lockfile を作り直せば誰の環境でも修正版になる。`npm diff` で見た差分は、brace-expansion が上限の追加、undici がセキュリティ修正（jsdom 経由でテスト時のみ使用）、joi が約 20 行（実行されない）。postcss-selector-parser 7.1.7 は `:not( )` の AST などの挙動も変えるが、ESLint の出力は変わらなかった。override で上げる案は、設定に残骸が残るので採らなかった。

**`@eslint/eslintrc` の削除（3 件）。** Flat Config（`FlatCompat` 不使用）からも、`eslint@10` を含む他のパッケージからも使われていなかった。brace-expansion の override のピンを 1.1.21 に直す案は、未使用の依存を残すだけなので採らなかった。

**deepmerge-ts の override（1 件）。** `@prisma/config@6.19` が 7.1.5 に完全固定しており、fabbrica は Prisma 7 に対応していない。8.0 の破壊的変更（`deepmergeInto`・型名・Map）は、`@prisma/config` が使う `deepmerge()` に関係せず、`@prisma/config@7.10.1` も 8.0.2 を同じ呼び方で使う。呼ばれるのは `prisma.config.ts` の読み込み時だけなので dismiss も可能だったが、high なのでメジャーを跨ぐ override を選び、外す条件をコメントに書いた。根本解消は fabbrica の廃止（[prisma-upgrade/plan.md](../../2026-07-20/prisma-upgrade/plan.md) Phase 3）で、そのとき uuid と override の `effect`・`defu` も消える。

**uuid は dismiss。** `short-uuid` は `uuidV4()` を引数なしで呼ぶだけで、脆弱な `buf` の経路を通らない。`short-uuid` 6 系への override は、デフォルトエクスポートが消えて fabbrica が壊れるので採らない。

**deepmerge は dismiss。** 修正版が存在しない。vite-plugin-svelte はビルド時に自前の設定をマージするだけで、外部入力は渡らない。

## minimatch と glob: dismiss に決定

公式 advisory によると、minimatch（#257）が発火するには、`optimizationLevel >= 2` であることと、攻撃者が glob パターンを指定できることの両方が必要。

- lint 系（`eslint`・`@eslint/config-array`・`@typescript-eslint/typescript-estree`）は既定の level 1 で呼んでおり、条件を満たさない
- nft 経由の glob は level 2 を設定するが、パターンを攻撃者は指定できない。本プロジェクトのビルドで nft が glob を呼ぶのは 2 回だけで、どちらも Prisma のクエリエンジンを探す定数パターン（`<@prisma/client>/.prisma/**/*.so?(.*)`）だった。ほかの呼び出し元も、トレース対象のソースコードを静的に評価してパターンを作る
- glob（#256）は、AbortSignal で中断した後も探索が続く問題で、nft は `signal` を渡していない

発火する経路がないので、#257 と #256 は dismiss する。設定に何も残らず、eslint と nft が新しい版に追従すれば、lockfile の更新だけで消える。

**採らなかった案: override 4 行で解消する。** 隔離した worktree で動くことは検証した。次の override を足し、不要になる `'minimatch@>=10.0.0 <10.2.3': '10.2.6'` を消すと、minimatch 10 系と glob 13 が lockfile から消え、残りは uuid と deepmerge だけになった。

```yaml
'@vercel/nft>glob': '14.0.3'
'eslint>minimatch': '11.0.4'
'@eslint/config-array>minimatch': '11.0.4'
'@typescript-eslint/typescript-estree>minimatch': '11.0.4'
```

この構成で、ESLint の対象ファイルの選び方（波括弧・`**`・括弧つきの ignore を含む 4 パターン）、ESLint の出力、ユニットテスト、ビルド成果物、nft の glob 呼び出しごとの結果が、変更前と全て一致した。それでも採らなかったのは、依存元の宣言レンジ（eslint の `^10.2.6`、nft の `glob@^13`）を越えて版を固定し続けることになるためである。上流の更新に追従できず、上流が追いついたら手で外す必要がある。また glob 14 は Vercel 上で Prisma のエンジンを見つける処理に効くので、採るなら preview デプロイでの確認も要る。上記の override は、将来アラートを再評価するときにそのまま使える。

ほかに採らなかった案: glob 13 に minimatch 11 を強制する（例外を出さずにワイルドカードの検出結果が空になる）、全 minimatch を一律に v11 にする、glob 13 の同梱コピーごと `pnpm patch` で直す（保守が重い）。override の版を v11 に変えるだけの PR #4295 は、10.2.6 が残って解消にならないのでクローズした。

## 検証の方法と結果

- 変更前に基準を取った: ESLint の JSON 出力（対象ファイルと指摘）、ユニットテスト（104 ファイル・3027 件）、`.vercel/output` のファイル一覧と sha256（616 ファイル）、`prisma/.fabbrica` と `ERD.md` の sha256。変更なしで 2 回ビルドすると、バージョンを含む 3 ファイル（`instance.js`・`internal.js`・`_app/version.json`）だけが変わるので、比較から除いた
- 3 つの commit とも、各段階で上記が全て一致し、`pnpm lint`・`pnpm check`・`git diff --check` も通った。`pnpm audit` は 23 件 → 8 件 → 5 件 → 4 件
- deepmerge-ts 8.0.2 で、一時ディレクトリの `prisma.config.ts` を `@prisma/config` の `loadConfigFromFile` で読み、deepmerge を通る経路がエラーなく動くことを確かめた。`db:seed` は実行していない。seed の実行時に読まれるのは `@quramy/prisma-fabbrica/lib/internal` だけで、`@prisma/internals` を読むのは generator（`prisma generate`）だけだからである
- minimatch と glob の実験は、`git worktree` で本体と分けて行い、終了後に削除した。nft の glob 呼び出しは `Module._load` のフックで記録し、glob 13 と 14 で比べた
- クロスレビューは、AGENTS.md の条件（30 ファイル以上、認証、DB、公開インターフェース）に当たらないので行っていない

## 教訓（次回の調査で最初に読むこと）

1. `pnpm audit` は候補出しに使い、結論は lockfile の `snapshots:` で出す（初回は 23 件中 17 件が誤検知だった）
2. override の前に、依存元のレンジ内に修正版があるかを見る。あれば `pnpm update` で済み、設定に残骸が残らない
3. override のレンジ上限とピン先を一致させる（`'pkg@<1.1.21': '1.1.21'`）。ずれていると、ピン先が後で脆弱になってもレンジに再マッチしない
4. override は依存元のレンジを無視して強制されるので、最小の修正版を選ぶ。意図してメジャーを跨ぐなら、依存元が使う API と、上流の後継版がその版を採用しているかを確認する
5. 更新の前に、削除できるか（使われているか）と dismiss できるか（advisory の発火条件を満たす経路があるか）を判定する。ある advisory の判断を、別の advisory に流用しない
6. override は、依存元が同梱したコードには届かない。ファイル探索に関わる変更は、終了コードではなく検出結果と成果物で確認する
7. 出力を比較する前に、変更なしでのノイズを測り、比較したい処理が実際に動いたかを確かめる（例: nft の glob 呼び出しを記録する）。そうしないと「一致した」が空振りになる

## 残タスクと未検証

- [ ] push と PR の作成（人間が実施）
- [ ] GitHub 上での dismiss（人間が実施）。理由は、#200 uuid と #256 glob が Vulnerable code is not actually used、#257 minimatch と #255 deepmerge が Risk is tolerable to this project（minimatch は nft の経路で脆弱なコード自体は実行されるため、not used ではなく tolerable にする）
- [ ] 任意: `lockFileMaintenance` の採否（差分の大きさと `minimumReleaseAge` などとの相互作用は未検証）
- [ ] fabbrica の廃止時に、deepmerge-ts・effect・defu の override を外す
- 未検証: preview・production での動作、Windows でのローカルビルド（CI と Vercel は Linux）、flowbite-datepicker 経路の deepmerge が実行時に読まれるか、アラートが一斉に開いた原因

## 調査方法

`gh` が未認証なので、アラート一覧は画面から共有してもらい、`pnpm audit` の 23 件と 1 対 1 で照合した。各パッケージは lockfile の `snapshots:`（解決済みの版と依存元）、`pnpm view`（修正版とレンジ）、`npm pack` / `npm diff`（CHANGELOG と dist）、`node_modules` の呼び出し箇所（到達性）の順に確認した。minimatch と glob は、公式 advisory、PR #4295（head `fa8b8ae0`）の差分と CI 結果、glob の changelog とタグ差分もあわせて照合した。
