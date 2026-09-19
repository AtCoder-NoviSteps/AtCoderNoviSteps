# devcontainer 内で Claude / Codex のサンドボックスが全滅した件

Issue: https://github.com/AtCoder-NoviSteps/AtCoderNoviSteps/issues/4059
Commit: 40450ec7（旧 `plan.md` / `survey.md` / `learning.md` を本ファイルに統合。原文は同コミットで参照可）

## 症状と発端

- Claude / Codex の Bash がすべて `bwrap: setuid use of bubblewrap is not supported` で失敗し、`git commit` もできない。
- 発端: DSA-6472-1（2026-08-27、CVE-2026-87766 修正）で Debian trixie に bubblewrap 0.12.0 が入った。0.12.0 は setuid 対応を削除しており、`acquire_privs()` が実 UID ≠ 実効 UID を検知して即終了する。[1][2][3]
- `Dockerfile` は `apt-get install bubblewrap` で版を固定していないため、再ビルドした日によって 0.11.x（setuid で動く）か 0.12.0 かが変わる。実環境で `bwrap --version` = 0.12.0、Debian 13.6 を確認（2026-09-19）。
- `allowUnsandboxedCommands: false`（Strict sandbox mode）なので、bwrap が起動できないとサンドボックス外で再実行する逃げ道がなく、Bash が全滅する。[4]
- #4034（2026-09-13 マージ）の時点で動いていたのは、DSA 配信前にビルドしたイメージ／キャッシュが残っていたためと推測（未確認）。

## 障害の連鎖と対応する修正

setuid の削除で、それまで先頭の失敗に隠れていた問題が 1 つずつ表に出た。

| #   | 表に出たエラー                                                | 原因                                                                                   | 修正（40450ec7）                                                        |
| --- | ------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| 1   | `setuid use of bubblewrap is not supported`                   | 0.12.0 が setuid を拒否                                                                | `Dockerfile` の `chmod u+s /usr/bin/bwrap` を削除                       |
| 2   | Claude: `Can't mount proc on /proc: Operation not permitted`  | setuid が暗黙に回避していた `/proc` マウント制約（下記）                               | `.claude/settings.json` に `enableWeakerNestedSandbox: true`            |
| 3   | Codex: `Can't write data to file <path>: Bad file descriptor` | openai/codex#43929（ファイル単位の deny が 2 つ以上で起動失敗）                        | 認証情報の deny をディレクトリ単位へ。ファイル単位は `.env` の 1 つだけ |
| 4   | Codex: `Can't mount proc on /proc`                            | #2 と同じ制約 + Codex の代替手段が新しいエラー文言を検知しない（#44304 / #44329）      | `compose.yaml` に `security_opt: systempaths=unconfined`                |
| 5   | サンドボックス内の `pnpm` が `Read-only file system`          | コンテナの pnpm と `packageManager` の版ずれ → pnpm が指定版をダウンロードしようとする | `setup-devcontainer.sh` で `packageManager` と同じ版を入れる            |

### #2 / #4: setuid が回避していた `/proc` の制約

- user namespace 方式では、既存の `/proc` がすべて見えている場合にしかカーネルは新しい procfs のマウントを許さない。Docker は `/proc/kcore` などをマスクしているので EPERM になる。
- setuid 方式ではコンテナの root（`SYS_ADMIN`）で動くため、この制約を受けなかった。つまり setuid は「コンテナ内で `/proc` をマウントする」回避策を兼ねていた。
- Claude: 公式 Troubleshooting の対処そのもの（"the inner sandbox bind-mounts the container's existing `/proc` instead"）。注意書き "considerably weakens security and should only be used when additional isolation is otherwise enforced" は、コンテナが外側の隔離境界になるので許容。[4][6]
- Codex: 公式 secure devcontainer は setuid 前提で、`--proc` が拒否されたら `--proc` なしで再試行する設計。[9] だが失敗判定が旧文言 `/newroot/proc` の文字列一致なので、0.12.0 では再試行されない。[8][10] Codex 側に設定で逃げる手段がないため、Docker のマスク自体を外した。
- `enableWeakerNestedSandbox` は `systempaths=unconfined` 導入前に入れたもので、「効果を確認できるまで残す」としている。現状では不要かもしれない（未検証）。

### #3: openai/codex#43929 の実際の数え方

- 「deny に一致するファイルが 2 つ以上で必ず失敗、ディレクトリなら動く」。完全パスかワイルドカードかによらない。0.155.1 でも未修正。[5]
- 実測で分かったこと:
  - 数える範囲はワークスペース内ではなく Codex の設定全体（`~/.claude/.credentials.json` で失敗した）。
  - ワイルドカードを含まない完全パス（例 `".env.local"`）は、実在しなくても 1 つに数えられる。
  - ワイルドカードのパターンは実在ファイルにのみ一致すると考えられる（未検証）。
  - `".env"` と `"**/.env"` を同じファイルとして 2 回数えるかは未確認。安全側で `".env"` だけにした。
