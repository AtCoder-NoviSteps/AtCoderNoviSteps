# devcontainer で Claude Code / Codex を安全に共存させる計画

## 概要

devcontainer で Claude Code と Codex のどちらも利用できる状態を維持しつつ、秘密情報・認証状態は分離し、開発規約とproject固有skillは単一ソースから共有する。

本計画の対象は devcontainer、`.claude/settings.json`、`.codex/config.toml`、`AGENTS.md`、共通rules / skills、`CONTRIBUTING.md`、`docs/guides/` の関連文書である。アプリケーション、DB、GitHub → Vercel のデプロイ方式は変更しない。

実装済みの未コミット変更（setup scriptの `@openai/codex` とVS Code拡張 `openai.chatgpt`）は維持する。

## 確定した方針

- Claude Code / Codex の両方を `postCreateCommand` でインストールする。
- 片方のインストール失敗だけで devcontainer の準備全体を止めない。
- CLI を Dockerfile へ移さない。月単位のモデル性能変化に対応しやすくする。
- Codex の状態はプロジェクト専用の `~/.codex-devcontainer/AtCoderNoviSteps` に分離する。
- Codexのproject設定はGit管理する `.codex/config.toml` に置き、永続状態から分離する。
- `~/.ssh` は mount せず、VS Code Dev Containers の SSH agent forwarding を使う。
- `.env` はローカル実行用として残すが、Docker image には含めず、agent からの読み取りも拒否する。
- rules本文は `docs/guides/agent-rules/`、project固有skillは `.agents/skills` を正本として両agentで共有する。
- planとdev noteは幅による手動改行を入れず、意味上の段落・箇条書き単位で記述してeditorのsoft wrapを使う。
- MCP は導入しない。現在も project / user 設定に MCP server は登録されていない。
- クロスレビューは通常任意とし、大規模または重要な変更だけ必須にする。
- 実装開始には、この計画とは別にユーザーの明示承認が必要である。

## 現状と問題

| 対象              | 現状                                              | 対応                                                 |
| ----------------- | ------------------------------------------------- | ---------------------------------------------------- |
| CLI               | setup script が両CLIを直列に必須インストール      | 各CLIの失敗を分離する                                |
| Codex状態         | 永続化・分離されていない                          | project専用 `CODEX_HOME` をmount                     |
| Codex設定         | repository管理のproject設定がない                 | `.codex/config.toml` を追加                          |
| SSH               | host `~/.ssh` をread-write mount                  | mountを削除しagent forwardingへ移行                  |
| `.env`            | `COPY .` の対象になり得る                         | `.dockerignore` で除外し、agentのreadもdeny          |
| Claude sandbox    | 利用不能時のfail-closedが未設定                   | `bubblewrap` と明示的な失敗設定を追加                |
| Superpowers       | project設定で旧marketplaceを有効化                | project設定から削除                                  |
| `AGENTS.md`       | 6,729 bytes。32 KiB上限には余裕があるが手順が重い | 必須事項だけへ縮小                                   |
| Claude rules      | 11ファイル、約43 KiB。Codexから参照できない       | `docs/guides/agent-rules/` を正本として両agentで共有 |
| Claude skills     | 6件、約20 KiB。Codexから利用できない              | 共通skillを `.agents/skills` へ移す                  |
| `architecture.md` | 現行規約と将来案が混在                            | 同じファイル内で明確に分離                           |

ホストの `~/.codex/config.toml` にあるmacOSの絶対pathは、コンテナの `/usr/src/app` のtrust設定には一致しない。また、通常利用とcontainer利用でsession・log・SQLite状態を同時共有する必要もない。このため、hostの `~/.codex` 全体はmountしない。

## 設計

### 1. agentの状態と秘密情報

- host `~/.codex-devcontainer/AtCoderNoviSteps` をcontainer `/home/node/.codex` へmountし、認証、session、log、SQLiteなどの永続状態だけを保持
- `CODEX_HOME=/home/node/.codex`
- host directoryは `0700`、認証ファイルは `0600`
- Codexのproject設定はrepositoryの `.codex/config.toml` で管理し、`CODEX_HOME/config.toml` への初回copyは行わない
- API keyやtokenを `containerEnv` やGit管理ファイルへ書かない

