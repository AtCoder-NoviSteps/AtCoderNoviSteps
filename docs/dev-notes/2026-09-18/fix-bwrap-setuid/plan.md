# Plan: devcontainer 内で Claude / Codex のサンドボックスを復旧する

Issue: https://github.com/AtCoder-NoviSteps/AtCoderNoviSteps/issues/4059
調査結果: [survey.md](./survey.md)

## 概要

- bubblewrap 0.12.0（Debian trixie の DSA-6472-1 で配信）は setuid での起動を拒否するため、`Dockerfile` の `chmod u+s /usr/bin/bwrap` で Claude / Codex の Bash がすべて失敗している。[1][2][3]
- setuid を外すと、隠れていた問題が 2 つ表に出る。
  - Claude: コンテナ内で新しい `/proc` をマウントできない（`Can't mount proc on /proc: Operation not permitted`）。[4]
  - Codex: deny ルールに一致するファイルが 2 つ以上あると起動時に失敗する既知バグ（`Can't write data to file /usr/src/app/.env.example: Bad file descriptor`）。[5]
- 3 つを設定ファイルの変更だけで解消する。

## 設計判断

### setuid を外す

- 上流の bubblewrap 0.12.0 は setuid 対応を削除しており、setuid 付きの bwrap は `acquire_privs()` で即終了する。[1][2]
- 残す選択肢はない。

### Claude: `sandbox.enableWeakerNestedSandbox: true`

- Claude Code 公式ドキュメントの Troubleshooting に載っている、この症状への対処法そのもの。[4]
  - "Set `enableWeakerNestedSandbox` to `true` so the inner sandbox bind-mounts the container's existing `/proc` instead."
- 設定リファレンス上の Scope は "Any file" で、プロジェクトの `.claude/settings.json` に書ける。[6]
- 公式ドキュメントの注意書きは "considerably weakens security and should only be used when additional isolation is otherwise enforced."。[4]
  - この環境ではコンテナ自体が外側の隔離境界になっているため許容する。
  - ファイルシステムの deny とネットワーク制限は引き続き有効で、弱まるのはサンドボックス内のコマンドから `/proc` のプロセス情報が見えるようになる点。
- Linux 専用の設定のため、macOS のホストで clone した場合は影響しない。Linux ホストで直接使う場合は同じく弱まる。

### Codex: `.env.example` を deny 対象から外す

- openai/codex#43929 は未修正で、回避策も示されていない。[5]
- `.env.example` は `.gitignore` の `!.env.example` で commit 済みのテンプレートで、秘密情報を含まない。`git show` でも読めるため、deny しても守れるものがない。
- `.env.*` を `.gitignore` と同じ意図の具体的なパターン（`.env.local`, `.env.*.local`）に置き換え、`.env.example` が一致しないようにする。
- `.codex/config.toml` のコメントに従い、`.claude/settings.json` の deny も同じ集合に揃える。

## 却下した代替案

| 案                                                          | 却下理由                                                                                                                                                                                                         |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `allowUnsandboxedCommands: true` / `sandbox.enabled: false` | 原因を直さずに防御を外すだけ。`denyRead` による認証情報の保護も効かなくなる                                                                                                                                      |
| bubblewrap を 0.11.x に固定                                 | 廃止済みの setuid 方式を延命するだけで、CVE-2026-87766 の修正も受けられない [3]                                                                                                                                  |
| `compose.yaml` に `security_opt: systempaths=unconfined`    | Claude のサンドボックスの強度は保てるが、コンテナ全体で `/proc` のマスクと読み取り専用の保護が外れる（Phase 3d のトレードオフを参照）。Claude の公式ドキュメントの対処法でもない。※ Codex 用には Phase 3d で採用 |
| Codex の `.env.*` deny を残して上流の修正を待つ             | 修正の目処が立っておらず、その間 Codex が起動しない                                                                                                                                                              |

## Phase 1: `Dockerfile` から setuid を外す（低リスク）

