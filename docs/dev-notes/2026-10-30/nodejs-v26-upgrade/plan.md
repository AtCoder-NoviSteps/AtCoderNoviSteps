# Node.js v24 → v26 アップグレード計画

**作成日**: 2026-10-30（最終更新: 2026-10-31）

**ステータス**: 実装中（Phase 1 のファイル変更はコミット済み。devcontainer の rebuild 後に Node 26 で検証する）

## 概要

devcontainer・CI・Vercel の Node.js を v24.x から v26.x へ上げる。
Node.js 26 は 2026-10-28 に LTS になり（26.13.0 'Lithium'）、EOL は 2029-04-30。Vercel も 2026-10-29 に Node.js 26 を正式サポートした。
v24 は Maintenance 期間（EOL 2028-04-30）に入ったが、まだ急ぐ必要はない。依存の対応が揃い、差分が小さい今のうちに上げる。
変更するファイルは前回の v22 → v24（PR #3125）とほぼ同じで、その後に追加された CI の composite action が加わる。

### 前提条件（満たし済み）

Node 26 でビルド・デプロイするには、次の 2 つが必要だった。どちらも staging にマージ済み。

| パッケージ                 | 必要なバージョン | 理由                                                                                                              | 対応 PR                                                                                                                                 |
| -------------------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `@sveltejs/adapter-vercel` | 7.0.2 以上       | 7.0.1 以下は Node 26 でのビルドをエラーにする                                                                     | #4256                                                                                                                                   |
| Vercel CLI                 | 65.8.0 以上      | CI の prebuilt deploy（`vercel build` → `vercel deploy --prebuilt`）で Node 26 の Function を deploy するのに必要 | #4252 で 65.9.0。#4262 で同じバージョンのネイティブ版 `@vercel/vc-native` 65.9.0 に置き換え（バイナリに `nodejs26.x` を含むことを確認） |

その他の依存は、インストール済みの全 457 パッケージ（#4262 後）で `engines.node` が Node 26 を許容していることを確認した（`engineStrict: true` でも install は止まらない）。

## 影響調査

Node.js 26.0.0 の公式リリースノートにある破壊的変更（Semver-Major 87 件）について、リポジトリ内の使用箇所を grep で調べた。

### 対応不要

| 変更                                                                                                    | 対応不要の理由                                                                                                          |
| ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| 削除された API（`http` の `writeHeader`、`_stream_*` モジュール、`--experimental-transform-types`）     | 使用箇所なし                                                                                                            |
| 非推奨化された API（`module.register()`、`crypto` の DEP0182 / DEP0203 / DEP0204、`stream` の DEP0201） | リポジトリでは未使用。tsx・vite・vitest・playwright は後継の `module.registerHooks()` を優先して使う                    |
| `type: module` パッケージでの拡張子なし CJS ファイルの扱い                                              | 拡張子なしの実行スクリプトなし                                                                                          |
| ネイティブアドオンの ABI 変更（`NODE_MODULE_VERSION` 147）                                              | Prisma engines・lightningcss・rolldown などの `.node` はすべて Node-API 製で、Node のバージョンが変わっても再ビルド不要 |
| `Temporal` のグローバル化、`util.inspect` の表示変更など                                                | 使用箇所なし、またはデバッグ出力のみに影響                                                                              |
| vercel CLI が proxy 環境で失敗する不具合（vercel/vercel#17629、未修正）                                 | devcontainer と CI には `HTTP(S)_PROXY` を設定していない                                                                |

### Node 26 で動かして確認するもの

| 項目              | 懸念                                                                                | 確認方法                                                                                      | リスク |
| ----------------- | ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ------ |
| Prisma 5.22.0     | Node 26 を公式サポートするのは Prisma 8 から。engine は Node-API 製なので動く見込み | `prisma generate`・`db:seed`・unit test・staging での DB 読み書き                             | Medium |
| fetch（Undici 8） | 内蔵の HTTP クライアントが更新され、fetch が既定で HTTP/2 を使う                    | 外部 API クライアントと nock を使う unit test、staging での AtCoder Problems / AOJ からの取得 | Medium |
| `localStorage`    | ファイル指定なしの `localStorage` が `undefined` を返すようになった                 | jsdom 環境で `localStorage` を使う unit test                                                  | Low    |

## 設計方針

- adapter の `runtime` オプションは指定しない。adapter がビルド時の Node のバージョンから `nodejs26.x` を自動で選ぶ（PR #3125 と同じ）。
- CI の各 job は composite action `.github/actions/setup/action.yml` の既定値で Node を選ぶので、ここも更新する。
- Prisma は 5.22.0 のまま動作確認だけ行う。5 → 8 への更新は影響範囲が別なので、別タスクにする。