`.env` には二段階で対応する。

1. `.dockerignore` で `.env`、`.env.*`、`.claude/settings.local.json`、`.git` をbuild contextから除外する。ただし `.env.example` は残す。
2. `.claude/settings.json` と `.codex/config.toml` のfilesystem permissionで `.env*` のreadをdenyする。

Docker除外後もworkspaceはbind mountされるため、アプリ自身はローカルの `.env` を利用できる。agent経由で実行したcommandが `.env` を必要とする場合は失敗するため、検証用には秘密を含まないtest環境を使う。

denyの範囲は設定ファイルのscopeに合わせる。`.claude/settings.json` はGit管理されproject scopeで適用されるため、このdevcontainerだけでなくhost clone、Codespaces、cloud agentにも効く。したがってdevcontainerに存在しない秘密でも、それらの環境で実在するものはdenyを維持する。具体的には `~/.ssh` と `secrets/**`、`config/credentials.json`、`*.pem`、`*.key` を残し、Claudeのcredential file（`~/.claude` をmountするため）と `.env*` を追加する。

当初はdevcontainerで実際に公開される秘密だけへ絞る方針だったが、判断の前提がdevcontainer限定である一方で設定の適用範囲はproject全体であり不一致が生じるため、クロスレビューを受けて撤回した。詳細は「クロスレビュー findings」の2を参照。

一方、どの環境でも利用しない `~/.aws`、`~/.npmrc`、`~/.netrc`、`~/.git-credentials`、cloud / package registry tokenは追加しない。GitHub CLIのcredential fileやtokenはruntimeで公開されることを確認できた場合だけdeny / filterする。devcontainer固有の緩和が必要になった場合は、project scopeを広げずに `.claude/settings.local.json` へ置く。

### 2. CLIとsandbox

- Claude Code / Codex はsetup scriptで個別にインストールする。
- 片方の失敗は警告して継続するが、`pnpm install` の失敗は通常どおり停止する。
- Dockerfileにはsandbox実行基盤として `bubblewrap` だけを追加する。
- Claudeはsandboxを必須にし、利用不能時にunsandboxed実行へfallbackさせない。
- Claudeは `.claude/settings.json`、Codexは `.codex/config.toml` でproject共通のsandbox / permissionを定義する。
- Codexが子processへ渡す環境変数は、devcontainerで実際に利用する変数を基準に必要最小限にする。未使用providerのtoken filterを網羅的に追加しない。

SSH秘密鍵はcontainerへ見せない。hostの `ssh-agent` が動作していれば、Dev Containers拡張が接続を自動転送する。

mountを外した代償として、hostの `ssh-agent` への鍵登録が前提条件になる。従来はmountした鍵ファイルをcontainerから直接読めたため不要だった手順であり、未登録だとcontainer内のGit操作が `Permission denied (publickey)` で失敗する。`ssh-agent` はhost側のプロセスなのでcontainerのrebuildでは再登録は不要で、必要になるのはhost再起動時だけである。手順は `CONTRIBUTING.md` に記載する。

この構成が防ぐのは鍵の複製であり、署名の依頼ではない。SSHの認証protocolには秘密鍵を運ぶmessageが存在しないため、悪意あるserverが要求しても鍵そのものは流れない。流出経路は鍵ファイルを直接読めるprocessが別経路で送り出す場合に限られ、containerに鍵ファイルを置かないことでその経路も塞がる。

一方、転送が有効な間はsocketへ到達できるcontainer内のprocessが署名を依頼できる。containerが侵害された場合、鍵を盗まれることはないが、その間はuserとして認証され得る。ただし複製と違い被害は一時的で、socketが切れた時点で終わる。read-only mountを却下した理由はこの差にある（却下案 4）。

| 方式             | 鍵の複製                      | 署名の依頼       |
| ---------------- | ----------------------------- | ---------------- |
| `~/.ssh` をmount | 可能。mount解除後も悪用が続く | 可能             |
| agent forwarding | 不可能                        | 可能。転送中のみ |

署名依頼そのものを絞る必要が生じた場合は、`ssh-add -c`（署名ごとに確認）や `ssh-add -t <life>`（自動失効）を各利用者の判断で使う。projectとしては強制せず、既定では利便性を採る。

### 3. 指示・rules・skills

