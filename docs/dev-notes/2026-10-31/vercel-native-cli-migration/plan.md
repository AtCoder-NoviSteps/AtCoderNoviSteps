# Vercel CLI native配布への移行調査

## 概要・判断

通常vercel 65.9.0を@vercel/vc-native 65.9.0へ置き換えることは実現性が高い。2026-10-31のユーザー承認に基づき、依存・CIの置換とローカル検証を実装済み。Linux x64 CIのpull / build / deploy --prebuilt / alias setの実動作は、人のpush後のpreviewで最終確認する。

目的はnpmに展開する不要なJS依存とinstall scriptの削減。nativeは機能を選別したminimal CLIではなく、CLIをバイナリへまとめた配布形式なので、不要な機能・内部依存・脆弱性対応の責任まで消えるわけではない。

## 公式情報と配布物の確認（2026-10-31）

- [公式発表](https://vercel.com/changelog/experimental-native-binaries-for-vercel-cli)は2026-05-27、experimentalとして案内。外部Node runtime不要・code signing・macOSのkeychain分離・x64/arm64対応を説明している。この発表だけを根拠に現在GA済みとは判断しない。
- 発表の導入例はpnpm i -g @vercel/vc-native -f。-fは通常版とvercel / vcのbin名が衝突するため。本プロジェクトではglobal installせず、通常vercelを削除してdevDependencyを固定版で置き換える案とする。
- [npm通常版65.9.0](https://registry.npmjs.org/vercel/65.9.0)の直接dependenciesは37件。[native版65.9.0](https://registry.npmjs.org/@vercel%2fvc-native/65.9.0)は通常dependenciesなし、OS別native packageをoptionalDependenciesとして固定する。件数は推移依存総数・容量の削減実測ではない。
- 導入済みvercel/dist/vc.jsを読むと、通常65.9.0もLinux/macOSの対応環境ではnativeを優先し、JS経路はfallback。従って今回の候補は主に配布依存の整理であり、初めてnativeを実行する移行ではない。
- npm native packageのbin名はvercel / vcで同じ。プロジェクトのpnpm exec vercel呼び出しへ変更可能。既存pnpm vercelもbin名は一致するが、採用時は規約に合わせpnpm execを使う。

## install script・環境の制約

| 項目         | 確認結果と方針                                                                                                                                                                                                                                                                                                               |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| postinstall  | node ./postinstall.mjs。OS別packageのbinaryをlink/copy・chmodし、--versionを実行する。取得できない場合は一時directoryでnpm install --ignore-scriptsにfallbackする。pnpmの取得・age policyだけで全取得が完結するとは扱わない。                                                                                                |
| script拒否時 | 配布bin/vercel.exeはNode launcherとして残り、OS別packageを解決してbinaryをspawnする。allowBuildsで@vercel/vc-native: falseとして動作する案を先に検証する。これなら外部Nodeを使うが本プロジェクトはNode24が必要なので支障は小さい。今回のLinux arm64 glibcクリーン環境でinstall・起動成功を確認。Linux x64 CIは別途確認する。 |
| platform     | CIのubuntu-latest x64 glibcと、今回のlocal Linux arm64 glibc向けpackageあり。postinstallとfallback launcherはmusl名を明示選択しておらず、Alpineへ一般化しない。Windowsも同一条件で検証した扱いにはしない。                                                                                                                   |
| サイズ       | linux-x64 packageの展開サイズは約179MB。JS依存件数を減らせても最小容量とは限らず、通常版にもnativeが入るため置換前後のstore / lockfileを実測する。                                                                                                                                                                           |
| 更新         | @vercel/*は既存Renovate matchPackageNamesとminimumReleaseAgeExcludeに含まれる。新しい独自更新処理は不要、採用前にRenovateの対象・固定版更新を確認する。                                                                                                                                                                      |
| koffi        | native側manifestにkoffiのnpm依存はない。ただしbinary内に組み込まれた機能の不存在を意味しない。既存koffi: falseは、他の依存経路を調べるまで削除しない。                                                                                                                                                                       |

## 現行CIとの照合

| 契約                                                | 移行評価・検証事項                                                                                                                                                                    |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| pull --yes --environment=preview/production --token | nativeにpullの入口あり。既存token・project / team識別と.env生成をpreviewで確認する。global login・keychain・DPoPへの切替は不要。                                                      |
| build / build --prod                                | nativeにbuildの入口あり。ただしnative内CLIがNode subprocess・builderをどう起動するか、Kit3 / adapter7・Prisma generate・output生成まで実buildで確認が必要。                           |
| deploy --prebuilt / --prod --prebuilt               | nativeにdeployの入口あり。stdoutのURLとstderrの進捗分離がGITHUB_OUTPUT契約を維持すること、API認証・upload・終了値を確認する。                                                         |
| alias set                                           | nativeにalias setの入口あり。--scopeと--tokenを含む実割当はpreviewの通常経路で確認する。                                                                                              |
| DB migration                                        | 現行CIはbuild後deploy前にprisma migrate deployを実行する。CLI調査のためにmigrationを実行しない。preview検証は通常の承認済みCIと区別し、必要ならmigration stepを実行しない検証を作る。 |

## 実施済みの調査と限界

既存OS別native65.9.0に対し、資格情報を含まない最小env・一時HOME・CI=1・telemetry無効で--versionとpull / build / deploy / alias setの--helpを実行し、すべて終了値0。local arm64でversion表示は65.9.0 (native)。これは認証・実build・deploy成功の証明ではない。

全環境変数継承でのhelp実行は、秘密情報を依存コードに渡すリスクとして自動承認レビューが拒否した。最小envへ変更して調査を完了。資格情報のコピー・実deploy・DB操作・依存置換は行っていない。

## 承認後の段階計画（低リスク順）

1. **導入検証:** 分離環境でvercelを@vercel/vc-native 65.9.0へ置換し、allowBuilds falseのinstall・bin launcher・version/helpを確認。既存package設定を再利用し、テスト名は新規unit testでなくinstall / CLI smoke checkとする。通常版との併存・global force installはしない。
2. **依存削減とbuild:** lockfileでcli-auth / koffi / builder等の到達経路と依存件数・容量を比較し、通常pnpm build・lint・check・unit testを確認。native vercel buildはproject設定が必要なので、通常Vite build成功だけで代替しない。
3. **preview互換性:** 明示承認されたpreview環境でpull→native build→deploy --prebuilt→alias setを確認。stdout URL・失敗終了値・Kit output・Node24を確認し、DB migrationを調査目的で追加実行しない。CI変更はgithub-actions規約とsecret取扱いのcross-review要否を確認する。
4. **採用判断:** 以上が成功すればpackage.json・lockfile・allowBuilds・CIのpnpm exec呼び出しを本変更へ反映。productionは通常の人のレビュー・反映手順で確認。失敗時は依存を通常vercelへ戻し、常設の二重CLI fallbackは作らない。

## 採用しない案

- 通常CLIのbuilder依存をoverrideで空packageに差し替える案は、動的利用を壊すため採用しない。
- 全optional依存の無効化はVite等のnative依存も壊し得るため採用しない。
- OS専用packageを直接呼ぶ固定pathはlockfile差分をさらに減らせるが、開発環境・CIのarch差を吸収する独自launcherが必要になるため第一候補にしない。
- 公式setup.shの追随インストールは現行の固定版・pnpm lockfile管理から外れるため採用しない。

## 追加調査: 取得・Node・クリーン起動（2026-10-31）

### 調査条件

/tmp/vc-native-clean-6590に通常vercelを含まない小さなprivate packageを作り、@vercel/vc-nativeを65.9.0固定、専用pnpm store・空HOME・資格情報なしの最小env・telemetry無効で検証した。既存アプリの.env・.vercel設定・node_modulesは流用していない。検証hostはLinux arm64 glibc、導入に使用したpnpmは12.15.0。既存プロジェクトのpackageManager12.16.1とCI x64の組合せは未実測。

### 1. クリーン起動: 成功

allowBuildsに@vercel/vc-native: falseを指定してinstall成功。OSフィルター適用後の.pnpmに入ったpackageは@vercel/vc-nativeと@vercel/vc-native-linux-arm64の2件。postinstallを許可せず、Node fallback launcher経由で--version・build --helpが終了値0、65.9.0 (native)と表示した。通常版の残存や既存Vercel cacheに依存しない起動を確認した。

OS別binaryを直接起動した--versionはPATH=/nonexistentでも終了値0。binary自体に外部Nodeは不要だが、postinstall拒否時のlauncherは#!/usr/bin/env nodeなので外部Nodeが必要。本プロジェクトにはNode24があるため、この差はブロッカーではない。

### 2. Nodeの使い分け: 実測で分離

| 経路                      | 確認結果                                                                                                                                                                              |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| native CLI本体            | 自作の無害なNODE_OPTIONS require hookでprocess.versionを観測しv24.22.1、process.execPathはOS別native binaryだった。                                                                   |
| postinstall拒否時launcher | PATH上のNodeで起動し、native binaryをspawnする。アプリやCLI内部Nodeの版を変更しない。                                                                                                 |
| build / install command   | 架空projectの静的fixtureで、node --versionとnode probe.cjsを実行。v24.21.0・/usr/local/bin/nodeを出力し、CLI内蔵24.22.1ではなく外部Nodeを利用した。                                   |
| デプロイ先Function        | 今回はdeployしておらず未実測。adapter・engines・project設定による選択をnative内蔵Nodeと混同しない。採用前に本プロジェクトの.vc-config.jsonのruntimeがnodejs24.xになることを確認する。 |

CLI内蔵Nodeの更新はアプリbuild環境の更新代替にはならない。CIのsetup-node24とpackageManager固定は維持する。

### 3. 追加取得: 通常経路とfallbackを区別

資格情報なしの架空project設定・空preview env・依存なしのstatic fixtureに対しnative vercel build --debugが終了値0、.vercel/output生成と検証成功。@vercel/static-buildを使うbuild本体はログ上86ms、builderの追加install表示はなく、builder用node_modulesの新規installは観測されなかった。ただし通信監視でネットワーク要求ゼロを証明した検証ではなく、実アプリの全経路へ一般化しない。

配布CLIのimportBuilders実装にはmanaged builder用のembedded index / graph読込経路と、legacy builderのinstall経路がある。取得済みbuilderが存在しない・pin不一致・URL指定等では追加installへ進む処理が存在する。従ってnative版が常に完全offline、または全builderを将来にわたり追加取得しないとはいえない。

@vercel/vc-nativeのpostinstall自体にも、OS packageの解決や起動確認に失敗した場合にnpm install --ignore-scriptsで同版OS packageを追加取得するfallbackがある。今回はpostinstall拒否によりこの処理を実行せず、pnpmでOS packageを取得した。アプリ側依存のinstall・Prisma engine等の取得は別で、native化によってなくならない。

### 残る採用条件

クリーンinstall・script拒否起動・CLIとbuild commandのNode分離にはブロッカーなし。本プロジェクトのSvelteKit native buildでのbuilder追加取得、生成Function runtime、previewのpull / deploy / aliasとstdout URL・失敗終了値は未確認。次の検証ではbuilder cacheの変更とinstallログも記録し、起動fixture成功だけで本移行を完了扱いにしない。

既存プロジェクトの依存・CIは変更せず、認証・deploy・DB操作を行っていない。今回のfixtureはinstallCommandをnode --versionに置いたため、実アプリのpnpm install経路の検証にはならない。

## 実装開始（2026-10-31、ユーザー承認済み）

パッケージ管理・CI設定層の変更として通常vercelを同版nativeへ置換し、allowBuilds拒否を維持、既存CIコマンドをpnpm execへ統一する。設定のみで新規unit testは追加せず、install / native buildの実測と既存テストを検証とする。alias・DB migrationの手順や条件は変更しない。push・認証付きdeployはこのローカル作業では実行せず、変更レビュー後の既存PR CIで確認する。

## 実装結果（2026-10-31）

- [x] package.jsonのvercel65.9.0を@vercel/vc-native65.9.0へ置換し、pnpm installでlockfile更新。
- [x] allowBuildsに@vercel/vc-native: falseを追加。koffi: falseは既存の拒否方針として維持。postinstallのnpm fallbackを実行しない導入にする。
- [x] CIの7箇所をpnpm exec vercelへ統一。引数・secret参照・alias先・migration手順・実行条件は変更していない。
- [x] lockfile全documentのpackage記録は907 → 590件（317件削減）、lockfileは292,013 → 187,404 bytes。通常vercelの直接linkとkoffi / cli-authのlockfile経路は除去された。古い.pnpm storeの残存を含むディスク使用量やbinary内部依存総数の削減率ではない。
- [x] 本アプリの追跡ソースを/tmp/novisteps-native-app-buildへコピーし、envなし・最小環境・架空project設定でnative vercel build成功。依存は更新後node_modulesを参照し、installCommandはnode --version、本体buildCommandはpnpm build。実projectへのAPI接続・deploy・DB操作なし。
- [x] native buildは@vercel/static-build26.0.1をvlt経由で専用HOMEのcacheへ解決し、約42MB展開した。ログ上builderの追加npm installはなく、builder用JS packageがproject lockfileへ再導入されることもない。通信ゼロの監視検証ではない。pnpm build時の依存再検証でアプリのinstall / Prisma generateが再実行されたが、builderの再導入とは区別する。
- [x] 生成されたfunctions/![-]/catchall.func/.vc-config.jsonのruntimeはnodejs24.x。build output検証も0 problems。
- [x] pnpm install --frozen-lockfile・pnpm lint・対象ファイルのPrettier check・git diff --check成功。lintは既存auth_forms.test.tsの警告1件。pnpm checkは0 errors（既存30 warnings）。pnpm test:unit --runは101 files・2940 tests成功。
- [ ] 人のpush後、PRのLinux x64 CIでfrozen install・lint・check・unit test・previewのpull / native build / deploy / alias成功とURL出力を確認する。
- [ ] productionは通常の反映手順で確認する。

ローカル確認で移行を妨げる問題は見つからなかった。remote CI・preview・productionを確認済みとは扱わない。資格情報の追加要求・既存env共有・常設fallback・独自launcherは追加していない。
