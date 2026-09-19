# Plan: devcontainer から秘密を排除し、入れ子のサンドボックスを撤去する

前回の経緯: [summary.md](../../2026-09-18/fix-bwrap-setuid/summary.md)

## 概要

- 方針: 「エージェントに秘密を読ませない」を、ツールごとのサンドボックスではなく「コンテナに秘密を置かない」ことで実現する。
- これにより bubblewrap、コンテナの権限緩和（`SYS_ADMIN` など）、`/proc` の回避策が不要になり、障害と重さ（コマンドごとの glob 走査、約 1 秒）の原因がまとめて消える。
- 要件（ユーザー決定）:
  - `.env` の本番の値を LLM のベンダーに渡さない。
  - エージェントは push しない。ただし人間の push の手間は増やさない（D1）。
  - 外部通信は許可リストのみ。各ツールのテレメトリは送らない。
  - Claude / Codex の両方を使い続ける（特定ベンダーに依存しない）。Windows / WSL のメンバーがいるため、OS に依存しない構成にする。

## 調査で判明した事実

- 本番の秘密は `CONFIRM_API_URL` の 1 つだけ。使うのは [atcoder_verification.ts:12](../../../../src/features/account/services/atcoder_verification.ts) のみ（`/users/edit` の連携確認）。
- **`compose.yaml` が `CONFIRM_API_URL=${CONFIRM_API_URL:?...}` でコンテナの環境変数に注入している。** そのため、`printenv` でエージェントから常に読めた。`.env` の deny もサンドボックスも、これは防いでいなかった。
- `:?` で必須のため、値がないとコンテナが起動しない。これが「全員が本物の値を持つ」運用の直接の原因。
- シード（`prisma/seed.ts`）は連携済みの `AtCoderAccount` を作らない。そのため、投票などの連携済みユーザー向けの機能をローカルで試すには、本物の値での連携が必要だった。
- 本物の値は、単体テスト（`vi.stubEnv` + `fetch` のモック）、e2e、CI のいずれでも使っていない。
- e2e の `votes.spec.ts` は `guest` でログインし、未連携なら skip している。
- bubblewrap とコンテナの権限（`SYS_ADMIN`、`SYS_PTRACE`、seccomp・apparmor の無効化）は、2026-09-12 の Codex 導入時（c276af73）に入った。それ以前の Claude のサンドボックスは、bubblewrap がなく実質的に動いていなかった可能性が高い（未検証）。
- `/etc/gitconfig` に VS Code の git credential helper が設定されている。コンテナ内のどのプロセスも、`git credential fill` で GitHub の認証情報を取得できる。
- 公式の devcontainer の立場: "dev containers do not prevent a malicious project from exfiltrating anything accessible inside the container" "Avoid mounting host secrets"。[1]

## 設計判断

### 本番の値は普段ローカルに置かず、Vercel で管理する

- 本番と staging（Preview）の値は、Vercel の環境変数で管理する。
- ローカルでは `CONFIRM_API_URL` を既定で未設定にする。連携確認のボタンは `Failed to validate AtCoder account.` を返すだけで、ほかの機能には影響しない。
- 連携の手順そのものの確認は、普段は単体テスト（既存のモック）と staging で行う。
- ローカルで本物の値を使った確認が必要なときは、例外として明示的に注入できるようにする（Phase 2）。その間はエージェントを使わない運用で守る。

### シードで連携済みアカウントを作る

- 連携済みの状態が必要な機能を、本物の値なしでローカルで試せるようにする。これで本物の値を必要とする人がほぼいなくなる。
- 既存の DB にも反映されるよう、ユーザーの作成とは別に upsert する（既存の `addUsers` は、登録済みのユーザーをスキップするため）。

### エージェントのサンドボックスは devcontainer の中でだけ無効にする

- `.claude/settings.json` と `.codex/config.toml` はリポジトリで共有しており、ホスト（Mac の Seatbelt、WSL の bubblewrap）でもそのまま適用される。そのため、プロジェクトの設定は残す。
- コンテナ内だけ、優先順位が最も高い managed settings で無効にする。
  - Claude: `/etc/claude-code/managed-settings.json` を Dockerfile で配置する（公式の devcontainer の手順どおり）。[1]
  - Codex: 同等の managed config を配置する。仕組みと優先順位は Phase 3 の最初に検証する。

### コンテナに残る秘密は、エージェント自身の認証トークンだけにする

