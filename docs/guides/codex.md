# Codex 設定ガイド

共通の開発規約はルートの `AGENTS.md` を参照する。この文書は Codex 固有の設定だけを扱う。

## devcontainer の状態分離

devcontainer は host の `~/.codex-devcontainer/AtCoderNoviSteps` を container の `/home/node/.codex` に mount し、`CODEX_HOME` を同じ path に設定する。これにより CLI と VS Code 拡張は project 専用の認証、session、log、SQLite 状態を共有し、host の通常の `~/.codex` とは分離される。

repository 共通設定は `.codex/config.toml` に置く。Codex は trusted project でこの設定を user config より優先して読み込み、CLI と VS Code 拡張で共有する。永続状態へ設定を copy しないため、rebuild 後も repository の更新がそのまま反映される。

## permissions

project の `project-edit` profile は built-in `:workspace` を継承する。workspace は編集可能だが、次の情報は command から read できない。

- workspace 内の `.env*`
- project 専用 `CODEX_HOME` に mount される `auth.json`

子 process へ渡す環境変数は `shell_environment_policy` で core variables を基準にし、既定の secret 名 filter を有効にする。filesystem deny と環境変数 filter は別々の防御であり、どちらか一方で代用しない。

設定変更時や CLI 更新時は `codex --strict-config doctor` で `.codex/config.toml` の読込と deny rule 数を検証する。

## devcontainer では `codex sandbox` を使わない

`codex sandbox` は bubblewrap に unprivileged user namespace の作成を要求するが、compose の web service は Docker 既定の seccomp profile で起動し effective capability を持たないため、この操作が拒否される。結果として `codex sandbox <command>` は deny 対象かどうかに関わらず常に失敗する。

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
