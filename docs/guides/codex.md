# Codex 設定ガイド

共通の開発規約はルートの `AGENTS.md` を参照する。この文書は Codex 固有の設定だけを扱う。

## devcontainer の状態分離

devcontainer は host の `~/.codex-devcontainer/AtCoderNoviSteps` を container の `/home/node/.codex` に mount し、`CODEX_HOME` を同じ path に設定する。これにより CLI と VS Code 拡張は project 専用の認証、session、log、SQLite 状態を共有し、host の通常の `~/.codex` とは分離される。

## project 設定の正本と適用

repository 共通設定は `.codex/config.toml` である。ただし Codex が読むのは `$CODEX_HOME/config.toml` だけで、repository 直下の `.codex/config.toml` は読み込まれない（codex-cli 0.154.0 で確認）。このため setup script が setup ごとに copy する。

`$CODEX_HOME/config.toml` は導出物であり、直接編集しない。次の setup で上書きされる。`.codex/config.toml` を更新したときは、container を rebuild するか、次を1回実行して同期する。

```bash
install -m 600 .codex/config.toml "${CODEX_HOME}/config.toml"
codex --strict-config doctor   # denied-read rules の件数が .codex/config.toml と一致すること
```

## permissions

project の `project-edit` profile は built-in `:workspace` を継承する。workspace は編集可能だが、次の情報は command から read できない。deny 対象は `.claude/settings.json` と揃える。片方の agent だけで読める秘密を残さないためである。

- workspace 内の `.env*`、`secrets/**`、`config/credentials.json`、`*.pem`、`*.key`
- project 専用 `CODEX_HOME` に mount される `auth.json`
- mount される `~/.claude/.credentials.json` と `~/.ssh/**`

子 process へ渡す環境変数は `shell_environment_policy` で core variables を基準にし、既定の secret 名 filter を有効にする。filesystem deny と環境変数 filter は別々の防御であり、どちらか一方で代用しない。

## devcontainer では `codex sandbox` を使わない

`codex sandbox` は bubblewrap に unprivileged user namespace の作成を要求するが、compose の web service は Docker 既定の seccomp profile で起動し effective capability を持たないため、この操作が拒否される。結果として `codex sandbox <command>` は deny 対象かどうかに関わらず常に失敗する。使えないことが確定しているため `bubblewrap` は image に含めない。

fail-closed 側へ倒れるため秘密が露出する経路にはならない。devcontainer では `approval_policy = "on-request"` による承認を主たる防御とし、`codex sandbox` には依存しない。seccomp profile は container 自体の防御層であり、この機能のために緩めない。

## SSH と MCP

- SSH 秘密鍵は mount しない。host で `ssh-agent` を起動し、Dev Containers の agent forwarding を利用する。
- project の MCP server は登録しない。必要になった時点で接続先、権限、認証情報の保存先を個別に設計する。

## rules と skills

Codex は `AGENTS.md` の path 対応表から `docs/guides/agent-rules/` の該当文書を読む。project 固有 skill は repository 標準の `.agents/skills/` から読み込む。

## 参考

- [Codex permissions](https://learn.chatgpt.com/docs/permissions)
- [Codex environment variables](https://learn.chatgpt.com/docs/config-file/environment-variables)
- [Codex AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md)