- `.env` と GitHub のトークン（https の credential helper）をコンテナから外す。SSH は agent forwarding のため、鍵そのものはコンテナにない。
- `~/.claude/.credentials.json` と `~/.codex/auth.json` は、各ツールの動作に必要なので残る。互いのトークンを読めてしまう点は、送信先を最小限に絞ったうえで受け入れる（D3）。

### push はコンテナ内のまま、エージェントはルールで禁止する（D1）

- 人間はコンテナ内の VS Code とターミナルから、承認なしで普段どおり push する。
- エージェントの push は、ルールで禁止する（Claude の `Bash(git push *)` の deny、AGENTS.md）。仕組みでの強制はしない。
- 根拠: コンテナから秘密を外せば、push で持ち出せるものがほぼない（リポジトリは公開）。勝手な push の実害は不要なブランチ程度で、`staging` / `main` はブランチ保護で守る（設定済みであることをユーザーが確認済み）。
- 残るリスク: 悪意ある指示を受けたエージェントがルールを回避して push し、エージェントの認証トークンを公開の場所へ書き込む可能性。D3 と同種のリスクとして受け入れる。

### `CONFIRM_API_URL` の値は変更しない（D2）

- これまで全メンバーのコンテナの環境変数に注入されており、エージェントや LLM のベンダーに渡った可能性は否定できない。ただし漏れたときのリスクは低いと判断した。
  - 機密性: 返すのは AtCoder の所属欄で、`user` に渡すユーザー名も AtCoder のランキングで公開されている。
  - 完全性: 本人確認は「所属欄に検証コードを書けるのは本人だけ」で成り立っており、URL の秘匿には依存しない。GET のみで書き換えの経路もない。
  - 可用性（唯一の論点）: 公開のユーザー名を列挙して大量に GET されると、クローラーが AtCoder に遮断されたり、実行回数の上限を使い切られたりしうる。DDoS などにならなければ一旦許容する。
- 対応: 値の変更ではなく、エンドポイント側にキャッシュか流量制限を足す（値を変えても、次に漏れれば同じことが起きるため）。現状はどちらもない（ユーザー確認済み）。エンドポイントは本リポジトリの外にあるため、本計画とは別のタスクとして扱う。
- 「LLM のベンダーに渡さない」方針は、リスクの大小とは別の原則として維持する（Phase 2 / 4 は変更しない）。

### エージェントの認証トークンが互いに読める点は受け入れ、送信先を最小限に絞る（D3）

- コンテナを分けずに受け入れる。代わりに Phase 5 の許可リストを最小限にする。
- 許可するのは、各ツールの公式ドキュメントが必須とする推論と認証の宛先、および開発に必要な宛先だけ。「あると便利」な宛先は入れない。
- 限界: 許可した宛先を経由した持ち出しは防げない。例えば Claude が `~/.codex/auth.json` を読めば、その内容は Anthropic に渡る。また iptables は IP で判定するため、同じ IP を共有するサービス（github.com の repo と gist など）は区別できない。

## 却下した代替案

| 案                                            | 却下理由                                                                                                                                                  |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 入れ子のサンドボックスを維持（現状）          | 障害と重さの原因そのもの。しかも環境変数経由の露出を防げていなかった                                                                                      |
| エージェントを各自の OS で直接動かす          | Windows ネイティブは Claude のサンドボックスに非対応。WSL の Codex では #43929 を再び踏む。Mac とコンテナで `node_modules` のネイティブバイナリが衝突する |
| dotenvx                                       | 秘密鍵を持つ人がほぼいなくなるため、利点が小さい。公開リポジトリに本番の暗号文が永久に残る。秘密が増えたら再検討する                                      |
| Infisical / mise / direnv                     | Infisical はログイン済みのセッションからエージェントも取得でき、1 変数には過剰。mise / direnv はシェルの環境変数経由でエージェントに引き継がれる          |
| `.env` を使うときだけ置く（普段の運用として） | 置いている間は読める。外し忘れで元に戻る。例外時の手段としてだけ、警告付きで残す（Phase 2）                                                               |
| push はホストから行う                         | 作業環境が二つに分かれ、VS Code の Source Control から push できない。Windows / WSL のメンバーはホスト側にも git と鍵の準備が必要                         |
| SSH エージェントで署名のたびに人間が承認する  | push のたびに承認が必要になり、開発の流れが止まる                                                                                                         |
| 開発サーバとエージェントのコンテナを分ける    | compose の再設計が大きい。ローカルに本物の値が不要になれば、分ける理由がない                                                                              |