`AGENTS.md` は両agent向けの基本指示、`CONTRIBUTING.md` は人間向けの共通workflowとする。詳細なパス別規約は `docs/guides/agent-rules/`、project固有skillは `.agents/skills` を単一ソースとする。

Claude Codeの `.claude/rules` には `paths` frontmatterと共通rules本文への参照だけを置き、`.claude/skills` から `.agents/skills` の正本を参照する。Codexは `.agents/skills` をproject skillとして利用し、`AGENTS.md` のpath対応表に従って、計画・変更前に `docs/guides/agent-rules/` の該当文書を読む。常時適用する規約も `AGENTS.md` から明示する。rules本文やskill本文を製品別に複製しない。`.codex/rules` はcommand実行の許可・確認・禁止を制御する場所であり、開発規約の格納や参照には使わない。

`claude-code.md` / `codex.md` は製品固有設定だけを扱い、`CLAUDE.md` はimport、共通rules / skillsへの参照方法、Claude固有事項に限定する。

`AGENTS.md` に残すもの:

- project固有のarchitecture境界と主要command
- TDD、既存実装の探索、plan承認と実装承認の分離
- planを簡潔に保ちつつ設計判断を省略せず、新機能では主要な関数・interfaceの予定signatureとcomponentのprops・events contractを示す
- service / route / testの重要な規約
- 対象pathに対応する `docs/guides/agent-rules/` の文書を読む手順
- project固有workflowに `.agents/skills` を利用する方針
- クロスレビュー条件

削除・簡素化するもの:

- 一般的な会話姿勢や現行agentに重複する品質論
- 全phase後の必須refactor cycle
- `/session-close` の必須実行
- CodeRabbit findingsの全件転記

共有rules / skillsは次のように整理する。

- `coding-style.md` はplan作成時にも必要なため常時適用を維持する。
- formatter / linterで強制できる書式規則は設定へ移し、文章から減らす。
- `testing.md` はunit test、`testing-e2e.md` はE2Eだけに適用し、共通事項は最小限にする。
- Vitestの `clearMocks` defaultに関する記述はHEAD時点で正しかった（v5 default は `true`）。誤記という当初の前提が誤りだったため、書き換えずに維持する。
- ほぼ未使用で重量級の `session-close` と `refactor-plan` を削除する。
- 維持するproject固有skillは `.agents/skills` へ移し、Claude / Codexの両方から同じ本文を参照する。

Codex固有設定は共通指示・rules・skillsとは分離して次を管理する。

- repositoryの `.codex/config.toml`: project共通のsandbox、permission、必要最小限の環境変数policy
- project専用 `CODEX_HOME`: 認証、session、log、SQLiteなどGit管理しない永続状態
- Codex CLIとVS Code拡張
- `docs/guides/codex.md`: Codex固有のsetupと設定の責務

### Superpowersの扱い

現在はClaude / CodexともPlan mode、Skills、subagent、worktree、review機能を標準で備えるため、Superpowers全体のproject-level自動導入は行わず、`CLAUDE_CODE_PLUGIN_SEED_DIR` も追加しない。チーム品質は `AGENTS.md`、CI、test、クロスレビューで担保し、各利用者の任意導入とする。個別に利用する場合は、標準機能との重複が比較的少ない `systematic-debugging` と `verification-before-completion` を候補にする。

### 4. architecture文書

`docs/guides/architecture.md` は削除せず、同じファイル内を「現在の構成・規約」と「将来案・未実装」に分ける。

修正内容:

- `admin`、`user-profile` など未実装のfeature構成を将来案へ移す。
- `src/lib/services` は意図した現行配置として記載する。
- `_components/`、`_types/`、`_utils/` は、admin page単独の責務かつ認証・認可の事情がある場合のroute colocation例外として明記する。
- すでに反映済みのVitest include設定を将来タスクから現状説明へ移す。
- 現在のdirectory treeと実ファイルが一致することを確認する。

### 5. クロスレビュー

ローカル作業中は必要なときに明示実行する。PR作成前は、AI主導の非軽微な変更または次のいずれかに該当する変更で必須とする。

- 手編集したsource・test・設定が30ファイル以上
- 認証、認可、秘密情報を変更
- DB schema、migration、データ変換を変更
- 共通architectureまたは公開interfaceを変更

