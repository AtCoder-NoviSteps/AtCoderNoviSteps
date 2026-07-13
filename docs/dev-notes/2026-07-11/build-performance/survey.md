# pnpm build / vitest 低速問題の調査

調査日: 2026-07-11

## 概要

`pnpm build` が約 30 秒、vitest が約 2,700 テストで約 30 秒かかる問題のボトルネック調査。環境は Mac Air M3 + OrbStack の Node コンテナ(Node v24.13.0、8 コア、RAM 11GiB)。コードベースは約 4 万行 / 350 ファイル。

**結論: コードベース規模の問題ではなく、(1) vitest の全ファイル jsdom 環境(最大要因・実測 5.5 倍)、(2) メモリ枯渇によるスワップ、(3) node_modules の virtiofs バインドマウント、(4) SvelteKit 2.x + Vite 8(rolldown)の guard プラグイン非効率、の複合。** 設定は「デフォルトのまま」で正しいが、デフォルトがこの環境・テスト構成に合っていない。

## 計測条件の注記

本調査の計測時、コンテナは**スワップ 8GiB 使用の高負荷状態**だった(RAM 11GiB ほぼ満杯)。そのため絶対値は平常時(約 30 秒)の約 5 倍に悪化している。**絶対値は割り引いて読む必要があるが、内訳の比率は構造的ボトルネックをそのまま示している。**

## 実測データ

再現コマンドと結果:

```bash
time pnpm exec prisma generate   # real 5.2s (sys 2.2s)
time pnpm exec vite build        # real 2m27s (user 1m46s, sys 37s)
time pnpm exec vitest run        # real 2m19s (user 5m45s, sys 3m10s)
```

### vite build の内訳

- クライアントビルド: 49.6s(1,140 モジュール変換)
- SSR ビルド: 1m46s
- PLUGIN_TIMINGS 警告: **`vite-plugin-sveltekit-guard` がプラグイン時間の 88%**、`vite-plugin-sveltekit-virtual-modules` 6%

### vitest の内訳(Duration 139.3s)

注意: 以下の項目はいずれも **wall clock ではなく全ワーカー横断の累積値**。またスワップ圧で膨張した状態の計測値(後述の node 環境実験では同一テストの tests が 8.7s だった = 約 2.5 倍膨張)。

| 項目                    | 時間            | 備考                                                                                        |
| ----------------------- | --------------- | ------------------------------------------------------------------------------------------- |
| tests(テスト本体)       | 累積 21.9s      | 平均 約 3ms/テスト。DB モックや nock を含む構成として普通(ボトルネックではないが速くもない) |
| environment(jsdom 構築) | **累積 687.2s** | 最大の無駄                                                                                  |
| import(モジュール読込)  | 累積 130.8s     | jsdom 本体の import + virtiofs + プロセス分離で増幅                                         |
| transform               | 累積 78.0s      | 同上                                                                                        |

sys 3m10s(カーネル時間)が user 5m45s に対して異常に大きいが、node 環境実験で virtiofs 同一のまま sys 23s に減少したため、大半は jsdom 構築に伴う大量のモジュール読込とメモリ圧(ページフォルト)由来。並列化はすでに効いている(fork プール 8 ワーカー、user 5m45s ÷ real 2m19s ≈ 2.5)。問題は並列の幅ではなく、各ワーカーがファイルごとに jsdom を構築する「重さ」。

### 検証実験: jsdom を外すと 5.5 倍速くなる

設定変更なし・CLI フラグのみ・スワップ 7.7GiB 使用中の同一コンテナで実測:

```bash
time pnpm exec vitest run --environment=node
# Duration 20.49s (transform 32.6s, import 56.1s, tests 8.7s, environment 0.12s)
# real 0m25.4s — 80 ファイル全パス(2,745 passed / 1 skipped)
```

- wall clock **2m19s → 25.4s**(このうち周辺負荷差も一部混在するが、environment 687s → 0.12s と import 半減は構造的な差)
- **DOM を参照するはずの 3 ファイルも node 環境でパス**(`typeof window` ガード等でブラウザ側分岐を通らずにパスしたと推測)。ただし「パスした = 同じ分岐をテストしている」ではないため、この 3 ファイルには `// @vitest-environment jsdom` を付ける方式を維持する(追記 Q&A 参照)
- jsdom × 8 ワーカーのメモリ消費がスワップを悪化させ、スワップが全体をさらに遅くする自己増悪ループも同時に解消される