## Phase 0: `origin` を本来のリポジトリ（SSH）に戻す（低リスク・手作業）

- 経緯: SSH の push が `Permission denied (publickey)` で失敗したとき、VS Code が fork を作って remote を繋ぎ替えた（2026-09-19 05:58）。
  - 元のリポジトリ（SSH）は `upstream` に改名された。
  - `origin` は fork（`https://github.com/KATO-Hiro/AtCoderNoviSteps.git`）に変わった。
  - `#4059` ブランチは fork に push された（05:43）。
- 変更: `origin` の fetch / push を、どちらも `git@github.com:AtCoder-NoviSteps/AtCoderNoviSteps.git` にする。`upstream` は `origin` と重複するため削除する。

```bash
git remote set-url origin git@github.com:AtCoder-NoviSteps/AtCoderNoviSteps.git
git remote remove upstream
git fetch --prune origin
```

- `.git/config` は各自のクローンのローカル設定で、リポジトリの変更ではない。ユーザーがコンテナ内のターミナルで実行する（エージェントのサンドボックスからは `.git/config` を書けない可能性がある）。
- 前提: ホストの ssh-agent に鍵が登録されていること（CONTRIBUTING の「ホスト側で鍵を ssh-agent へ登録」）。コンテナ内で `ssh-add -l` と `ssh -T git@github.com` が通ることを先に確認する。
- 後片付け（ユーザーの判断）: fork 側の `#4059` ブランチと fork 自体が不要なら、GitHub 上で削除する。`#4059` は `git push -u origin '#4059'` で本来のリポジトリに push し直す。
- 確認: `git remote -v` の fetch / push がどちらも `git@github.com:AtCoder-NoviSteps/AtCoderNoviSteps.git` で、`upstream` がないこと。

## Phase 1: シードに連携済みアカウントを追加する（低リスク）

- レイヤー: DB のシード（`prisma/`）
- 変更: `prisma/users.ts` に、任意の `atCoderHandle` を追加する。`prisma/seed.ts` に、連携済みの `AtCoderAccount` を upsert する処理を追加する。

```typescript
// prisma/users.ts
export const users = [
  { id: '1', name: 'admin', role: Roles.ADMIN, atCoderHandle: 'novisteps_admin' },
  { id: '2', name: 'guest', role: Roles.USER, atCoderHandle: 'novisteps_guest' },
  // Other users stay unverified so the unverified path remains testable.
];

// prisma/seed.ts
async function addAtCoderAccounts(): Promise<void>;
async function addAtCoderAccount(userId: string, handle: string): Promise<void>; // upsert with isValidated: true
```

- 連携済みにするのは e2e で使う `admin` と `guest`。未連携の画面を確かめられるよう、ほかのユーザーは未連携のまま残す。
- ハンドルは、実在の AtCoder ユーザーと衝突しない明らかな架空名にする（`novisteps_` 接頭辞）。
- 影響: `votes.spec.ts` の「ログイン済みユーザー」のテストが skip されずに実行されるようになる。失敗した場合は、このフェーズで原因を切り分ける。
- テスト: シードには単体テストがなく、分岐も持たないデータ追加のため、テストファーストは省略する。`pnpm db:seed` を 2 回実行して冪等性を確認し、`pnpm test:e2e` で votes を確認する。

## Phase 2: `CONFIRM_API_URL` を既定でコンテナに入れない（低リスク）

- レイヤー: 開発環境の設定
- `compose.yaml`: 必須（`:?`）から任意（`:-`）に変える。行を削除すると、ローカルで本物の値を使った確認ができなくなるため残す。

```yaml
- CONFIRM_API_URL=${CONFIRM_API_URL:-} # Unset by default; set only for a real verification session
```

- `.env.example`: 値の行をコメントアウトし、「ローカル開発では不要。ローカルで本物の値を使った確認をするときだけ設定し、終わったら外す」と書く。
- `.devcontainer/setup-devcontainer.sh`: `CONFIRM_API_URL` が設定されていたら、「本物の値が注入されています。エージェントを使わず、確認後は値を外して Rebuild してください」と警告する。compose はホストの `.env` を変数の置き換えに自動で読むため、消し忘れた値が黙って注入され続けるのを防ぐ。
- ローカルで本物の値を使って確認する手順（例外時）:
  1. ホストで値を設定する（シェルの環境変数か `.env`）。
  2. Rebuild する。
  3. エージェントを使わずに確認する。
  4. 値を外して、もう一度 Rebuild する。