- レイヤー: 開発環境の設定（コンテナイメージ）
- 変更: `&& chmod u+s /usr/bin/bwrap \` の 1 行を削除する。

```dockerfile
RUN apt-get update \
    && apt-get -y install --no-install-recommends bubblewrap fish \
    && rm -rf /var/lib/apt/lists/*
```

- 確認: リビルド後に `ls -l /usr/bin/bwrap` の結果に `s` ビットが付いていないこと。
- テスト: 分岐のある振る舞いを持たない設定変更のため、テストファーストは省略する。

## Phase 2: Claude の入れ子サンドボックスを有効にする（中リスク）

- レイヤー: Claude Code 設定
- 変更: `.claude/settings.json` の `sandbox` に `enableWeakerNestedSandbox: true` を追加する。

```json
{
  "sandbox": {
    "enabled": true,
    "allowUnsandboxedCommands": false,
    "enableWeakerNestedSandbox": true,
    "filesystem": { "...": "..." }
  }
}
```

- 確認: Claude から `true`、`git status`、`git commit --dry-run` が成功すること。

## Phase 3: `.env.example` を deny 対象から外す（中リスク・秘密情報の扱いの変更）

- レイヤー: Codex / Claude Code 設定
- `.codex/config.toml` の `":workspace_roots"` テーブル:

```toml
".env" = "deny"
".env.local" = "deny"
".env.*.local" = "deny"
"**/.env" = "deny"
"**/.env.local" = "deny"
"**/.env.*.local" = "deny"
```

- `.claude/settings.json`: `sandbox.filesystem.denyRead` と `permissions.deny` の `**/.env.*` / `Read(**/.env.*)` を同じ集合（`**/.env.local`, `**/.env.*.local`）に置き換える。
- 確認: `codex sandbox -- /bin/true` が成功し、Claude / Codex から `.env` が読めず、`.env.example` が読めること。
- 既知の制約: ワークスペースに `.env` と `.env.local` が同時に存在すると、再び openai/codex#43929 に当たる。現状は `.env` のみの想定。

## Phase 3b: deny を `.env` のみに絞る（Phase 3 の見直し）

### 経緯

- Phase 3 の適用とリビルドのあと、Codex が `bwrap: Can't write data to file /usr/src/app/.env.local: Bad file descriptor` で失敗した。
- `.env.local` は実在しない。リポジトリ直下の env ファイルは `.env` と `.env.example` のみ。

### 見直した原因の理解

- Phase 3 では「実在するファイルが 2 つ以上一致すると失敗する」と考えていたが、不十分だった。
- `".env.local"` のようにワイルドカードを含まない完全パスは、ファイルが実在しなくても Codex がマスク対象として扱い、1 つに数えると考えられる。
- 今回は `.env`（実在）と `.env.local`（実在しない完全パス）で 2 つになり、2 つ目で失敗した。
- `".env.*.local"` のようなワイルドカードのパターンは、実在するファイルにしか一致しないと考えられる（未検証）。

| 時点           | 失敗したファイル | 一致したルール                       |
| -------------- | ---------------- | ------------------------------------ |
| Phase 3 適用前 | `.env.example`   | `.env.*`（ワイルドカード、実在）     |
| Phase 3 適用後 | `.env.local`     | `.env.local`（完全パス、実在しない） |

### 変更

- `.env.local` は運用上置いていないため、`.local` の系統を Codex / Claude の両方から外し、`.env` のみを deny する。
- `.codex/config.toml` の `":workspace_roots"` テーブル:

```toml
".env" = "deny"
"**/.env" = "deny"
```

- `.claude/settings.json`: `denyRead` と `permissions.deny` から `.env.local` / `.env.*.local` の行を外し、`**/.env` / `Read(**/.env)` のみ残す。

### 未確認の点とフォールバック

- `".env"` と `"**/.env"` は同じ `.env` を指すが、Codex がこれを 1 つと数えるか 2 つと数えるかは未確認。
- 2 つと数えられて失敗した場合は、`"**/.env"` を外して `".env"` のみにする。

### トレードオフ

- 将来 `.env.local` などを置くと、Codex / Claude の deny から外れて読めるようになる。置く際に deny を足し直す必要がある（その時点で openai/codex#43929 が未修正なら Codex が起動しなくなる点にも注意）。

### 確認

- リビルド不要（設定ファイルのみ）。Codex CLI を再起動し、セッションが開始できること。
- Codex / Claude から `.env` が読めず、`.env.example` が読めること。

## Phase 3c: Codex のファイル単位の deny を `.env` の 1 つに絞る（最優先）

### 経緯

- Phase 3b のあと、Codex CLI が `bwrap: Can't write data to file /home/node/.claude/.credentials.json: Bad file descriptor` で起動しなくなった。
- ファイル単位でマスクされる上限（1 つ）は、ワークスペース内だけでなく Codex の設定全体で数えられていた。
- 現状でファイル単位にマスクされるのは `.env`、`~/.codex/auth.json`、`~/.claude/.credentials.json` の 3 つ（`~/.ssh` は存在せず、`**/*.pem` などに一致するファイルもない）。

### 判定: Codex CLI の不具合（設定ミスではない）

