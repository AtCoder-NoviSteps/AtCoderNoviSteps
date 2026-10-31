# Node.js v24 → v26 アップグレード

**作成日**: 2026-10-30（最終更新: 2026-10-31）

**ステータス**: リポジトリ側の変更は完了し、Node 26 で検証済み（issue #4263）。staging・production への反映待ち

## 概要

devcontainer・CI・Vercel の Node.js を v24.x から v26.x へ上げた。
Node.js 26 は 2026-10-28 に LTS（26.13.0 'Lithium'、EOL 2029-04-30）になり、Vercel も 2026-10-29 に正式サポートした。
変更したファイルは前回の v22 → v24（PR #3125）とほぼ同じで、`dep-upgrade` skill の Node 更新手順に従った。

## 意思決定

- **今のうちに上げる**: v24 の EOL は 2028-04-30 で急ぐ必要はない。ただし Maintenance 期間中はセキュリティ修正などに限られるうえ、依存の対応が揃った今が最も移行コストが小さい。
- **adapter の `runtime` は指定しない**: adapter がビルド時の Node のバージョンから `nodejs26.x` を自動で選ぶ。明示すると、Node を上げるたびに書き換える箇所が増える（PR #3125 と同じ判断）。
- **CI は Node 26 だけでテストする**: `engines.node: 26.x` と `engineStrict: true` の組み合わせでは Node 24 の install が失敗する。本番は単一のランタイムなので、両方をテストする価値も小さい。
- **Prisma は 5.22.0 のまま**: 5 → 8 の更新は影響範囲が別で、同時に行うと問題の切り分けが難しくなるため、別タスクにする。
- **Node 26 の新機能（Temporal、`Map.prototype.getOrInsert()` など）は今回採用しない**: 今回の目的はランタイムの更新だけ。Temporal はブラウザ側の対応が揃うまでサーバー限定になる。

## コードから読めない事実

### 前提条件

Node 26 でビルド・デプロイするには、次の 2 つが必要だった。どちらも本タスクの前に staging へマージ済み。

- `@sveltejs/adapter-vercel` 7.0.2 以上（#4256）: 7.0.1 以下は、Node 26 でのビルドをエラーにする。
- Vercel CLI 65.8.0 以上（#4252 で 65.9.0）: CI の prebuilt deploy（`vercel build` → `vercel deploy --prebuilt`）で Node 26 の Function を deploy するのに必要。その後 #4262 で、同じバージョンのネイティブ版 `@vercel/vc-native` に置き換えた。バイナリに `nodejs26.x` が含まれることを確認済み。

Vercel Dashboard > Project Settings > Build and Deployment > Node.js Version は、2026-10-31 に 26.x へ変更済み（リポジトリ外の設定）。

### 影響調査

- Node.js 26.0.0 の破壊的変更（Semver-Major 87 件）のうち、リポジトリに該当するものはなかった。削除・非推奨化された API（`writeHeader`、`_stream_*`、`module.register()` など）は使っていない。tsx・vite・vitest・playwright は、後継の `module.registerHooks()` を優先して使う。
- ネイティブアドオン（Prisma engines・lightningcss・rolldown など）はすべて Node-API 製なので、Node のバージョンが変わっても再ビルドは不要。
- インストール済みの全 457 パッケージ（#4262 後）の `engines.node` が、Node 26 を許容している。
- Prisma 5.22.0 は Node 26 を公式にはサポートしていない（Node 26 の公式サポートは Prisma 8 から）。engine が Node-API 製なので、ローカルでは問題なく動いた。
- vercel CLI には、`HTTP(S)_PROXY` があると Node 26 で通信が全部失敗する未修正の不具合がある（vercel/vercel#17629）。devcontainer と CI には proxy 変数がないので影響しない。

### 運用上の注意

- `engines.node: 26.x` と `engineStrict: true` により、Node 24 の環境では `pnpm exec` やコミット時の lefthook で `ERR_PNPM_UNSUPPORTED_ENGINE` が出る。devcontainer を rebuild すれば解消する。
- ルートの `engines` は lockfile に記録されないので、`engines` を変えても lockfile は変わらない。
- devcontainer image `javascript-node:26` は、2026-10-31 時点で 26.12.1（LTS 版の 26.13.0 ではない）。CI は `check-latest: true` なので最新の 26.x を使う。

### 検証結果（2026-10-31、devcontainer の Node v26.12.1）

- install（`--force --frozen-lockfile`）、format、lint、check、unit test（2940 tests）、build、seed、e2e（119 passed / 1 skipped）がすべて成功した。
- 生成された関数のランタイムは `nodejs26.x`。
- Node 由来の DeprecationWarning は、どの手順でも出なかった。
- 懸念していた fetch（Undici 8）と `localStorage` の挙動変更についても、該当する unit test（nock を使う 3 ファイル、jsdom で `localStorage` を使う 3 ファイル）が pass した。
- e2e の skip 1 件は、DB に該当データがないときに skip される votes のテスト。
- lint の警告 1 件と check の警告 30 件は既存のもので、Node 24 のときと同数。

## 残りタスク

- [ ] ブランチを push して PR を作成し、staging にマージする。preview deploy の成功を確認する
- [ ] staging で動作確認する: ログイン、AtCoder Problems / AOJ からの取得、`/workbooks/{slug}`（メモリ使用量が大きいページ）、DB の読み書き
- [ ] production に deploy し、Vercel の Function logs にエラーや DeprecationWarning が出ていないことを確認する

問題が出たら PR を revert し、Vercel Dashboard の Node.js Version を 24.x に戻す。

### 範囲外（別タスク）

- Prisma 5 → 8 の更新（Node 26 の公式サポートを得るため）
- Flowbite Svelte の `Tabs` の非推奨 props（`ulClass`、`contentClass`）の置き換え。e2e のログに警告が出ているが、Node のバージョンとは関係ない

## 参考資料

- [Node.js 26.0.0 release notes](https://nodejs.org/en/blog/release/v26.0.0)
- [Node.js Release schedule](https://github.com/nodejs/Release)
- [Vercel changelog: Node.js 26 LTS is now Generally Available](https://vercel.com/changelog/node-js-26-lts-is-now-generally-available-on-vercel)
- [adapter-vercel CHANGELOG](https://github.com/sveltejs/kit/blob/main/packages/adapter-vercel/CHANGELOG.md)
- PR #3125（前回の v22 → v24）
