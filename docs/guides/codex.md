# Codex 設定ガイド

共通規約とrules / skillsの利用方法は [AGENTS.md](../../AGENTS.md) を参照する。

## 設定と保存先

- 共通設定は原本 [.codex/config.toml](../../.codex/config.toml) だけで管理する。CLIとVS Code拡張が直接読み、trusted projectではuser設定より優先される。コピーや別のlocal設定fileは作らない。
- `$CODEX_HOME/config.toml` は個人のmodel設定、trust、TUI状態の保存用とし、共通設定を重複させない。
- devcontainerではhostの `~/.codex-devcontainer/AtCoderNoviSteps` を `/home/node/.codex`（`CODEX_HOME`）へmountする。CLIと拡張の認証・sessionなどを共有し、rebuild後も保持する。hostの通常の `~/.codex` とは分離する。
- CodexにはClaude Codeの `.claude/skills/` のようなsymlink層はない（`.codex/skills/` は存在しない）。project固有workflowは正本 `.agents/skills/<name>/instructions.md` を直接参照する。

## 実行権限

`project-edit` profileはworkspaceの編集を許可し、`.env*`、credential、秘密鍵などのreadを拒否する。具体的なdeny対象は原本を参照し、`.claude/settings.json` と揃える。子processの環境変数は `core` を基準に、既定のsecret名filterも有効にする。

Linux sandboxには `bubblewrap` を使う。Dockerfileでsetuid付きで導入し、composeのweb serviceにnested sandbox用のcapabilityとseccomp / AppArmorの緩和を設定する。

`on-request` はsandbox外の操作に対する承認方針であり、sandboxの代替ではない。credentialを保護するため、`danger-full-access` と `--dangerously-bypass-approvals-and-sandbox` は使用しない。

SSH秘密鍵はmountせず、hostの `ssh-agent` からDev Containersのagent forwardingを使う。projectのMCP serverは登録しない。

## 動作確認

sandboxの実行基盤を変更したらclean rebuildし、通常のcontainer terminalで確認する。

```bash
command -v bwrap
bwrap --unshare-user --dev-bind / / true
codex sandbox -- true
```

CLIとVS Code拡張の両方で新規sessionを開始し、command実行とdummy credentialのread拒否を確認する。
