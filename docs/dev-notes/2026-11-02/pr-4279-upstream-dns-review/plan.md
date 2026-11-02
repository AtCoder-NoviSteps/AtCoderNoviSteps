# PR #4279 上流DNS許可のレビュー

## 概要

対象は外部コントリビューターの未マージ[PR #4279](https://github.com/AtCoder-NoviSteps/AtCoderNoviSteps/pull/4279)（1コミット、init-firewall.shに+48 / -1）。`/etc/resolv.conf`の`# ExtServers: [...]`からDockerの上流DNSを読み、port 53を許可する。

結論として、PRの方向性は正しい。ただし解析に不具合があり、現状のままではマージできない。解析部分を約10行の最小案に置き換えるよう、変更を依頼するのが妥当。PRへの返信も修正の適用もまだしていない。

## 仕組み（実測で確定）

| 環境 | ExtServers | stagingのスクリプト適用下での結果 |
| --- | --- | --- |
| 本devcontainer（OrbStack） | `[host(0.250.250.200)]` | 解決できる。未キャッシュ名もNXDOMAINまで届く。コンテナから上流への直接問い合わせはhost unreachable |
| PR作者（WSL2と推定） | `[10.255.255.254]` | 127.0.0.11経由でSERVFAIL。OUTPUTのREJECTカウンタが18 → 19。`db`の名前解決と、WSLから上流への問い合わせは正常 |

`host(...)`への転送はホスト側から出るため、コンテナのiptablesを通らない。素のアドレスへの転送はコンテナ内から出るため、stagingのルールで遮断される。したがって、ルールが必要なのは素のIPv4だけ。導入済みのスクリプトはstaging版と同一であることを確認した。カウンタの増加は、127.0.0.11への問い合わせ単体で測った値である前提で解釈している。

## PRの不具合（解析部分を切り出して実行）

| ExtServers | PRの挙動 |
| --- | --- |
| `[host(0.250.250.200)]`・`[host(127.0.0.53)]` | exit 1 |
| `[8.8.8.8 1.1.1.1]` | `8.8.8.81.1.1.1`に連結されexit 1 |
| `[10.255.255.254]` | 成功 |

exit 1になる位置は、iptablesのポリシーをDROPに変える前である。そのためOrbStackやsystemd-resolvedの環境では、コンテナが毎回、ファイアウォール未適用のまま（外向き通信がすべて許可された状態で）動く。早期の失敗で全許可のまま残る性質は既存スクリプトにもあるが、PRはそれを毎回起きる状態にする。postStartCommandが失敗した後もコンテナが動き続けるかは、実機では未確認。

## CodeRabbit指摘の評価

空白区切りは妥当で、カンマとの併用は不要。`host(...)`からIPv4を取り出してACCEPTする案は誤り。上記のとおりルールは不要で、0.250.250.200ならコンテナからの不要な直通経路を開けてしまう。読み飛ばすのが正しい。

## 冗長さの評価

- **検証ループ:** 空白除去は区切り文字を誤ったことの回避策で、連結の原因になっている。オクテット検査や、行がないときのexit 1は、Dockerが生成する入力に対して過剰。不正な値はiptablesが拒否して安全側で止まり（既存115行目の設計）、DNS障害は末尾の疎通確認で検出できる。
- **コメント:** 既存のwhyコメント「port 53 to any other IP would bypass the allowlist」を「Allow Docker's embedded DNS.」というwhatに置き換え、同じ趣旨を2行で書き直している。
- **コミット:** 日本語の件名で、`fix:`の後に空白がない（AGENTS.mdはコミットを英語と定めている）。squash時の件名で直せる。
- 書式（複数行化、`/32`）とログは好みの範囲（nit）なので、指摘しない。

## 修正案

PRの解析・検証・ルール追加を、次のコードに置き換える。置き場所は、stagingの133〜135行目（127.0.0.11のルール）。PRの差分で言えば、ポリシー変更の前に追加された解析ブロック（114〜150行目）を削除し、170〜182行目をこのコードに置き換える。事前に失敗させる検証がないため、解析もDNSのルールと同じ場所にまとめる。上記の各値、`host(...)`と素のアドレスの混在、IPv6の混在、行がない場合のすべてで、期待どおりのルールが出てexit 0になることを確認した。IPv4以外は読み飛ばす。IPv6はip6tablesで全拒否しているため、許可しても使えない。

```bash
# Only Docker's DNS servers; port 53 to any other IP would bypass the allowlist.
iptables -A NOVISTEPS_OUTPUT -p udp -d 127.0.0.11/32 --dport 53 -j ACCEPT
iptables -A NOVISTEPS_OUTPUT -p tcp -d 127.0.0.11/32 --dport 53 -j ACCEPT

# Docker queries bare ExtServers addresses from the container's namespace and host(...) ones from the host's.
read -r -a upstream_dns_entries <<<"$(sed -n 's/^# ExtServers: \[\(.*\)\]$/\1/p' /etc/resolv.conf)"

for upstream_dns in "${upstream_dns_entries[@]}"; do
  if [[ "${upstream_dns}" =~ ^[0-9.]+$ ]]; then
    iptables -A NOVISTEPS_OUTPUT -p udp -d "${upstream_dns}" --dport 53 -j ACCEPT
    iptables -A NOVISTEPS_OUTPUT -p tcp -d "${upstream_dns}" --dport 53 -j ACCEPT
  fi
done
```

### 却下案

- **CodeRabbit案:** 上記のとおり。
- **PRの厳密な検証を残す:** 入力はDockerが生成する。iptablesの入力検証と末尾の疎通確認に重複し、正常な環境まで止める。
- **port 53を全宛先に許可する（Anthropic版スクリプトの方式）:** 任意のIPへの通信路になり、許可リストを迂回できる。

## Codexのクロスレビュー

`codex exec -s read-only`で実施した（静的な検証のみ）。採用したのは、「`host(...)`が経路外である根拠の不足」と「PRの前提が未再現」の2点で、それぞれ追加の実測と作者のデータで解消した。本planの表現の誤り（既存のdig結果との比較、検証位置のコメントのwhat扱い、ログ方針）は、本文に反映済み。

その他の指摘は、Dockerが生成する入力では起きないエッジケースとして採用しなかった（不正なIPv4、`sed`の失敗、上流ごとやUDP/TCP別の到達性、複数のExtServers行、手動での再実行）。流出経路に関する指摘は、planの記述の誤読だった。

## 対応

1. PRへのレビューコメント（不具合、`host(...)`の扱い、最小案）を作成する。投稿するかはユーザーが判断する。
2. 取り込む場合は、OrbStackと作者の環境の両方でpostStartCommandが成功し、「Firewall check OK」が出ることを確認する。

## 未確認

- 空白区切りの出力（mobyの`ExtDNSEntry.String()`）は記憶に基づく。複数エントリの実際の出力は観測していない。
- 作者の環境での遮断は作者の切り分けに基づき、こちらでは再現していない。Docker Desktopの出力形式も未確認。
- 本環境（OrbStack）では、修正版を`pr-4279`ブランチに当ててリビルドし、postStartCommandで疎通確認3件・example.comの遮断・「Firewall configured」を確認した（2026-11-02）。素のアドレスにルールを追加する側の実機確認は、作者の環境で必要。
