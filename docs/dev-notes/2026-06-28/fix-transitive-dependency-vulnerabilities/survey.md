# Dependabot セキュリティ脆弱性の調査

対処計画・実施結果は [plan.md](plan.md) を参照。

## Context

`pnpm audit` で **high 17件**、moderate 16件、low 5件の脆弱性が検出されている。ほぼ全てが transitive dependency（依存先の依存ライブラリ）由来で、直接依存のバージョンを上げても親パッケージが内部で古いバージョンを指定しているため解消されないケースが大半。

## 調査結果サマリ

### High 脆弱性の分類

| パッケージ                               | 脆弱性                           | 経由元                                                       | 本番影響                                                          | 対処                             |
| ---------------------------------------- | -------------------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------- | -------------------------------- |
| **path-to-regexp** (6.1.0, 8.2.0, 8.3.0) | ReDoS (2件)                      | `vercel` → `@vercel/node`, `@vercel/fun`, `@vercel/backends` | **なし** (devDependency, ローカルCLI/ビルドツール)                | vercel更新 + overrides           |
| **tar** (7.5.7)                          | symlink/hardlink traversal (3件) | `vercel` → `@vercel/fun`                                     | **なし** (devDependency)                                          | overrides                        |
| **minimatch** (10.1.1)                   | ReDoS (3件)                      | `vercel` → `@vercel/python-analysis`                         | **なし** (devDependency, Python解析用)                            | overrides                        |
| **undici** (5.28.4, 6.27.0)              | TLS bypass, DoS, WebSocket (5件) | `vercel` → `@vercel/node`, `@vercel/blob`                    | **なし** (devDependency)                                          | vercel更新で一部改善 + overrides |
| **effect** (3.18.4)                      | AsyncLocalStorage context汚染    | `@quramy/prisma-fabbrica` → `@prisma/internals`              | **なし** (devDependency, テストデータ生成)                        | overrides                        |
| **defu** (6.1.4)                         | prototype pollution              | `@quramy/prisma-fabbrica` → `@prisma/config` → `c12`         | **なし** (devDependency)                                          | overrides                        |
| **devalue** (5.6.4)                      | sparse array DoS                 | `sveltekit-superforms`                                       | **潜在的あり** (superformsがサーバーデータのデシリアライズに使用) | overrides                        |

### 重要な所見

1. **本番影響はほぼゼロ**: `vercel` は devDependency（ローカル CLI / CI ビルドツール）。`@quramy/prisma-fabbrica` もテストデータ生成用の devDependency。本番デプロイ環境（Vercel プラットフォーム側）はこれらのパッケージを使わない
2. **唯一の注意点**: `devalue` は `sveltekit-superforms` 経由で本番にも影響しうるが、`@sveltejs/kit` 自体は既に 5.8.1 を使用済み。superforms が内部で古い 5.6.4 を持つだけで、実際の devalue 呼び出しは kit 側の 5.8.1 が使われる可能性が高い
   - 参考: https://github.com/ciscoheat/sveltekit-superforms/issues/687 （本プロジェクトメンバーが作成したPR）。`pnpm.overrides` で devalue を 5.8.1 に上書きした上で単体テストを実行した限りでは pass している
3. **vercel 54.14.5 → 54.18.0 では大半の内部パッケージバージョンが据え置き**: `@vercel/fun` は 1.3.0 のまま。path-to-regexp, tar, minimatch は修正されない

## リリースノート確認結果

### High 脆弱性対象

リリースノートを確認した上での互換性評価。全パッケージで **breaking change なし**。