- 確認:
  - 値なしでコンテナが起動し、`printenv CONFIRM_API_URL` が空になる。
  - `/users/edit` の連携確認が `Failed to validate AtCoder account.` を返す。
  - 値を設定して Rebuild すると、注入され、警告が表示される。
- 手作業（ユーザー）:
  - Vercel の Production と Preview に `CONFIRM_API_URL` が設定されていることを確認する。
  - メンバーに、ホストの `.env` とシェルの環境変数から値を削除するよう依頼する。

## Phase 3: bubblewrap とエージェントのサンドボックスをコンテナ内で撤去する（中リスク）

- レイヤー: 開発環境の設定（イメージ、compose、エージェントの設定）
- 最初に検証すること: Codex の managed config の配置場所と、プロジェクトの `.codex/config.toml` との優先順位。確認できない場合は、代わりの手段（CLI 引数、`CODEX_HOME` の設定）を比べてから進める。
  - 結果（2026-09-19）: 公式ドキュメント上、Linux は `/etc/codex/managed_config.toml` で、プロジェクトの設定より優先される。プロジェクトが権限プロファイル（`default_permissions`）を使っており、`sandbox_mode` とは併用できないため、`default_permissions = ":danger-full-access"` で指定する。実際に上書きされるかは、エージェントのサンドボックスからは `/etc/codex` に書けないため未検証。Rebuild 後に確認する。
  - apt の `bubblewrap` を外すだけでは不十分: Codex は `bwrap` がないと同梱の `codex-resources/bwrap` を使う（README、実物も確認）。
  - 同梱の bwrap で Codex のサンドボックスを続ける案は却下: Docker の既定の seccomp / AppArmor は `pivot_root` やマウントを拒否し、bwrap の版によらず失敗する（openai/codex#17547）。続けるにはコンテナの権限の緩和が要り、本計画の目的と両立しない。
- `Dockerfile`:
  - `bubblewrap` のインストールを削除する。
  - Claude の managed settings（`sandbox.enabled: false`）と Codex の managed config（`default_permissions = ":danger-full-access"`）をコピーする。
- `compose.yaml`:
  - `cap_add` の `SYS_ADMIN`、`SYS_PTRACE`、`SETGID`、`SETUID`、`SYS_CHROOT` を削除する。後ろの 3 つは Docker の既定の capability に含まれる。
  - `security_opt` の 3 つを削除する。
  - `NET_ADMIN` は Phase 5 のファイアウォールで使うため、ここでは残す。
- `.claude/settings.json`: `enableWeakerNestedSandbox` を削除する（ホストでは不要）。`permissions.deny` の Read と Bash のルールは、コストがほぼないので残す。
- `.codex/config.toml`: 変更しない（ホスト向けの設定として残す）。
- 確認:
  - Rebuild Container 後、`command -v bwrap` が空になる。
  - Claude / Codex の CLI と VS Code 拡張の両方で、コマンドを実行できる。
  - `git commit` が数秒で終わる（lefthook 込み）。

## Phase 4: `.env` と GitHub の認証情報をコンテナから外す（中リスク）

- レイヤー: 開発環境の設定
- `.env` を空のファイルで覆い隠す（保険）:
  - `compose.yaml` の `volumes` に `./.devcontainer/empty.env:/usr/src/app/.env:ro` を追加する。
  - 覆い隠すのはコンテナ内からの読み取りだけで、compose がホスト側で `.env` を変数の置き換えに読むことは妨げない。そのため、Phase 2 の例外時の注入とは両立する。
  - Phase 3 で `SYS_ADMIN` を外しているため、コンテナ内の root でも覆いを外せない。
  - ホストに `.env` がない場合、マウント先として空の `.env` がホストに作られる（gitignore 済み）。
- GitHub の認証情報（D1 で決定）:
  - push はコンテナ内で普段どおり、SSH agent forwarding で行う。署名だけを依頼する方式で、秘密鍵はコンテナに渡らない。
  - VS Code の https 用 git credential helper は止める。`git credential fill` で GitHub のトークンそのもの（push 以外の操作もできる）を取り出せるため。止める設定は各自のホストの VS Code 側にあると見込まれ、リポジトリからは強制できない。設定名を実装前に確認し、CONTRIBUTING で案内する。
  - `origin` は Phase 0 で SSH の URL に戻し済み（https のままだと、ヘルパーを止めた後に push できない）。
