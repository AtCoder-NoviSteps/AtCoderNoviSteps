# ファイアウォール再実行の安全化

## 概要

devcontainer の起動待ちが長時間続き、コンテナ破棄後は起動できた。
確認できた欠陥は、再実行時の `iptables -F` が許可規則を消して `OUTPUT DROP` だけを残し、GitHub メタデータ取得を妨げることである。ログがなく、実際の停止箇所は未特定。
専用チェーン・一時 ipset の swap・全外部取得への期限・双方向の自己検証を導入した。

## 判断

- 稼働中の規則は、新しい宛先の取得と検証が終わるまで保持する。Docker の DNS を壊さないよう NAT と組み込みチェーンの flush には触れない。
- このスクリプトは誤っていても症状が出ない（許可リストが無効でも通信は成功する）ため、起動時の自己検証で「許可先に届く」と「未許可先が塞がる」の両方を確かめる。片方だけでは全遮断でも合格する。
- stub による挙動テストは全廃した。自己検証まで stub が答えるため、ファイアウォール無効化・全遮断・DNS 断・IPv6 素通し・freeze 再発の 5 点をどれも検出しなかった。実機で現れない「全 `curl`/`dig` に期限がある」ことだけを静的に検査する。
- 個人環境で Rebuild により回復できるため、恒久的に壊れる経路だけを潰す。途中失敗で以後毎回 "Chain already exists" になる問題は `-N || -F` で直し、Rebuild で戻る不具合（`host_network` の固定、ジャンプ規則の重複、IPv4 ジャンプ追加後・IPv6 ジャンプ追加前の中断で再実行が完了済みと判定し IPv6 が素通しになること）は見送る。最後の件は該当区間が ip6tables 成功後の `-I`/`-P` だけで発生率が低い。コンテナ再起動で netns が作り直され規則も消えると想定しているが未検証。
- 未許可先の検証は curl の終了コード 7（接続失敗）のみを遮断の証拠とする。DNS・TLS・タイムアウトによる失敗は遮断を証明しないため検証失敗とする。

## 却下

- 取得前に `OUTPUT ACCEPT` にする。一時的に許可範囲が広がる。
- `waitFor: postStartCommand` を外す。設定失敗を隠す。
- 別言語での書き直しや `iptables-restore` による宣言化。書き直し量に対し、要件（実態が分かること）に効かない。
- 初回設定の fail-closed 化。2 経路を抱える複雑さが Rebuild で回復できる状況に見合わない。

## 補足: チェーン

`NOVISTEPS_*` は変数ではなく iptables のチェーン名である。チェーンは上から照合される規則のリストで、`-N` でカーネル内に作られスクリプト終了後も残る。組み込みの `INPUT`/`OUTPUT` からのジャンプで呼ばれる。
中身はホスト側から `docker compose exec -u root web iptables -L NOVISTEPS_OUTPUT -n -v --line-numbers` で確認できる（node の sudo は init-firewall.sh のみ許可）。

## 未解決

- 反映には Rebuild が必要（image に焼き込んだコピーを sudo 実行する構成は、agent による改変を防ぐため維持）。
- オフライン時や probe 先の障害時は自己検証が失敗する。
- コンテナ起動から `postStartCommand` までの窓は無防備のまま。
- コンテナ再起動で netns が作り直され規則も消える、という想定は未検証のまま（下記「残る任意確認」）。

## Rebuild 後の確認（2026-09-19 実施・合格）

- 起動ログ: freeze せず、`Firewall check OK` 4 行と `Firewall configured` が出る。
- コンテナ内:
  - `diff /usr/local/bin/init-firewall.sh .devcontainer/init-firewall.sh` が差分なし。
  - `curl -sS -o /dev/null --max-time 8 https://example.com; echo $?` が `7`。
  - `sudo /usr/local/bin/init-firewall.sh` の再実行が `Firewall configured` まで進む。
  - `ip -6 route` にデフォルト経路がなければ、IPv6 素通しの影響は実質ない。
- ホスト側（`docker compose exec -u root web ...`）:
  - `iptables -S OUTPUT` に `-P OUTPUT DROP` と、再実行後も 1 行だけの `-j NOVISTEPS_OUTPUT`。
  - `ip6tables -S OUTPUT` に `-P OUTPUT DROP` と `-j NOVISTEPS_IPV6`。

## 残る任意確認

- `iptables -N NETNS_MARKER` 後にコンテナを再起動し、`iptables -L NETNS_MARKER` が失敗すれば netns 再作成の想定を確認済みとして「判断」の「未検証」を外す。残っていれば IPv6 素通しの見送り判断を見直す。