| パッケージ         | 変更前 → 変更後     | リリースノート要約                                                                                                                                                                                                                                                 | breaking change |
| ------------------ | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------- |
| **path-to-regexp** | 6.1.0 → 6.3.0       | backtrack protection の追加のみ（[#324](https://github.com/pillarjs/path-to-regexp/pull/324)）                                                                                                                                                                     | なし            |
| **path-to-regexp** | 8.2.0/8.3.0 → 8.4.0 | wildcard backtracking 制限、optional route の組合せ上限（256）追加、regex prefix 最適化。パフォーマンス改善（コンパイル 25%、パース 20% 高速化）                                                                                                                   | なし            |
| **tar**            | 7.5.7 → 7.5.16      | symlink chain 経由の hardlink path traversal 修正（CVE-2026-26960）。hardlink 解決時の文字列ベースチェックを実パス解決に変更                                                                                                                                       | なし            |
| **minimatch**      | 10.1.1 → 10.2.3     | `braceExpandMax` オプション追加（新機能）+ ReDoS 修正。既存 API への変更なし                                                                                                                                                                                       | なし            |
| **undici**         | 5.28.4 → 5.28.5     | セキュリティリリース（CVE-2025-22150）のみ                                                                                                                                                                                                                         | なし            |
| **undici**         | 6.x → 6.27.0        | 6.24.0: 5件のセキュリティ修正（WebSocket DoS、CRLF injection、HTTP smuggling 等）。6.26.0: chunked HTTP/1 EOF validation 修正。6.27.0: 4件のセキュリティ修正（WebSocket DoS CVE-2026-12151、Set-Cookie injection CVE-2026-9679 等）。全てセキュリティ/バグ修正のみ | なし            |
| **undici**         | 7.25.0 → 7.28.0     | 7.26.0: chunked HTTP/1 EOF validation 修正。7.27.0: Node 26 対応。7.28.0: 7件のセキュリティ修正（WebSocket DoS CVE-2026-12151、TLS bypass CVE-2026-9697、cross-origin routing CVE-2026-6734 等）。全てセキュリティ/バグ修正のみ                                    | なし            |
| **effect**         | 3.18.4 → 3.20.0     | `AsyncLocalStorage` のファイバー間分離修正、`Schema.omit` バグ修正、`TupleWithRest` バリデーション改善                                                                                                                                                             | なし            |
| **defu**           | 6.1.4 → 6.1.5       | `__proto__` 経由の prototype pollution 防止。継承された enumerable プロパティの無視                                                                                                                                                                                | なし            |
| **devalue**        | 5.6.4 → 5.8.1       | sparse array の DoS 修正（5.8.1）、`stringifyAsync` 追加（5.8.0）、DataView/Float16Array 対応（5.7.0）                                                                                                                                                             | なし            |

### Moderate/Low 脆弱性対象

| パッケージ            | 変更前 → 変更後 | リリースノート要約                                                                                                                     | breaking change                                                    |
| --------------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| **ajv**               | 8.6.3 → 8.18.0  | ReDoS 修正（`$data` キーワード、CVE-2025-69873）。`uri-js` → `fast-uri` 内部置換（8.15.0/8.17.0）。ESM 対応、`regExp` オプション追加等 | なし（全てマイナー/パッチ）                                        |
| **brace-expansion**   | 1.1.12 → 1.1.13 | GHSA-f886-m6hf-6m8v: zero-step sequence ハング修正。2コミットのみ                                                                      | なし（パッチ）                                                     |
| **js-yaml**           | 4.1.1 → 4.2.0   | merge key の二次計算量 DoS 修正、`maxDepth` オプション追加（デフォルト100）。アンダースコア付き数値（`1_000`）が文字列扱いに変更       | **微妙**: `1_000` → 文字列化。ただし消費者が使う可能性は極めて低い |
| **postcss**           | 8.5.6 → 8.5.10  | `</style>` XSS 修正（8.5.10）、ソースマップ性能改善（8.5.7/8.5.9）、`Processor#version` 修正（8.5.8）                                  | なし（パッチ）                                                     |
| **smol-toml**         | 1.5.2 → 1.6.1   | 連続コメント行 DoS 修正（1.6.1）。TOML 1.1.0 仕様対応（マルチラインインラインテーブル、trailing comma、`\xHH`/`\e` エスケープ）        | なし（加法的な仕様拡張のみ）                                       |
| **cookie**            | 0.6.0 → 0.7.0   | RFC 6265 準拠の厳格化（範囲外文字の拒否）、パース性能10%改善、`main` フィールド追加（rspack互換）                                      | なし（厳格化は意図されたセキュリティ修正）                         |
| **@tootallnate/once** | 2.0.0 → 2.0.1   | AbortSignal が既に abort 済みの場合の Promise ハング修正                                                                               | なし（パッチ）                                                     |

## リスク評価

### pnpm.overrides の安全性

- **メリット**: pnpm 公式サポート機能。npm の `overrides`、yarn の `resolutions` と同等。transitive dependency のバージョンを強制上書きできる
- **リスク**: 上書き先のバージョンが親パッケージと互換性がない場合、ランタイムエラーが発生する可能性
- **今回のケース**: リリースノート確認済み。全てパッチまたはマイナーバージョン範囲の更新で、breaking change は報告されていない。セキュリティ修正・バグ修正・新機能追加（後方互換）のみ
- **追加安全策**: 適用後に `pnpm build` と `pnpm test:unit` で動作確認を行えば、互換性問題があれば検出可能

### override で親ライブラリが壊れるリスク評価（high）

壊れるパターン: 親ライブラリが、修正で変わった挙動に依存している場合。

| override             | 親ライブラリ              | 壊れるシナリオ                                                                | 確率                               |
| -------------------- | ------------------------- | ----------------------------------------------------------------------------- | ---------------------------------- |
| path-to-regexp 6.3.0 | `@vercel/node`            | vercel のルーティングが backtrack に依存したパターンを使っている              | 極めて低い（backtrack 自体がバグ） |
| path-to-regexp 8.4.0 | `@vercel/backends`        | optional route が 256 組合せ超のパターンを使っている                          | 低い                               |
| tar 7.5.16           | `@vercel/fun`             | vercel が symlink chain を含む tar を正規用途で作成している                   | 極めて低い（攻撃ベクタの修正）     |
| minimatch 10.2.3     | `@vercel/python-analysis` | Python 解析で backtrack する glob パターンに依存                              | 極めて低い                         |
| undici 5.28.5        | `@vercel/node`            | なし（セキュリティパッチのみ）                                                | ほぼゼロ                           |
| undici 6.27.0        | `@vercel/blob`            | なし（セキュリティパッチのみ、6.24.0→6.27.0 はバグ修正+セキュリティ修正のみ） | ほぼゼロ                           |
| undici 7.28.0        | `jsdom` (vitest 経由)     | なし（7.25.0→7.28.0 はバグ修正+セキュリティ修正+Node 26 対応のみ）            | ほぼゼロ                           |
| **effect 3.20.0**    | **`@prisma/internals`**   | **AsyncLocalStorage 分離修正で prisma の内部挙動が変わる**                    | **低〜中**                         |
| defu 6.1.5           | `c12` (config loader)     | `__proto__` をキーに使う設定オブジェクトがある                                | 極めて低い                         |
| devalue 5.8.1        | `sveltekit-superforms`    | sparse array のシリアライズ挙動変更に依存                                     | 低い（PR #687 で既にテスト済み）   |

**最もリスクが高いのは `effect 3.20.0`**。マイナーバージョン 2 つ分のジャンプ（3.18→3.20）で、パッチ修正 3 件 + ALS 修正を含む。prisma-fabbrica はテスト時しか使わないので本番影響はないが、`pnpm db:seed` やテストの factory が壊れる可能性はゼロではない。

### overrides で対処が難しいもの（high）

| パッケージ     | 脆弱なバージョン | advisory の patched    | 経由元                               | 問題点                                                                                                                               |
| -------------- | ---------------- | ---------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| **undici 5.x** | 5.28.5 / 5.29.0  | `>=6.24.0`, `>=6.27.0` | `vercel` → `@vercel/node` / `vercel` | advisory の修正が 6.x 系にのみ存在し、5.x へのバックポートなし。`5.x → 6.x` のメジャー override は `@vercel/node` の破壊リスクが高い |

全て devDependency 経由のため**本番影響なし**。vercel 側が undici 6.x+ に移行するまで解消不可（3件残存）。

### override で親ライブラリが壊れるリスク評価（moderate/low）

| override                | 親ライブラリ                                  | 壊れるシナリオ                                                        | 確率                                           |
| ----------------------- | --------------------------------------------- | --------------------------------------------------------------------- | ---------------------------------------------- |
| ajv 8.18.0              | `@vercel/static-config`                       | `uri-js` → `fast-uri` 内部置換で URI パース結果が微妙に変わる         | 極めて低い（API 互換、vercel 自体が ajv 使用） |
| brace-expansion 1.1.13  | `@eslint/eslintrc`, `ts-morph`                | なし（セキュリティパッチのみ）                                        | ほぼゼロ                                       |
| js-yaml 4.2.0           | `@eslint/eslintrc`, `@vercel/python-analysis` | YAML 設定内にアンダースコア付き数値がある場合に文字列として解釈される | 極めて低い（ESLint/vercel の YAML に該当なし） |
| postcss 8.5.10          | `flowbite`                                    | なし（パッチレベルのバグ修正のみ）                                    | ほぼゼロ                                       |
| smol-toml 1.6.1         | `@vercel/python-analysis`                     | TOML 1.1.0 の新構文を含むファイルが新たにパース可能になる（加法的）   | ほぼゼロ                                       |
| cookie 0.7.0            | `@sveltejs/kit`                               | RFC 6265 範囲外の文字を含む cookie が拒否される                       | 低い（正規の cookie 値には影響なし）           |
| @tootallnate/once 2.0.1 | `@vercel/fun`                                 | なし（バグ修正のみ）                                                  | ほぼゼロ                                       |

## moderate/low 脆弱性の詳細

### overrides で対処可能（パッチ/マイナー範囲、リスク低）

| パッケージ        | 変更前 → 変更後 | 経由元                                                   | severity     | 備考                                                                    |
| ----------------- | --------------- | -------------------------------------------------------- | ------------ | ----------------------------------------------------------------------- |
| ajv               | 8.6.3 → 8.18.0  | `vercel` → `@vercel/static-config`                       | moderate     | ReDoS（`$data` オプション使用時）                                       |
| brace-expansion   | 1.1.12 → 1.1.13 | `@eslint/eslintrc` → `minimatch`, `vercel` → `ts-morph`  | moderate     | zero-step sequence でハング                                             |
| js-yaml           | 4.1.1 → 4.2.0   | `@eslint/eslintrc`, `vercel` → `@vercel/python-analysis` | moderate     | merge key の二次計算量 DoS                                              |
| postcss           | 8.5.6 → 8.5.10  | `flowbite` → `postcss`                                   | moderate     | `</style>` 未エスケープによる XSS                                       |
| smol-toml         | 1.5.2 → 1.6.1   | `vercel` → `@vercel/python-analysis`                     | moderate     | 連続コメント行による DoS                                                |
| undici            | 7.25.0 → 7.28.0 | `jsdom` → `undici` (vitest 経由)                         | moderate+low | Set-Cookie injection、cache bypass、queue poisoning、SameSite downgrade |
| cookie            | 0.6.0 → 0.7.0   | `@sveltejs/kit` → `cookie`                               | low          | cookie name/path/domain の範囲外文字                                    |
| @tootallnate/once | 2.0.0 → 2.0.1   | `vercel` → `@vercel/fun`                                 | low          | 制御フロースコーピング                                                  |

### overrides で対処が難しいもの

| パッケージ       | 変更前 → 変更後     | 経由元                                   | severity | 問題点                                                                                            |
| ---------------- | ------------------- | ---------------------------------------- | -------- | ------------------------------------------------------------------------------------------------- |
| **ts-deepmerge** | 7.0.3 → **8.0.0**   | `sveltekit-superforms`                   | moderate | **メジャーバージョンアップ**。superforms が 7.x の API に依存している可能性あり                   |
| **uuid**         | 9.0.1 → **11.1.1**  | `@quramy/prisma-fabbrica` → `short-uuid` | moderate | **メジャー2つジャンプ**（9→11）。`short-uuid` が 9.x の API に依存している可能性あり              |
| **joi**          | 17.13.3 → 17.13.4   | `sveltekit-superforms`                   | moderate | パッチ範囲だが、再帰的 `link()` スキーマの挙動変更。superforms の validation に影響する可能性あり |
| **srvx**         | 0.8.9 → **0.11.13** | `vercel` → `@vercel/backends`            | moderate | **0.x のマイナージャンプ**（0.8→0.11）。semver 上 0.x は breaking change の可能性                 |

## vercel のバージョンアップ調査

### リリースノート確認結果（54.14.5 → 54.18.1）

| バージョン    | 日付       | 主な変更                                                                                                                               | breaking change                                   |
| ------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| **54.15.0**   | 2026-06-23 | deploy-manifest 拡張、`vercel domains verify` コマンド追加、feature flag segments 機能追加                                             | なし                                              |
| **54.15.1**   | 2026-06-23 | パッチ修正                                                                                                                             | なし                                              |
| **54.16.0**   | 2026-06-24 | `services` を正式設定に昇格（`experimentalServicesV2` は非推奨エイリアスとして維持）、`@vercel/container` builder 追加（experimental） | なし（`experimentalServicesV2` は後方互換で動作） |
| **54.17.0**   | 2026-06-24 | services V2 の websocket upgrade 修正、`vercel deploy --dry` フラグ追加                                                                | なし                                              |
| **54.17.1-3** | 2026-06-25 | パッチ修正                                                                                                                             | なし                                              |
| **54.18.0**   | 2026-06-26 | サービス自動検出のV2 resolver形式移行、Node.js native fetch への移行（deprecation warning 解消）、flags コマンド改善                   | なし                                              |
| **54.18.1**   | 2026-06-27 | V2 services の per-service function 設定が反映されるよう修正、queue consumer group のスコーピング改善                                  | なし                                              |

**SvelteKit / adapter-vercel への影響**: 全バージョンを通じて SvelteKit 固有の変更なし。主な変更は services V2（本プロジェクト未使用）、container builder（experimental）、CLI UX 改善に集中。`@vercel/node` は 5.8.18 → 5.8.22 へパッチ更新のみ。

**結論**: breaking change なし。本プロジェクトが使用する機能（SvelteKit + adapter-vercel でのデプロイ）に影響する変更はない。安全にアップデート可能。

## QA

### pnpm.overrides vs pnpm-workspace.yaml

pnpm v11 の公式ドキュメント（https://pnpm.io/settings#overrides）によると:

| 観点                   | `package.json` の `pnpm.overrides`     | `pnpm-workspace.yaml` の `overrides`          |
| ---------------------- | -------------------------------------- | --------------------------------------------- |
| pnpm v11 での推奨      | 非推奨（後方互換で動作はする）         | **推奨**                                      |
| 定義場所               | プロジェクトルートの `package.json` 内 | プロジェクトルートの `pnpm-workspace.yaml` 内 |
| モノレポ対応           | ルートの `package.json` のみ有効       | ワークスペース全体に適用                      |
| 他のpnpm設定との一貫性 | pnpm 設定が `package.json` に混在      | pnpm 設定が `pnpm-workspace.yaml` に集約      |

**本プロジェクトの場合**: シングルプロジェクト（モノレポではない）だが、既に `pnpm-workspace.yaml` で `allowBuilds`, `minimumReleaseAge` 等のセキュリティ設定を管理しているため、**`pnpm-workspace.yaml` に追加するのが一貫性がある**。

### pnpm audit vs pnpm outdated

| 観点             | `pnpm audit`                                                          | `pnpm outdated`                                  |
| ---------------- | --------------------------------------------------------------------- | ------------------------------------------------ |
| **目的**         | 既知のセキュリティ脆弱性の検出                                        | 新しいバージョンが利用可能なパッケージの一覧表示 |
| **データソース** | npm advisory database（GitHub Advisory Database 連携）                | npm registry のバージョン情報                    |
| **対象**         | transitive dependency を含む全依存                                    | 直接依存（`dependencies` / `devDependencies`）   |
| **出力内容**     | CVE/GHSA ID、severity、脆弱なバージョン範囲、修正バージョン、依存パス | Current / Wanted / Latest バージョンの比較表     |
| **自動修正**     | `--fix` オプションあり（`override` または `update` メソッド）         | なし（情報表示のみ）                             |

- **`pnpm audit`**: セキュリティ観点。「脆弱性があるか？」を確認する。CI に組み込んで脆弱性を継続的に監視する用途
  - `pnpm audit --fix`: `pnpm.overrides` を自動生成してくれる（今回の手動 overrides と同等の処理を自動化）
  - `pnpm audit --fix update`: overrides ではなく lockfile 内のバージョンを直接更新しようとする
- **`pnpm outdated`**: メンテナンス観点。「最新版に追従できているか？」を確認する。定期的な依存更新（Renovate / Dependabot）の補助として使う

今回の脆弱性は全て transitive dependency 由来。`pnpm outdated` では直接依存しか表示されないため検出できない。`pnpm audit` でのみ発見可能。

なお `pnpm audit --fix` を使えば overrides の手動記述を省略できるが、どのパッケージがどのバージョンに上書きされるかを把握した上で適用する方が安全。