誤字修正、formatのみ、生成物、lockfile、snapshotだけの変更は軽微とし、30ファイルの集計からも除外する。

- Codexが計画・実装した場合: Claudeでレビュー
- Claudeが計画・実装した場合: Codexでレビュー
- 他方agentを利用できない場合はCodeRabbitで代用する。利用可能でもtoken残量が厳しい場合の補助にしてよい
- CodeRabbit findingsをplanへ残す場合は `Critical` / `Severe` 相当を優先し、低重要度の全件転記はしない
- findingの修正は自動で行わず、ユーザーが選ぶ

## 却下した代替案

1. **hostの `~/.codex` をそのままmount**: trust pathが一致せず、状態の同時利用も避けたい。
2. **全project共通の `~/.codex-devcontainer`**: 設定は楽だが、trust・session・SQLiteの影響範囲が広い。
3. **CLIをDockerfileへ移す**: image rebuildが必要になり、agentの更新・切替が重くなる。
4. **`~/.ssh` をread-only mount**: writeは防げるが、秘密鍵自体はcontainerから見えるため複製できる。agent forwardingなら複製は不可能で、残るリスクは転送中の署名依頼だけになる。設計 §2 を参照。
5. **Superpowersをimageへseed**: Claude利用者だけが必要な任意機能を全員へ配布することになる。
6. **rules / skills本文をClaude用とCodex用に複製**: 更新先が増えて内容が乖離する。rulesは `docs/guides/agent-rules/`、skillsは `.agents/skills` を単一ソースとし、Claude側は参照だけを持つ。
7. **Codex設定を `CODEX_HOME/config.toml` へ初回copy**: rebuild後の既存環境へ更新が反映されず、repositoryの設定と実行時設定が乖離する。
8. **~~未使用credentialの包括denyを外す~~（撤回）**: devcontainerに実在しない秘密の列挙は設定を読みにくくすると判断して既存denyを外したが、`.claude/settings.json` はproject scopeで host clone や cloud agent にも適用されるため撤回し、HEAD時点のdenyを復帰させた。
9. **MCPを先行導入**: 現在のCLIと公式連携で足りており、認証・常駐process・供給網リスクだけが増える。
10. **毎回クロスレビュー**: 小変更でもtokenと待ち時間を消費する。

## 実装フェーズ

### Phase 1: 文書とagent規約の整理

対象: `AGENTS.md`、`docs/guides/agent-rules/`、`.agents/skills`、`.claude/rules`、`.claude/skills`、`CONTRIBUTING.md`、`docs/guides/`

- [x] `AGENTS.md` を必須事項とクロスレビュー条件へ縮小し、Codexが対象pathに対応する `docs/guides/agent-rules/` の文書を読む指示と `.agents/skills` の利用方針を追加し、planの機械的な行数基準を削除し、簡潔さ、設計判断の保持、新機能の予定signature、Markdownのsoft wrapを明記する。
- [x] rules本文の正本を `docs/guides/agent-rules/` へ移し、Claude側は `.claude/rules` の薄いpath別エントリから、Codex側は `AGENTS.md` のpath対応表から同じ文書を参照する。unit / E2Eの適用範囲も直す。Vitest `clearMocks` は元の記述が正しいため変更しない。
- [x] 維持するproject固有skillを `.agents/skills` へ移し、Claude側は `.claude/skills` から同じファイルを参照する。`session-close` と `refactor-plan` は削除する。
- [x] `architecture.md` を現状と将来案に分け、実装状況と整合させ、ProviderガイドのClaude専用参照を共通規約へ変更する。
- [x] `CONTRIBUTING.md` に両agent共通の選択利用・PR前reviewを簡潔に記載する。`claude-code.md` はClaude固有設定だけへ縮小し、同程度の `codex.md` を追加する。Superpowersの任意性とCodeRabbit代用も重複なく配置する。
- [x] `CONTRIBUTING.md` に、host側で `ssh-agent` へ鍵を登録する手順とトラブルシューティングを追加する。`~/.ssh` のmountを外した結果、従来は不要だった前提が必要になったため。
- [x] 検証 `agent docs consistency check`: 両agentからのrules / skills参照、frontmatter、link、path、重複、file size、実directoryとの差を確認する。

