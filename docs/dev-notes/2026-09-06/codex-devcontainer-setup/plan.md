# devcontainer で Claude Code / Codex を安全に共存させる計画

## 概要

devcontainerでClaude CodeとCodexのどちらも利用できる状態を保ちつつ、秘密情報・認証状態は分離し、開発規約とproject固有skillは単一ソースから共有する。

対象はdevcontainer、`.claude/settings.json`、`.codex/config.toml`、`AGENTS.md`、共通rules / skills、`CONTRIBUTING.md`、`docs/guides/` の関連文書。アプリケーション、DB、デプロイ方式は変更しない。

## 確定した方針

### agentの可用性

- **両CLIの併存**: `postCreateCommand` で個別にインストールし、片方の失敗だけでは環境構築を止めない。
- **CLIの導入先**: Dockerfileへは移さない。image rebuildなしで更新・切替でき、月単位のモデル性能変化に追従できる。
- **RTK**: agent非依存のCLIとしてinstallを検証し、失敗を成功扱いにしない。`rtk init` によるagent統合とは別の完了条件とする。

### 状態と設定の分離

- **Codexの永続状態**: project専用の `~/.codex-devcontainer/AtCoderNoviSteps` を `CODEX_HOME` としてmountする。hostの通常の `~/.codex` はmountしない。
- **Codexの設定階層**: project設定はGit管理の `.codex/config.toml` に置き、公式のproject config layerとして直接読み込む。`CODEX_HOME/config.toml` はtrustとTUI状態用のuser configとして分離する。

### 秘密情報の保護

- **SSH秘密鍵**: `~/.ssh` はmountせず、Dev ContainersのSSH agent forwardingを使う。
- **`.env`**: ローカル実行用に残すが、Docker imageへは含めず、agentからのreadも拒否する。
- **sandbox実行基盤**: CodexのLinux sandboxに必要な `bubblewrap` とcontainer runtime権限を、OpenAI公式のsecure devcontainer構成を基準に用意する。

### 単一ソース化

- **rules / skills**: rules本文は `docs/guides/agent-rules/`、project固有skillは `.agents/skills` を正本として両agentで共有し、LLM別に複製しない。
- **文書の書式**: plan・dev noteは幅による手動改行を入れず、意味上の段落・箇条書き単位で書いてeditorのsoft wrapを使う。

### 見送るもの

- **MCP**: 導入しない。
- **Superpowers**: project設定で自動導入せず、各利用者の任意とする。

### レビュー運用

- **クロスレビュー**: 通常は任意とし、大規模または重要な変更だけ必須にする。

## 設計判断

### `.env` 保護の二段構え

`.dockerignore` が防ぐのはimage layerへの焼き込みだけである。`compose.yaml` が `.:/usr/src/app` をbind mountするため、`.env` はimageに無くてもcontainerには存在する。「agentが読めない」を担保するのは設定側のdenyだけで、`.git` の除外もsecurity効果はなくbuild context削減が目的である。アプリ自身はbind mount経由で `.env` を使えるが、agent経由のcommandは失敗するため検証には秘密を含まないtest環境を使う。

### denyのscopeは設定fileのscopeに合わせる

`.claude/settings.json` と `.codex/config.toml` はGit管理でproject scopeに適用されるため、denyはhost clone、Codespaces、cloud agentにも効く。devcontainerに無い秘密でも他環境で実在するもの（`~/.ssh`、`secrets/**`、`config/credentials.json`、`*.pem`、`*.key`）は外さず、どの環境でも使わない `~/.aws`、`~/.npmrc`、`~/.netrc`、`~/.git-credentials` は追加しない。環境固有の緩和は `.claude/settings.local.json` へ置く。denyはsandbox層とtool層の両方へ書く。sandboxはbash経路しか止めない。

### SSH agent forwardingの脅威モデル

防げるのは鍵の複製であり、署名の依頼ではない。SSHの認証protocolに秘密鍵を運ぶmessageは無いため、悪意あるserverが要求しても鍵は流れない。流出経路は鍵fileを直接読めるprocessに限られ、containerに鍵を置かないことで塞がる。