- 公式ドキュメントは、完全パス（例: `~/.ssh`）とワイルドカード（例: `"**/*.env" = "deny"`）による deny を推奨している。現在の設定はこの使い方どおり。[7]
- openai/codex#43929 では、完全パスかワイルドカードかなどの条件によらず「deny に一致するファイルが 2 つ以上で必ず失敗、ディレクトリなら動く」と報告されている。0.155.1 でも未修正。[5]

### 方針

- `.env` を守ることを最優先し、ファイル単位の 1 枠を `.env` に使う。
- 認証ファイルはディレクトリ単位の deny に置き換える（#43929 によると、ディレクトリは上限に数えられない）。

| 対象                          | 変更前                                   | 変更後                                                     |
| ----------------------------- | ---------------------------------------- | ---------------------------------------------------------- |
| `.env`                        | `".env"` と `"**/.env"`（ファイル）      | `".env"` のみ（同じファイルが 2 つと数えられるのを避ける） |
| `~/.claude/.credentials.json` | ファイル                                 | `"~/.claude"`（ディレクトリ）                              |
| `~/.codex/auth.json`          | ファイル                                 | `"~/.codex"`（ディレクトリ）                               |
| `~/.ssh/**`                   | ワイルドカード（現在は何にも一致しない） | 変更なし                                                   |

### リスクとフォールバック

- `~/.codex` を deny すると、AGENTS.md を読み込むサンドボックスが `~/.codex` 配下（グローバルの AGENTS.md や skills）を読めず、失敗する可能性がある。
  - 失敗した場合は `"~/.codex"` の deny だけを外す。そうすると `~/.codex/auth.json` は Codex のコマンドから読めるようになるが、`.env` と `~/.claude` は守られたまま。
- `"**/.env"` を外すため、サブディレクトリの `.env` は Codex の deny から外れる（現在は存在しない）。
- `**/*.pem`、`**/*.key`、`**/secrets/**`、`**/config/credentials.json` に一致するファイルが今後 1 つでも置かれると、再び #43929 に当たる。
- 次に #44304（bubblewrap 0.12.0 で `/proc` をマウントできないときの代替手段が働かない）に当たる可能性がある。[8]
- Claude 側の deny（`.claude/settings.json`）は変更しない。Claude にはこの制約がないため。

### 確認

- Codex CLI を再起動し、セッションが開始できること。
- Codex から `.env`、`~/.claude/.credentials.json`、`~/.codex/auth.json` が読めず、`.env.example` が読めること。

## Phase 3d: `compose.yaml` に `systempaths=unconfined` を追加する（Codex の `/proc` 対策）

### 経緯

- Phase 3c のあと、古い deny 設定を読み込んだまま動いていた VS Code 拡張の app server（PID 804、03:04 起動）を再起動した。すると Codex のエラーが `bwrap: Can't mount proc on /proc: Operation not permitted` に変わった。
- deny の変更は反映された。次の問題として、[8] の `/proc` の問題が表に出た。

### 原因（根拠）

- Codex 公式の secure devcontainer は「bubblewrap を setuid で入れる」方式で、Docker 内で `bwrap --proc /proc` が拒否されたときは、Codex が `--proc` なしで再試行する設計になっている。[9]
- bubblewrap 0.12.0 では setuid 方式が使えず、エラー文言も `/newroot/proc` から `/proc` に変わった。Codex は `/newroot/proc` という文字列で失敗を判定しているため、再試行されない。[8][10]
- #44304 と #44329 はどちらも Open で、PR もない。
- Codex 公式ドキュメント（Permissions）には、コンテナ内での `/proc` の扱いについての記述がない。[7]

### 変更

- `compose.yaml` の `web.security_opt` に `systempaths=unconfined` を追加する。
- Docker が `/proc` の一部をマスクするのをやめるので、user namespace の中でも bwrap が新しい `/proc` をマウントできるようにする狙い（未検証）。
- コンテナの作り直しが必要（Rebuild Container）。

### トレードオフ

- Docker 公式の説明は "Turn off confinement for system paths (masked paths, read-only paths) for the container"。[11] 影響は次の 2 つで、コンテナ内の全プロセスが対象になる。
  - マスクの解除: Docker が隠していた `/proc` のパス（`/proc/kcore` など）が見えるようになる。
  - 読み取り専用の解除: `/proc/sys`、`/proc/sysrq-trigger` などが書き込めるようになる。こちらのほうが影響が大きい。
- このコンテナは user namespace で root を分離していない（userns-remap なし）。そのため、コンテナ内で root（`sudo`）になると、ホストのカーネル設定を変えたり、`/proc/sysrq-trigger` でホストを再起動したりできる経路が開く。