- 確認:
  - コンテナ内で `cat /usr/src/app/.env` が空になる。
  - `git credential fill` でトークンを取得できない。
  - コンテナ内の VS Code とターミナルから、承認なしで push できる。

## Phase 5: 外部通信の許可リスト（ファイアウォール）を導入する（高リスク）

- 2026-09-19: 許可リストの洗い出しが大きいため、別の PR に分ける（ユーザー決定）。それまで D3 の送信先の制限はない。

- レイヤー: 開発環境の設定
- Anthropic の公式リファレンスの `init-firewall.sh` を元に、コンテナの起動時に許可リスト以外への通信を遮断する。[2]
- `compose.yaml`: `NET_ADMIN` と `NET_RAW` を指定する。
- 許可リストの候補:
  - GitHub
  - npm レジストリ
  - Anthropic、OpenAI（推論と認証のみ。テレメトリとエラー報告の宛先は許可しない）
  - VS Code のマーケットプレイスと更新
  - Playwright のブラウザ配布元
  - Prisma のエンジン配布元
  - アプリが開発中に呼ぶ外部 API
  - 実際の一覧は、実装前にコードと各公式ドキュメントから洗い出す。D3 のとおり、公式に必須とされる宛先だけに絞る。宛先ごとに根拠（どのドキュメントか、どの機能が使うか）をスクリプトのコメントに残す。
- テレメトリの拒否: 遮断に加えて、各ツールの設定でも送信を止める（遮断だけだと、送信の失敗や再試行で遅くなりうるため）。
  - Claude: `containerEnv` に `DISABLE_TELEMETRY=1` と `DISABLE_ERROR_REPORTING=1` を設定する。`CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1` は、機能フラグの取得まで止めて一部の機能が使えなくなるため採らない。[1]
  - Codex: テレメトリと分析の送信を止める設定を、実装前に公式ドキュメントで確認する。
- sudo の制限: node ユーザーの sudo を、ファイアウォールのスクリプトだけに絞る（公式リファレンスと同じ）。これをしないと、エージェントが `sudo iptables -F` で遮断を解除できる。
- リスク: CDN の IP が変わると通信が止まる。許可リストの漏れで、開発中に突然失敗する。失敗したときの切り分け手順を CONTRIBUTING に書く。

## Phase 6: ドキュメントを更新する（低リスク）