| 方式             | 鍵の複製                      | 署名の依頼       |
| ---------------- | ----------------------------- | ---------------- |
| `~/.ssh` をmount | 可能。mount解除後も悪用が続く | 可能             |
| agent forwarding | 不可能                        | 可能。転送中のみ |

転送中にcontainerが侵害されれば署名は依頼されうるが、被害はsocketが切れた時点で終わる。さらに絞る場合は `ssh-add -c` / `ssh-add -t <life>` を各自の判断で使い、projectとしては強制しない。代償としてhostの `ssh-agent` への鍵登録が前提条件になる（未登録だとcontainer内のGit操作が `Permission denied (publickey)` で失敗する）。手順は `CONTRIBUTING.md` に記載した。

### 指示・rules・skillsの分担

`AGENTS.md` は両agent向けの基本指示、`CONTRIBUTING.md` は人間向けworkflow、`claude-code.md` / `codex.md` は製品固有設定だけを扱う。Claude側は `.claude/rules` と `.claude/skills` のsymlink、Codexは `AGENTS.md` のpath対応表から同じ正本を読む。`.codex/rules` はcommand実行の許可・確認・禁止を制御する場所で、開発規約は置かない。

`AGENTS.md` からは一般的な会話姿勢、全phase後の必須refactor cycle、`/session-close` の必須実行、CodeRabbit findingsの全件転記を削除した。`coding-style.md` はplan作成時にも必要なため常時適用を維持し、formatter / linterで強制できる書式規則は設定へ移す。ほぼ未使用で重量級の `session-close` と `refactor-plan` skillは削除した。

### Superpowersの扱い

Claude / Codexとも現在はPlan mode、Skills、subagent、worktree、review機能を標準で備えるため、project-levelの自動導入は行わず `CLAUDE_CODE_PLUGIN_SEED_DIR` も追加しない。個別利用時は標準機能との重複が少ない `systematic-debugging` と `verification-before-completion` を候補にする。

### クロスレビュー条件

AI主導の非軽微な変更のうち、手編集のsource・test・設定が30ファイル以上、認証・認可・秘密情報、DB schema・migration・データ変換、共通architectureまたは公開interfaceを変更する場合に必須。誤字・formatのみ・生成物・lockfile・snapshotは軽微としてファイル数からも除外する。Codex主導はClaude、Claude主導はCodexでレビューし、他方が使えない場合はCodeRabbitで代用する。findingの修正は自動で行わず、ユーザーが選ぶ。

## 却下した代替案

1. **hostの `~/.codex` をそのままmount**: trust pathが一致せず、session / log / SQLite状態の同時共有も避けたい。
2. **全project共通の `~/.codex-devcontainer`**: trust・session・SQLiteの影響範囲が広い。
3. **CLIをDockerfileへ移す**: image rebuildが必要になり、更新・切替が重くなる。
4. **`~/.ssh` をread-only mount**: writeは防げるが秘密鍵は見えるため複製できる。
5. **Superpowersをimageへseed**: 一部の利用者だけが必要な任意機能を全員へ配布することになる。
6. **rules / skills本文をLLM別に複製**: 更新先が増えて内容が乖離する。
7. **Codex設定を `CODEX_HOME/config.toml` へcopy**: copy先へ動的状態が追記され、原本と実効設定が乖離する。`chmod 400` もowner自身が戻せるため境界にならない。
8. **`.codex/config.toml` のfile mount**: read-onlyではtrustを永続化できず `config/batchWrite failed` でTUIが起動せず、writeableではuser configと同一fileへ潰れる。公式の設定階層を使えば不要。
9. **~~未使用credentialの包括denyを外す~~（撤回）**: 読みやすさを理由に外したが、project scopeで効くためHEAD時点のdenyを復帰させた。
10. **MCPを先行導入**: 現在のCLIと公式連携で足り、認証・常駐process・供給網riskだけが増える。
11. **毎回クロスレビュー**: 小変更でもtokenと待ち時間を消費する。
12. **`.prettierrc` の `proseWrap: "never"`**: `.github/ISSUE_TEMPLATE/bug_report.md` の記入欄が1行へ潰れてCIのlintが落ち、table paddingも無効化されて既存文書のほぼ全てが再整形対象になる。方針は規約と `editor.wordWrap` で維持する。

