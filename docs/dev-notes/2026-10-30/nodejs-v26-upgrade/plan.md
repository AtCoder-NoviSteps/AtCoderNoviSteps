# Node.js v24 → v26 アップグレード

**作成日**: 2026-10-30（最終更新: 2026-10-31）

**ステータス**: リポジトリ側は完了し、Node 26 で検証済み（issue #4263）。staging・production への反映待ち

## 概要

devcontainer・CI・Vercel の Node.js を v24.x から v26.x（2026-10-28 に LTS、EOL 2029-04-30。Vercel は 2026-10-29 に正式サポート）へ上げた。変更したファイルは、`dep-upgrade` skill の Node 更新手順（前回の PR #3125 と同じ構成）に従っている。

## 意思決定

- **今上げる**: v24（EOL 2028-04-30）は Maintenance 期間に入り、セキュリティ修正などに限られる。依存の対応が揃った今が、最も移行コストが小さい。
- **adapter の `runtime` は指定しない**: ビルド時の Node から `nodejs26.x` が自動で選ばれるので、Node を上げるたびに書き換える必要がない。
- **CI は Node 26 だけでテストする**: `engines.node: 26.x` と `engineStrict: true` の組み合わせでは Node 24 の install が失敗する。本番も単一のランタイムなので、両方をテストする価値は小さい。
- **Prisma は 5.22.0 のまま**: 5 → 8 の更新は影響範囲が別で、同時に行うと問題の切り分けが難しくなる。

## コードから読めない事実

- 前提として、次の 2 つが必要だった。どちらも本タスクの前にマージ済み。
  - `@sveltejs/adapter-vercel` 7.0.2 以上（#4256）: 7.0.1 以下は Node 26 でビルドエラーになる。
  - prebuilt deploy 用の Vercel CLI 65.8.0 以上: #4252 で 65.9.0 にし、#4262 で同じバージョンのネイティブ版 `@vercel/vc-native` に置き換えた。
- Vercel Dashboard の Node.js Version は、2026-10-31 に 26.x へ変更済み（リポジトリ外の設定）。
- Node.js 26.0.0 の破壊的変更（Semver-Major 87 件）のうち、リポジトリに該当するものはない。ネイティブアドオンはすべて Node-API 製なので再ビルド不要で、全 457 パッケージの `engines.node` も Node 26 を許容している。
- Prisma 5.22.0 は Node 26 を公式にはサポートしていない（Prisma 8 から）。engine が Node-API 製なので、ローカルでは問題なく動いた。
- Node 24 の環境では、`pnpm exec` やコミット時の lefthook で `ERR_PNPM_UNSUPPORTED_ENGINE` が出る。devcontainer を rebuild すれば解消する。
- devcontainer image `javascript-node:26` は、2026-10-31 時点で 26.12.1（LTS 版の 26.13.0 ではない）。CI は `check-latest: true` なので最新の 26.x を使う。
- vercel CLI は、`HTTP(S)_PROXY` があると Node 26 で通信に失敗する（vercel/vercel#17629、未修正）。devcontainer と CI には proxy 変数がないので影響しない。

## 検証結果（2026-10-31、Node v26.12.1）

install・format・lint・check・unit test（2940 tests）・build・seed・e2e（119 passed / 1 skipped。skip は DB のデータ有無で決まる votes のテスト）がすべて成功した。生成された関数のランタイムは `nodejs26.x` で、Node 由来の DeprecationWarning は出なかった。懸念していた fetch（Undici 8）と `localStorage` の挙動変更についても、該当する unit test が pass した。

## 残りタスク

- [ ] PR を staging にマージし、preview deploy の成功と動作を確認する（ログイン、AtCoder Problems / AOJ からの取得、`/workbooks/{slug}`、DB の読み書き）
- [ ] production に deploy し、Vercel の Function logs にエラーや DeprecationWarning が出ていないことを確認する

問題が出たら PR を revert し、Dashboard の Node.js Version を 24.x に戻す。

範囲外（別タスク）: Prisma 5 → 8 の更新と、e2e のログに出る Flowbite Svelte `Tabs` の非推奨 props（`ulClass`、`contentClass`）の置き換え。

## 参考資料

- [Node.js 26.0.0 release notes](https://nodejs.org/en/blog/release/v26.0.0)
- [Vercel changelog: Node.js 26 LTS is now Generally Available](https://vercel.com/changelog/node-js-26-lts-is-now-generally-available-on-vercel)
