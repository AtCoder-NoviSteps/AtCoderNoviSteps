# Rebuild 後の確認: devcontainer レビュー対応

CodeRabbit のレビューを受けて、DNS の許可を Docker の組み込み DNS（`127.0.0.11`）宛てに限定し、Claude の mount 元を `~/.claude-devcontainer/AtCoderNoviSteps` に分離した。
ホストの `~/.claude` の memory・会話履歴は引き継がない。

## 確認項目

- [ ] `postStartCommand`（`sudo /usr/local/bin/init-firewall.sh`）が `Firewall configured` で終わる
- [ ] 名前解決できる: `dig +short api.anthropic.com`
- [ ] 許可先に接続できる: `curl -fsS -o /dev/null https://registry.npmjs.org`
- [ ] 非許可先は拒否される: `curl -fsS --connect-timeout 5 https://example.com` が失敗する
- [ ] 53 番ポートでも他の DNS には届かない: `dig +short +time=3 +tries=1 @1.1.1.1 example.com` が失敗する
- [ ] Claude に再ログインでき、CLI と拡張で会話とコマンドを実行できる

## 失敗したとき

- 名前解決が失敗する場合は、`/etc/resolv.conf` の `nameserver` が `127.0.0.11` かを確認する。別の値なら、`init-firewall.sh` の DNS 規則の宛先がずれている。