| ファイル                     | 変更                                                                                                                                                                                                              |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CONTRIBUTING.md`            | 環境構築で `CONFIRM_API_URL` が不要になったことを書く。シードの連携済みユーザーの説明を足す。SSH の節と push の手順を D1 に合わせて書き直す。ファイアウォールの許可リストの追加方法とトラブルシューティングを足す |
| `docs/guides/claude-code.md` | 「実行権限」を書き直す（ホストはサンドボックス、devcontainer はコンテナが境界）。bubblewrap の記述を削除する。「動作確認」を更新する                                                                              |
| `docs/guides/codex.md`       | 「実行権限」の「`danger-full-access` は使用しない」「Dockerfile で setuid 付きで導入」を、devcontainer 内の方針に合わせて書き直す。「動作確認」の `bwrap` のコマンドを削除する                                    |
| `.env.example`               | Phase 2 のとおり                                                                                                                                                                                                  |
| `compose.yaml` のコメント    | 「Codex の bubblewrap のため」のコメントを、ファイアウォール用の説明に置き換える                                                                                                                                  |

## Phase 7: 検証（高リスク・開発環境全体に影響）

- Rebuild Container 後、Claude / Codex の両方で次を確認する。
  - コマンドの実行と `git commit` が数秒で終わる。
  - `printenv CONFIRM_API_URL`、`.env`、`git credential fill` から秘密を取得できない。
  - 許可リストにない宛先（例: `example.com`）へ接続できない（Phase 5 の実装後）。
- 結果は「実装後の確認」を参照。
- `pnpm format`、`pnpm lint`、`pnpm check`、`pnpm test:unit`、`pnpm test:e2e`、`git diff --check` を実行する。
- 可能であれば、Windows / WSL のメンバーにも Rebuild と上の確認を依頼する。

## 実装後の確認（2026-09-19、Rebuild 後）

| 確認                                                                                       | 結果                                              | 状態                                                     | 確認者   |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------- | -------------------------------------------------------- | -------- |
| `bwrap --unshare-user --ro-bind / / true` が失敗する                                       | `No permissions to create a new namespace` で失敗 | 完了                                                     | Claude   |
| `printenv CONFIRM_API_URL`、`.env` が空                                                    | どちらも空（`.env` は 0 バイト）                  | 完了                                                     | Claude   |
| `printf 'protocol=https\nhost=github.com\n\n' \| git credential fill` がトークンを返さない | credential helper なし、トークンは返らない        | 完了                                                     | Claude   |
| Claude のサンドボックスが無効で、コマンドが速い                                            | サンドボックスなしで実行、`git status` 0.16 秒    | 完了                                                     | Claude   |
| Codex の managed config がプロジェクトの設定を上書きする                                   | `codex doctor` で下記のとおり                     | 完了                                                     | Claude   |
| Codex（CLI と VS Code 拡張）でコマンドを実行できる                                         | 動作                                              | 完了                                                     | ユーザー |
| `pnpm db:seed` を 2 回、`pnpm test:e2e` で votes のテストが skip されずに成功する          | 成功                                              | 完了                                                     | ユーザー |
| `git push` が承認なしで通る                                                                | —                                                 | 未実施                                                   | ユーザー |
| `git commit`（lefthook 込み）が数秒で終わる                                                | —                                                 | 未実施                                                   | ユーザー |
| 外部通信の遮断                                                                             | —                                                 | 未実施（Phase 5 は別 PR のため、現状は遮断されない想定） | ユーザー |

- `bwrap` はベースイメージ（`javascript-node` の common-utils）が入れており、Dockerfile から外しても残る。コンテナの権限を外したため namespace を作れず、起動できないので害はない。当初の確認項目「`command -v bwrap` が空」は誤りだった。
- `codex doctor` の比較（managed config を一時的に退避して確認）:

| 条件                                                        | sandbox                                              |
| ----------------------------------------------------------- | ---------------------------------------------------- |
| managed config あり                                         | unrestricted fs + enabled network                    |
| managed config あり + `-c default_permissions=":workspace"` | unrestricted のまま（managed が CLI より優先）       |
| managed config なし、プロジェクト内                         | restricted fs + restricted network、deny ルール 8 件 |
| managed config なし、`/tmp`（Codex の既定値）               | restricted fs + restricted network、deny ルール 0 件 |

## 計画外の変更と発見（2026-09-19）

- 変更:
  - Codex の managed config に、`:danger-full-access` は名前に反してコンテナのユーザー以上の権限を与えず、サンドボックスを使わないだけだというコメントを、公式ドキュメントを出典に付けた。
  - CONTRIBUTING の clone の URL を SSH に変え、HTTPS で clone 済みの人向けの切り替え方法を 1 行足した。
  - `codex.md` の「動作確認」のコマンド一覧を削り、この plan.md の確認表に任せた。
  - 3 つのガイドの加筆は、ユーザーの指摘で半分以下に絞った。
- 発見:
  - `node` はパスワードなしで `sudo` を使える。検証のために managed config を一時的に退避できたのもこのため（すでに元に戻した）。エージェントも managed 設定を外せるので、Phase 5 の sudo の制限はファイアウォールだけでなく、managed 設定を守るためにも必要。
  - エージェントのサンドボックス（Rebuild 前）の中では、DB（`db:5432`）への接続と、`tsx` の IPC ソケットの作成ができなかった。そのため、シードの検証はユーザーに依頼した。
  - `pnpm format` は、サンドボックスが読めないリポジトリ直下のファイル（`.bashrc`、`.profile`、`.zshrc` など。git 未追跡で由来は不明）のために終了コード 2 になった。変更したファイルは個別に整形した。

## ルール追加の候補（未反映）

- learning.md の教訓から。AGENTS.md の Implementation Workflow の 2 の後に追加するか、後で判断する。

> When asking the user to choose, do not list an option that contradicts the approved plan unless it is explicitly labeled as overturning the plan.

## レビュー

- 秘密情報の扱いと開発環境の構成を変えるため、AGENTS.md に従いクロスレビューの対象とする（Claude 主導のため Codex、使えなければ `coderabbit review --plain`）。

## 出典

1. Claude Code: Development containers: https://code.claude.com/docs/en/devcontainer
2. Claude Code reference devcontainer（`init-firewall.sh`）: https://github.com/anthropics/claude-code/tree/main/.devcontainer
3. Claude Code: Configure the sandboxed Bash tool（macOS は Seatbelt、Windows ネイティブは非対応）: https://code.claude.com/docs/en/sandboxing
4. dotenvx: Encryption quickstart: https://dotenvx.com/docs/quickstart/encryption