## 再発防止策

クロスレビュー2回（`/code-review`）で14件を検出し、1件の誤指摘を除く全件へ対応した。繰り返しうる失敗の型として次を残す。

- **`set -euo pipefail` 下のguard漏れ**: 非guardの1行が `pnpm install` 到達前にscript全体を止める。`||` はunbound variableに発火しないため `${CODEX_HOME:-/home/node/.codex}` のように既定値を挟み、install系は全行を非blockにする。
- **`initializeCommand` はhostのshellで動く**: Windowsでは `chmod` がcommand not foundとなり作成が止まる。container内でできる処理はsetup script側へ置く。
- **実測失敗から仕様を推論しない**: untrusted projectでproject config layerがskipされた事象を「repository configを読まない」と誤診し、copy → read-only mount → writeable mountと誤った対処を重ねた。`bwrap` の失敗も原因はcontainer runtime権限の不足だった。公式仕様と前提条件（trust、capability、seccomp）を先に切り分ける。
- **install失敗をwarningで流さない**: rebuildが成功したように見えたままRTK CLIが欠落した。完了条件に `rtk --version` と `rtk gain` の成功を含める。
- **denyは層ごとに書く**: `sandbox.filesystem.denyRead` だけではtool経路が止まらない。Claude側とCodex側でdeny対象を非対称にしない。
- **判断の前提と設定のscopeを一致させる**: 「このdevcontainerには無い」を根拠にproject scopeの設定を削らない。
- **「誤記修正」の前に現行実測を確認する**: Vitest `clearMocks` はv5.0.0のdefaultが `true` で、HEAD時点の記述が正しかった。誤記という前提自体が誤りだった。
- **証跡は両agentで取る**: symlink解決はClaude側の証跡にすぎない。Codex側は `codex debug prompt-input` のskill rootsで確かめる。
- **sandbox内の失敗を環境の欠陥と混同しない**: agent sessionのsandboxでは入れ子実行やstate DB書き込みが制限され、`codex sandbox`、`rtk gain`、`git diff --check` が本来の可否と無関係に失敗する。

`approval_policy` はsandbox境界の外へ出る際の確認方針であり、filesystem denyの代替ではない。`danger-full-access` と `--dangerously-bypass-approvals-and-sandbox` は `.env`・認証情報・SSH agent socketを公開するため採用しない。

## 実測値

| 項目                 | 実測                                                                                                                                                                                                                                                                |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| version              | `claude 2.1.270`、`codex 0.154.0`、`rtk 0.49.0`、VS Code拡張 `anthropic.claude-code` / `openai.chatgpt`（`26.908.40401`）                                                                                                                                           |
| install失敗の非block | `coderabbit` のinstall失敗後も他CLIと `pnpm install` が完了。`set -euo pipefail` 下の `npm` 失敗simulationもexit 0                                                                                                                                                  |
| `CODEX_HOME`         | `/home/node/.codex` にhostの `.codex-devcontainer/AtCoderNoviSteps` がmountされ、directoryは `0700`、user configは `0600`。CLIとIDE拡張がstate / log / DBを共有                                                                                                     |
| 設定fileの分離       | 原本とuser configは別inodeで、config file単体のmountは無い。user configは `model` / `model_reasoning_effort` / trust / `tui` だけを持つ                                                                                                                             |
| project layerの適用  | user configに `approval_policy`・`permissions`・`shell_environment_policy` が無い状態で、doctorが `OnRequest`、denied-read rules 11件、glob rules 8件、`glob scan max depth 8` を報告。これらは原本にしか無く、project config layerが適用されていることの証拠になる |
| deny                 | 内訳は原本の3件（`~/.codex/auth.json`、`~/.claude/.credentials.json`、`~/.ssh/**`）とworkspace内glob 8件。VS Code sandboxでは `NoNewPrivs: 1`、`Seccomp: 2` で、deny対象がtmpfsへ置換される                                                                         |
| CLI sandbox / RTK    | 2026-09-13に通常のcontainer terminalで `bwrap`、`codex sandbox`、新規session、`rtk --version`（`0.49.0`）、`rtk gain` の成功を確認                                                                                                                                  |
| rules / skills共有   | `.claude/rules` 11件と `.claude/skills` 4件のsymlinkが全て正本へ解決。`codex debug prompt-input` のskill rootsに `/usr/src/app/.agents/skills` と skill 4件                                                                                                         |
| SSH                  | container内に秘密鍵が無い状態で `ssh -T git@github.com` が認証され、`git ls-remote origin HEAD` が成功。`~/.ssh` はrebuildで消える `known_hosts` のみ                                                                                                               |
| MCP / Superpowers    | doctorのMCP server数は0。projectのClaude設定にSuperpowers有効化設定なし                                                                                                                                                                                             |
| 機械的gate           | prettier（in-scope分）、`oxlint`、`eslint`、`pnpm check`（0 errors / 30 warnings）、`git diff --check` が通過                                                                                                                                                       |