## 却下した代替案

- **adapter に `runtime: 'nodejs26.x'` を明示する**: Node を上げるたびに書き換える箇所が増える。
- **CI で Node 24 と 26 の両方をテストする**: `engines.node: 26.x` と `engineStrict: true` の組み合わせでは、Node 24 の install が失敗する。本番は単一のランタイムなので、両方をテストする価値も小さい。
- **Node 24 の EOL（2028-04）まで据え置く**: Maintenance 期間中はセキュリティ修正などに限られる。依存の対応が揃った今のほうが移行コストが小さい。
- **Prisma も同時に上げる**: 問題が起きたときに原因を切り分けにくくなる。

## 便利な新機能（採用検討）

| 機能                               | 説明                                    | 推奨度                                        |
| ---------------------------------- | --------------------------------------- | --------------------------------------------- |
| Temporal API                       | `Date` に代わる不変の日時 API           | Low（ブラウザ側の対応が揃うまでサーバー限定） |
| `Map.prototype.getOrInsert()` など | 「なければ作って入れる」を 1 行で書ける | Low                                           |

今回は採用しない。

## 実装フェーズ

### Phase 1: リポジトリ内の Node.js を 26 にする（中リスク）

- [x] `package.json`: `@types/node` を 26.6.6 にする。Node 24 で `pnpm check` は 0 errors、`pnpm test:unit` は 2940 tests pass
- [x] `Dockerfile`: `ARG NODE_VERSION=26`
- [x] `.github/workflows/ci.yml`: build job の matrix を `[26]` にする
- [x] `.github/actions/setup/action.yml`: `node-version` の既定値を `'26'` にする
- [x] `package.json`: `engines.node` を `26.x` にする（ルートの `engines` は lockfile に記録されないので lockfile は変更なし）
- [x] `CONTRIBUTING.md`: 必要な Node.js のバージョンを `v26.x` にする
- [x] `.agents/skills/dep-upgrade/instructions.md`: Node 更新時の対象に `.github/actions/setup/action.yml` と `@types/node` を追記する
- [ ] devcontainer を rebuild し、下記の検証手順を実行する

`engines.node` を `26.x` にした後は、Node 24 の環境だと `pnpm exec` などの実行前に `ERR_PNPM_UNSUPPORTED_ENGINE` が出る（`engineStrict: true` による想定どおりの挙動）。検証は rebuild 後の Node 26 環境で行う。

### Phase 2: Vercel に反映する（高リスク）

- [ ] PR を staging にマージし、preview deploy が成功することを確認する
- [x] Vercel Dashboard > Project Settings > Build and Deployment > Node.js Version を 26.x にする（2026-10-31 設定済み）
- [ ] staging で動作確認する: ログイン、AtCoder Problems / AOJ からの取得、`/workbooks/{slug}`（メモリ使用量が大きいページ）、DB の読み書き
- [ ] production に deploy し、Vercel の Function logs にエラーや DeprecationWarning が出ていないことを確認する
- [ ] 問題が出たら PR を revert し、Dashboard を 24.x に戻す

## 検証手順

```bash
node -v  # v26.x
pnpm install
pnpm format
pnpm lint
pnpm check
pnpm test:unit
pnpm build
find .vercel/output/functions -name .vc-config.json -exec grep -h '"runtime"' {} + | sort -u  # "nodejs26.x" のみ
pnpm test:e2e
pnpm db:seed  # ローカル DB。DeprecationWarning が出ないこと
git diff --check
```

`pnpm test:unit` では、特に次のテストの結果を確認する。

- `localStorage`: `src/test/lib/stores/active_problem_list_tab.svelte.test.ts`、`src/features/tasks/stores/active_contest_type.svelte.test.ts`、`src/features/workbooks/stores/replenishment_workbook.test.ts`
- fetch（nock）: `src/lib/clients/atcoder/atcoder_problems.test.ts`、`src/lib/clients/aizu_online_judge/clients.test.ts`、`src/features/votes/internal_clients/vote_grade.test.ts`

## 参考資料

- [Node.js 26.0.0 release notes](https://nodejs.org/en/blog/release/v26.0.0)
- [Node.js Release schedule](https://github.com/nodejs/Release)
- [Vercel changelog: Node.js 26 LTS is now Generally Available](https://vercel.com/changelog/node-js-26-lts-is-now-generally-available-on-vercel)
- [adapter-vercel CHANGELOG](https://github.com/sveltejs/kit/blob/main/packages/adapter-vercel/CHANGELOG.md)
- PR #3125（前回の v22 → v24）