#### 実害の範囲（ローカルの OrbStack で動かす場合）

- ここでの「ホストのカーネル」は、macOS ではなく OrbStack が動かしている Linux VM のカーネル。影響が及ぶのはこの VM と、同じ VM で動くほかのコンテナまでで、Mac 本体のファイルには届かない。
- 悪意のあるコードがコンテナ内で root になれた場合に、新たにできるようになること:

| できるようになること             | 実害                                                                                   |
| -------------------------------- | -------------------------------------------------------------------------------------- |
| `/proc/sysrq-trigger` に書き込む | VM を即座に再起動・停止できる。OrbStack の全コンテナが止まる                           |
| `/proc/sys` に書き込む           | VM のカーネル設定を変えられる。ほかのコンテナの保護を弱めることもできる                |
| `/proc/kcore` を読む             | VM のカーネルメモリを読める。ほかのコンテナの秘密情報（DB のパスワードなど）が漏れうる |

- root でなくても、`/proc/timer_list` などから VM 内のプロセスの情報が少し見えるようになる（軽微）。

#### 誰がこれをできるか

- devcontainer の `node` ユーザーは、通常パスワードなしで `sudo` を使える。`pnpm install` で入ったパッケージの postinstall スクリプトなど、サンドボックスの外で動くコードが悪意を持っていれば、root になれる。
- Claude / Codex がサンドボックスの中で実行するコマンドは、bwrap が `sudo` による昇格を防ぐため、この経路は通らない。

#### 判断

- このコンテナにはすでに `SYS_ADMIN` と `seccomp` / `apparmor` の unconfined が与えられており、root ならこれらの保護を自分で外せる。`systempaths=unconfined` で新しくできるようになることはほとんどなく、変わるのは攻撃に必要な手間が 1 段減ること。
- ただし「すでに緩めてあるから、さらに緩めてもよい」という理屈は、緩和を重ねる理由にはならない点に注意する。
- ローカルの開発環境で、同じ OrbStack の VM に重要なコンテナを同居させない前提で許容する。この前提と実害の範囲は、チームに共有する。
- Phase 2 の「却下した代替案」では Claude 用として退けたが、Codex には代わりの手段がないため採用する。Claude の `enableWeakerNestedSandbox` は、効果を確認できるまで残す。

### フォールバック

- それでも `/proc` のエラーが出る場合は、この変更を戻し、上流の修正を待つ。
- 上流の修正を待つ間は、`default_permissions` を外して組み込みの `:workspace` で動かす（`.env` が Codex から読めるようになる）かどうかを、チームで判断する。

### 確認

- Rebuild Container のあと、Codex CLI と VS Code 拡張の両方で、セッションが開始できること。
- Codex から `.env`、`~/.claude/.credentials.json`、`~/.codex/auth.json` が読めず、`.env.example` が読めること。
- Claude の Bash が引き続き動くこと。

## Phase 3e: コンテナの pnpm を `packageManager` に揃える

### 経緯

- Codex が動いたあと、Claude CLI から commit できなかった。lefthook の `format` ジョブ（`pnpm exec prettier`）がサンドボックス内で `create the temporary package manager install directory: Read-only file system` で失敗していた。
- `pnpm test:unit` や `pnpm lint` など、Claude がサンドボックス内で実行する `pnpm` はすべて同じ理由で失敗する。

### 原因

- pnpm 11 以降は、実行中の pnpm と `package.json` の `packageManager` のバージョンが違うと、指定のバージョンを自動でダウンロードして使う（`pmOnFail: download` が既定）。[12]
- コンテナの pnpm はベースイメージ（`mcr.microsoft.com/devcontainers/javascript-node:24`）に入っている 12.3.4。`packageManager` は Renovate が上げていて 12.4.2。
- サンドボックスの中ではダウンロード先に書き込めないため失敗する。サンドボックスの外では黙ってダウンロードして動くため、これまで気づかなかった。
- `Dockerfile` と `setup-devcontainer.sh` は、過去に一度も pnpm のバージョンを固定していない（git 履歴で確認）。

| 日付  | `packageManager` | コンテナの 12.3.4 との関係 |
| ----- | ---------------- | -------------------------- |
| 09-05 | pnpm@12.3.4      | 一致                       |
| 09-13 | pnpm@12.4.1      | ここからずれた             |
| 09-18 | pnpm@12.4.2      | ずれたまま                 |

- ずれ始めた 09-13 は、#4033 / #4034 で Claude の Bash が全滅した時期と重なる。そのため、サンドボックスを直すまで表に出なかった。
- 09-01 以前（pnpm 11 の時期）に問題にならなかった理由は、当時のイメージの pnpm の版が分からず未確認。