### flaky テストの観測

初回フル実行で 1 件失敗 → 直後の再実行(`--bail=1`)では 2,745 件全パス。高負荷(スワップ使用中)時のみ失敗するタイミング依存のテストが 1 件存在する。ファイル特定は未実施。

## ボトルネック分析(影響度順)

### 1. vitest: 全 80 テストファイルが jsdom 環境で実行【設定・最大要因】

`vite.config.ts` で `environment: 'jsdom'` がグローバル指定されているが、実測で:

- `@testing-library/svelte` を import するテストファイル: **0 件**(パッケージ自体が未使用)
- DOM API(`window` / `document` / `localStorage`)を参照するテスト: **3 ファイルのみ**
  - `src/test/lib/stores/active_problem_list_tab.svelte.test.ts`
  - `src/features/tasks/stores/active_contest_type.svelte.test.ts`
  - `src/features/workbooks/stores/replenishment_workbook.test.ts`

残り 77 ファイルは純粋なユニットテストなのに、ファイルごとに jsdom 環境(重い DOM 実装の import + 初期化)を構築している。environment 累積 687s は純粋な無駄。CPU だけでなくメモリのピークも押し上げてスワップ突入(2)を誘発する、二重の悪化要因。node 環境実験で **wall clock 5.5 倍の改善を実測済み**。

### 2. メモリ枯渇とスワップ【環境】

計測時点で RAM 11GiB ほぼ満杯 + スワップ 8GiB 使用。平常時 30 秒のビルドが本調査で 2 分半かかった直接原因。スワップに乗った状態の Node プロセスは数倍遅くなる。

常駐の内訳(実測): VS Code Server 群 約 2.6GB + `vite dev` 648MB(PID 実測で確定、7/10 から常駐)+ claude 等。**テスト開始前からほぼ満杯**のところに jsdom × 8 ワーカーのピークが乗ってスワップに突入する構図。jsdom をやめること自体がメモリ対策にもなる。dev サーバーの再起動でベースラインも約 650MB 空く。

### 3. node_modules が virtiofs バインドマウント【環境・二番手(追加効果は未実測)】

`compose.yaml`:

```yaml
volumes:
  - .:/usr/src/app:cached
  - ./node_modules:/usr/src/app/node_modules:cached
```

node_modules の実体が mac ホスト側にあり、コンテナからの open/stat/read が 1 回ずつ virtiofs(VM 境界)を越える。Node のモジュール解決は小さいアクセスを数千回行うため累積する。node 環境実験でも import 累積 56s が残っており短縮余地はあるが、named volume 化による追加効果は A/B 未計測。`:cached` フラグは Docker Desktop 時代の指定で、OrbStack の virtiofs では効果がない。

### 4. vite build: sveltekit-guard プラグインが 88%【upstream】