Phase summary: 現行モデルでも必要なproject固有規約だけを残し、未実装案を失わずに分離する。

### Phase 2: devcontainerの安全性と任意性を改善

対象: `.devcontainer/`、`Dockerfile`、`.dockerignore`、`.claude/settings.json`、`.codex/config.toml`

- [x] project専用 `CODEX_HOME` を認証・session・log・SQLiteの永続状態用として作成・mountする。
- [x] `.codex/config.toml` をGit管理のproject設定として追加し、`.devcontainer/codex-config.toml` の初回copy方式は廃止する。
- [x] `~/.ssh` mountを削除し、SSH agent forwardingへ移行する。
- [x] `.dockerignore` から秘密情報とGit metadataを除外する。
- [x] 両CLIをsetup scriptに残し、各install失敗を非block化する。
- [x] VS CodeのMarkdown設定でsoft wrapを有効にする。
- [x] `bubblewrap` とClaudeのfail-closed設定を追加する。
- [x] Claude / Codexで `.env*` とmount・公開されるcredentialのreadをdenyし、project scopeで効く既存denyは維持する。どの環境でも使わないAWS / npm / cloud設定は追加しない。
- [x] projectのSuperpowers marketplace設定を削除する。
- [x] MCP設定を追加しない。
- [x] 検証 `devcontainer configuration validation`: JSON / TOML / shell構文、project configの読込、permission対象の実在性を確認する。

Phase summary: どちらかのagentが利用不能でも開発環境を作れ、利用時は秘密情報を読めない構成にする。

### Phase 3: clean rebuildと動作確認

対象: devcontainer runtime。アプリコード変更なし。

- [ ] clean rebuild後にproject依存のinstallと開発server起動を確認する。host側のrebuildが必要なため未実施。現行containerでは `pnpm dev` が `[::1]:5173` で HTTP 200 を返すことを確認済み。
- [x] Claude / Codex CLIとVS Code拡張を個別に確認する。
- [x] 片方のCLI install失敗が全体を停止しないことを確認する。
- [x] Codex CLI / IDE拡張がproject専用 `CODEX_HOME` を共有することを確認する。
- [x] Codex CLI / IDE拡張がrepositoryの `.codex/config.toml` をproject設定として読み込むことを確認する。
- [x] Claude Code / Codexが同じrules本文とproject固有skillsを利用できることを確認する。
- [x] hostの通常の `~/.codex` と `~/.ssh` がcontainerへ公開されていないことを確認する。
- [x] dummy secretで `.env` read拒否とsandbox fail-closedを確認する。実際の秘密は表示しない。
- [x] SSH agent forwarding経由でGitHubへのread-only接続を確認する。container内に秘密鍵が存在しない状態で `ssh -T git@github.com` が認証され、`git ls-remote origin HEAD` が成功した。
- [x] `pnpm format`、`pnpm lint`、`git diff --check` を実行する。

Phase summary: install、永続状態、SSH、sandbox、秘密情報保護を実環境で確認する。

### Phase 3 検証結果

container 内で確認できた項目の実測値。

| 項目                   | 結果                                                                                                                                     |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| CLI                    | `claude` / `codex` ともPATH上に存在。`coderabbit` は install 失敗で不在                                                                  |
| VS Code拡張            | `anthropic.claude-code` と `openai.chatgpt` の両方が container に install 済み                                                           |
| install失敗の非block化 | `coderabbit` の install が失敗しても他CLIと `pnpm install` は完了。`npm` 失敗を模した `set -euo pipefail` 下の simulation も exit 0      |
| `CODEX_HOME`           | `/home/node/.codex`。`codex doctor` の rollout DB sources が `vscode=2` を示し、CLIとIDE拡張が同じ永続状態を共有                         |
| project設定の読込      | `codex --strict-config doctor` が denied-read rules 5件、glob rules 3件、glob scan max depth 8 を報告。`.codex/config.toml` の内容と一致 |
| rules / skills共有     | `.claude/rules` 11件と `.claude/skills` 4件の symlink が全て正本へ解決。両set が正本と完全一致                                           |
| host状態の非公開       | 秘密鍵は不在。`~/.ssh` には検証時に生成された `known_hosts` のみで、rebuildで消える。`~/.codex` はproject専用 directory のみ             |
| SSH agent forwarding   | container内に秘密鍵が無い状態で `ssh -T git@github.com` が認証され、`git ls-remote origin HEAD` が成功                                   |
| `.env` read拒否        | Claude / Codex の両方で拒否。dummy secret のみ使用し実ファイルは開いていない                                                             |
| 機械的gate             | `pnpm exec prettier --check`（in-scope分）、`oxlint`、`eslint`、`pnpm check`（0 errors / 30 warnings）、`git diff --check` が通過        |

