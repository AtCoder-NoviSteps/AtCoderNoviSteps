# Codex 設定ガイド

共通規約とrules / skillsの利用方法は [AGENTS.md](../../AGENTS.md) を参照する。

## 設定と保存先

- 共通設定は原本 [.codex/config.toml](../../.codex/config.toml) だけで管理する。CLIとVS Code拡張が直接読み、trusted projectではuser設定より優先される。コピーや別のlocal設定fileは作らない。
- `$CODEX_HOME/config.toml` は個人のmodel設定、trust、TUI状態の保存用とし、共通設定を重複させない。
- devcontainerではhostの `~/.codex-devcontainer/AtCoderNoviSteps` を `/home/node/.codex`（`CODEX_HOME`）へmountする。CLIと拡張の認証・sessionなどを共有し、rebuild後も保持する。hostの通常の `~/.codex` とは分離する。
- CodexにはClaude Codeの `.claude/skills/` のようなsymlink層はない（`.codex/skills/` は存在しない）。project固有workflowは正本 `.agents/skills/<name>/instructions.md` を直接参照する。

## 実行権限

`project-edit` profileはworkspaceの編集を許可し、`.env`、credential、秘密鍵などのreadを拒否する。具体的なdeny対象は原本を参照し、`.claude/settings.json` と揃える。子processの環境変数は `core` を基準に、既定のsecret名filterも有効にする。

hostでは `project-edit` profileのsandboxが境界で、`danger-full-access` は使用しない。devcontainerではcontainerが境界で、[managed config](../../.devcontainer/codex-managed-config.toml)がsandboxを無効にし、agent自身のlogin情報以外の秘密はcontainerに置かない。Codexは `bwrap` がないと同梱版を使うため、bubblewrapを外すだけではsandboxは止まらない。

SSH秘密鍵はmountせず、hostの `ssh-agent` からDev Containersのagent forwardingを使う。projectのMCP serverは登録しない。外向き通信は [init-firewall.sh](../../.devcontainer/init-firewall.sh) で制限し、analyticsはmanaged configで止める。

## 動作確認

実行基盤を変更したらclean rebuildし、常駐のapp serverも再起動してから、CLIとVS Code拡張の両方でcommandを実行できることを確認する。hostではdummy credentialのread拒否を確認する。
