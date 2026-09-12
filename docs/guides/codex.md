# Codex 設定ガイド

共通の開発規約はルートの `AGENTS.md` を参照する。この文書は Codex 固有の設定だけを扱う。

## devcontainer の状態分離

devcontainer は host の `~/.codex-devcontainer/AtCoderNoviSteps` を container の `/home/node/.codex` に mount し、`CODEX_HOME` を同じ path に設定する。これにより CLI と VS Code 拡張は project 専用の認証、session、log、SQLite 状態を共有し、host の通常の `~/.codex` とは分離される。

## project 設定の正本と適用

repository 共通設定の唯一の実体は `.codex/config.toml` である。ただし Codex が読むのは `$CODEX_HOME/config.toml` だけで、repository 直下のpathからは読み込まれない（codex-cli 0.154.0 で確認）。このため devcontainer は `.codex/config.toml` を `$CODEX_HOME/config.toml` へ書き込み可能なbind mountとして直接公開する。

sourceとtargetは同じ実体を参照するため、同期操作は不要である。CodexによるtrustやTUI状態の追記も `.codex/config.toml` のGit差分として現れる。設定変更は常に `.codex/config.toml` に対して行い、動的状態をcommitするかは差分を確認して判断する。

## permissions

project の `project-edit` profile は built-in `:workspace` を継承する。workspace は編集可能だが、次の情報は command から read できない。deny 対象は `.claude/settings.json` と揃える。片方の agent だけで読める秘密を残さないためである。

- workspace 内の `.env*`、`secrets/**`、`config/credentials.json`、`*.pem`、`*.key`
- project 専用 `CODEX_HOME` に mount される `auth.json`
- mount される `~/.claude/.credentials.json` と `~/.ssh/**`

子 process へ渡す環境変数は `shell_environment_policy` で core variables を基準にし、既定の secret 名 filter を有効にする。filesystem deny と環境変数 filter は別々の防御であり、どちらか一方で代用しない。

## devcontainer の Linux sandbox

Codex CLIとVS Code拡張はLinux上のlocal commandに `bubblewrap` sandboxを使用する。Dockerfileはdistribution提供の `bubblewrap` をsetuidで導入し、composeはOpenAI公式のsecure devcontainerを基準に、nested sandbox構築に必要なcapabilityとDocker外側のseccomp / AppArmor緩和をweb serviceだけへ設定する。

`approval_policy = "on-request"` はsandbox境界を越える操作の確認方針であり、filesystem denyを実装するsandboxの代替ではない。`danger-full-access` と `--dangerously-bypass-approvals-and-sandbox` は、containerから見えるcredentialにもCodexが到達できるため使用しない。

変更後はclean rebuildし、次を確認する。

```bash
command -v bwrap
bwrap --unshare-user --dev-bind / / true
codex sandbox -- true
```

CLIとVS Code拡張の両方でfresh sessionを開始し、dummy credentialのdenyも確認する。

## SSH と MCP

- SSH 秘密鍵は mount しない。host で `ssh-agent` を起動し、Dev Containers の agent forwarding を利用する。
- project の MCP server は登録しない。必要になった時点で接続先、権限、認証情報の保存先を個別に設計する。

## rules と skills

Codex は `AGENTS.md` の path 対応表から `docs/guides/agent-rules/` の該当文書を読む。project 固有 skill は repository 標準の `.agents/skills/` から読み込む。

## 参考

- [Codex permissions](https://learn.chatgpt.com/docs/permissions)
- [Codex environment variables](https://learn.chatgpt.com/docs/config-file/environment-variables)
- [Codex AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md)
