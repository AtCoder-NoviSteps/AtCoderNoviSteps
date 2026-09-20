# Devcontainer ファイアウォールの許可範囲と再実行の修正

## 概要

Compose の `web` から `db:5432` への通信を残し、Docker ブリッジ全体への許可を削除する。IPv4 と IPv6 の設定状態を確認し、途中で止まった初期化を再実行できるようにする。

## 設計

ファイアウォール設定は `.devcontainer/init-firewall.sh` の単一責務とする。既存のユーティリティやサービスに同等の処理はない。Docker DNS で `db` の IPv4 アドレスを取得し、TCP 5432 だけ許可する。公開ポート 5173 と 5555 への着信のみ許可する。初期化済み判定は設けず、再実行時も両系統のチェーンを作り直して欠落を補う。再構築前に DROP ポリシーを設定し、途中失敗で許可的な IPv6 OUTPUT を残さない。

完全な `iptables-save` / `restore` による状態保存は、ローカル開発コンテナには複雑すぎるため採用しない。ホスト側の宛先を許可する必要は Compose の通信契約から確認できないため採用しない。

## フェーズ

1. テスト層: `init-firewall.sh` の許可範囲と再実行条件を検証するテストを先に追加する。
2. 設定層: DB 宛て、着信ポート、IPv4/IPv6 の再実行処理を修正する。
3. 文書: `CONTRIBUTING.md` の通信範囲、Rebuild、公開ポートの説明を現行設定に合わせる。
4. 検証: `pnpm test:unit`、変更ファイルの Prettier、`pnpm lint`、`pnpm check`、`git diff --check` を実行する。

## Rebuild 後の確認

以下のコマンドはホスト側のリポジトリで実行する。`web` と `db` が起動してから確認する。
全項目を 2026-09-20 に確認した。手順 1・2 の再実行・5 の DB 接続・6 は `web` コンテナ内（`node` ユーザー）から、手順 2 の `postStartCommand`・3・4・5 のホストからの 5173 番ポートはホスト側から確認した。
`node` ユーザーの `sudo` は `/usr/local/bin/init-firewall.sh` だけが NOPASSWD で許可されており、`iptables` の参照はできないため、残りはホスト側で実行する。

1. [x] `docker compose exec web cmp -s .devcontainer/init-firewall.sh /usr/local/bin/init-firewall.sh` が成功すること。イメージ内の実行ファイルが修正版であることを確かめる。
2. [x] Dev Container の `postStartCommand` が `Firewall configured` で終了すること。
       [x] 続けて `docker compose exec web sudo /usr/local/bin/init-firewall.sh` をもう一度実行し、再実行でも成功することを確かめる（自己チェック 4 件が通り `Firewall configured` で終了）。
3. [x] `docker compose exec -u root web iptables -S NOVISTEPS_OUTPUT` で、`db` の IPv4 アドレス宛て TCP 5432 の許可があり、Docker サブネット全体またはホスト側への無条件の許可がないことを確かめる。`docker compose exec -u root web iptables -S NOVISTEPS_INPUT` では、着信の許可が公開ポート 5173 と 5555、および既存接続とループバックに限られることを確かめる。
4. [x] `docker compose exec -u root web iptables -S OUTPUT` と `docker compose exec -u root web ip6tables -S OUTPUT` で、それぞれの `NOVISTEPS_*` チェーンへのジャンプが１つずつあり、両方の OUTPUT ポリシーが DROP であることを確かめる。再実行後もジャンプが増えないことを確認する。手順 2 の再実行を済ませてあるので、ここでジャンプが重複していなければ冪等性の確認を兼ねる。
5. [x] `docker compose exec web node -e "const socket = require('node:net').connect(5432, 'db'); socket.on('connect', () => { console.log('DB TCP OK'); socket.destroy(); }); socket.on('error', (error) => { console.error(error); process.exitCode = 1; });"` が `DB TCP OK` と表示することを確かめる（手順 2 の再実行の前後どちらも接続できた）。
       [x] アプリを起動している場合はホストから 5173 番ポートにアクセスできることも確認する。
6. [x] `docker compose exec web curl -I --connect-timeout 5 --max-time 8 https://api.github.com` が通信でき、`docker compose exec web curl -sS --connect-timeout 5 --max-time 8 https://example.com` は接続拒否で終了することを確かめる。これは初期化スクリプト自身の許可先・遮断先チェックの再確認である。