`pnpm lint` は本PR範囲外の未追跡file `docs/dev-notes/2026-08-01/contest-discussion-automation-review/qa.md` 1件だけで失敗する。prettierが整形を収束できないfileで、commit対象外のため対応しない。`svelte-check` はwarningでは非0終了しないため30 warningsでもCIは通過する。CIの `pnpm check` job追加は計画外だったが、`AGENTS.md` と `CONTRIBUTING.md` の記述に合わせる必要があるため取り込んだ（`.github/workflows/**` のpath rule確認は未実施）。

## 完了条件

2026-09-13時点で全て達成。SSH接続とimage内容は前回の実測を継続利用しており、今回は再検証していない。user configの整理経緯は[原本への一本化計画](../../2026-09-12/codex-config-single-source/plan.md)を参照する。

- [x] Claude Code / Codexの両方を選択でき、片方のinstall失敗だけでは環境構築が止まらない。
- [x] Codex状態が `~/.codex-devcontainer/AtCoderNoviSteps` に分離される。
- [x] 共通設定はGit管理の原本 `.codex/config.toml` だけで管理し、公式のproject config layerから直接適用する。`CODEX_HOME/config.toml` は個人設定と動的状態に限定する。2026-09-13に両fileの内容とdoctorの実効設定を突き合わせて確認した。
- [x] SSH秘密鍵はcontainerへmountされず、`.env` とproject scopeでdenyしたcredentialをagentが読めない。
- [x] `.env` やlocal設定がDocker imageへ入らない。
- [x] SuperpowersとMCPが暗黙に有効化されない。
- [x] `docs/guides/agent-rules/` と `.agents/skills` が単一ソースになり、Claude Code / Codexの両方から利用できる。
- [x] `AGENTS.md`、共通rules / skills、`CONTRIBUTING.md`、関連guideが簡潔で現状と矛盾しない。
- [x] 大規模・重要変更だけクロスレビューが必須になる。
- [x] Codex CLI / VS Code拡張の両方がLinux sandboxを初期化できる。2026-09-13に通常のcontainer terminalでCLIの動作を確認した。
- [x] RTK CLIがPATH上に存在し、`rtk --version` と `rtk gain` が成功する。2026-09-13に通常のcontainer terminalで両方の成功を確認した。

## 参考資料

- [Codex project configuration](https://learn.chatgpt.com/docs/config-file/config-basic)
- [Codex permissions](https://learn.chatgpt.com/docs/permissions)
- [Codex sandbox](https://learn.chatgpt.com/docs/sandboxing)
- [Codex secure devcontainer](https://github.com/openai/codex/blob/main/.devcontainer/README.md)
- [Codex project instructions (AGENTS.md)](https://learn.chatgpt.com/docs/agent-configuration/agents-md) / [skills](https://learn.chatgpt.com/docs/build-skills) / [command rules](https://learn.chatgpt.com/docs/agent-configuration/rules)
- [VS Code: Sharing Git credentials](https://code.visualstudio.com/remote/advancedcontainers/sharing-git-credentials)
- [Claude Code sandboxing](https://code.claude.com/docs/en/sandboxing)