`pnpm lint` は未追跡かつ本PR範囲外の `docs/dev-notes/2026-08-01/contest-discussion-automation-review/qa.md` 1件だけで失敗する。prettierが整形結果を収束させられないファイルで、本PRのcommit対象に含めないため対応しない。

### SSH agent forwarding の確認結果

container 内に秘密鍵が存在しない状態で認証が通ることを確認した。設計 §2 の成立条件を満たしている。

```text
$ ssh-add -l
256 SHA256:... (ED25519)

$ ssh -T git@github.com
Hi KATO-Hiro! You've successfully authenticated, but GitHub does not provide shell access.

$ git ls-remote origin HEAD
3dc04bde...	HEAD

$ ls -la ~/.ssh/
known_hosts  known_hosts.old      # 秘密鍵は無い
```

`git push` は plan が read-only に限定しており `.claude/settings.json` でも deny しているため検証に含めない。

到達までに2点つまずいた。どちらも `CONTRIBUTING.md` に対処を記載した。

1. **鍵ファイル名の想定違い**: 実際の鍵は `~/.ssh/github` であり `id_ed25519` ではなかった。`ls -l ~/.ssh/id_*` では独自名の鍵を見落とすため、確認手順を `ls -la ~/.ssh/` に改めた。
2. **`AddKeysToAgent yes` が発火しない**: host の `~/.ssh/config` に設定済みでも agent は空だった。これはclient側optionであり、`ssh` processが config と鍵ファイルを読んだときにのみ動作する。container 内の `ssh` はhostのconfigも鍵も見えず agent へ問い合わせるだけなので、container 発の接続では自動登録が起きない。host 側で一度 `ssh -T git@github.com` を実行すれば agent に載り、転送済み socket 経由で container からも即座に見える。**rebuild は不要**。

### 残作業

`plan:202` の clean rebuild だけが残る。container 内からは実行できないため、host で rebuild（VS Code: Dev Containers: Rebuild Container）した後に確認する。

```bash
pnpm install
pnpm dev   # [::1]:5173 が HTTP 200 を返すこと
```

### `codex sandbox` が使えない制約

`bubblewrap` は install 済みだが、compose の web service は Docker 既定の seccomp profile で起動し effective capability を持たないため unprivileged user namespace を作れない。このため `codex sandbox <command>` は deny 対象か否かに関わらず常に失敗する。

fail-closed 側へ倒れるため秘密が露出する経路にはならない。container 自体の防御層である seccomp profile をこの機能のために緩めない方針とし、devcontainer では `approval_policy = "on-request"` の承認を主たる防御とする。Claude Code 側の実行と `.env` deny は影響を受けない。詳細は `docs/guides/codex.md` に記載した。

### 撤回した `proseWrap: "never"`

soft wrap 方針を formatter で機械的に強制する意図で `.prettierrc` に `proseWrap: "never"` が追加されていたが、本PRの範囲では撤回した。この設定は本計画のどのphaseにも含まれていない。

撤回の理由は影響範囲が意図より広いこと。

- 折り返された文章行を強制的に1行へ結合するため、`.github/ISSUE_TEMPLATE/bug_report.md` の OS / Browser / Version という記入欄が1行に潰れる。追跡済みファイルであり CI の lint job が落ちる。
- Markdown tableのcolumn paddingも同時に無効化するため、既存のdev noteとguideほぼ全てが再整形対象になる。

soft wrap 方針そのものは `AGENTS.md` の規約と devcontainer の `editor.wordWrap` で維持する。formatter での強制は、影響範囲を切り分けた別PRで検討する。

## クロスレビュー findings

Claude の `/code-review` による指摘。全件を手元で再現確認し、ユーザーの選択に基づき4件すべて対応した。

