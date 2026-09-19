# Plan: devcontainer から秘密を排除し、入れ子のサンドボックスを撤去する

## 経緯（深刻だったもの）

#4034 で導入したエージェントのサンドボックスの構成で、次の問題が分かった。

1. **エージェントのコマンドが全く動かなくなった（2026-09-18）**
   - Debian のセキュリティ更新で bubblewrap が 0.12.0 になり、setuid での起動が廃止された。[4] version を固定していなかったため、コンテナを作った日によって動作が不安定に。
   - 直そうとすると、コンテナのセキュリティ制限を次々に緩める必要があった（コンテナの中でさらにサンドボックスを動かす「入れ子」は、そもそも相性が悪い）。
2. **サンドボックスがあっても、秘密は守れていなかった**
   - 本番の秘密 `CONFIRM_API_URL` は、compose がコンテナの環境変数として必須で注入していた。`printenv` を実行すれば誰でも読め、サンドボックスでは防げていなかった。
   - VS Code が GitHub のトークンをコンテナに共有しており、`git credential fill` で取り出せた。
3. **エージェントが何でもできる権限を持っていた**
   - ベースイメージが `node` ユーザーにパスワードなしの `sudo`（管理者権限）を与えていた。エージェントも設定を書き換えたり、ファイアウォールを外したりできた。

## 方針: コンテナに秘密を置かず、外向きの通信は許可リストで絞る

コンテナ全体を境界とし、コンテナ内ではエージェントのサンドボックスを使わない。

### 本番の値はローカルに置かない

- `CONFIRM_API_URL`（AtCoder アカウント連携の確認にだけ使う）は、既定でコンテナに入れない。連携確認のボタンが失敗するだけで、ほかの機能には影響しない。
- 連携済みユーザーは、シード（`pnpm db:seed`）で作る（`admin`、`guest`）。本物の値での確認が必要なときだけ、エージェントを使わずに行う。
- 値そのものは変更しない。返すのは AtCoder の公開情報で、本人確認は URL の秘匿に依存しないため。大量アクセスへの対策は、エンドポイント側で別途行う。

### エージェントのサンドボックスはコンテナ内だけ無効にする

- プロジェクトの設定は、コンテナを使わないホストでも効くため残す。
- bubblewrap のパッケージを外すだけでは不十分だった。Codex は自前の bwrap を同梱しており、それを使うため。

### コンテナに残る秘密は、エージェント自身のログイン情報だけ

- エージェントの push はルールで禁止し、`staging` / `main` はブランチ保護で守る。人間の push の手間は増やさない。ルールだけではエージェントによる push を技術的には防げない。
- Claude と Codex のログイン情報はコンテナに残り、エージェントのコマンドから読める。この残余リスクを受け入れ、送信先を絞る。

### 外部通信の許可リスト

- Anthropic の公式リファレンスの `init-firewall.sh` を元にし、コンテナの起動のたびに適用する。[1]
- 各ツールの任意機能の宛先 [2] と、`api.openai.com`（Codex を API キーで使うときだけ必要）[5] は入れない。
- テレメトリは、各ツールの設定でも止める（遮断だけだと再送で遅くなる）。
- CDN の IP 変更で許可先につながらなくなった場合は Rebuild する。稼働中の `init-firewall.sh` 再実行は、既存の `OUTPUT DROP` 規則を消した後に GitHub から IP 一覧を取得できず、通信不能になるため行わない。
- 受け入れた制約:
  - Claude の Remote Control が使えない（テレメトリを止める設定が、その機能も止めるため）。[6]
  - Codex の利用状況の送信先は推論と同じ `chatgpt.com` で、ファイアウォールでは止められない。設定でだけ止めている。[3][7]

## 却下した代替案

| 案                                        | 却下理由                                                            |
| ----------------------------------------- | ------------------------------------------------------------------- |
| エージェントを各自の OS で直接動かす      | Windows は Claude のサンドボックスに非対応。OS ごとに挙動が分かれる |
| 秘密管理ツール（dotenvx、Infisical など） | 秘密 1 つには過剰。エージェントからも取得できてしまう               |
| push はホストから行う                     | 作業環境が二つに分かれ、手間が増える                                |

## Rebuild 後の確認（2026-09-19）

ユーザーの確認結果:

- `curl` による許可先・非許可先への接続と `sudo -n true` は、それぞれ期待どおりに成功・失敗した。
- VS Code の拡張と Claude / Codex の CLI・拡張で会話とコマンドを実行できた。
- `pnpm install` と `pnpm test:e2e` は成功した。

実際の `git commit` / `git push` は、このレビュー前の確認項目から外した。`coderabbit review --plain` も今回の動作確認には含めない。

## 残るリスク

- Claude / Codex のログイン情報はエージェントのコマンドから読める。許可した宛先や DNS の問い合わせを経由した持ち出しは防げない。DNS の宛先だけを絞っても、このリスクは解消しない。
- ファイアウォールは IP アドレスで判定するため、同じ IP を共有する他のサイトにも届く。
- コンテナ作成直後のセットアップと、VS Code を使わない `docker compose up` では、ファイアウォールが効かない。この起動時の例外は、ローカル開発の運用として受け入れる。
- ホストに `CONFIRM_API_URL` が残っていると再注入される（警告は出る）。GitHub のトークン共有の停止も各自のホスト設定に依存する。新しいメンバーにも確認を依頼する。

## 教訓

- セキュリティの設定を外すときは、それが裏で何を回避していたかを先に洗い出す。
- エラーが連鎖しそうなら、既知の上流 issue をまとめて確認し、方針を 1 回で決める。
- 守るもの（秘密とログイン情報）を先に固定し、それを削る案は候補にしない。

## 出典

1. Claude Code reference devcontainer: https://github.com/anthropics/claude-code/tree/main/.devcontainer
2. Claude Code: Network access requirements: https://code.claude.com/docs/en/network-config
3. Codex: Configuration reference: https://learn.chatgpt.com/docs/config-file/config-reference
4. Debian: DSA-6472-1: https://security-tracker.debian.org/tracker/DSA-6472-1
5. Codex: Authentication: https://developers.openai.com/codex/auth
6. Claude Code: Data usage: https://code.claude.com/docs/en/data-usage
7. openai/codex Discussion #8291（Client Analytics）: https://github.com/openai/codex/discussions/8291