- 設定は公式ドキュメント推奨の書き方どおりで、設定ミスではなく Codex のバグ。[7]

### #5: pnpm の版ずれ

- pnpm 11 以降は `pmOnFail: download` が既定で、版がずれると指定版を自動ダウンロードする。[12] サンドボックス外では黙って成功するため気づかなかった。
- ベースイメージの pnpm は 12.3.4、`packageManager` は Renovate により 09-13 に 12.4.1、09-18 に 12.4.2。ずれ始めた 09-13 は Bash 全滅の時期と重なり、サンドボックス復旧まで表に出なかった。
- 版を `package.json` から読むので、Renovate が上げても次のリビルドで追従する（2 か所管理にしない）。

## 意思決定

### 守るもの（固定）

- `.env`、`~/.claude/.credentials.json`、`~/.codex/auth.json` を Claude / Codex の両方から読めないこと。これを削る案（`.env` の deny 解除、`default_permissions` を外す等）は採らない。

### deny 設定の最終形とトレードオフ

- Codex: `"~/.codex"` / `"~/.claude"` をディレクトリで deny、ファイル単位は `".env"` のみ。`**/.env` と `.env.*` 系は外した。
- Claude: `**/.env.*` 系を外し `**/.env` のみ（Codex と集合を揃えるため）。Claude 自体には #43929 の制約はない。
- 失うもの:
  - サブディレクトリの `.env` と、`.env.local` などは deny から外れる（現状は存在しない）。置くときは deny を足し直す必要があり、#43929 が未修正なら Codex が再び起動しなくなる。
  - `**/*.pem`、`**/*.key`、`**/secrets/**`、`**/config/credentials.json` に一致するファイルが 1 つでも置かれると #43929 に当たる。
  - `~/.codex` の deny で、サンドボックス内から `~/.codex` 配下（グローバル AGENTS.md、skills）が読めなくなる可能性。問題が出たら `"~/.codex"` だけ外す。

### `systempaths=unconfined` のリスク評価

- Docker の説明は "Turn off confinement for system paths (masked paths, read-only paths)"。[11] コンテナ内の全プロセスで、`/proc/kcore` 等のマスクと `/proc/sys`、`/proc/sysrq-trigger` の読み取り専用が外れる。
- userns-remap がないため、コンテナ内 root は VM カーネルを直接操作できる。

| 新たにできること（root の場合）  | 実害                                                        |
| -------------------------------- | ----------------------------------------------------------- |
| `/proc/sysrq-trigger` に書き込む | VM を即座に再起動・停止。OrbStack の全コンテナが止まる      |
| `/proc/sys` に書き込む           | VM のカーネル設定変更。他コンテナの保護も弱められる         |
| `/proc/kcore` を読む             | VM のカーネルメモリ読み出し。他コンテナの秘密情報が漏れうる |

- 範囲: OrbStack の Linux VM とその中のコンテナまで。Mac 本体のファイルには届かない。
- 誰が: `node` はパスワードなし `sudo` が使えるので、サンドボックス外で動くコード（悪意ある postinstall など）。サンドボックス内のコマンドは bwrap が `sudo` 昇格を防ぐので通らない。
- 判断: 既存の `SYS_ADMIN` / seccomp・apparmor unconfined で root は元々これらを外せるため、新たな能力はほぼ増えず攻撃の手間が 1 段減るのみ。ただしこれは緩和を重ねる理由ではないので、単体で実害を評価した上で「同じ VM に重要なコンテナを同居させない」前提で許容する。この前提はチームに共有する。
- フォールバック: それでも `/proc` エラーが出るなら戻して上流の修正を待つ。

### 却下した代替案

| 案                                                          | 却下理由                                                                  |
| ----------------------------------------------------------- | ------------------------------------------------------------------------- |
| `allowUnsandboxedCommands: true` / `sandbox.enabled: false` | 原因を直さず防御を外すだけ。`denyRead` による認証情報の保護も効かなくなる |
| bubblewrap を 0.11.x に固定                                 | 廃止済みの setuid 方式の延命。CVE-2026-87766 の修正も受けられない [3]     |
| `.env` を deny から外して Codex を動かす                    | 守るものを削る本末転倒                                                    |
| Codex の deny を残して上流の修正を待つ                      | 修正の目処がなく、その間 Codex が起動しない                               |
| サンドボックスに pnpm キャッシュへの書き込みを許可          | サンドボックスを緩め、pnpm 本体を書き換えられる余地が生まれる             |
| `Dockerfile` に pnpm の版を直書き                           | `package.json` と 2 か所管理になり、Renovate の更新でまたずれる           |
| `pmOnFail: ignore`                                          | `packageManager` による版の固定が効かなくなる                             |

## 運用上の注意