SvelteKit 2.x のプラグインは rolldown-vite(Vite 8)の hook filters に未対応で、全モジュールが JS プラグインフックを通過する。[sveltejs/kit#13756](https://github.com/sveltejs/kit/issues/13756)(Adopt rolldown-vite hook filters)で解決済みだが **milestone は 3.0** — kit 2.69.2 では対処不可、SvelteKit 3.0 待ち。

補足([公式 docs](https://vite.dev/guide/api-plugin) 確認済み):

- 88% は「プラグイン処理時間のうち guard が占めた割合」であり、ビルド総時間の 88% ではない
- sveltekit-guard = サーバー専用モジュール(`$lib/server`、`$env/*/private` 等)のクライアント混入を全モジュール検査で防ぐ門番プラグイン
- hook filters = Rolldown 発の仕組み(Vite 6.3+ / Rollup 4.38+)。フックに静的パターン(`filter: { id: /\.svelte$/ }` 等)を宣言すると、Rust 側で照合して不一致モジュールは JS フック呼び出し自体をスキップできる。Vite 8 はコアが Rust(Rolldown)のため、filter なしだと全モジュール × 複数フック × 2 パス(クライアント + SSR)で Rust→JS 境界越えのコストが発生する — これが 88% の正体
- kit 3.0 に更新するだけで(本プロジェクト側の変更なしに)解消される見込み。ただしプラグイン時間がビルド総時間に占める割合は未計測のため、短縮幅は見積もれない(Rust 側のバンドル処理は filter では縮まない)

### 5. vitest デフォルト設定(pool: forks、isolate: true)【設定】

ファイルごとにプロセスを分離し全依存を再 import するため、3 の virtiofs コストと掛け算になり import 130s / transform 78s に増幅されている。

## 対策 TODO

[todo.md](./todo.md) に分離。upstream 待ち（SvelteKit 3.0 / kit#13756）は対応不可のため TODO 対象外。

## 期待効果の見積もり

| 対策                    | 根拠                                                                                           |
| ----------------------- | ---------------------------------------------------------------------------------------------- |
| jsdom → node デフォルト | **実測済み: wall clock 2m19s → 25.4s(5.5 倍)**。メモリ消費減によるスワップ緩和も同時に得られる |
| named volume 化         | node 環境実験後も残る import 累積 56s の短縮余地(追加効果は A/B 未計測)                        |
| スワップ解消            | 今回の実測 5 倍悪化ぶんが戻る(30 秒台の平常値に安定)                                           |
| kit 3.0(将来)           | vite build のプラグイン時間 88% を占める guard のオーバーヘッド解消                            |

テスト本体は累積 8.7s(node 環境実測)と健全なため、上記がすべて入れば vitest は実行時間の大半がテスト本体という妥当な状態(wall clock 10 秒前後)に近づく見込み。

## 追記: レビュー Q&A(2026-07-11)

批判的レビューで判明した訂正と、質疑の要約(訂正は本文に反映済み)。

**Q. sys 3m10s は virtiofs の積算?(本文の「最大要因」は正しい?)**
訂正。node 環境実験では virtiofs 同一のまま sys が 3m10s → 23s に激減した。sys の大半は jsdom × 80 回の構築とメモリ圧(ページフォルト)由来。**優先順位は「jsdom が最大要因(実測 5.5 倍)、named volume 化は二番手(追加効果は A/B 未計測)」に訂正**する。

**Q. node_modules マウントは「ローカルと VM の往復」で遅い?**
ファイルのコピー往復ではなく、実体が mac 側にあるため open/stat/read が 1 回ずつ VM 境界(virtiofs)を越えるオーバーヘッドの積算。Node のモジュール解決は小さいアクセスを数千回行うため累積する。

**Q. メンバーに Docker Desktop 利用者がいるが named volume 化して大丈夫?**
問題ない(記法は両ツール共通)。根拠の確度は分けて記す:

- OrbStack: **公式明文あり**。volume は「Linux 側に直接格納されバインドマウントよりはるかに高速」「For best performance, use volumes when possible」([公式 docs](https://docs.orbstack.dev/docker/file-sharing))
- Docker Desktop: **格納場所からの推論**。公式 docs は「volume は `/var/lib/docker/volumes/` に格納」「コンテナ・イメージは VM のディスクイメージ内」とまでは明記するが、bind mount との性能比較の明文は確認できず。構造上ファイル共有を経由しないため速いはず、という推論(コミュニティでは定説)
- pnpm: ストアを別ファイルシステムに**明示固定した場合のみ**ハードリンク → コピーにフォールバック([公式 FAQ](https://pnpm.io/faq))。**デフォルト設定ではファイルシステムごとにストアを自動作成するためリンクは維持される**。named volume 化で特別な設定は不要

**Q. VS Code ターミナルの pnpm はホスト側で動いている?**
勘違い。vscode-server(linux-arm64)がコンテナ内に常駐する Dev Containers 構成のため、**統合ターミナルはコンテナ内**(`uname -s` が `Linux` なら確定)。`~/.gitconfig` と `~/.ssh` がマウントされているため git がホスト同然に動き、区別がつきにくいだけ。したがって named volume 化しても VS Code ターミナルからの commit(lefthook)は壊れない。ホスト側 commit への影響は当初懸念より小さい(次項の Q&A 参照)。

**Q. メモリは単純に不足している?**
「ベースラインでほぼ満杯 + テストのピーク」の複合。ベースライン実測: VS Code Server 群 約 2.6GB + `vite dev` 648MB(PID 実測で正体確定、7/10 から常駐)+ claude 等。そこに jsdom × 8 ワーカーのピークが乗ってスワップ突入。jsdom 廃止はピーク削減を兼ねる。dev サーバーの再起動でベースラインも約 650MB 空く。

**Q. jsdom 環境 = コンポーネントテスト用の環境を単体テストでも実行している?**
その通り。jsdom は `document`/`window` を再実装した擬似ブラウザで、本来 `@testing-library/svelte` の render に必要なもの。現状コンポーネントテスト 0 件なのに全 80 ファイルで毎回起動していた。

**方針の再訂正(jsdom アノテーション)**: 「node 環境でパスした = 同じものをテストしている」ではない。`typeof window` ガードがあるとブラウザ側分岐(localStorage 永続化など)を通らずにパスし、カバレッジが静かに落ちる。コストはほぼゼロのため、**DOM 参照のある 3 ファイルには `// @vitest-environment jsdom` を付ける当初方式を維持**する。

**Q. lint が落ちた PR を送ってくるメンバーがいるのはこれが原因?**
その可能性が高い。`.git/hooks/pre-commit`(lefthook 生成スクリプト)の実物を確認した結果:

- フォールバックの全候補で lefthook の実体が見つからない場合、`echo "Can't find lefthook in PATH"` を出すだけで **exit 0(commit は素通り)**。GUI クライアントではこの表示すら見えない
- フックにはコンテナ内で生成された `/usr/src/app/node_modules/.pnpm/lefthook-linux-arm64@2.1.10/...` というハードコードパスがあり、mac には存在しない
- pnpm install はコンテナ(Linux)内で実行されるため、node_modules には **linux-arm64 バイナリしか入っておらず**、ホスト側から node_modules が見えている現状でも mac で実行できる lefthook はない

つまり **mac ホスト側からの commit(Terminal / GUI クライアント / Claude Desktop + ローカル MCP 等)は現状でも lefthook が静かにスキップされ、lint なしで commit される**。クラウド経由(Claude Code Web 版、GitHub 直接編集)もフック自体が clone に含まれないため元から未実行。lint の最終防衛線は PR の CI のみ。

対処の選択肢: (a) 「commit はコンテナ内(VS Code 統合ターミナル / Source Control)から」を周知、(b) CI の lint を required check 化、(c) フックに頼らず CI 側で自動修正。現実的には (a)+(b)。

**Q. Windows(Docker/WSL)のメンバーは lefthook-windows 版がなくてスルーされる?**
バイナリ不在は事実(pnpm install は実行環境のプラットフォーム分しか入れないため、各自の node_modules に windows 版はない)。ただし挙動は経路で異なる(lefthook の JS ラッパー実コード確認済み):

- node_modules が見える経路(C:\ 側から commit 等)では `lefthook/bin/index.js` が MODULE_NOT_FOUND で exit 1 → **静かなスルーではなく、うるさくブロック**される
- WSL 内 clone + WSL から commit なら linux-x64 バイナリがそのまま動く(lint 実行には WSL に pnpm/node が必要)
- **無音でスルーされるのは「`.git/hooks` にフック自体が未インストールの clone」か「`--no-verify` / `LEFTHOOK=0` の常用」のみ**。lint 落ち PR が繰り返し来る観測に合うのはこの 2 つ。確認は本人の `ls .git/hooks` と commit 手順のヒアリング

**Q. CI は lint 失敗で止まる設定済み。それで十分?**
最終防衛線としては十分。確認するなら「CI が落ちる」と「落ちたらマージ不可」は別設定という点のみ(branch protection / ruleset で lint を required status check に指定していなければ赤い PR もマージ可能)。残る問題は品質ではなくノイズ(レビュー往復・CI 無駄実行)なので、本人の環境是正か、コスパが合わなければ放置も合理的。