### Severe

1. **Vitest `clearMocks` の記述が正しい内容から誤った内容へ反転した** — 修正済み

   `docs/guides/agent-rules/testing.md` は「`clearMocks` の default は `false`」と書いていたが、install 済み vitest 5.0.0 の default は `clearMocks: true`（`defaults` chunk で確認）。`vite.config.ts` でも上書きしていない。HEAD 時点の記述が正しく、Phase 1 の「Vitestの `clearMocks` defaultに関する誤記を修正する」が、誤記でなかった記述を誤記へ書き換えていた。agent が不要な `vi.clearAllMocks()` を追加する方向へ誘導するため、`true` と「`vi.clearAllMocks()` を追加しない」の記述へ戻した。

2. **`.claude/settings.json` の deny 縮小が devcontainer 以外の環境にも適用される** — revert 済み

   `~/.ssh` の `denyRead` と `Read(**/*.pem)`、`Read(**/*.key)`、`Read(**/secrets/**)`、`Read(**/config/credentials.json)` を削除した根拠は「この devcontainer には存在しない / mount しない」だったが、このファイルはproject scopeでcommitされるため、host clone、Codespaces、cloud agentにも適用される。それらの環境では `~/.ssh` が実在する。

   設計 §1 と却下案 8 の方針は devcontainer 限定の前提に立っており、設定の適用範囲と一致しない。削除した5件を戻し、`.env*` と Claude credential file の deny は追加のまま維持した。devcontainer 固有の緩和が必要になった場合は `.claude/settings.local.json` 側へ置く。

### Moderate

3. **`install -d` の失敗が `pnpm install` の実行前に script 全体を止める** — 修正済み

   `set -euo pipefail` 下でこの行だけが非guardであり、同 script の他のinstall行はすべて `|| echo ... continuing` を持っていた。mount の所有者が不一致の場合に exit 1 となり、`postCreateCommand` が中断して `node_modules` のない container が残る。`install -d` と `chmod 600` の両方を非blockにした。書き込み不可pathでの simulation で、修正前は中断、修正後は `pnpm install` へ到達することを確認した。

### Minor

4. **単文 `if` の brace 必須ルールが設定へ移されず消えた** — 復帰済み

   HEAD の `## Syntax` にあった「**Braces**: always for single-statement `if` blocks」が `## Error and Type Clarity` への改称時に落ちていた。`.oxlintrc.json` と `eslint.config.mjs` に `curly` 相当の設定はないため、linter へ移すのではなく文章として戻した。

## 完了条件

- Claude Code / Codexの両方を選択でき、片方のinstall失敗だけでは環境構築が止まらない。
- Codex状態が `~/.codex-devcontainer/AtCoderNoviSteps` に分離される。
- `.codex/config.toml` がGit管理のCodex project設定として適用され、永続状態と混在しない。
- SSH秘密鍵はcontainerへmountされず、`.env` とproject scopeでdenyしたcredentialをagentが読めない。
- `.env` やlocal設定がDocker imageへ入らない。
- SuperpowersとMCPが暗黙に有効化されない。
- `docs/guides/agent-rules/` と `.agents/skills` が単一ソースになり、Claude Code / Codexの両方から利用できる。
- `AGENTS.md`、共通rules / skills、`CONTRIBUTING.md`、関連guideが簡潔で現状と矛盾しない。
- 大規模・重要変更だけクロスレビューが必須になる。

## 参考資料

- [Codex project instructions (AGENTS.md)](https://learn.chatgpt.com/docs/agent-configuration/agents-md)
- [Codex skills](https://learn.chatgpt.com/docs/build-skills)
- [Codex command rules](https://learn.chatgpt.com/docs/agent-configuration/rules)
- [Codex project configuration](https://learn.chatgpt.com/docs/config-file/config-basic)
- [Codex permissions](https://learn.chatgpt.com/docs/permissions)
- [Codex environment variables](https://learn.chatgpt.com/docs/config-file/environment-variables)
- [VS Code: Sharing Git credentials](https://code.visualstudio.com/remote/advancedcontainers/sharing-git-credentials)
- [Docker build context](https://docs.docker.com/build/concepts/context/)
- [Claude Code sandboxing](https://code.claude.com/docs/en/sandboxing)