- Codex の設定を変えたら、VS Code 拡張が起動した app server も再起動する。CLI は常駐 app server に接続するだけで設定を読み直さない（今回、03:04 起動の古い app server が古い deny のまま動いていた）。
- 上流の修正（#43929、#44304 / #44329）が入ったら、ディレクトリ単位の deny、`systempaths=unconfined`、`enableWeakerNestedSandbox` の要否を見直す。

## 振り返り

### 紆余曲折の根本原因

修正は 1 コミットだが、到達までに Phase 3 → 3b → 3c → 3d → 3e と 5 回方針を出し直した。原因は次の 3 つに集約される。

1. setuid が暗黙に担っていた役割を洗い出さずに外した。
   - setuid が `/proc` マウントの回避策を兼ねていたことを見落とし、Claude / Codex の `/proc` 問題を別々に扱った。そのため `systempaths=unconfined` を Claude 用に却下 → Codex 用に採用という往復が起きた。#44304 は Phase 3c の時点で「次に当たる可能性」と把握していたのに先送りした。
2. 一次資料を読み切らず、観測したエラーから仮説を狭く立てた。
   - #43929 の条件（ファイル単位の deny が 2 つ以上で失敗、ディレクトリは可）を「ワークスペース内の実在ファイルが 2 つ以上」と読み替えたため、`.env.example` → `.env.local` → `~/.claude/.credentials.json` と 3 回に分けて潰すことになった。
3. 検証環境が変更を反映しているか確認しなかった。
   - 「CLI を再起動すれば反映される」と説明し、常駐 app server が古い設定のまま出したエラーで判断した回があった。

背景として、先頭の失敗が後ろの問題をすべて隠す構造（Strict sandbox mode で Bash が全滅 → Codex のバグと pnpm の版ずれが見えない）があり、1 つ直すたびに次の層が現れた。これ自体は避けられないが、上の 1〜3 がなければ往復は 1〜2 回で済んだ。

### 判断の誤り（結果には残っていないもの）

- `.env` を deny から外す案を推した: 動かすことを優先して目的（秘密情報の保護）を損ねる本末転倒。
- 「すでに緩めてあるから」を理由に `systempaths=unconfined` のリスクを小さく見積もった: 既存の緩和は追加の緩和の根拠にならない。

### 教訓

- 権限まわりの設定（setuid、capability、security_opt）を外すときは、それが暗黙に回避していた制約を先に洗い出す。
- エラーが連鎖しそうなときは、既知の上流 issue をまとめて確認し、方針を 1 回で決める。
- 上流 issue を根拠にするときは、報告された条件をそのまま採用し、自分の観測で狭めない。
- 設定変更が効かないときは、その設定を読むのが常駐プロセスかを確かめ、プロセスの起動時刻と設定の更新時刻を比べる。
- バージョン未固定のパッケージは、再ビルドした日によって挙動が変わる。「以前は動いた」ときは、まず実環境の版を確認する（`bwrap --version`）。
- 回避策を選ぶ前に守るもの（今回は `.env` と認証情報）を固定し、それを削る案は候補から外す。
- セキュリティの緩和は、既存の緩和を根拠にせず、単体で実害（誰が・何を・どこまで）を書き出して判断する。

## 出典

1. bubblewrap releases（0.11.2 で setuid 非推奨化・CVE-2026-41163、0.12.0 で削除）: https://github.com/containers/bubblewrap/releases
2. bubblewrap source（`acquire_privs()` の `die ("setuid use of bubblewrap is not supported")`）: https://github.com/containers/bubblewrap/blob/main/bubblewrap.c
3. Debian security tracker: https://security-tracker.debian.org/tracker/DSA-6472-1 / https://security-tracker.debian.org/tracker/CVE-2026-87766 / https://security-tracker.debian.org/tracker/CVE-2026-41163
4. Claude Code sandboxing（Troubleshooting「Bubblewrap fails to start inside a container」、Strict sandbox mode）: https://code.claude.com/docs/en/sandboxing
5. openai/codex#43929（deny に一致するファイルが 2 つ以上で起動失敗）: https://github.com/openai/codex/issues/43929
6. Claude Code settings reference（`sandbox.enableWeakerNestedSandbox`）: https://code.claude.com/docs/en/settings-reference
7. Codex Permissions（deny の完全パスとワイルドカード、`:workspace_roots`）: https://learn.chatgpt.com/docs/permissions
8. openai/codex#44304（0.12.0 で `/proc` のエラー文言が変わり代替手段が働かない）: https://github.com/openai/codex/issues/44304
9. openai/codex PR #17547（secure devcontainer、`--proc` なしで再試行）: https://github.com/openai/codex/pull/17547
10. openai/codex#44329（CLI と VS Code 拡張が `/proc` マウント失敗を扱えない）: https://github.com/openai/codex/issues/44329
11. Docker `docker container run`（`--security-opt systempaths=unconfined`）: https://docs.docker.com/reference/cli/docker/container/run/
12. pnpm 11.0 release notes（`pmOnFail`）: https://pnpm.io/blog/releases/11.0