### 変更（案 A）

- `.devcontainer/setup-devcontainer.sh` の `pnpm install` の直前で、`package.json` の `packageManager` と同じ版の pnpm をグローバルに入れる。
- バージョンを 2 か所に書かないので、Renovate が `packageManager` を上げても、次のリビルドで自動的に追従する。

```bash
# Match the global pnpm to `packageManager`; a mismatch makes pnpm download the pinned version,
# which the agent sandboxes cannot write, so every sandboxed `pnpm` command fails.
pnpm_version="$(node -p "require('./package.json').packageManager.split('@')[1].split('+')[0]")"
npm install -g "pnpm@${pnpm_version}"
```

- `+sha512...` のハッシュが `packageManager` に付いた場合に備え、`+` 以降は取り除く。
- 失敗したときは、後続の `pnpm install` と同じくセットアップ全体を失敗させる（黙ってずれたままにしない）。

### 却下した代替案

| 案                                                                   | 却下理由                                                                               |
| -------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| サンドボックスで pnpm のキャッシュへの書き込みを許可（`allowWrite`） | サンドボックスを緩める。書き込めるようになった pnpm 本体を書き換えられる余地が生まれる |
| `Dockerfile` に pnpm の版を直接書く                                  | `package.json` と 2 か所で管理することになり、Renovate の更新でまたずれる              |
| `pmOnFail: ignore` にしてダウンロードさせない                        | `packageManager` による版の固定が効かなくなる                                          |

### 確認

- Rebuild Container のあと、`pnpm --version` が `packageManager` と一致すること。
- Claude CLI から `pnpm exec prettier --version` と `git commit` が通ること。
- 今すぐの回避（リビルド前）: ご自身のターミナルで `npm install -g pnpm@12.4.2`。

## Phase 4: リビルドと検証（高リスク・開発環境全体に影響）

- devcontainer を Rebuild Container する。
- Claude / Codex の両方で次を確認する。
  - `git commit` まで通ること
  - `.env`、`~/.codex/auth.json`、`~/.claude/.credentials.json` が読めないこと
- `pnpm format`、`pnpm lint`、`git diff --check` を実行する。

## レビュー

- 秘密情報の扱いの変更（deny 設定）を含むため、AGENTS.md に従いクロスレビューの対象とする。
- Claude 主導の変更なので Codex でレビューする。Codex が使えない場合は `coderabbit review --plain` を使う。

## 出典

1. bubblewrap releases（0.11.2 で setuid を非推奨化、0.12.0 で削除）: https://github.com/containers/bubblewrap/releases
2. bubblewrap source（`acquire_privs()` の `die ("setuid use of bubblewrap is not supported")`）: https://github.com/containers/bubblewrap/blob/main/bubblewrap.c
3. Debian security tracker（DSA-6472-1 / CVE-2026-87766、trixie で 0.12.0-1~deb13u1）: https://security-tracker.debian.org/tracker/DSA-6472-1 / https://security-tracker.debian.org/tracker/CVE-2026-87766
4. Claude Code sandboxing（Troubleshooting「Bubblewrap fails to start inside a container」、Security limitations）: https://code.claude.com/docs/en/sandboxing
5. openai/codex#43929（deny ルールに一致するファイルが 2 つ以上あると起動に失敗）: https://github.com/openai/codex/issues/43929
6. Claude Code settings reference（`sandbox.enableWeakerNestedSandbox`、Scope: Any file）: https://code.claude.com/docs/en/settings-reference
7. Codex Permissions（deny の完全パスとワイルドカード、`:workspace_roots`、`glob_scan_max_depth`）: https://learn.chatgpt.com/docs/permissions
8. openai/codex#44304（bubblewrap 0.12.0 で `/proc` のエラー文言が変わり、代替手段が働かない）: https://github.com/openai/codex/issues/44304
9. openai/codex PR #17547（secure devcontainer で bubblewrap を setuid で入れる。`/proc` のマウントが拒否されたら `--proc` なしで再試行）: https://github.com/openai/codex/pull/17547
10. openai/codex#44329（CLI と VS Code 拡張が `/proc` のマウント失敗を扱えない）: https://github.com/openai/codex/issues/44329
11. Docker `docker container run`（`--security-opt systempaths=unconfined`）: https://docs.docker.com/reference/cli/docker/container/run/
12. pnpm 11.0 release notes（`pmOnFail`、既定は `download`）: https://pnpm.io/blog/releases/11.0
